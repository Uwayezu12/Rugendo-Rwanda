import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';

const publicRouteSelect = {
  id: true,
  origin: true,
  destination: true,
  distanceKm: true,
  durationMin: true,
};

const adminRouteSelect = {
  id: true,
  origin: true,
  destination: true,
  distanceKm: true,
  durationMin: true,
  isActive: true,
  createdAt: true,
  _count: {
    select: {
      schedules: true,
    },
  },
};

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeLocation(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function areSameLocation(origin, destination) {
  return origin.toLowerCase() === destination.toLowerCase();
}

function handleUniqueConstraint(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw makeError('Route already exists', 409);
  }

  throw err;
}

async function ensureRouteExists(id) {
  try {
    const route = await prisma.route.findUnique({
      where: { id },
      select: adminRouteSelect,
    });

    if (!route) {
      throw makeError('Route not found', 404);
    }

    return route;
  } catch (err) {
    throw err;
  }
}

async function ensureNoDuplicateRoute(origin, destination, excludeId) {
  try {
    const duplicate = await prisma.route.findFirst({
      where: {
        origin,
        destination,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw makeError('Route already exists', 409);
    }
  } catch (err) {
    throw err;
  }
}

export async function listPublicRoutes() {
  try {
    return await prisma.route.findMany({
      where: { isActive: true },
      orderBy: [{ origin: 'asc' }, { destination: 'asc' }],
      select: publicRouteSelect,
    });
  } catch (err) {
    throw err;
  }
}

export async function listRoutesForAdmin({ page, limit, search, status }) {
  try {
    const where = {};

    if (search) {
      where.OR = [
        { origin: { contains: search } },
        { destination: { contains: search } },
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [total, routes] = await Promise.all([
      prisma.route.count({ where }),
      prisma.route.findMany({
        where,
        select: adminRouteSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      routes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (err) {
    throw err;
  }
}

export async function createRoute({ origin, destination, distanceKm, durationMin, isActive }) {
  try {
    const cleanOrigin = normalizeLocation(origin);
    const cleanDestination = normalizeLocation(destination);

    if (areSameLocation(cleanOrigin, cleanDestination)) {
      throw makeError('Origin and destination must be different', 400);
    }

    await ensureNoDuplicateRoute(cleanOrigin, cleanDestination);

    return await prisma.route.create({
      data: {
        origin: cleanOrigin,
        destination: cleanDestination,
        distanceKm: distanceKm ?? null,
        durationMin: durationMin ?? null,
        isActive,
      },
      select: adminRouteSelect,
    });
  } catch (err) {
    handleUniqueConstraint(err);
  }
}

export async function updateRoute(id, { origin, destination, distanceKm, durationMin, isActive }) {
  try {
    const route = await ensureRouteExists(id);
    const data = {};

    const nextOrigin = origin !== undefined ? normalizeLocation(origin) : route.origin;
    const nextDestination = destination !== undefined ? normalizeLocation(destination) : route.destination;

    if (areSameLocation(nextOrigin, nextDestination)) {
      throw makeError('Origin and destination must be different', 400);
    }

    const originChanged = nextOrigin !== route.origin;
    const destinationChanged = nextDestination !== route.destination;

    if ((originChanged || destinationChanged) && route._count.schedules > 0) {
      throw makeError('Cannot change origin or destination for a route that already has schedules', 409);
    }

    if (originChanged || destinationChanged) {
      await ensureNoDuplicateRoute(nextOrigin, nextDestination, id);
      data.origin = nextOrigin;
      data.destination = nextDestination;
    }

    if (distanceKm !== undefined) {
      data.distanceKm = distanceKm;
    }

    if (durationMin !== undefined) {
      data.durationMin = durationMin;
    }

    if (isActive !== undefined) {
      data.isActive = isActive;
    }

    return await prisma.route.update({
      where: { id },
      data,
      select: adminRouteSelect,
    });
  } catch (err) {
    handleUniqueConstraint(err);
  }
}

export async function updateRouteStatus(id, isActive) {
  try {
    await ensureRouteExists(id);

    return await prisma.route.update({
      where: { id },
      data: { isActive },
      select: adminRouteSelect,
    });
  } catch (err) {
    throw err;
  }
}
