import prisma from '../../lib/prisma.js';

const driverSelect = {
  id: true,
  companyId: true,
  name: true,
  licenseNo: true,
  phone: true,
  isActive: true,
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

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeLicenseNo(value) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function normalizePhone(value) {
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

async function ensureDriverExists(id) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        name: true,
        licenseNo: true,
        phone: true,
        isActive: true,
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!driver) {
      throw makeError('Driver not found', 404);
    }

    return driver;
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

export async function listDrivers({ page, limit, search, companyId, status }) {
  try {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { licenseNo: { contains: search } },
        { company: { is: { name: { contains: search } } } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [total, drivers] = await Promise.all([
      prisma.driver.count({ where }),
      prisma.driver.findMany({
        where,
        select: driverSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      drivers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (err) {
    throw err;
  }
}

export async function createDriver({ name, licenseNo, phone, companyId }) {
  try {
    const cleanName = normalizeName(name);
    const cleanLicenseNo = normalizeLicenseNo(licenseNo);
    const cleanPhone = normalizePhone(phone);

    await ensureCompanyExists(companyId);

    const existing = await prisma.driver.findUnique({
      where: { licenseNo: cleanLicenseNo },
      select: { id: true },
    });

    if (existing) {
      throw makeError('License number is already in use', 409);
    }

    return await prisma.driver.create({
      data: {
        name: cleanName,
        licenseNo: cleanLicenseNo,
        phone: cleanPhone,
        companyId,
        isActive: true,
      },
      select: driverSelect,
    });
  } catch (err) {
    throw err;
  }
}

export async function updateDriver(id, { name, licenseNo, phone, companyId }) {
  try {
    const driver = await ensureDriverExists(id);
    const data = {};

    if (name !== undefined) {
      data.name = normalizeName(name);
    }

    if (licenseNo !== undefined) {
      const cleanLicenseNo = normalizeLicenseNo(licenseNo);

      if (cleanLicenseNo !== driver.licenseNo) {
        const existing = await prisma.driver.findUnique({
          where: { licenseNo: cleanLicenseNo },
          select: { id: true },
        });

        if (existing) {
          throw makeError('License number is already in use', 409);
        }
      }

      data.licenseNo = cleanLicenseNo;
    }

    if (phone !== undefined) {
      data.phone = normalizePhone(phone);
    }

    if (companyId !== undefined && companyId !== driver.companyId) {
      await ensureCompanyExists(companyId);

      if (driver._count.schedules > 0) {
        throw makeError('Cannot change company for a driver that already has schedules', 409);
      }

      data.companyId = companyId;
    }

    return await prisma.driver.update({
      where: { id },
      data,
      select: driverSelect,
    });
  } catch (err) {
    throw err;
  }
}

export async function updateDriverStatus(id, isActive) {
  try {
    await ensureDriverExists(id);

    return await prisma.driver.update({
      where: { id },
      data: { isActive },
      select: driverSelect,
    });
  } catch (err) {
    throw err;
  }
}
