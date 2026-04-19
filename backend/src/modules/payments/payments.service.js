import prisma from '../../lib/prisma.js';
import { randomBytes } from 'crypto';

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

  return { booking: updatedBooking, payment };
}
