import * as service from './companyAdmin.service.js';
import { badRequest, conflict, created, forbidden, notFound, serverError, success } from '../../utils/apiResponse.js';

function companyId(req) {
  return req.companyScope.companyId;
}

function handleError(res, err, label) {
  if (err.status === 400) return badRequest(res, err.message);
  if (err.status === 403) return forbidden(res, err.message);
  if (err.status === 404) return notFound(res, err.message);
  if (err.status === 409) return conflict(res, err.message);
  console.error(`[company-admin] ${label}:`, err);
  return serverError(res, 'Could not complete request');
}

export async function dashboardHandler(req, res) {
  try {
    return success(res, await service.getDashboard(companyId(req)));
  } catch (err) {
    return handleError(res, err, 'dashboard');
  }
}

export async function listBookingsHandler(req, res) {
  try {
    return success(res, await service.listBookings(companyId(req), req.validatedQuery));
  } catch (err) {
    return handleError(res, err, 'listBookings');
  }
}

export async function getBookingHandler(req, res) {
  try {
    return success(res, await service.getBooking(companyId(req), req.validatedParams.id));
  } catch (err) {
    return handleError(res, err, 'getBooking');
  }
}

export async function cancelBookingHandler(req, res) {
  try {
    return success(res, await service.cancelBooking(companyId(req), req.validatedParams.id), 'Booking cancelled');
  } catch (err) {
    return handleError(res, err, 'cancelBooking');
  }
}

export async function listSchedulesHandler(req, res) {
  try {
    return success(res, await service.listSchedules(companyId(req), req.validatedQuery));
  } catch (err) {
    return handleError(res, err, 'listSchedules');
  }
}

export async function getScheduleHandler(req, res) {
  try {
    return success(res, await service.getSchedule(companyId(req), req.validatedParams.id));
  } catch (err) {
    return handleError(res, err, 'getSchedule');
  }
}

export async function createScheduleHandler(req, res) {
  try {
    return created(res, await service.createSchedule(companyId(req), req.validatedBody), 'Schedule created');
  } catch (err) {
    return handleError(res, err, 'createSchedule');
  }
}

export async function updateScheduleHandler(req, res) {
  try {
    return success(res, await service.updateSchedule(companyId(req), req.validatedParams.id, req.validatedBody), 'Schedule updated');
  } catch (err) {
    return handleError(res, err, 'updateSchedule');
  }
}

export async function cancelScheduleHandler(req, res) {
  try {
    return success(res, await service.cancelSchedule(companyId(req), req.validatedParams.id), 'Schedule cancelled');
  } catch (err) {
    return handleError(res, err, 'cancelSchedule');
  }
}

export async function routeOptionsHandler(_req, res) {
  try {
    return success(res, await service.listRouteOptions());
  } catch (err) {
    return handleError(res, err, 'routeOptions');
  }
}

export async function busOptionsHandler(req, res) {
  try {
    return success(res, await service.listBusOptions(companyId(req)));
  } catch (err) {
    return handleError(res, err, 'busOptions');
  }
}

export async function driverOptionsHandler(req, res) {
  try {
    return success(res, await service.listDriverOptions(companyId(req)));
  } catch (err) {
    return handleError(res, err, 'driverOptions');
  }
}

export async function listBusesHandler(req, res) {
  try {
    return success(res, await service.listBuses(companyId(req), req.validatedQuery));
  } catch (err) {
    return handleError(res, err, 'listBuses');
  }
}

export async function createBusHandler(req, res) {
  try {
    return created(res, await service.createBus(companyId(req), req.validatedBody), 'Bus created');
  } catch (err) {
    return handleError(res, err, 'createBus');
  }
}

export async function updateBusHandler(req, res) {
  try {
    return success(res, await service.updateBus(companyId(req), req.validatedParams.id, req.validatedBody), 'Bus updated');
  } catch (err) {
    return handleError(res, err, 'updateBus');
  }
}

export async function updateBusStatusHandler(req, res) {
  try {
    return success(res, await service.updateBusStatus(companyId(req), req.validatedParams.id, req.validatedBody.status), 'Bus status updated');
  } catch (err) {
    return handleError(res, err, 'updateBusStatus');
  }
}

export async function listDriversHandler(req, res) {
  try {
    return success(res, await service.listDrivers(companyId(req), req.validatedQuery));
  } catch (err) {
    return handleError(res, err, 'listDrivers');
  }
}

export async function createDriverHandler(req, res) {
  try {
    return created(res, await service.createDriver(companyId(req), req.validatedBody), 'Driver created');
  } catch (err) {
    return handleError(res, err, 'createDriver');
  }
}

export async function updateDriverHandler(req, res) {
  try {
    return success(res, await service.updateDriver(companyId(req), req.validatedParams.id, req.validatedBody), 'Driver updated');
  } catch (err) {
    return handleError(res, err, 'updateDriver');
  }
}

export async function updateDriverStatusHandler(req, res) {
  try {
    return success(res, await service.updateDriverStatus(companyId(req), req.validatedParams.id, req.validatedBody.isActive), 'Driver status updated');
  } catch (err) {
    return handleError(res, err, 'updateDriverStatus');
  }
}

export async function listOperatorsHandler(req, res) {
  try {
    return success(res, await service.listOperators(companyId(req), req.validatedQuery));
  } catch (err) {
    return handleError(res, err, 'listOperators');
  }
}

export async function createOperatorHandler(req, res) {
  try {
    return created(res, await service.createOperator(companyId(req), req.validatedBody), 'Operator created');
  } catch (err) {
    return handleError(res, err, 'createOperator');
  }
}

export async function updateOperatorHandler(req, res) {
  try {
    return success(res, await service.updateOperator(companyId(req), req.validatedParams.id, req.validatedBody), 'Operator updated');
  } catch (err) {
    return handleError(res, err, 'updateOperator');
  }
}

export async function updateOperatorStatusHandler(req, res) {
  try {
    return success(res, await service.updateOperatorStatus(companyId(req), req.validatedParams.id, req.validatedBody.isActive), 'Operator status updated');
  } catch (err) {
    return handleError(res, err, 'updateOperatorStatus');
  }
}

export async function revenueHandler(req, res) {
  try {
    return success(res, await service.getRevenue(companyId(req)));
  } catch (err) {
    return handleError(res, err, 'revenue');
  }
}

export async function profileHandler(req, res) {
  try {
    return success(res, await service.getProfile(companyId(req)));
  } catch (err) {
    return handleError(res, err, 'profile');
  }
}
