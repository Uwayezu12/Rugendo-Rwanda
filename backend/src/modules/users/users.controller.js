import * as usersService from './users.service.js';
import { validateUpdateProfile } from './users.validator.js';
import { success, badRequest, serverError, conflict, notFound, forbidden } from '../../utils/apiResponse.js';

export async function getMe(req, res, next) {
  try {
    const user = await usersService.getUserById(req.user.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  const result = validateUpdateProfile(req.body);
  if (!result.success) {
    return badRequest(res, 'Validation failed', result.error.flatten().fieldErrors);
  }

  try {
    const user = await usersService.updateUser(req.user.id, result.data);
    return success(res, user, 'Profile updated');
  } catch (err) {
    if (err.status === 409) return conflict(res, err.message);
    if (err.status === 404) return notFound(res, err.message);
    next(err);
  }
}

export async function deleteMe(req, res, next) {
  try {
    await usersService.deleteUser(req.user.id);
    return success(res, null, 'Account deleted');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    next(err);
  }
}

// ── Super-admin: user management ─────────────────────────────────────────────

export async function listUsersHandler(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search?.trim() || '';
    const role = req.query.role?.toUpperCase() || '';

    const data = await usersService.listUsers({ page, limit, search, role });
    return success(res, data, 'Users list');
  } catch (err) {
    console.error('listUsersHandler:', err);
    return serverError(res, 'Could not load users');
  }
}

export async function updateUserRoleHandler(req, res) {
  try {
    const targetId = parseInt(req.params.id);
    const requesterId = req.user.id;

    if (targetId === requesterId) {
      return forbidden(res, 'You cannot change your own role');
    }

    const { role, companyId } = req.body;
    const VALID_ROLES = ['PASSENGER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'OPERATOR'];
    if (!role || !VALID_ROLES.includes(role)) {
      return badRequest(res, `role must be one of: ${VALID_ROLES.join(', ')}`);
    }
    if (['OPERATOR', 'COMPANY_ADMIN'].includes(role) && !companyId) {
      return badRequest(res, 'companyId is required when assigning a company-scoped role');
    }

    const updated = await usersService.changeUserRole(
      targetId,
      role,
      ['OPERATOR', 'COMPANY_ADMIN'].includes(role) ? Number(companyId) : null,
    );
    return success(res, updated, 'User role updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    console.error('updateUserRoleHandler:', err);
    return serverError(res, 'Could not update user role');
  }
}

export async function updateUserStatusHandler(req, res) {
  try {
    const targetId = parseInt(req.params.id);
    const requesterId = req.user.id;

    if (targetId === requesterId) {
      return forbidden(res, 'You cannot deactivate your own account');
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return badRequest(res, 'isActive must be a boolean');
    }

    const updated = await usersService.changeUserStatus(targetId, isActive);
    return success(res, updated, 'User status updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    console.error('updateUserStatusHandler:', err);
    return serverError(res, 'Could not update user status');
  }
}
