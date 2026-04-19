import { randomBytes } from 'crypto';

/**
 * Generates a unique booking reference in the format: RW-XXXXXXXX
 * Example: RW-A3F9C21B
 */
export function generateBookingRef() {
  const hex = randomBytes(4).toString('hex').toUpperCase();
  return `RW-${hex}`;
}

/**
 * Generates a boarding token (short UUID-like string).
 */
export function generateBoardingToken() {
  return randomBytes(16).toString('hex');
}
