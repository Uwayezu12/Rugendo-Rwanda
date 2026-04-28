import prisma from '../../lib/prisma.js';

// ── Super-admin: Platform-wide stats ─────────────────────────────────────────

export async function getSuperAdminStats() {
  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    completedBookings,
    revenueAgg,
    activeRoutes,
    activeSchedules,
    fleetSize,
    totalUsers,
    totalCompanies,
    activeCompanies,
    topRouteGroups,
    recentBookings,
    companies,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    prisma.route.count({ where: { isActive: true } }),
    prisma.schedule.count({ where: { status: 'SCHEDULED' } }),
    prisma.bus.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count(),
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.booking.groupBy({
      by: ['scheduleId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        schedule: {
          select: {
            departureTime: true,
            route: { select: { origin: true, destination: true } },
            company: { select: { name: true } },
          },
        },
        payment: { select: { status: true, amount: true } },
      },
    }),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            buses: true,
            drivers: true,
            operators: true,
            schedules: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const scheduleIds = topRouteGroups.map(g => g.scheduleId);
  const schedules = scheduleIds.length > 0
    ? await prisma.schedule.findMany({
        where: { id: { in: scheduleIds } },
        select: { id: true, route: { select: { origin: true, destination: true } } },
      })
    : [];
  const scheduleMap = Object.fromEntries(schedules.map(s => [s.id, s]));

  const routeBookingMap = {};
  for (const g of topRouteGroups) {
    const s = scheduleMap[g.scheduleId];
    if (!s?.route) continue;
    const key = `${s.route.origin} → ${s.route.destination}`;
    routeBookingMap[key] = (routeBookingMap[key] || 0) + g._count.id;
  }
  const topRoutes = Object.entries(routeBookingMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, bookings]) => ({ route, bookings }));

  const operatorCounts = await prisma.user.groupBy({
    by: ['companyId'],
    where: {
      companyId: { in: companies.map(c => c.id) },
      role: 'OPERATOR',
    },
    _count: { _all: true },
  });
  const operatorCountMap = Object.fromEntries(operatorCounts.map(row => [row.companyId, row._count._all]));

  const companyOverview = companies.map(c => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive,
    buses: c._count.buses,
    drivers: c._count.drivers,
    operators: operatorCountMap[c.id] || 0,
    schedules: c._count.schedules,
  }));

  return {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    completedBookings,
    revenue: { total: Number(revenueAgg._sum.amount ?? 0), currency: 'RWF' },
    activeRoutes,
    activeSchedules,
    fleetSize,
    totalUsers,
    totalCompanies,
    activeCompanies,
    topRoutes,
    recentBookings,
    companyOverview,
  };
}

export async function getSuperAdminTimeseries() {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const [recentBookings, paidPayments, allCounts] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    }),
    prisma.payment.findMany({
      where: { status: 'PAID', paidAt: { gte: since } },
      select: { paidAt: true, amount: true },
    }),
    Promise.all([
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
    ]),
  ]);

  const bookingsByDate = {};
  const revenueByDate = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    bookingsByDate[key] = 0;
    revenueByDate[key] = 0;
  }

  for (const b of recentBookings) {
    const key = new Date(b.createdAt).toISOString().slice(0, 10);
    if (key in bookingsByDate) bookingsByDate[key]++;
  }
  for (const p of paidPayments) {
    const key = new Date(p.paidAt || p.createdAt).toISOString().slice(0, 10);
    if (key in revenueByDate) revenueByDate[key] += Number(p.amount);
  }

  const bookingsOverTime = Object.entries(bookingsByDate).map(([date, count]) => ({ date, count }));
  const revenueOverTime = Object.entries(revenueByDate).map(([date, amount]) => ({ date, amount }));

  const [confirmed, pending, cancelled, completed] = allCounts;
  const statusDistribution = [
    { name: 'CONFIRMED', value: confirmed },
    { name: 'PENDING', value: pending },
    { name: 'CANCELLED', value: cancelled },
    { name: 'COMPLETED', value: completed },
  ];

  return { bookingsOverTime, revenueOverTime, statusDistribution };
}

