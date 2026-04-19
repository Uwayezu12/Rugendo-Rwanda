import * as operatorsService from './operators.service.js';
import { created, success, serverError, conflict, notFound } from '../../utils/apiResponse.js';

export async function listCompaniesHandler(_req, res) {
  try {
    const companies = await operatorsService.listCompanies();
    return success(res, companies, 'Companies list');
  } catch (err) {
    console.error('listCompaniesHandler:', err);
    return serverError(res, 'Could not load companies');
  }
}

export async function listOperatorsHandler(req, res) {
  try {
    const data = await operatorsService.listOperators(req.validatedQuery);
    return success(res, data, 'Operators list');
  } catch (err) {
    console.error('listOperatorsHandler:', err);
    return serverError(res, 'Could not load operators');
  }
}

export async function createOperatorHandler(req, res) {
  try {
    const operator = await operatorsService.createOperator(req.validatedBody);
    return created(res, operator, 'Operator created');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('createOperatorHandler:', err);
    return serverError(res, 'Could not create operator');
  }
}

export async function updateOperatorStatusHandler(req, res) {
  try {
    const operator = await operatorsService.updateOperatorStatus(
      req.validatedParams.id,
      req.validatedBody.isActive,
    );
    return success(res, operator, 'Operator status updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    console.error('updateOperatorStatusHandler:', err);
    return serverError(res, 'Could not update operator status');
  }
}

export async function updateOperatorCompanyHandler(req, res) {
  try {
    const operator = await operatorsService.updateOperatorCompany(
      req.validatedParams.id,
      req.validatedBody.companyId,
    );
    return success(res, operator, 'Operator company updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    console.error('updateOperatorCompanyHandler:', err);
    return serverError(res, 'Could not update operator company');
  }
}
