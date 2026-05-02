import prisma from '../../lib/prisma.js';
import { randomBytes } from 'crypto';
import { createNotification } from '../notifications/notifications.service.js';

/**
 * Simulates a payment for a PENDING booking.
 *
 * Flow (method = 'simulated'):
 *   1. Verify booking is PENDING and belongs to the requesting user.
 *   2. Re-check seatsAvailable >= seatsBooked (race-safe inside transaction).
 *   3. In one transaction:
 *      - Create Payment record (status: PAID).
 *      - Update Booking status to CONFIRMED.
 *      - Decrement Schedule.seatsAvailable.
 *
 * Flow (method = 'fail'):
 *   1. Verify booking is PENDING and belongs to user.
 *   2. Create Payment record (status: FAILED).
 *   3. Booking stays PENDING, seats unchanged.
 *
 * Returns { booking, payment }.
 */
export async function payBooking(userId, { bookingId, method }) {
  // 1. Load booking with schedule
  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { schedule: true, payment: true },
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
          ? 'This booking has already been paid and confirmed.'
          : `Booking is already ${booking.status.toLowerCase()}.`
      ),
      { code: 'INVALID_STATE' }
    );
  }
  // Block retry only if a PAID payment already exists. FAILED payments are safe to retry.
  if (booking.payment?.status === 'PAID') {
    throw Object.assign(new Error('This booking has already been paid.'), { code: 'CONFLICT' });
  }

  const transactionId = randomBytes(8).toString('hex').toUpperCase();

  // Helper: upsert the payment record (create if none exists, update if FAILED exists)
  const upsertPayment = (tx, status, extra = {}) => {
    if (booking.payment) {
      // Update the existing FAILED record
      return tx.payment.update({
        where: { id: booking.payment.id },
        data: { status, transactionId, method: 'simulated', ...extra },
      });
    }
    return tx.payment.create({
      data: {
        bookingId: booking.id,
        amount:    booking.totalAmount,
        status,
        method:    'simulated',
        transactionId,
        ...extra,
      },
    });
  };

  // Simulated failure path
  if (method === 'fail') {
    const payment = await upsertPayment(prisma, 'FAILED');
    await createNotification({
      userId: booking.userId,
      title: 'Payment Failed',
      message: `Payment for booking ${booking.reference} failed. Please try again.`,
      type: 'PAYMENT',
      priority: 'HIGH',
      actionUrl: '/passenger/bookings',
      metadata: { bookingId: booking.id, paymentId: payment.id, amount: booking.totalAmount },
    });
    return { booking, payment };
  }

  // Successful payment path — inside a transaction
  const [updatedBooking, payment] = await prisma.$transaction(async (tx) => {
    // Re-check seat availability inside the transaction to prevent race conditions
    const schedule = await tx.schedule.findUnique({
      where: { id: booking.scheduleId },
    });

    if (schedule.seatsAvailable < booking.seatsBooked) {
      throw Object.assign(
        new Error(`Only ${schedule.seatsAvailable} seat(s) now available — booking cannot be confirmed`),
        { code: 'INSUFFICIENT_SEATS' }
      );
    }

    // Create or update payment record
    const pmt = await upsertPayment(tx, 'PAID', { paidAt: new Date() });

    // Confirm the booking
    const bk = await tx.booking.update({
      where: { id: booking.id },
      data:  { status: 'CONFIRMED' },
      include: {
        schedule: {
          include: {
            route:   { select: { id: true, origin: true, destination: true, distanceKm: true, durationMin: true } },
            company: { select: { id: true, name: true } },
            bus:     { select: { id: true, plateNumber: true, model: true, capacity: true } },
          },
        },
        payment: true,
      },
    });

    // Decrement available seats
    await tx.schedule.update({
      where: { id: booking.scheduleId },
      data:  { seatsAvailable: { decrement: booking.seatsBooked } },
    });

    return [bk, pmt];
  });

  await createNotification({
    userId: updatedBooking.userId,
    title: 'Payment Successful',
    message: `Payment for booking ${updatedBooking.reference} confirmed. Your seat is reserved.`,
    type: 'PAYMENT',
    priority: 'HIGH',
    actionUrl: '/passenger/bookings',
    metadata: { bookingId: updatedBooking.id, paymentId: payment.id, amount: payment.amount },
  });

  // Notify company-side staff of confirmed booking — fire and forget
  notifyCompanySideOnConfirmed({ updatedBooking, originalSchedule: booking.schedule }).catch(() => {});

  return { booking: updatedBooking, payment };
}

/**
 * Notifies COMPANY_ADMIN and OPERATOR users when a booking is confirmed after payment.
 * Uses actual remaining seats (post-decrement) derived from the pre-transaction schedule value.
 * Silently fails — never throws.
 */
async function notifyCompanySideOnConfirmed({ updatedBooking, originalSchedule }) {
  try {
    const companyId = updatedBooking.schedule?.company?.id ?? originalSchedule?.companyId;
    if (!companyId) return;

    // seatsAvailable in originalSchedule is the pre-decrement value (loaded before transaction).
    // The transaction already decremented atomically, so this subtraction gives the real new value.
    const remainingSeats = originalSchedule.seatsAvailable - updatedBooking.seatsBooked;
    const route = updatedBooking.schedule?.route;
    const routeStr = route ? `${route.origin} → ${route.destination}` : '';

    const [passenger, staffUsers] = await Promise.all([
      prisma.user.findUnique({ where: { id: updatedBooking.userId }, select: { name: true } }),
      prisma.user.findMany({
        where: { companyId, role: { in: ['COMPANY_ADMIN', 'OPERATOR'] }, isActive: true },
        select: { id: true, role: true },
      }),
    ]);

    if (!staffUsers.length) return;

    const seen = new Set();
    for (const staff of staffUsers) {
      if (seen.has(staff.id)) continue;
      seen.add(staff.id);

      const isAdmin = staff.role === 'COMPANY_ADMIN';
      const messageParts = [
        passenger?.name ? `Passenger: ${passenger.name}.` : '',
        `Ref: ${updatedBooking.reference}.`,
        routeStr ? `Route: ${routeStr}.` : '',
        `Seats booked: ${updatedBooking.seatsBooked}.`,
        `Remaining seats: ${remainingSeats}.`,
      ].filter(Boolean);

      await createNotification({
        userId: staff.id,
        title: 'Booking Confirmed',
        message: messageParts.join(' '),
        type: 'BOOKING',
        priority: 'HIGH',
        actionUrl: isAdmin ? '/company-admin/bookings' : '/operator/bookings',
        metadata: {
          bookingId: updatedBooking.id,
          bookingReference: updatedBooking.reference,
          scheduleId: updatedBooking.scheduleId,
          passengerUserId: updatedBooking.userId,
          seatsBooked: updatedBooking.seatsBooked,
          remainingSeats,
          companyId,
        },
      });
    }
  } catch (err) {
    console.error('[notifyCompanySideConfirmed] failed:', err.message);
  }
}
