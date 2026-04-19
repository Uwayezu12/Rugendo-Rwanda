import * as routesService from './routes.service.js';
import {
  badRequest,
  conflict,
  created,
  forbidden,
  notFound,
  serverError,
  success,
  unauthorized,
} from '../../utils/apiResponse.js';

function isAdminRole(role) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export async function listRoutesHandler(req, res) {
  const { scope } = req.validatedQuery;

  if (scope === 'admin') {
    if (!req.user) {
      return unauthorized(res, 'No token provided');
    }

    if (!isAdminRole(req.user.role)) {
      return forbidden(res, 'Insufficient permissions');
    }

    try {
      const data = await routesService.listRoutesForAdmin(req.validatedQuery);
      return success(res, data, 'Routes list');
    } catch (err) {
      console.error('listRoutesHandler(admin):', err);
      return serverError(res, 'Could not load routes');
    }
  }

  try {
    const routes = await routesService.listPublicRoutes();
    return success(res, routes, 'Routes list');
  } catch (err) {
    console.error('listRoutesHandler(public):', err);
    return serverError(res, 'Could not load routes');
  }
}

export async function createRouteHandler(req, res) {
  try {
    const route = await routesService.createRoute(req.validatedBody);
    return created(res, route, 'Route created');
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('createRouteHandler:', err);
    return serverError(res, 'Could not create route');
  }
}

export async function updateRouteHandler(req, res) {
  try {
    const route = await routesService.updateRoute(req.validatedParams.id, req.validatedBody);
    return success(res, route, 'Route updated');
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message);
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('updateRouteHandler:', err);
    return serverError(res, 'Could not update route');
  }
}

export async function updateRouteStatusHandler(req, res) {
  try {
    const route = await routesService.updateRouteStatus(
      req.validatedParams.id,
      req.validatedBody.isActive,
    );
    return success(res, route, 'Route status updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    console.error('updateRouteStatusHandler:', err);
    return serverError(res, 'Could not update route status');
  }
}
