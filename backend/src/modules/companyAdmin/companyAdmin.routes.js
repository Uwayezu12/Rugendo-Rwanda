import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireCompanyAdminScope } from '../../middlewares/companyScope.middleware.js';
import {
  busOptionsHandler,
  cancelBookingHandler,
  cancelScheduleHandler,
  createBusHandler,
  createDriverHandler,
  createOperatorHandler,
  createScheduleHandler,
  dashboardHandler,
  driverOptionsHandler,
  getBookingHandler,
  getScheduleHandler,
  listBookingsHandler,
  listBusesHandler,
  listDriversHandler,
  listOperatorsHandler,
  listSchedulesHandler,
  profileHandler,
  revenueHandler,
  routeOptionsHandler,
  updateBusHandler,
  updateBusStatusHandler,
  updateDriverHandler,
  updateDriverStatusHandler,
  updateOperatorHandler,
  updateOperatorStatusHandler,
  updateScheduleHandler,
} from './companyAdmin.controller.js';
import {
  validateActiveStatus,
  validateBookingList,
  validateBusCreate,
  validateBusList,
  validateBusStatus,
  validateBusUpdate,
  validateDriverCreate,
  validateDriverList,
  validateDriverUpdate,
  validateIdParam,
  validateOperatorCreate,
  validateOperatorList,
  validateOperatorUpdate,
  validateScheduleCreate,
  validateScheduleList,
  validateScheduleUpdate,
} from './companyAdmin.validator.js';

const router = Router();

router.use(authenticate, requireCompanyAdminScope);

router.get('/dashboard', dashboardHandler);

router.get('/bookings', validateBookingList, listBookingsHandler);
router.get('/bookings/:id', validateIdParam, getBookingHandler);
router.patch('/bookings/:id/cancel', validateIdParam, cancelBookingHandler);

router.get('/schedules/options/routes', routeOptionsHandler);
router.get('/schedules/options/buses', busOptionsHandler);
router.get('/schedules/options/drivers', driverOptionsHandler);
router.get('/schedules', validateScheduleList, listSchedulesHandler);
router.post('/schedules', validateScheduleCreate, createScheduleHandler);
router.get('/schedules/:id', validateIdParam, getScheduleHandler);
router.patch('/schedules/:id', validateIdParam, validateScheduleUpdate, updateScheduleHandler);
router.patch('/schedules/:id/cancel', validateIdParam, cancelScheduleHandler);

router.get('/buses', validateBusList, listBusesHandler);
router.post('/buses', validateBusCreate, createBusHandler);
router.patch('/buses/:id', validateIdParam, validateBusUpdate, updateBusHandler);
router.patch('/buses/:id/status', validateIdParam, validateBusStatus, updateBusStatusHandler);

router.get('/drivers', validateDriverList, listDriversHandler);
router.post('/drivers', validateDriverCreate, createDriverHandler);
router.patch('/drivers/:id', validateIdParam, validateDriverUpdate, updateDriverHandler);
router.patch('/drivers/:id/status', validateIdParam, validateActiveStatus, updateDriverStatusHandler);

router.get('/operators', validateOperatorList, listOperatorsHandler);
router.post('/operators', validateOperatorCreate, createOperatorHandler);
router.patch('/operators/:id', validateIdParam, validateOperatorUpdate, updateOperatorHandler);
router.patch('/operators/:id/status', validateIdParam, validateActiveStatus, updateOperatorStatusHandler);

router.get('/revenue', revenueHandler);
router.get('/profile', profileHandler);

export default router;
