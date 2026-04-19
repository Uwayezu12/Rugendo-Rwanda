import { z } from 'zod';

// Rwanda phone number pattern: 07[2389]XXXXXXX
const rwandaPhone = z
  .string()
  .regex(/^07(2|3|8|9)\d{7}$/, 'Phone must be a valid Rwanda number (e.g. 0781234567)');

const registerSchema = z
  .object({
    name:     z.string().min(2).max(100),
    email:    z.string().email().optional().or(z.literal('')),
    phone:    rwandaPhone.optional().or(z.literal('')),
    password: z.string().min(8).max(100),
  })
  .superRefine((data, ctx) => {
    const hasEmail = data.email && data.email.trim() !== '';
    const hasPhone = data.phone && data.phone.trim() !== '';
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['email'],
        message: 'At least one of email or phone number is required.',
      });
    }
    // Re-validate phone format only when a non-empty phone was provided
    if (hasPhone && !/^07(2|3|8|9)\d{7}$/.test(data.phone)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['phone'],
        message: 'Phone must be a valid Rwanda number (e.g. 0781234567).',
      });
    }
  });

// Login accepts either email or Rwanda phone number as the identifier.
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password:   z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).max(100),
});

const googleAuthSchema = z.object({
  // ID token (credential) issued by Google Sign-In / One Tap
  credential: z.string().min(1),
});

export const validateRegister      = (data) => registerSchema.safeParse(data);
export const validateLogin         = (data) => loginSchema.safeParse(data);
export const validateForgotPassword = (data) => forgotPasswordSchema.safeParse(data);
export const validateResetPassword  = (data) => resetPasswordSchema.safeParse(data);
export const validateGoogleAuth     = (data) => googleAuthSchema.safeParse(data);
