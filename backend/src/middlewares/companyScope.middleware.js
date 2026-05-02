import prisma from '../lib/prisma.js';
import { forbidden } from '../utils/apiResponse.js';

/**
 * Loads the authenticated user from DB and enforces COMPANY_ADMIN company scope.
 * Use after authenticate(). Company-admin endpoints must read companyId only from
 * req.companyScope, never from client-provided request data.
 */
export async function requireCompanyAdminScope(req, res, next) {
  if (!req.user?.id) {
    return forbidden(res, 'Not authenticated');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        companyId: true,
        company: {
          select: { id: true, name: true, isActive: true },
        },
      },
    });

    if (!user || !user.isActive || user.role !== 'COMPANY_ADMIN') {
      return forbidden(res, 'Company admin access required');
    }

    if (!user.companyId || !user.company || !user.company.isActive) {
      return forbidden(res, 'Company admin is not assigned to an active company');
    }

    req.companyScope = {
      userId: user.id,
      companyId: user.companyId,
      company: user.company,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}
