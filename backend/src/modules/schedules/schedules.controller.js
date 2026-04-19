import { Prisma } from '@prisma/client';
import {
  badRequest,
  conflict,
  created,
  notFound,
  serverError,
  success,
} from '../../utils/apiResponse.js';
import {
  cancelSchedule,
  createSchedule,
  getScheduleById,
  getScheduleByIdForAdmin,
  listSchedulesForAdmin,
  searchSchedules,
  updateSchedule,
} from './schedules.service.js';

// ── Public handlers ───────────────────────────────────────────────────────────

export async function handleSearchSchedules(req, res) {
  try {
    const { from, to, date, seats } = req.validated;
    const schedules = await searchSchedules({ from, to, date, seats });
    return res.json({ success: true, data: schedules });
  } catch (err) {
    console.error('searchSchedules error:', err);
    return res.status(500).json({ success: false, message: 'Failed to search schedules' });
  }
}

export async function handleGetScheduleById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule ID' });
    }
    const schedule = await getScheduleById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    return res.json({ success: true, data: schedule });
  } catch (err) {
    console.error('getScheduleById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
}

// ── Admin handlers ────────────────────────────────────────────────────────────

export async function handleListSchedulesAdmin(req, res) {
  try {
    const data = await listSchedulesForAdmin(req.validatedQuery);
    return success(res, data, 'Schedules list');
  } catch (err) {
    console.error('handleListSchedulesAdmin:', err);
    return serverError(res, 'Could not load schedules');
  }
}

export async function handleGetScheduleByIdAdmin(req, res) {
  try {
    const schedule = await getScheduleByIdForAdmin(req.validatedParams.id);
    return success(res, schedule, 'Schedule detail');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    console.error('handleGetScheduleByIdAdmin:', err);
    return serverError(res, 'Could not fetch schedule');
  }
}

export async function handleCreateSchedule(req, res) {
  try {
    const schedule = await createSchedule(req.validatedBody);
    return created(res, schedule, 'Schedule created');
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message);
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    if (err instanceof Prisma.PrismaClientValidationError) {
      console.error('handleCreateSchedule Prisma validation:', err.message);
      return badRequest(res, 'Invalid schedule data — check all fields and try again');
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('handleCreateSchedule Prisma request error:', err.code, err.message);
      return badRequest(res, `Database error: ${err.code}`);
    }
    console.error('handleCreateSchedule:', err);
    return serverError(res, 'Could not create schedule');
  }
}

export async function handleUpdateSchedule(req, res) {
  try {
    const schedule = await updateSchedule(req.validatedParams.id, req.validatedBody);
    return success(res, schedule, 'Schedule updated');
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message);
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('handleUpdateSchedule:', err);
    return serverError(res, 'Could not update schedule');
  }
}

export async function handleCancelSchedule(req, res) {
  try {
    const schedule = await cancelSchedule(req.validatedParams.id);
    return success(res, schedule, 'Schedule cancelled');
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message);
    if (err.status === 409) return conflict(res, err.message);
    console.error('handleCancelSchedule:', err);
    return serverError(res, 'Could not cancel schedule');
  }
}
