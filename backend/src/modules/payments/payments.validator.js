import { z } from 'zod';

const paySchema = z.object({
  bookingId: z.number().int().positive('bookingId must be a positive integer'),
  // 'simulated' is the only valid method in MVP. 'fail' triggers a simulated failure.
  method: z.enum(['simulated', 'fail']).default('simulated'),
});

export function validatePay(data) {
  return paySchema.safeParse(data);
}
