import { z } from 'zod';

const bookingReferenceSchema = z.string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^RW-[A-F0-9]{8}$/.test(value), {
    message: 'Reference must be in the format RW-XXXXXXXX',
  });

const boardingNoteSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().max(191, 'Boarding note must be 191 characters or fewer').optional()
);

// Lookup accepts only a booking reference (RW-XXXXXXXX).
const lookupBoardingSchema = z.object({
  query: bookingReferenceSchema,
});

const validateBoardingSchema = z.object({
  reference: bookingReferenceSchema,
  boardingNote: boardingNoteSchema,
});

export function validateLookupBoarding(data) {
  return lookupBoardingSchema.safeParse(data);
}

export function validateValidateBoarding(data) {
  return validateBoardingSchema.safeParse(data);
}
