import prisma from '../../lib/prisma.js';

const BOARDING_BOOKING_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  boardedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  },
  schedule: {
    include: {
      route:   { select: { id: true, origin: true, destination: true, distanceKm: true, durationMin: true } },
      company: { select: { id: true, name: true } },
      bus:     { select: { id: true, plateNumber: true, model: true, capacity: true } },
    },
  },
  payment: true,
};

function makeError(message, code, status) {
  return Object.assign(new Error(message), { code, status });
}

async function loadBoardingActor(actor) {
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: {
      id: true,
      name: true,
      role: true,
      companyId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw makeError('Your account is not authorized for boarding validation.', 'FORBIDDEN', 403);
  }

  return user;
}

function enforceBoardingScope(actor, actorUser, booking) {
  if (actorUser.role !== 'OPERATOR') return;

  if (!actorUser.companyId) {
    throw makeError('Operator is not assigned to a company.', 'FORBIDDEN', 403);
  }

  if (actorUser.companyId !== booking.schedule.companyId) {
    throw makeError('You cannot validate boarding for another company.', 'FORBIDDEN', 403);
  }
}

async function resolveBoardingBooking(actor, reference) {
  const actorUser = await loadBoardingActor(actor);

  const booking = await prisma.booking.findUnique({
    where:   { reference },
    include: BOARDING_BOOKING_INCLUDE,
  });

  if (!booking) {
    throw makeError('Booking not found', 'NOT_FOUND', 404);
  }

  enforceBoardingScope(actor, actorUser, booking);

  return { actorUser, booking };
}

function assertBoardingState(booking) {
  if (booking.status === 'CANCELLED') {
    throw makeError('Cancelled bookings cannot be boarded.', 'INVALID_STATE', 400);
  }

  if (booking.status === 'COMPLETED' || booking.boardedAt || booking.boardedById) {
    throw makeError('This booking has already been boarded.', 'INVALID_STATE', 400);
  }

  if (booking.status !== 'CONFIRMED') {
    throw makeError('Only confirmed bookings can be boarded.', 'INVALID_STATE', 400);
  }

  if (!booking.payment || booking.payment.status !== 'PAID') {
    throw makeError('Only paid bookings can be boarded.', 'INVALID_STATE', 400);
  }
}

// Returns an array of 0 or 1 booking. Operators are scoped to their own company.
export async function lookupBoardingBooking(actor, reference) {
  const { booking } = await resolveBoardingBooking(actor, reference);
  return [booking];
}

export async function validateBoarding(actor, { reference, boardingNote }) {
  const { actorUser, booking } = await resolveBoardingBooking(actor, reference);

  assertBoardingState(booking);

  const boardedAt = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      id: booking.id,
      status: 'CONFIRMED',
      boardedAt: null,
      boardedById: null,
    },
    data: {
      status: 'COMPLETED',
      boardedAt,
      boardedById: actorUser.id,
      boardingNote: boardingNote ?? null,
    },
  });

  if (result.count === 0) {
    throw makeError('This booking has already been boarded.', 'INVALID_STATE', 400);
  }

  const updatedBooking = await prisma.booking.findUnique({
    where:   { id: booking.id },
    include: BOARDING_BOOKING_INCLUDE,
  });

  return updatedBooking;
}
