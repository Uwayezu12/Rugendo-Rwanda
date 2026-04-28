import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { hashPassword } from '../../utils/bcrypt.utils.js';

const BOOKING_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  schedule: {
    include: {
      route: { select: { id: true, origin: true, destination: true, officialFareRwf: true, fareSource: true } },
      company: { select: { id: true, name: true } },
      bus: { select: { id: true, plateNumber: true, model: true, capacity: true } },
      driver: { select: { id: true, name: true, licenseNo: true } },
    },
  },
  payment: true,
};

const SCHEDULE_INCLUDE = {
  route: { select: { id: true, origin: true, destination: true, distanceKm: true, durationMin: true, officialFareRwf: true, fareSource: true, fareEffectiveFrom: true } },
  company: { select: { id: true, name: true, dataSource: true, isVerifiedOperator: true } },
  bus: { select: { id: true, plateNumber: true, model: true, capacity: true, status: true } },
  driver: { select: { id: true, name: true, licenseNo: true, isActive: true } },
  _count: { select: { bookings: true } },
};

const BUS_SELECT = {
  id: true,
  companyId: true,
  plateNumber: true,
  model: true,
  capacity: true,
  status: true,
  createdAt: true,
  company: { select: { id: true, name: true, isActive: true } },
  _count: { select: { schedules: true } },
};

const DRIVER_SELECT = {
  id: true,
  companyId: true,
  name: true,
  licenseNo: true,
  phone: true,
  isActive: true,
  createdAt: true,
  company: { select: { id: true, name: true, isActive: true } },
  _count: { select: { schedules: true } },
};

const OPERATOR_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  companyId: true,
  createdAt: true,
  company: { select: { id: true, name: true, isActive: true } },
};

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeEmail(value) {
  return value && value.trim() !== '' ? value.trim().toLowerCase() : null;
}

function normalizePhone(value) {
  return value && value.trim() !== '' ? value.trim() : null;
}

function normalizePlateNumber(value) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function normalizeNullableText(value) {
  if (value === undefined) return undefined;
  const clean = value.trim();
  return clean === '' ? null : clean;
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeLicenseNo(value) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function handleUnique(err, fallback = 'Record already exists') {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw makeError(fallback, 409);
  }
  throw err;
}

async function ensureSchedule(companyId, id) {
  const schedule = await prisma.schedule.findFirst({
    where: { id, companyId },
    include: SCHEDULE_INCLUDE,
  });
  if (!schedule) throw makeError('Schedule not found', 404);
  return schedule;
}

async function countActiveBookings(scheduleId) {
  return prisma.booking.count({
    where: { scheduleId, status: { in: ['PENDING', 'CONFIRMED'] } },
  });
}

async function getOfficialFare(routeId) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true, isActive: true, officialFareRwf: true },
  });
  if (!route || !route.isActive) throw makeError('Route not found', 404);
  if (route.officialFareRwf === null || route.officialFareRwf === undefined) {
    throw makeError('Selected route has no official fare configured', 409);
  }
  return route.officialFareRwf;
}

async function ensureBusForCompany(companyId, busId) {
  const bus = await prisma.bus.findFirst({
    where: { id: busId, companyId },
    select: { id: true, companyId: true, plateNumber: true, capacity: true, status: true, _count: { select: { schedules: true } } },
  });
  if (!bus) throw makeError('Bus not found', 404);
  return bus;
}

async function ensureDriverForCompany(companyId, driverId) {
  const driver = await prisma.driver.findFirst({
    where: { id: driverId, companyId },
    select: { id: true, companyId: true, name: true, licenseNo: true, phone: true, isActive: true, _count: { select: { schedules: true } } },
  });
  if (!driver) throw makeError('Driver not found', 404);
  return driver;
}

