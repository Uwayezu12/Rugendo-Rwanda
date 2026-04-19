import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';

const companySelect = {
  id: true,
  name: true,
  licenseNo: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      operators: true,
      buses: true,
      drivers: true,
      schedules: true,
    },
  },
};

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeLicenseNo(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized === '' ? null : normalized;
}

function handleUniqueConstraint(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw makeError('Company name already exists', 409);
  }

  throw err;
}

async function getActiveScheduleCountMap(companyIds) {
  if (!companyIds.length) return {};

  const rows = await prisma.schedule.groupBy({
    by: ['companyId'],
    where: {
      companyId: { in: companyIds },
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    },
    _count: {
      _all: true,
    },
  });

  return Object.fromEntries(rows.map((row) => [row.companyId, row._count._all]));
}

async function withScheduleMetrics(company) {
  const counts = await getActiveScheduleCountMap([company.id]);
  return {
    ...company,
    activeScheduleCount: counts[company.id] || 0,
  };
}

async function ensureCompanyExists(id) {
  const company = await prisma.company.findUnique({
    where: { id },
    select: companySelect,
  });

  if (!company) {
    throw makeError('Company not found', 404);
  }

  return company;
}

async function ensureCompanyCanDeactivate(id) {
  const activeScheduleCount = await prisma.schedule.count({
    where: {
      companyId: id,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    },
  });

  if (activeScheduleCount > 0) {
    throw makeError('Cannot deactivate a company while active schedules exist', 409);
  }
}

export async function listCompanies({ page, limit, search, status }) {
  try {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { licenseNo: { contains: search } },
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        select: companySelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const activeScheduleCounts = await getActiveScheduleCountMap(companies.map((company) => company.id));

    return {
      companies: companies.map((company) => ({
        ...company,
        activeScheduleCount: activeScheduleCounts[company.id] || 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (err) {
    throw err;
  }
}

export async function createCompany({ name, licenseNo, isActive = true }) {
  try {
    const company = await prisma.company.create({
      data: {
        name: normalizeName(name),
        licenseNo: normalizeLicenseNo(licenseNo) ?? null,
        isActive,
      },
      select: companySelect,
    });

    return {
      ...company,
      activeScheduleCount: 0,
    };
  } catch (err) {
    handleUniqueConstraint(err);
  }
}

export async function updateCompany(id, { name, licenseNo, isActive }) {
  try {
    const company = await ensureCompanyExists(id);
    const data = {};

    if (name !== undefined) {
      data.name = normalizeName(name);
    }

    if (licenseNo !== undefined) {
      data.licenseNo = normalizeLicenseNo(licenseNo);
    }

    if (isActive !== undefined) {
      if (company.isActive && !isActive) {
        await ensureCompanyCanDeactivate(id);
      }

      data.isActive = isActive;
    }

    const updated = await prisma.company.update({
      where: { id },
      data,
      select: companySelect,
    });

    return withScheduleMetrics(updated);
  } catch (err) {
    handleUniqueConstraint(err);
  }
}

export async function updateCompanyStatus(id, isActive) {
  try {
    const company = await ensureCompanyExists(id);

    if (company.isActive && !isActive) {
      await ensureCompanyCanDeactivate(id);
    }

    const updated = await prisma.company.update({
      where: { id },
      data: { isActive },
      select: companySelect,
    });

    return withScheduleMetrics(updated);
  } catch (err) {
    throw err;
  }
}
