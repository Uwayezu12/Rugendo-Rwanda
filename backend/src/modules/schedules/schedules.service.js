import prisma from '../../lib/prisma.js';

// ── Shared selects ────────────────────────────────────────────────────────────

const SCHEDULE_INCLUDE = {
  route:   { select: { id: true, origin: true, destination: true, distanceKm: true, durationMin: true } },
  company: { select: { id: true, name: true } },
  bus:     { select: { id: true, plateNumber: true, model: true, capacity: true } },
};

const ADMIN_SCHEDULE_INCLUDE = {
  route:   { select: { id: true, origin: true, destination: true, distanceKm: true, durationMin: true } },
  company: { select: { id: true, name: true } },
  bus:     { select: { id: true, plateNumber: true, model: true, capacity: true } },
  driver:  { select: { id: true, name: true, licenseNo: true } },
  _count:  { select: { bookings: true } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function ensureScheduleExists(id) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: ADMIN_SCHEDULE_INCLUDE,
  });
  if (!schedule) throw makeError('Schedule not found', 404);
  return schedule;
}

async function countActiveBookings(scheduleId) {
  return prisma.booking.count({
    where: {
      scheduleId,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });
}

// ── Public functions (passenger-facing) ───────────────────────────────────────

export async function searchSchedules({ from, to, date, seats }) {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay   = new Date(`${date}T23:59:59.999Z`);

  return prisma.schedule.findMany({
    where: {
      status:         'SCHEDULED',
      seatsAvailable: { gte: seats },
      departureTime:  { gte: startOfDay, lte: endOfDay },
      company: {
        isActive: true,
      },
      route: {
        origin:      { contains: from },
        destination: { contains: to },
        isActive:    true,
      },
    },
    include:  SCHEDULE_INCLUDE,
    orderBy:  { departureTime: 'asc' },
  });
}

export async function getScheduleById(id) {
  return prisma.schedule.findUnique({
    where:   { id },
    include: SCHEDULE_INCLUDE,
  });
}

// ── Admin functions ────────────────────────────────────────────────────────────

export async function listSchedulesForAdmin({ page, limit, routeId, status }) {
  const where = {};

  if (routeId) where.routeId = routeId;
  if (status)  where.status  = status;

  const [total, schedules] = await Promise.all([
    prisma.schedule.count({ where }),
    prisma.schedule.findMany({
      where,
      include:  ADMIN_SCHEDULE_INCLUDE,
      orderBy:  { departureTime: 'desc' },
      skip:     (page - 1) * limit,
      take:     limit,
    }),
  ]);

  return {
    schedules,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getScheduleByIdForAdmin(id) {
  const schedule = await prisma.schedule.findUnique({
    where:   { id },
    include: ADMIN_SCHEDULE_INCLUDE,
  });
  if (!schedule) throw makeError('Schedule not found', 404);
  return schedule;
}

export async function createSchedule({ routeId, busId, driverId, companyId, departureTime, arrivalTime, price, seatsTotal, status }) {
  // Validate FK existence
  const [route, bus, driver, company] = await Promise.all([
    prisma.route.findUnique({ where: { id: routeId }, select: { id: true, isActive: true } }),
    prisma.bus.findUnique({ where: { id: busId }, select: { id: true, capacity: true } }),
    prisma.driver.findUnique({ where: { id: driverId }, select: { id: true } }),
    prisma.company.findUnique({ where: { id: companyId }, select: { id: true, isActive: true } }),
  ]);

  if (!route) throw makeError('Route not found', 404);
  if (!bus)   throw makeError('Bus not found', 404);
  if (!driver) throw makeError('Driver not found', 404);
  if (!company) throw makeError('Company not found', 404);
  if (!company.isActive && (status || 'SCHEDULED') !== 'CANCELLED' && (status || 'SCHEDULED') !== 'COMPLETED') {
    throw makeError('Cannot create an active schedule for an inactive company', 409);
  }

  // Business rule: seatsTotal cannot exceed bus capacity
  if (seatsTotal > bus.capacity) {
    throw makeError(`Seat count (${seatsTotal}) cannot exceed bus capacity (${bus.capacity})`, 400);
  }

  // Duplicate check: same routeId + busId + departureTime with SCHEDULED or IN_PROGRESS status
  const duplicate = await prisma.schedule.findFirst({
    where: {
      routeId,
      busId,
      departureTime: new Date(departureTime),
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    },
    select: { id: true },
  });
  if (duplicate) throw makeError('A schedule for this route, bus, and departure time already exists', 409);

  return prisma.schedule.create({
    data: {
      routeId,
      busId,
      driverId,
      companyId,
      departureTime:  new Date(departureTime),
      arrivalTime:    new Date(arrivalTime),
      price:          String(price),
      seatsTotal,
      seatsAvailable: seatsTotal,
      status:         status || 'SCHEDULED',
    },
    include: ADMIN_SCHEDULE_INCLUDE,
  });
}

export async function updateSchedule(id, updates) {
  const schedule = await ensureScheduleExists(id);
  const activeBookings = await countActiveBookings(id);
  const hasActiveBookings = activeBookings > 0;
  const nextCompanyId = updates.companyId ?? schedule.companyId;
  const nextStatus = updates.status ?? schedule.status;

  const data = {};

  // Fields locked when active bookings exist
  if (updates.departureTime !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change departure time while active bookings exist', 409);
    data.departureTime = new Date(updates.departureTime);
  }
  if (updates.arrivalTime !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change arrival time while active bookings exist', 409);
    data.arrivalTime = new Date(updates.arrivalTime);
  }
  if (updates.price !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change price while active bookings exist', 409);
    data.price = String(updates.price);
  }
  if (updates.seatsTotal !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change seat count while active bookings exist', 409);
    if (updates.seatsTotal < (schedule.seatsTotal - schedule.seatsAvailable)) {
      throw makeError('New seat count cannot be less than the number of seats already booked', 400);
    }
    const delta = updates.seatsTotal - schedule.seatsTotal;
    data.seatsTotal = updates.seatsTotal;
    data.seatsAvailable = schedule.seatsAvailable + delta;
  }

  // Fields freely updatable
  if (updates.routeId !== undefined) data.routeId = updates.routeId;
  if (updates.busId   !== undefined) {
    const bus = await prisma.bus.findUnique({ where: { id: updates.busId }, select: { id: true, capacity: true } });
    if (!bus) throw makeError('Bus not found', 404);
    const effectiveSeats = data.seatsTotal ?? schedule.seatsTotal;
    if (effectiveSeats > bus.capacity) throw makeError(`Seat count exceeds new bus capacity (${bus.capacity})`, 400);
    data.busId = updates.busId;
  }
  if (updates.driverId  !== undefined) data.driverId  = updates.driverId;
  if (updates.companyId !== undefined) {
    const company = await prisma.company.findUnique({
      where: { id: updates.companyId },
      select: { id: true, isActive: true },
    });
    if (!company) throw makeError('Company not found', 404);
    data.companyId = updates.companyId;
  }
  if (updates.status    !== undefined) {
    // Block re-activating a CANCELLED schedule if it had active bookings
    if (updates.status === 'SCHEDULED' && schedule.status === 'CANCELLED' && hasActiveBookings) {
      throw makeError('Cannot reactivate a cancelled schedule with active bookings', 409);
    }
    data.status = updates.status;
  }

  if (['SCHEDULED', 'IN_PROGRESS'].includes(nextStatus)) {
    const company = await prisma.company.findUnique({
      where: { id: nextCompanyId },
      select: { id: true, isActive: true },
    });

    if (!company) throw makeError('Company not found', 404);
    if (!company.isActive) {
      throw makeError('Cannot assign an active schedule to an inactive company', 409);
    }
  }

  if (Object.keys(data).length === 0) throw makeError('No changes provided', 400);

  return prisma.schedule.update({
    where:   { id },
    data,
    include: ADMIN_SCHEDULE_INCLUDE,
  });
}

export async function cancelSchedule(id) {
  await ensureScheduleExists(id);

  const activeBookings = await countActiveBookings(id);
  if (activeBookings > 0) {
    throw makeError(
      `Cannot cancel this schedule — it has ${activeBookings} active booking(s). Cancel or complete those bookings first.`,
      409,
    );
  }

  return prisma.schedule.update({
    where:   { id },
    data:    { status: 'CANCELLED' },
    include: ADMIN_SCHEDULE_INCLUDE,
  });
}
