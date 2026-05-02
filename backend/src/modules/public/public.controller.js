import { success, serverError } from '../../utils/apiResponse.js';
import prisma from '../../lib/prisma.js';

export async function publicStatsHandler(_req, res) {
  try {
    // Use UTC midnight to match how the seed stores departure times (Date.UTC).
    const now = new Date();
    const todayStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [
      activeRoutes,
      todayDepartures,
      activeCompanies,
      routeEndpoints,
    ] = await Promise.all([
      prisma.route.count({ where: { isActive: true } }),
      // Valid ScheduleStatus values: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
      // Count today's SCHEDULED and IN_PROGRESS departures.
      prisma.schedule.count({
        where: {
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          departureTime: { gte: todayStartUtc },
        },
      }),
      prisma.company.count({ where: { isActive: true } }),
      prisma.route.findMany({
        where: { isActive: true },
        select: { origin: true, destination: true },
      }),
    ]);

    const cities = new Set();
    for (const r of routeEndpoints) {
      if (r.origin) cities.add(r.origin.trim().toUpperCase());
      if (r.destination) cities.add(r.destination.trim().toUpperCase());
    }

    return success(res, {
      activeRoutes,
      todayDepartures,
      connectedCities: cities.size,
      activeCompanies,
    }, 'Public platform stats');
  } catch (err) {
    console.error('publicStatsHandler:', err);
    return serverError(res, 'Could not load platform stats');
  }
}