export async function getDashboard(companyId) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [
    todayTrips,
    upcomingSchedules,
    totalBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    completedTrips,
    activeBuses,
    activeDrivers,
    revenueAgg,
    recentBookings,
    nextSchedules,
  ] = await Promise.all([
    prisma.schedule.count({ where: { companyId, departureTime: { gte: todayStart, lt: todayEnd } } }),
    prisma.schedule.count({ where: { companyId, status: 'SCHEDULED', departureTime: { gte: now } } }),
    prisma.booking.count({ where: { schedule: { companyId } } }),
    prisma.booking.count({ where: { schedule: { companyId }, status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { schedule: { companyId }, status: 'PENDING' } }),
    prisma.booking.count({ where: { schedule: { companyId }, status: 'CANCELLED' } }),
    prisma.schedule.count({ where: { companyId, status: 'COMPLETED' } }),
    prisma.bus.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.driver.count({ where: { companyId, isActive: true } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', booking: { schedule: { companyId } } },
    }),
    prisma.booking.findMany({
      where: { schedule: { companyId } },
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.schedule.findMany({
      where: { companyId, status: 'SCHEDULED', departureTime: { gte: now } },
      include: SCHEDULE_INCLUDE,
      orderBy: { departureTime: 'asc' },
      take: 8,
    }),
  ]);

  return {
    companyId,
    stats: {
      todayTrips,
      upcomingSchedules,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      completedTrips,
      activeBuses,
      activeDrivers,
      totalRevenue: Number(revenueAgg._sum.amount ?? 0),
      currency: 'RWF',
    },
    recentBookings,
    upcoming: nextSchedules,
  };
}

export async function listBookings(companyId, { page, limit, status, paymentStatus, search }) {
  const where = { schedule: { companyId } };
  if (status) where.status = status;
  if (search) where.reference = { contains: search.trim().toUpperCase() };
  if (paymentStatus) where.payment = { is: { status: paymentStatus } };

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getBooking(companyId, id) {
  const booking = await prisma.booking.findFirst({
    where: { id, schedule: { companyId } },
    include: BOOKING_INCLUDE,
  });
  if (!booking) throw makeError('Booking not found', 404);
  return booking;
}

export async function cancelBooking(companyId, id) {
  const booking = await prisma.booking.findFirst({
    where: { id, schedule: { companyId } },
    include: { payment: true },
  });
  if (!booking) throw makeError('Booking not found', 404);
  if (booking.status !== 'PENDING') {
    throw makeError('Only pending bookings can be cancelled in this MVP', 409);
  }

  return prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: BOOKING_INCLUDE,
  });
}

export async function listSchedules(companyId, { page, limit, routeId, status }) {
  const where = { companyId };
  if (routeId) where.routeId = routeId;
  if (status) where.status = status;

  const [total, schedules] = await Promise.all([
    prisma.schedule.count({ where }),
    prisma.schedule.findMany({
      where,
      include: SCHEDULE_INCLUDE,
      orderBy: { departureTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { schedules, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getSchedule(companyId, id) {
  return ensureSchedule(companyId, id);
}

export async function createSchedule(companyId, { routeId, busId, driverId, departureTime, arrivalTime, seatsTotal, status }) {
  const [fare, bus, driver] = await Promise.all([
    getOfficialFare(routeId),
    ensureBusForCompany(companyId, busId),
    ensureDriverForCompany(companyId, driverId),
  ]);

  if (bus.status !== 'ACTIVE') throw makeError('Cannot assign an inactive bus to a schedule', 409);
  if (!driver.isActive) throw makeError('Cannot assign an inactive driver to a schedule', 409);
  if (seatsTotal > bus.capacity) {
    throw makeError(`Seat count (${seatsTotal}) cannot exceed bus capacity (${bus.capacity})`, 400);
  }

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
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      price: String(fare),
      seatsTotal,
      seatsAvailable: seatsTotal,
      status: status || 'SCHEDULED',
    },
    include: SCHEDULE_INCLUDE,
  });
}

export async function updateSchedule(companyId, id, updates) {
  const schedule = await ensureSchedule(companyId, id);
  const activeBookings = await countActiveBookings(id);
  const hasActiveBookings = activeBookings > 0;
  const data = {};

  if (updates.departureTime !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change departure time while active bookings exist', 409);
    data.departureTime = new Date(updates.departureTime);
  }
  if (updates.arrivalTime !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change arrival time while active bookings exist', 409);
    data.arrivalTime = new Date(updates.arrivalTime);
  }
  if (updates.seatsTotal !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change seat count while active bookings exist', 409);
    if (updates.seatsTotal < (schedule.seatsTotal - schedule.seatsAvailable)) {
      throw makeError('New seat count cannot be less than the number of seats already booked', 400);
    }
    const effectiveBusId = updates.busId ?? schedule.busId;
    const bus = await ensureBusForCompany(companyId, effectiveBusId);
    if (updates.seatsTotal > bus.capacity) {
      throw makeError(`Seat count exceeds bus capacity (${bus.capacity})`, 400);
    }
    const delta = updates.seatsTotal - schedule.seatsTotal;
    data.seatsTotal = updates.seatsTotal;
    data.seatsAvailable = schedule.seatsAvailable + delta;
  }

  if (updates.routeId !== undefined) {
    if (hasActiveBookings) throw makeError('Cannot change route while active bookings exist', 409);
    const fare = await getOfficialFare(updates.routeId);
    data.routeId = updates.routeId;
    data.price = String(fare);
  }
  if (updates.busId !== undefined) {
    const bus = await ensureBusForCompany(companyId, updates.busId);
    const effectiveSeats = data.seatsTotal ?? schedule.seatsTotal;
    if (effectiveSeats > bus.capacity) throw makeError(`Seat count exceeds new bus capacity (${bus.capacity})`, 400);
    data.busId = updates.busId;
  }
  if (updates.driverId !== undefined) {
    await ensureDriverForCompany(companyId, updates.driverId);
    data.driverId = updates.driverId;
  }
  if (updates.status !== undefined) data.status = updates.status;

  if (Object.keys(data).length === 0) throw makeError('No changes provided', 400);

  return prisma.schedule.update({
    where: { id },
    data,
    include: SCHEDULE_INCLUDE,
  });
}

export async function cancelSchedule(companyId, id) {
  await ensureSchedule(companyId, id);
  const activeBookings = await countActiveBookings(id);
  if (activeBookings > 0) {
    throw makeError(`Cannot cancel this schedule while ${activeBookings} active booking(s) exist`, 409);
  }

  return prisma.schedule.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: SCHEDULE_INCLUDE,
  });
}

export async function listRouteOptions() {
  return prisma.route.findMany({
    where: { isActive: true },
    select: { id: true, origin: true, destination: true, durationMin: true, officialFareRwf: true, fareSource: true },
    orderBy: [{ origin: 'asc' }, { destination: 'asc' }],
  });
}

export async function listBusOptions(companyId) {
  return prisma.bus.findMany({
    where: { companyId, status: 'ACTIVE' },
    select: { id: true, plateNumber: true, model: true, capacity: true },
    orderBy: { plateNumber: 'asc' },
  });
}

export async function listDriverOptions(companyId) {
  return prisma.driver.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true, licenseNo: true },
    orderBy: { name: 'asc' },
  });
}