// ── Admin: KPI stats ─────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    completedBookings,
    revenueAgg,
    activeRoutes,
    activeSchedules,
    fleetSize,
    topRouteGroups,
    recentBookings,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    prisma.route.count({ where: { isActive: true } }),
    prisma.schedule.count({ where: { status: 'SCHEDULED' } }),
    prisma.bus.count({ where: { status: 'ACTIVE' } }),
    prisma.booking.groupBy({
      by: ['scheduleId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        schedule: {
          select: {
            departureTime: true,
            route: { select: { origin: true, destination: true } },
            company: { select: { name: true } },
          },
        },
        payment: { select: { status: true, amount: true } },
      },
    }),
  ]);

  // Resolve route names for top-route groups
  const scheduleIds = topRouteGroups.map(g => g.scheduleId);
  const schedules = scheduleIds.length > 0
    ? await prisma.schedule.findMany({
        where: { id: { in: scheduleIds } },
        select: { id: true, route: { select: { origin: true, destination: true } } },
      })
    : [];
  const scheduleMap = Object.fromEntries(schedules.map(s => [s.id, s]));

  const routeBookingMap = {};
  for (const g of topRouteGroups) {
    const s = scheduleMap[g.scheduleId];
    if (!s?.route) continue;
    const key = `${s.route.origin} → ${s.route.destination}`;
    routeBookingMap[key] = (routeBookingMap[key] || 0) + g._count.id;
  }
  const topRoutes = Object.entries(routeBookingMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, bookings]) => ({ route, bookings }));

  return {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    completedBookings,
    revenue: { total: Number(revenueAgg._sum.amount ?? 0), currency: 'RWF' },
    activeRoutes,
    activeSchedules,
    fleetSize,
    topRoutes,
    recentBookings,
  };
}

// ── Admin: Timeseries ────────────────────────────────────────────────────────

export async function getAdminTimeseries() {
  const since = new Date();
  since.setDate(since.getDate() - 13); // last 14 days
  since.setHours(0, 0, 0, 0);

  const [recentBookings, paidPayments, allCounts] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    }),
    prisma.payment.findMany({
      where: { status: 'PAID', paidAt: { gte: since } },
      select: { paidAt: true, amount: true },
    }),
    Promise.all([
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
    ]),
  ]);

  // Build day buckets for last 14 days
  const bookingsByDate = {};
  const revenueByDate = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    bookingsByDate[key] = 0;
    revenueByDate[key] = 0;
  }

  for (const b of recentBookings) {
    const key = new Date(b.createdAt).toISOString().slice(0, 10);
    if (key in bookingsByDate) bookingsByDate[key]++;
  }
  for (const p of paidPayments) {
    const key = new Date(p.paidAt || p.createdAt).toISOString().slice(0, 10);
    if (key in revenueByDate) revenueByDate[key] += Number(p.amount);
  }

  const bookingsOverTime = Object.entries(bookingsByDate).map(([date, count]) => ({ date, count }));
  const revenueOverTime = Object.entries(revenueByDate).map(([date, amount]) => ({ date, amount }));

  const [confirmed, pending, cancelled, completed] = allCounts;
  const statusDistribution = [
    { name: 'CONFIRMED', value: confirmed },
    { name: 'PENDING', value: pending },
    { name: 'CANCELLED', value: cancelled },
    { name: 'COMPLETED', value: completed },
  ];

  return { bookingsOverTime, revenueOverTime, statusDistribution };
}

// ── Operator: Dashboard data ─────────────────────────────────────────────────

export async function getOperatorDashboardData(operatorUser) {
  const { companyId } = operatorUser;
  if (!companyId) {
    const err = new Error('Operator account has no associated company');
    err.status = 403;
    throw err;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [company, counts, pendingBoarding, todaySchedules] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, isActive: true },
    }),
    Promise.all([
      prisma.booking.count({ where: { schedule: { companyId } } }),
      prisma.booking.count({ where: { schedule: { companyId }, status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { schedule: { companyId }, status: 'PENDING' } }),
      prisma.booking.count({
        where: { schedule: { companyId }, boardedAt: { gte: todayStart, lt: todayEnd } },
      }),
    ]),
    prisma.booking.count({
      where: {
        schedule: { companyId },
        status: 'CONFIRMED',
        boardedAt: null,
        payment: { status: 'PAID' },
      },
    }),
    prisma.schedule.findMany({
      where: { companyId, departureTime: { gte: todayStart, lt: todayEnd } },
      include: {
        route: { select: { origin: true, destination: true } },
        bus: { select: { plateNumber: true, capacity: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { departureTime: 'asc' },
    }),
  ]);

  const [totalBookings, confirmedBookings, pendingBookings, boardedToday] = counts;

  const todayDepartures = todaySchedules.map(s => ({
    id: s.id,
    route: s.route ? `${s.route.origin} → ${s.route.destination}` : null,
    departureTime: s.departureTime,
    seatsAvailable: s.seatsAvailable,
    seatsTotal: s.seatsTotal,
    bus: s.bus?.plateNumber ?? null,
    bookingCount: s._count.bookings,
  }));

  return {
    company,
    summary: { totalBookings, confirmedBookings, pendingBookings, pendingBoarding, boardedToday },
    todayDepartures,
  };
}
