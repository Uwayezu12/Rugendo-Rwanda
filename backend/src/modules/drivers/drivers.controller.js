import * as driversService from './drivers.service.js';
import { created, success, notFound, conflict, serverError } from '../../utils/apiResponse.js';

export async function listDriverCompaniesHandler(_req, res) {
  try {
    const companies = await driversService.listCompanies();
    return success(res, companies, 'Driver companies list');
  } catch (err) {
    console.error('listDriverCompaniesHandler:', err);
    return serverError(res, 'Could not load companies');
  }
}

export async function listDriversHandler(req, res) {
  try {
    const data = await driversService.listDrivers(req.validatedQuery);
    return success(res, data, 'Drivers list');
  } catch (err) {
    console.error('listDriversHandler:', err);
    return serverError(res, 'Could not load drivers');
  }
}

export async function createDriverHandler(req, res) {
  try {
    const driver = await driversService.createDriver(req.validatedBody);
    return created(res, driver, 'Driver created');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('createDriverHandler:', err);
    return serverError(res, 'Could not create driver');
  }
}

export async function updateDriverHandler(req, res) {
  try {
    const driver = await driversService.updateDriver(req.validatedParams.id, req.validatedBody);
    return success(res, driver, 'Driver updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('updateDriverHandler:', err);
    return serverError(res, 'Could not update driver');
  }
}

export async function updateDriverStatusHandler(req, res) {
  try {
    const driver = await driversService.updateDriverStatus(
      req.validatedParams.id,
      req.validatedBody.isActive,
    );
    return success(res, driver, 'Driver status updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('updateDriverStatusHandler:', err);
    return serverError(res, 'Could not update driver status');
  }
}