export async function listBuses(companyId, { page, limit, search, status }) {
  const where = { companyId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { plateNumber: { contains: search } },
      { model: { contains: search } },
    ];
  }

  const [total, buses] = await Promise.all([
    prisma.bus.count({ where }),
    prisma.bus.findMany({ where, select: BUS_SELECT, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { buses, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function createBus(companyId, { plateNumber, model, capacity, status }) {
  const cleanPlateNumber = normalizePlateNumber(plateNumber);
  const existing = await prisma.bus.findUnique({ where: { plateNumber: cleanPlateNumber }, select: { id: true } });
  if (existing) throw makeError('Plate number is already in use', 409);

  return prisma.bus.create({
    data: { companyId, plateNumber: cleanPlateNumber, model: normalizeNullableText(model), capacity, status },
    select: BUS_SELECT,
  });
}

export async function updateBus(companyId, id, { plateNumber, model, capacity, status }) {
  const bus = await ensureBusForCompany(companyId, id);
  const data = {};

  if (plateNumber !== undefined) {
    const cleanPlateNumber = normalizePlateNumber(plateNumber);
    if (cleanPlateNumber !== bus.plateNumber) {
      const existing = await prisma.bus.findUnique({ where: { plateNumber: cleanPlateNumber }, select: { id: true } });
      if (existing) throw makeError('Plate number is already in use', 409);
    }
    data.plateNumber = cleanPlateNumber;
  }
  if (model !== undefined) data.model = normalizeNullableText(model);
  if (capacity !== undefined) {
    const { _max } = await prisma.schedule.aggregate({
      where: { busId: id },
      _max: { seatsTotal: true },
    });
    if (_max.seatsTotal && capacity < _max.seatsTotal) {
      throw makeError('Capacity cannot be lower than seats already configured on existing schedules', 409);
    }
    data.capacity = capacity;
  }
  if (status !== undefined) data.status = status;

  return prisma.bus.update({ where: { id }, data, select: BUS_SELECT });
}

export async function updateBusStatus(companyId, id, status) {
  await ensureBusForCompany(companyId, id);
  return prisma.bus.update({ where: { id }, data: { status }, select: BUS_SELECT });
}

export async function listDrivers(companyId, { page, limit, search, status }) {
  const where = { companyId };
  if (status) where.isActive = status === 'active';
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { licenseNo: { contains: search } },
    ];
  }

  const [total, drivers] = await Promise.all([
    prisma.driver.count({ where }),
    prisma.driver.findMany({ where, select: DRIVER_SELECT, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { drivers, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function createDriver(companyId, { name, licenseNo, phone }) {
  const cleanLicenseNo = normalizeLicenseNo(licenseNo);
  const existing = await prisma.driver.findUnique({ where: { licenseNo: cleanLicenseNo }, select: { id: true } });
  if (existing) throw makeError('License number is already in use', 409);

  return prisma.driver.create({
    data: { companyId, name: normalizeName(name), licenseNo: cleanLicenseNo, phone: normalizePhone(phone), isActive: true },
    select: DRIVER_SELECT,
  });
}

export async function updateDriver(companyId, id, { name, licenseNo, phone }) {
  const driver = await ensureDriverForCompany(companyId, id);
  const data = {};

  if (name !== undefined) data.name = normalizeName(name);
  if (licenseNo !== undefined) {
    const cleanLicenseNo = normalizeLicenseNo(licenseNo);
    if (cleanLicenseNo !== driver.licenseNo) {
      const existing = await prisma.driver.findUnique({ where: { licenseNo: cleanLicenseNo }, select: { id: true } });
      if (existing) throw makeError('License number is already in use', 409);
    }
    data.licenseNo = cleanLicenseNo;
  }
  if (phone !== undefined) data.phone = normalizePhone(phone);

  return prisma.driver.update({ where: { id }, data, select: DRIVER_SELECT });
}

export async function updateDriverStatus(companyId, id, isActive) {
  await ensureDriverForCompany(companyId, id);
  return prisma.driver.update({ where: { id }, data: { isActive }, select: DRIVER_SELECT });
}

export async function listOperators(companyId, { page, limit, search, status }) {
  const where = { companyId, role: 'OPERATOR' };
  if (status) where.isActive = status === 'active';
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [total, operators] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: OPERATOR_SELECT, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { operators, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function createOperator(companyId, { name, email, phone, password }) {
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);

  const [byEmail, byPhone] = await Promise.all([
    cleanEmail ? prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } }) : null,
    cleanPhone ? prisma.user.findUnique({ where: { phone: cleanPhone }, select: { id: true } }) : null,
  ]);
  if (byEmail) throw makeError('Email is already registered', 409);
  if (byPhone) throw makeError('Phone number is already registered', 409);

  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      name: normalizeName(name),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      role: 'OPERATOR',
      companyId,
      isActive: true,
    },
    select: OPERATOR_SELECT,
  });
}

async function ensureOperator(companyId, id) {
  const operator = await prisma.user.findFirst({
    where: { id, companyId, role: 'OPERATOR' },
    select: { id: true, email: true, phone: true },
  });
  if (!operator) throw makeError('Operator not found', 404);
  return operator;
}

export async function updateOperator(companyId, id, { name, email, phone }) {
  const operator = await ensureOperator(companyId, id);
  const data = {};
  const cleanEmail = email !== undefined ? normalizeEmail(email) : undefined;
  const cleanPhone = phone !== undefined ? normalizePhone(phone) : undefined;

  if (name !== undefined) data.name = normalizeName(name);
  if (email !== undefined) {
    if (cleanEmail && cleanEmail !== operator.email) {
      const existing = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } });
      if (existing) throw makeError('Email is already registered', 409);
    }
    data.email = cleanEmail;
  }
  if (phone !== undefined) {
    if (cleanPhone && cleanPhone !== operator.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: cleanPhone }, select: { id: true } });
      if (existing) throw makeError('Phone number is already registered', 409);
    }
    data.phone = cleanPhone;
  }

  return prisma.user.update({ where: { id }, data, select: OPERATOR_SELECT });
}

