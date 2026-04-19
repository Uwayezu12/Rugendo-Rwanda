import prisma from '../../lib/prisma.js';
import { generateBookingRef } from '../../utils/bookingRef.utils.js';

const BOOKING_INCLUDE = {
  schedule: {
    include: {
      route:   { select: { id: true, origin: true, destination: true, distanceKm: true, durationMin: true } },
      company: { select: { id: true, name: true } },
      bus:     { select: { id: true, plateNumber: true, model: true, capacity: true } },
    },
  },
  payment: true,
};

/**
 * Creates a PENDING booking for a passenger.
 * Does NOT decrement seatsAvailable — that happens on payment confirmation.
 */
export async function createBooking(userId, { scheduleId, seats }) {
  // 1. Guard: block duplicate active bookings for the same user + schedule
  const existingActive = await prisma.booking.findFirst({
    where: {
      userId:     userId,
      scheduleId: scheduleId,
      status:     { in: ['PENDING', 'CONFIRMED'] },
    },
  });
  if (existingActive) {
    throw Object.assign(
      new Error('You already have a booking for this trip.'),
      { code: 'DUPLICATE_BOOKING' }
    );
  }

  // 3. Load and validate the schedule
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) {
    throw Object.assign(new Error('Schedule not found'), { code: 'NOT_FOUND' });
  }
  if (schedule.status !== 'SCHEDULED') {
    throw Object.assign(new Error('This schedule is not available for booking'), { code: 'UNAVAILABLE' });
  }
  // Block booking at or after departure time
  if (new Date() >= new Date(schedule.departureTime)) {
    throw Object.assign(
      new Error('This trip can no longer be booked because it has already departed.'),
      { code: 'DEPARTED' }
    );
  }
  if (schedule.seatsAvailable < seats) {
    throw Object.assign(
      new Error(`Only ${schedule.seatsAvailable} seat(s) available`),
      { code: 'INSUFFICIENT_SEATS' }
    );
  }

  // 4. Compute total amount
  const totalAmount = parseFloat(schedule.price) * seats;

  // 5. Generate a unique reference (retry on collision — extremely rare)
  let reference;
  let attempts = 0;
  while (attempts < 5) {
    reference = generateBookingRef();
    const exists = await prisma.booking.findUnique({ where: { reference } });
    if (!exists) break;
    attempts++;
  }
  if (!reference) {
    throw Object.assign(new Error('Could not generate a unique booking reference'), { code: 'SERVER_ERROR' });
  }

  // 6. Create the booking
  const booking = await prisma.booking.create({
    data: {
      reference,
      userId,
      scheduleId,
      seatsBooked: seats,
      totalAmount,
      status: 'PENDING',
    },
    include: BOOKING_INCLUDE,
  });

  return booking;
}

/**
 * Returns all bookings for the authenticated passenger, newest first.
 */
export async function getMyBookings(userId) {
  return prisma.booking.findMany({
    where:   { userId },
    include: BOOKING_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Returns a single booking by id.
 * If passengerUserId is provided, the booking must belong to that user.
 * Admins can pass null to skip ownership check.
 */
export async function getBookingById(id, passengerUserId = null) {
  const where = { id };
  if (passengerUserId !== null) where.userId = passengerUserId;

  return prisma.booking.findFirst({ where, include: BOOKING_INCLUDE });
}

/**
 * Cancels a PENDING booking for a passenger.
 * Only PENDING bookings can be cancelled — CONFIRMED bookings are not cancellable in MVP.
 * If a FAILED payment record exists it is left as-is (historical record).
 */
export async function cancelBooking(id, userId) {
  const booking = await prisma.booking.findUnique({
    where:   { id },
    include: { payment: true },
  });

  if (!booking) {
    throw Object.assign(new Error('Booking not found'), { code: 'NOT_FOUND' });
  }
  if (booking.userId !== userId) {
    throw Object.assign(new Error('This booking does not belong to you'), { code: 'FORBIDDEN' });
  }
  if (booking.status !== 'PENDING') {
    throw Object.assign(
      new Error(
        booking.status === 'CONFIRMED'
          ? 'Confirmed bookings cannot be cancelled in MVP.'
          : `This booking is already ${booking.status.toLowerCase()}.`
      ),
      { code: 'INVALID_STATE' }
    );
  }

  const updated = await prisma.booking.update({
    where:   { id },
    data:    { status: 'CANCELLED' },
    include: BOOKING_INCLUDE,
  });

  return updated;
}

// ── Admin include ─────────────────────────────────────────────────────────────

const ADMIN_BOOKING_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  schedule: {
    include: {
      route:   { select: { id: true, origin: true, destination: true } },
      company: { select: { id: true, name: true } },
      bus:     { select: { id: true, plateNumber: true, model: true } },
      driver:  { select: { id: true, name: true } },
    },
  },
  payment: true,
};

/**
 * Lists all bookings for admin with optional filters and pagination.
 */
export async function listBookingsAdmin({ page, limit, status, paymentStatus, routeId, scheduleId, userId, date }) {
  const where = {};

  if (status)     where.status     = status;
  if (scheduleId) where.scheduleId = scheduleId;
  if (userId)     where.userId     = userId;

  if (routeId) {
    where.schedule = { ...(where.schedule || {}), routeId };
  }

  if (paymentStatus) {
    where.payment = { status: paymentStatus };
  }

  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end   = new Date(`${date}T23:59:59.999Z`);
    where.schedule = {
      ...(where.schedule || {}),
      departureTime: { gte: start, lte: end },
    };
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include:  ADMIN_BOOKING_INCLUDE,
      orderBy:  { createdAt: 'desc' },
      skip:     (page - 1) * limit,
      take:     limit,
    }),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

/**
 * Returns a single booking by id for admin (no ownership check).
 */
export async function getBookingByIdAdmin(id) {
  return prisma.booking.findUnique({ where: { id }, include: ADMIN_BOOKING_INCLUDE });
}

/**
 * Returns all bookings for the operator's company, plus the company record.
 * Scoped to the authenticated operator's companyId.
 */
export async function getOperatorCompanyBookings(operatorId) {
  const operator = await prisma.user.findUnique({
    where:  { id: operatorId },
    select: { id: true, role: true, companyId: true, isActive: true, company: { select: { id: true, name: true } } },
  });

  if (!operator || !operator.isActive) {
    throw Object.assign(new Error('Operator account not found or inactive.'), { code: 'FORBIDDEN' });
  }
  if (operator.role !== 'OPERATOR') {
    throw Object.assign(new Error('Access denied.'), { code: 'FORBIDDEN' });
  }
  if (!operator.companyId) {
    throw Object.assign(new Error('Operator is not assigned to a company.'), { code: 'FORBIDDEN' });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      schedule: { companyId: operator.companyId },
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      schedule: {
        select: {
          id: true,
          departureTime: true,
          arrivalTime: true,
          seatsAvailable: true,
          seatsTotal: true,
          price: true,
          route:   { select: { id: true, origin: true, destination: true } },
          company: { select: { id: true, name: true } },
          bus:     { select: { id: true, plateNumber: true, capacity: true } },
        },
      },
      payment: { select: { status: true, paidAt: true, method: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { company: operator.company, bookings };
}
