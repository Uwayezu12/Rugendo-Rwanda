import prisma from '../../lib/prisma.js';

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Create a notification for a user.
 * Called by other service modules after a business action succeeds.
 * Never throws — failure is logged silently so it cannot break the caller.
 *
 * @returns {Promise<object|null>}
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  priority = 'NORMAL',
  actionUrl = null,
  metadata = null,
}) {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, type, priority, actionUrl, metadata },
    });
  } catch (err) {
    console.error('[notifications] createNotification failed:', err.message);
    return null;
  }
}

// ─── User-facing service functions ───────────────────────────────────────────

/**
 * List notifications for the authenticated user with optional pagination and filters.
 * ARCHIVED notifications are excluded by default unless status=ARCHIVED is requested.
 */
export async function getMyNotifications(userId, { page = 1, limit = 20, status, type } = {}) {
  // Build the where clause
  const where = { userId };

  if (status) {
    where.status = status;
  } else {
    // Default: exclude ARCHIVED
    where.status = { not: 'ARCHIVED' };
  }

  if (type) {
    where.type = type;
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Return the count of UNREAD notifications for the authenticated user.
 */
export async function getUnreadCount(userId) {
  const count = await prisma.notification.count({
    where: { userId, status: 'UNREAD' },
  });
  return { count };
}

/**
 * Mark a single notification as READ.
 * Enforces ownership — throws if not found or belongs to another user.
 */
export async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw Object.assign(new Error('Notification not found'), { code: 'NOT_FOUND' });
  }
  if (notification.userId !== userId) {
    throw Object.assign(new Error('You do not have access to this notification'), { code: 'FORBIDDEN' });
  }
  if (notification.status === 'READ') {
    // Already read — return as-is, no DB write needed
    return notification;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data:  { status: 'READ', readAt: new Date() },
  });
}

/**
 * Mark all UNREAD notifications for the authenticated user as READ.
 */
export async function markAllRead(userId) {
  const now = new Date();
  const { count } = await prisma.notification.updateMany({
    where: { userId, status: 'UNREAD' },
    data:  { status: 'READ', readAt: now },
  });
  return { updated: count };
}

/**
 * Archive a single notification.
 * Enforces ownership — throws if not found or belongs to another user.
 */
export async function archiveNotification(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw Object.assign(new Error('Notification not found'), { code: 'NOT_FOUND' });
  }
  if (notification.userId !== userId) {
    throw Object.assign(new Error('You do not have access to this notification'), { code: 'FORBIDDEN' });
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data:  { status: 'ARCHIVED' },
  });
}