export async function updateOperatorStatus(companyId, id, isActive) {
  await ensureOperator(companyId, id);
  return prisma.user.update({ where: { id }, data: { isActive }, select: OPERATOR_SELECT });
}

export async function getRevenue(companyId) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidWhere = { status: 'PAID', booking: { schedule: { companyId } } };
  const [
    total,
    today,
    week,
    month,
    paidBookings,
    unpaidBookings,
    paymentStatuses,
    paidPayments,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: paidWhere }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...paidWhere, paidAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...paidWhere, paidAt: { gte: weekStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...paidWhere, paidAt: { gte: monthStart } } }),
    prisma.booking.count({ where: { schedule: { companyId }, payment: { is: { status: 'PAID' } } } }),
    prisma.booking.count({
      where: {
        schedule: { companyId },
        OR: [
          { payment: { is: null } },
          { payment: { is: { status: { not: 'PAID' } } } },
        ],
      },
    }),
    prisma.payment.groupBy({
      by: ['status'],
      where: { booking: { schedule: { companyId } } },
      _count: { id: true },
    }),
    prisma.payment.findMany({
      where: paidWhere,
      select: {
        amount: true,
        booking: {
          select: {
            scheduleId: true,
            schedule: {
              select: {
                route: { select: { id: true, origin: true, destination: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const byRouteMap = {};
  const byScheduleMap = {};
  for (const payment of paidPayments) {
    const amount = Number(payment.amount ?? 0);
    const scheduleId = payment.booking?.scheduleId;
    const route = payment.booking?.schedule?.route;
    if (route) {
      const key = `${route.id}`;
      if (!byRouteMap[key]) {
        byRouteMap[key] = { routeId: route.id, route: `${route.origin} -> ${route.destination}`, amount: 0 };
      }
      byRouteMap[key].amount += amount;
    }
    if (scheduleId) {
      const key = `${scheduleId}`;
      if (!byScheduleMap[key]) byScheduleMap[key] = { scheduleId, amount: 0 };
      byScheduleMap[key].amount += amount;
    }
  }

  return {
    totalRevenue: Number(total._sum.amount ?? 0),
    todayRevenue: Number(today._sum.amount ?? 0),
    weekRevenue: Number(week._sum.amount ?? 0),
    monthRevenue: Number(month._sum.amount ?? 0),
    currency: 'RWF',
    paidBookings,
    unpaidBookings,
    paymentStatusSummary: paymentStatuses.map((row) => ({ status: row.status, count: row._count.id })),
    revenueByRoute: Object.values(byRouteMap).sort((a, b) => b.amount - a.amount),
    revenueBySchedule: Object.values(byScheduleMap).sort((a, b) => b.amount - a.amount).slice(0, 20),
  };
}

export async function getProfile(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      licenseNo: true,
      isActive: true,
      dataSource: true,
      isVerifiedOperator: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { buses: true, drivers: true, schedules: true } },
    },
  });
  if (!company) throw makeError('Company not found', 404);

  const operatorCount = await prisma.user.count({ where: { companyId, role: 'OPERATOR' } });

  return {
    ...company,
    _count: {
      ...company._count,
      operators: operatorCount,
    },
  };
}

export { handleUnique };
