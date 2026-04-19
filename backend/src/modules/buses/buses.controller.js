import * as busesService from './buses.service.js';
import { created, success, notFound, conflict, serverError } from '../../utils/apiResponse.js';

export async function listBusCompaniesHandler(_req, res) {
  try {
    const companies = await busesService.listCompanies();
    return success(res, companies, 'Bus companies list');
  } catch (err) {
    console.error('listBusCompaniesHandler:', err);
    return serverError(res, 'Could not load companies');
  }
}

export async function listBusesHandler(req, res) {
  try {
    const data = await busesService.listBuses(req.validatedQuery);
    return success(res, data, 'Buses list');
  } catch (err) {
    console.error('listBusesHandler:', err);
    return serverError(res, 'Could not load buses');
  }
}

export async function createBusHandler(req, res) {
  try {
    const bus = await busesService.createBus(req.validatedBody);
    return created(res, bus, 'Bus created');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('createBusHandler:', err);
    return serverError(res, 'Could not create bus');
  }
}

export async function updateBusHandler(req, res) {
  try {
    const bus = await busesService.updateBus(req.validatedParams.id, req.validatedBody);
    return success(res, bus, 'Bus updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('updateBusHandler:', err);
    return serverError(res, 'Could not update bus');
  }
}

export async function updateBusStatusHandler(req, res) {
  try {
    const bus = await busesService.updateBusStatus(req.validatedParams.id, req.validatedBody.status);
    return success(res, bus, 'Bus status updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('updateBusStatusHandler:', err);
    return serverError(res, 'Could not update bus status');
  }
}
