import * as companiesService from './companies.service.js';
import { conflict, created, notFound, serverError, success } from '../../utils/apiResponse.js';

export async function listCompaniesHandler(req, res) {
  try {
    const data = await companiesService.listCompanies(req.validatedQuery);
    return success(res, data, 'Companies list');
  } catch (err) {
    console.error('listCompaniesHandler:', err);
    return serverError(res, 'Could not load companies');
  }
}

export async function createCompanyHandler(req, res) {
  try {
    const company = await companiesService.createCompany(req.validatedBody);
    return created(res, company, 'Company created');
  } catch (err) {
    if (err.status === 409) return conflict(res, err.message);
    console.error('createCompanyHandler:', err);
    return serverError(res, 'Could not create company');
  }
}

export async function updateCompanyHandler(req, res) {
  try {
    const company = await companiesService.updateCompany(req.validatedParams.id, req.validatedBody);
    return success(res, company, 'Company updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('updateCompanyHandler:', err);
    return serverError(res, 'Could not update company');
  }
}

export async function updateCompanyStatusHandler(req, res) {
  try {
    const company = await companiesService.updateCompanyStatus(
      req.validatedParams.id,
      req.validatedBody.isActive,
    );
    return success(res, company, 'Company status updated');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('updateCompanyStatusHandler:', err);
    return serverError(res, 'Could not update company status');
  }
}
