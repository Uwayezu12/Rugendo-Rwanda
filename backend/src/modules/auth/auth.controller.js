import * as authService from './auth.service.js';
import { success, badRequest } from '../../utils/apiResponse.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGoogleAuth,
} from './auth.validator.js';

export async function register(req, res, next) {
  try {
    const parsed = validateRegister(req.body);
    if (!parsed.success) return badRequest(res, 'Validation error', parsed.error.flatten().fieldErrors);
    const data = await authService.register(parsed.data);
    return success(res, data, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = validateLogin(req.body);
    if (!parsed.success) return badRequest(res, 'Validation error', parsed.error.flatten().fieldErrors);
    const data = await authService.login(parsed.data);
    return success(res, data, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const data = await authService.refreshTokens(req.body.refreshToken);
    return success(res, data, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id, req.body.refreshToken);
    return success(res, null, 'Logged out');
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const parsed = validateForgotPassword(req.body);
    if (!parsed.success) return badRequest(res, 'Validation error', parsed.error.flatten().fieldErrors);
    await authService.forgotPassword(parsed.data);
    // Always return the same message — do not reveal whether the email exists.
    return success(res, null, 'If the email exists, a reset link has been sent');
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const parsed = validateResetPassword(req.body);
    if (!parsed.success) return badRequest(res, 'Validation error', parsed.error.flatten().fieldErrors);
    await authService.resetPassword(parsed.data);
    return success(res, null, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const parsed = validateGoogleAuth(req.body);
    if (!parsed.success) return badRequest(res, 'Validation error', parsed.error.flatten().fieldErrors);
    const data = await authService.googleAuth(parsed.data);
    return success(res, data, 'Google authentication successful');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const data = await authService.getMe(req.user.id);
    return success(res, data, 'Profile fetched');
  } catch (err) {
    next(err);
  }
}
