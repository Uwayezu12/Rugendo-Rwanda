import { z } from 'zod';

const rwandaPhone = z
  .string()
  .regex(/^07(2|3|8|9)\d{7}$/, 'Phone must be a valid Rwanda number (e.g. 0781234567)');

const updateProfileSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: rwandaPhone.optional().or(z.literal('')),
});

export function validateUpdateProfile(data) {
  return updateProfileSchema.safeParse(data);
}
