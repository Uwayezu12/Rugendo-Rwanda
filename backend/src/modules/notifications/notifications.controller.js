import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  archiveNotification,
} from './notifications.service.js';
import { success, notFound, forbidden, serverError } from '../../utils/apiResponse.js';

export async function handleGetMyNotifications(req, res) {
  try {
    const result = await getMyNotifications(req.user.id, req.validatedQuery);
    return success(res, result);
  } catch (err) {
    console.error('getMyNotifications error:', err);
    return serverError(res);
  }
}

export async function handleGetUnreadCount(req, res) {
  try {
    const result = await getUnreadCount(req.user.id);
    return success(res, result);
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return serverError(res);
  }
}

export async function handleMarkAsRead(req, res) {
  const id = req.validatedParams.id;
  try {
    const notification = await markAsRead(id, req.user.id);
    return success(res, notification, 'Notification marked as read');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'FORBIDDEN') return forbidden(res, err.message);
    console.error('markAsRead error:', err);
    return serverError(res);
  }
}

export async function handleMarkAllRead(req, res) {
  try {
    const result = await markAllRead(req.user.id);
    return success(res, result, 'All notifications marked as read');
  } catch (err) {
    console.error('markAllRead error:', err);
    return serverError(res);
  }
}

export async function handleArchiveNotification(req, res) {
  const id = req.validatedParams.id;
  try {
    const notification = await archiveNotification(id, req.user.id);
    return success(res, notification, 'Notification archived');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'FORBIDDEN') return forbidden(res, err.message);
    console.error('archiveNotification error:', err);
    return serverError(res);
  }
}
