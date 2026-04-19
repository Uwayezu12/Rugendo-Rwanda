import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../../lib/prisma.js';
import { hashPassword, comparePassword } from '../../utils/bcrypt.utils.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.utils.js';
import { env } from '../../config/env.js';
import { sendPasswordResetEmail } from '../../utils/mail.utils.js';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;        // 1 hour in ms

const googleClient = new OAuth2Client(env.googleClientId);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isRwandaPhone(value) {
  return /^07(2|3|8|9)\d{7}$/.test(value);
}

function makeTokenPair(payload) {
  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

async function persistRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function register({ name, email, phone, password }) {
  // Normalise: treat empty string as absent
  const cleanEmail = email && email.trim() !== '' ? email.trim() : null;
  const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;

  const [byEmail, byPhone] = await Promise.all([
    cleanEmail ? prisma.user.findUnique({ where: { email: cleanEmail } }) : null,
    cleanPhone ? prisma.user.findUnique({ where: { phone: cleanPhone } }) : null,
  ]);

  if (byEmail) {
    const err = new Error('Email is already registered');
    err.status = 409;
    throw err;
  }
  if (byPhone) {
    const err = new Error('Phone number is already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: cleanEmail, phone: cleanPhone, passwordHash },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return { user };
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login({ identifier, password }) {
  // Determine lookup field from the identifier value
  const isPhone = isRwandaPhone(identifier);
  const user = isPhone
    ? await prisma.user.findUnique({ where: { phone: identifier } })
    : await prisma.user.findUnique({ where: { email: identifier } });

  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Google-only accounts have no password hash — block password login for them.
  if (!user.passwordHash) {
    const err = new Error('This account uses Google sign-in. Please sign in with Google.');
    err.status = 401;
    throw err;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const payload = { id: user.id, role: user.role };
  const { accessToken, refreshToken } = makeTokenPair(payload);
  await persistRefreshToken(user.id, refreshToken);

  return { user: safeUser(user), accessToken, refreshToken };
}

// ─── Refresh tokens ──────────────────────────────────────────────────────────

export async function refreshTokens(token) {
  if (!token) {
    const err = new Error('Refresh token required');
    err.status = 400;
    throw err;
  }

  const payload = verifyRefreshToken(token); // throws if invalid/expired JWT

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error('Refresh token invalid or expired');
    err.status = 401;
    throw err;
  }

  // Rotate: delete old token, issue a fresh pair
  await prisma.refreshToken.delete({ where: { token } });
  const newPayload = { id: payload.id, role: payload.role };
  const { accessToken, refreshToken: newRefreshToken } = makeTokenPair(newPayload);
  await persistRefreshToken(payload.id, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(userId, token) {
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token, userId } });
  }
}

// ─── Forgot password ─────────────────────────────────────────────────────────

export async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way — do not reveal whether the email exists.
  if (!user || !user.isActive) return;

  // Google-only accounts cannot reset a password that doesn't exist.
  if (!user.passwordHash) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt  = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken:     resetToken,
      passwordResetExpiresAt: expiresAt,
    },
  });

  try {
    await sendPasswordResetEmail({ to: user.email, resetToken });
  } catch (mailErr) {
    // Log mail failure but do not expose it to the caller — the token is already saved.
    console.error('[mail] Failed to send password reset email:', mailErr.message);
  }
}

// ─── Reset password ──────────────────────────────────────────────────────────

export async function resetPassword({ token, password }) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken:     token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    const err = new Error('Reset token is invalid or has expired');
    err.status = 400;
    throw err;
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken:     null,
      passwordResetExpiresAt: null,
    },
  });
}

// ─── Google auth ─────────────────────────────────────────────────────────────

export async function googleAuth({ credential }) {
  // Verify the ID token with Google's public keys
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: env.googleClientId,
    });
  } catch {
    const err = new Error('Invalid Google credential');
    err.status = 401;
    throw err;
  }

  const { sub: googleId, email, name, email_verified } = ticket.getPayload();

  if (!email_verified) {
    const err = new Error('Google account email is not verified');
    err.status = 401;
    throw err;
  }

  // 1. Check for an existing account linked to this Google ID
  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    // 2. Check for an existing account with the same email (link safely)
    const byEmail = await prisma.user.findUnique({ where: { email } });

    if (byEmail) {
      if (!byEmail.isActive) {
        const err = new Error('This account has been deactivated');
        err.status = 403;
        throw err;
      }
      // Link the Google ID to the existing account
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data:  { googleId },
      });
    } else {
      // 3. Create a brand-new account from Google (no password hash)
      user = await prisma.user.create({
        data: { name, email, googleId, passwordHash: null },
      });
    }
  } else if (!user.isActive) {
    const err = new Error('This account has been deactivated');
    err.status = 403;
    throw err;
  }

  const payload = { id: user.id, role: user.role };
  const { accessToken, refreshToken } = makeTokenPair(payload);
  await persistRefreshToken(user.id, refreshToken);

  return { user: safeUser(user), accessToken, refreshToken };
}

// ─── Get current user (for /api/me) ─────────────────────────────────────────

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
  });

  if (!user || !user.isActive) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return { user };
}
