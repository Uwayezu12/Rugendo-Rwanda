import prisma from '../../lib/prisma.js';
import { createNotification } from '../notifications/notifications.service.js';

const safeSelect = {
  id: true, name: true, email: true, phone: true,
  role: true, companyId: true, company: { select: { id: true, name: true } },
  isActive: true, createdAt: true,
};

export async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

/**
 * Updates name, email, and/or phone for a user.
 * - Normalises empty strings to null (removes the field).
 * - Checks uniqueness for email and phone, skipping the check if the value
 *   is unchanged from the current record (so submitting the same email is not
 *   a false "already in use" error).
 */
export async function updateUser(id, { name, email, phone }) {
  // Normalise: treat empty string as "clear the field"
  const cleanEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : null;
  const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;

  // Load current record so we can skip uniqueness checks on unchanged values
  const current = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, phone: true },
  });
  if (!current) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // Uniqueness checks — only run when the new value differs from the stored one
  if (cleanEmail !== null && cleanEmail !== current.email) {
    const taken = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (taken) {
      const err = new Error('That email address is already in use.');
      err.status = 409;
      throw err;
    }
  }

  if (cleanPhone !== null && cleanPhone !== current.phone) {
    const taken = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (taken) {
      const err = new Error('That phone number is already in use.');
      err.status = 409;
      throw err;
    }
  }

  const data = {};
  if (name  !== undefined && name.trim() !== '') data.name  = name.trim();
  if (email !== undefined) data.email = cleanEmail;
  if (phone !== undefined) data.phone = cleanPhone;

  const updated = await prisma.user.update({ where: { id }, data, select: safeSelect });

  await createNotification({
    userId: id,
    title: 'Profile Updated',
    message: 'Your profile information has been updated.',
    type: 'ACCOUNT',
    priority: 'LOW',
    actionUrl: '/',
  });

  return updated;
}

// ── Super-admin: user management ─────────────────────────────────────────────

const adminSelect = {
  id: true, name: true, email: true, phone: true,
  role: true, isActive: true, companyId: true, createdAt: true,
  company: { select: { id: true, name: true } },
};

export async function listUsers({ page, limit, search, role }) {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  const VALID_ROLES = ['PASSENGER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'OPERATOR'];
  if (role && VALID_ROLES.includes(role)) {
    where.role = role;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: adminSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function changeUserRole(id, role, companyId) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (['OPERATOR', 'COMPANY_ADMIN'].includes(role)) {
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) {
      const err = new Error('Company not found');
      err.status = 404;
      throw err;
    }
  }
  return prisma.user.update({
    where: { id },
    data: { role, companyId: ['OPERATOR', 'COMPANY_ADMIN'].includes(role) ? companyId : null },
    select: adminSelect,
  });
}

export async function changeUserStatus(id, isActive) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: adminSelect,
  });
}

/**
 * Permanently deletes a user account.
 * Refresh tokens are cascade-deleted by the DB.
 * Bookings and their payments are cascade-deleted by the DB (onDelete: Cascade).
 */
export async function deleteUser(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // Delete refresh tokens explicitly to invalidate all sessions immediately,
  // even though the cascade on the User delete would cover this too.
  await prisma.refreshToken.deleteMany({ where: { userId: id } });

  // Hard delete — cascades to bookings → payments
  await prisma.user.delete({ where: { id } });
}
