import { success, serverError, forbidden } from '../../utils/apiResponse.js';
import {
  getSuperAdminStats,
  getSuperAdminTimeseries,
  getAdminStats,
  getAdminTimeseries,
  getOperatorDashboardData,
} from './dashboard.service.js';

export async function adminStatsHandler(req, res) {
  try {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const data = isSuperAdmin ? await getSuperAdminStats() : await getAdminStats();
    return success(res, data, 'Dashboard stats');
  } catch (err) {
    console.error('adminStatsHandler:', err);
    return serverError(res, 'Could not load dashboard stats');
  }
}

export async function adminTimeseriesHandler(req, res) {
  try {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const data = isSuperAdmin ? await getSuperAdminTimeseries() : await getAdminTimeseries();
    return success(res, data, 'Dashboard timeseries');
  } catch (err) {
    console.error('adminTimeseriesHandler:', err);
    return serverError(res, 'Could not load dashboard timeseries');
  }
}

export async function operatorDashboardHandler(req, res) {
  try {
    const data = await getOperatorDashboardData(req.user);
    return success(res, data, 'Operator dashboard');
  } catch (err) {
    if (err.status === 403) return forbidden(res, err.message);
    console.error('operatorDashboardHandler:', err);
    return serverError(res, 'Could not load operator dashboard');
  }
}
