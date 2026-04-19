import prisma from '../../lib/prisma.js';
import { hashPassword } from '../../utils/bcrypt.utils.js';

const operatorSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  companyId: true,
  createdAt: true,
  company: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
};

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeEmail(value) {
  return value && value.trim() !== '' ? value.trim().toLowerCase() : null;
}

function normalizePhone(value) {
  return value && value.trim() !== '' ? value.trim() : null;
}

async function ensureCompanyExists(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, isActive: true },
  });

  if (!company) {
    throw makeError('Company not found', 404);
  }

  return company;
}

async function ensureOperatorExists(id) {
  const operator = await prisma.user.findFirst({
    where: { id, role: 'OPERATOR' },
    select: { id: true, companyId: true, isActive: true },
  });

  if (!operator) {
    throw makeError('Operator not found', 404);
  }

  return operator;
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

export async function listOperators({ page, limit, search, companyId, status }) {
  try {
    const where = { role: 'OPERATOR' };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { company: { is: { name: { contains: search } } } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [total, operators] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: operatorSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      operators,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (err) {
    throw err;
  }
}

export async function createOperator({ name, email, phone, password, companyId }) {
  try {
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(phone);

    await ensureCompanyExists(companyId);

    const [byEmail, byPhone] = await Promise.all([
      cleanEmail ? prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } }) : null,
      cleanPhone ? prisma.user.findUnique({ where: { phone: cleanPhone }, select: { id: true } }) : null,
    ]);

    if (byEmail) {
      throw makeError('Email is already registered', 409);
    }

    if (byPhone) {
      throw makeError('Phone number is already registered', 409);
    }

    const passwordHash = await hashPassword(password);

    return await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: 'OPERATOR',
        companyId,
        isActive: true,
      },
      select: operatorSelect,
    });
  } catch (err) {
    throw err;
  }
}

export async function updateOperatorStatus(id, isActive) {
  try {
    await ensureOperatorExists(id);

    return await prisma.user.update({
      where: { id },
      data: { isActive },
      select: operatorSelect,
    });
  } catch (err) {
    throw err;
  }
}

export async function updateOperatorCompany(id, companyId) {
  try {
    await Promise.all([
      ensureOperatorExists(id),
      ensureCompanyExists(companyId),
    ]);

    return await prisma.user.update({
      where: { id },
      data: { companyId },
      select: operatorSelect,
    });
  } catch (err) {
    throw err;
  }
}
