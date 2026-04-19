import prisma from '../../lib/prisma.js';

const busSelect = {
  id: true,
  companyId: true,
  plateNumber: true,
  model: true,
  capacity: true,
  status: true,
  createdAt: true,
  company: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
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

function normalizePlateNumber(value) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function normalizeModel(value) {
  if (value === undefined) return undefined;
  const clean = value.trim();
  return clean === '' ? null : clean;
}

async function ensureCompanyExists(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, isActive: true },
    });

    if (!company) {
      throw makeError('Company not found', 404);
    }

    return company;
  } catch (err) {
    throw err;
  }
}

async function ensureBusExists(id) {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        plateNumber: true,
        capacity: true,
        status: true,
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!bus) {
      throw makeError('Bus not found', 404);
    }

    return bus;
  } catch (err) {
    throw err;
  }
}

export async function listCompanies() {
  try {
    return await prisma.company.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    throw err;
  }
}

export async function listBuses({ page, limit, search, companyId, status }) {
  try {
    const where = {};

    if (search) {
      where.OR = [
        { plateNumber: { contains: search } },
        { model: { contains: search } },
        { company: { is: { name: { contains: search } } } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }

    const [total, buses] = await Promise.all([
      prisma.bus.count({ where }),
      prisma.bus.findMany({
        where,
        select: busSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      buses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (err) {
    throw err;
  }
}

export async function createBus({ plateNumber, model, capacity, companyId, status }) {
  try {
    const cleanPlateNumber = normalizePlateNumber(plateNumber);
    const cleanModel = normalizeModel(model);

    await ensureCompanyExists(companyId);

    const existing = await prisma.bus.findUnique({
      where: { plateNumber: cleanPlateNumber },
      select: { id: true },
    });

    if (existing) {
      throw makeError('Plate number is already in use', 409);
    }

    return await prisma.bus.create({
      data: {
        plateNumber: cleanPlateNumber,
        model: cleanModel,
        capacity,
        companyId,
        status,
      },
      select: busSelect,
    });
  } catch (err) {
    throw err;
  }
}

export async function updateBus(id, { plateNumber, model, capacity, companyId, status }) {
  try {
    const bus = await ensureBusExists(id);
    const data = {};

    if (plateNumber !== undefined) {
      const cleanPlateNumber = normalizePlateNumber(plateNumber);

      if (cleanPlateNumber !== bus.plateNumber) {
        const existing = await prisma.bus.findUnique({
          where: { plateNumber: cleanPlateNumber },
          select: { id: true },
        });

        if (existing) {
          throw makeError('Plate number is already in use', 409);
        }
      }

      data.plateNumber = cleanPlateNumber;
    }

    if (model !== undefined) {
      data.model = normalizeModel(model);
    }

    if (capacity !== undefined) {
      const { _max } = await prisma.schedule.aggregate({
        where: { busId: id },
        _max: { seatsTotal: true },
      });

      if (_max.seatsTotal && capacity < _max.seatsTotal) {
        throw makeError('Capacity cannot be lower than seats already configured on existing schedules', 409);
      }

      data.capacity = capacity;
    }

    if (companyId !== undefined && companyId !== bus.companyId) {
      await ensureCompanyExists(companyId);

      if (bus._count.schedules > 0) {
        throw makeError('Cannot change company for a bus that already has schedules', 409);
      }

      data.companyId = companyId;
    }

    if (status !== undefined) {
      data.status = status;
    }

    return await prisma.bus.update({
      where: { id },
      data,
      select: busSelect,
    });
  } catch (err) {
    throw err;
  }
}

export async function updateBusStatus(id, status) {
  try {
    await ensureBusExists(id);

    return await prisma.bus.update({
      where: { id },
      data: { status },
      select: busSelect,
    });
  } catch (err) {
    throw err;
  }
}
