/**
 * Seed script — creates stable demo users and realistic operational data
 * for route search, booking, admin, and operator testing.
 *
 * Run: node prisma/seed.js  (from the backend directory)
 *
 * Newly created seed accounts use 'Password123'.
 * Existing accounts retain their current password.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const HASH = await bcrypt.hash('Password123', 12);

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function fmtDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addDays(date, days) {
  return new Date(date.getTime() + (days * DAY_MS));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + (minutes * 60 * 1000));
}

function dt(dateStr, time) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}

function deriveBasePrice(route) {
  const basis = route.distanceKm ?? Math.max(90, Math.round((route.durationMin ?? 120) * 0.7));
  return Math.max(2500, Math.round((basis * 28) / 500) * 500);
}

function seatsAvailableFor(capacity, routeIndex, dayIndex, slotIndex) {
  const reserved = 6 + ((routeIndex * 5 + dayIndex * 3 + slotIndex * 4) % Math.max(8, Math.floor(capacity * 0.45)));
  return Math.max(4, capacity - reserved);
}

const BASE_DAY = startOfUtcDay();
const YESTERDAY = fmtDate(addDays(BASE_DAY, -1));
const DATE_STRINGS = Array.from({ length: 6 }, (_, index) => fmtDate(addDays(BASE_DAY, index)));

const USER_DEFS = [
  { name: 'Test Passenger', email: 'passenger@test.rw', phone: '0781000001', role: 'PASSENGER' },
  { name: 'Test Admin', email: 'admin@test.rw', phone: '0781000002', role: 'ADMIN' },
  { name: 'Test SuperAdmin', email: 'superadmin@test.rw', phone: '0781000003', role: 'SUPER_ADMIN' },
  { name: 'Test Operator', email: 'operator@test.rw', phone: '0781000004', role: 'OPERATOR' },
  { name: 'Horizon Operator', email: 'operator2@test.rw', phone: '0781000005', role: 'OPERATOR' },
  { name: 'Virunga Operator', email: 'operator3@test.rw', phone: '0781000006', role: 'OPERATOR' },
  { name: 'Alice Uwimana', email: 'alice@test.rw', phone: '0782000001', role: 'PASSENGER' },
  { name: 'Bob Nkurunziza', email: 'bob@test.rw', phone: '0782000002', role: 'PASSENGER' },
  { name: 'Carol Mukamana', email: 'carol@test.rw', phone: '0782000003', role: 'PASSENGER' },
];

const COMPANY_DEFS = [
  { key: 'volcano', name: 'Volcano Express', licenseNo: 'RW-BUS-001', operatorEmail: 'operator@test.rw', priceDelta: 300 },
  { key: 'horizon', name: 'Horizon Express', licenseNo: 'RW-BUS-002', operatorEmail: 'operator2@test.rw', priceDelta: 0 },
  { key: 'virunga', name: 'Virunga Transit', licenseNo: 'RW-BUS-003', operatorEmail: 'operator3@test.rw', priceDelta: 200 },
];

const FLEET_DEFS = {
  volcano: {
    buses: [
      { plateNumber: 'RAA 001 A', model: 'Yutong Coach', capacity: 45 },
      { plateNumber: 'RAB 002 B', model: 'King Long Coach', capacity: 49 },
      { plateNumber: 'RAE 005 E', model: 'Scania Touring', capacity: 51 },
      { plateNumber: 'RAF 006 F', model: 'Toyota Coaster', capacity: 30 },
      { plateNumber: 'RAG 007 G', model: 'Golden Dragon', capacity: 33 },
    ],
    drivers: [
      { name: 'Jean Bosco Nkusi', licenseNo: 'DL-RW-10001', phone: '0788100001' },
      { name: 'Patrick Habyarimana', licenseNo: 'DL-RW-10002', phone: '0788100002' },
      { name: 'Eric Niyonzima', licenseNo: 'DL-RW-10005', phone: '0788100005' },
      { name: 'Claude Mugisha', licenseNo: 'DL-RW-10006', phone: '0788100006' },
      { name: 'Alfred Rukundo', licenseNo: 'DL-RW-10007', phone: '0788100007' },
    ],
  },
  horizon: {
    buses: [
      { plateNumber: 'RAC 003 C', model: 'Higer Coach', capacity: 45 },
      { plateNumber: 'RAD 004 D', model: 'Yutong Coach', capacity: 49 },
      { plateNumber: 'RAH 008 H', model: 'Scania K-series', capacity: 51 },
      { plateNumber: 'RAK 011 K', model: 'Toyota Coaster', capacity: 29 },
      { plateNumber: 'RAL 012 L', model: 'Golden Dragon', capacity: 33 },
    ],
    drivers: [
      { name: 'Emmanuel Uwimana', licenseNo: 'DL-RW-10003', phone: '0788100003' },
      { name: 'Celestin Bizimana', licenseNo: 'DL-RW-10004', phone: '0788100004' },
      { name: 'Olivier Ndayisenga', licenseNo: 'DL-RW-10008', phone: '0788100008' },
      { name: 'Didier Mutabazi', licenseNo: 'DL-RW-10009', phone: '0788100009' },
      { name: 'Yvan Habimana', licenseNo: 'DL-RW-10010', phone: '0788100010' },
    ],
  },
  virunga: {
    buses: [
      { plateNumber: 'RAM 013 M', model: 'Zhongtong Coach', capacity: 45 },
      { plateNumber: 'RAN 014 N', model: 'Yutong Coach', capacity: 49 },
      { plateNumber: 'RAP 016 P', model: 'Scania Touring', capacity: 51 },
      { plateNumber: 'RAU 021 U', model: 'Toyota Coaster', capacity: 29 },
      { plateNumber: 'RAV 022 V', model: 'King Long', capacity: 33 },
    ],
    drivers: [
      { name: 'Gilbert Nshimiyimana', licenseNo: 'DL-RW-10011', phone: '0788100011' },
      { name: 'Samuel Ntirushwa', licenseNo: 'DL-RW-10012', phone: '0788100012' },
      { name: 'Frederic Turikumwe', licenseNo: 'DL-RW-10013', phone: '0788100013' },
      { name: 'Bosco Mugenzi', licenseNo: 'DL-RW-10014', phone: '0788100014' },
      { name: 'Alexis Hakizimana', licenseNo: 'DL-RW-10015', phone: '0788100015' },
    ],
  },
};

const DEFAULT_ROUTE_PROFILES = [
  {
    origin: 'Kigali',
    destination: 'Musanze',
    distanceKm: 111,
    durationMin: 120,
    basePrice: 3000,
    departures: ['06:30', '14:30'],
  },
  {
    origin: 'Kigali',
    destination: 'Butare',
    distanceKm: 136,
    durationMin: 150,
    basePrice: 3500,
    departures: ['07:00', '16:00'],
  },
  {
    origin: 'Kigali',
    destination: 'Gisenyi',
    distanceKm: 157,
    durationMin: 165,
    basePrice: 4500,
    departures: ['06:00', '15:15'],
  },
  {
    origin: 'Kigali',
    destination: 'Cyangugu',
    distanceKm: 218,
    durationMin: 210,
    basePrice: 6500,
    departures: ['05:45', '13:45'],
  },
  {
    origin: 'Kigali',
    destination: 'Kibungo',
    distanceKm: 114,
    durationMin: 120,
    basePrice: 3000,
    departures: ['07:30', '17:30'],
  },
  {
    origin: 'Butare',
    destination: 'Musanze',
    distanceKm: 195,
    durationMin: 195,
    basePrice: 5500,
    departures: ['08:00', '14:45'],
  },
];

function routeKey(route) {
  return `${route.origin}→${route.destination}`;
}

async function main() {
  console.log('Resetting operational demo data...');
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.schedule.deleteMany({});

  console.log('Seeding users...');
  for (const user of USER_DEFS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: true,
      },
      create: {
        ...user,
        isActive: true,
        passwordHash: HASH,
      },
    });
  }

  console.log('Seeding companies...');
  const companiesByKey = {};
  for (const def of COMPANY_DEFS) {
    companiesByKey[def.key] = await prisma.company.upsert({
      where: { name: def.name },
      update: {
        licenseNo: def.licenseNo,
        isActive: true,
      },
      create: {
        name: def.name,
        licenseNo: def.licenseNo,
        isActive: true,
      },
    });

    await prisma.user.update({
      where: { email: def.operatorEmail },
      data: { companyId: companiesByKey[def.key].id, isActive: true },
    });
  }

  console.log('Seeding fleet and drivers...');
  const busesByCompanyId = {};
  const driversByCompanyId = {};

  for (const def of COMPANY_DEFS) {
    const company = companiesByKey[def.key];
    busesByCompanyId[company.id] = [];
    driversByCompanyId[company.id] = [];

    for (const busDef of FLEET_DEFS[def.key].buses) {
      const bus = await prisma.bus.upsert({
        where: { plateNumber: busDef.plateNumber },
        update: {
          companyId: company.id,
          model: busDef.model,
          capacity: busDef.capacity,
          status: 'ACTIVE',
        },
        create: {
          companyId: company.id,
          plateNumber: busDef.plateNumber,
          model: busDef.model,
          capacity: busDef.capacity,
          status: 'ACTIVE',
        },
      });
      busesByCompanyId[company.id].push(bus);
    }

    for (const driverDef of FLEET_DEFS[def.key].drivers) {
      const driver = await prisma.driver.upsert({
        where: { licenseNo: driverDef.licenseNo },
        update: {
          companyId: company.id,
          name: driverDef.name,
          phone: driverDef.phone,
          isActive: true,
        },
        create: {
          companyId: company.id,
          name: driverDef.name,
          licenseNo: driverDef.licenseNo,
          phone: driverDef.phone,
          isActive: true,
        },
      });
      driversByCompanyId[company.id].push(driver);
    }
  }

  console.log('Seeding default routes...');
  const routeProfiles = new Map();
  for (const profile of DEFAULT_ROUTE_PROFILES) {
    const route = await prisma.route.upsert({
      where: {
        origin_destination: {
          origin: profile.origin,
          destination: profile.destination,
        },
      },
      update: {
        distanceKm: profile.distanceKm,
        durationMin: profile.durationMin,
        isActive: true,
      },
      create: {
        origin: profile.origin,
        destination: profile.destination,
        distanceKm: profile.distanceKm,
        durationMin: profile.durationMin,
        isActive: true,
      },
    });

    routeProfiles.set(routeKey(route), profile);
  }

  const activeRoutes = await prisma.route.findMany({
    where: { isActive: true },
    orderBy: [{ origin: 'asc' }, { destination: 'asc' }],
  });

  console.log(`Seeding schedules for ${activeRoutes.length} active routes across ${DATE_STRINGS.length} days...`);
  let schedulesCreated = 0;

  for (const [dayIndex, dateStr] of DATE_STRINGS.entries()) {
    const companyLoad = new Map(
      COMPANY_DEFS.map((def) => [companiesByKey[def.key].id, 0])
    );

    for (const [routeIndex, route] of activeRoutes.entries()) {
      const key = routeKey(route);
      const profile = routeProfiles.get(key) ?? {
        durationMin: route.durationMin ?? 120,
        basePrice: deriveBasePrice(route),
        departures: ['09:15'],
      };

      for (const [slotIndex, departureClock] of profile.departures.entries()) {
        const companyDef = COMPANY_DEFS[(routeIndex + dayIndex + slotIndex) % COMPANY_DEFS.length];
        const company = companiesByKey[companyDef.key];
        const load = companyLoad.get(company.id) ?? 0;
        const busPool = busesByCompanyId[company.id];
        const driverPool = driversByCompanyId[company.id];

        if (load >= busPool.length || load >= driverPool.length) {
          throw new Error(`Not enough seeded fleet to cover ${dateStr} for ${company.name}.`);
        }

        const bus = busPool[load];
        const driver = driverPool[load];
        companyLoad.set(company.id, load + 1);

        const departureTime = dt(dateStr, departureClock);
        const arrivalTime = addMinutes(departureTime, route.durationMin ?? profile.durationMin);
        const seatsTotal = bus.capacity;
        const seatsAvailable = seatsAvailableFor(bus.capacity, routeIndex, dayIndex, slotIndex);
        const price = (profile.basePrice ?? deriveBasePrice(route)) + companyDef.priceDelta;

        await prisma.schedule.create({
          data: {
            routeId: route.id,
            busId: bus.id,
            driverId: driver.id,
            companyId: company.id,
            departureTime,
            arrivalTime,
            price: String(price),
            seatsTotal,
            seatsAvailable,
            status: 'SCHEDULED',
          },
        });

        schedulesCreated += 1;
      }
    }
  }

  const historicalRoute = activeRoutes.find((route) => routeKey(route) === 'Kigali→Musanze') ?? activeRoutes[0];
  const volcano = companiesByKey.volcano;
  const completedSchedule = await prisma.schedule.create({
    data: {
      routeId: historicalRoute.id,
      busId: busesByCompanyId[volcano.id][0].id,
      driverId: driversByCompanyId[volcano.id][0].id,
      companyId: volcano.id,
      departureTime: dt(YESTERDAY, '09:00'),
      arrivalTime: addMinutes(dt(YESTERDAY, '09:00'), historicalRoute.durationMin ?? 120),
      price: String((routeProfiles.get(routeKey(historicalRoute))?.basePrice ?? deriveBasePrice(historicalRoute)) + COMPANY_DEFS[0].priceDelta),
      seatsTotal: busesByCompanyId[volcano.id][0].capacity,
      seatsAvailable: busesByCompanyId[volcano.id][0].capacity,
      status: 'COMPLETED',
    },
  });
  schedulesCreated += 1;

  console.log('Seeding booking and payment demo data...');

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'passenger@test.rw',
          'alice@test.rw',
          'bob@test.rw',
          'carol@test.rw',
          'operator@test.rw',
        ],
      },
    },
  });

  const userByEmail = Object.fromEntries(users.map((user) => [user.email, user]));

  const futureVolcano = await prisma.schedule.findMany({
    where: {
      companyId: volcano.id,
      status: 'SCHEDULED',
      departureTime: { gt: new Date() },
      seatsAvailable: { gt: 1 },
    },
    orderBy: { departureTime: 'asc' },
    take: 3,
  });

  const futureHorizon = await prisma.schedule.findMany({
    where: {
      companyId: companiesByKey.horizon.id,
      status: 'SCHEDULED',
      departureTime: { gt: new Date() },
      seatsAvailable: { gt: 1 },
    },
    orderBy: { departureTime: 'asc' },
    take: 2,
  });

  if (futureVolcano.length < 3 || futureHorizon.length < 2) {
    throw new Error('Not enough future schedules were generated for booking seed data.');
  }

  async function seedBooking({
    reference,
    userId,
    schedule,
    status,
    paymentStatus = null,
    transactionId = null,
    paidAt = null,
    extraData = {},
  }) {
    const totalAmount = Number(schedule.price);
    const booking = await prisma.booking.create({
      data: {
        reference,
        userId,
        scheduleId: schedule.id,
        seatsBooked: 1,
        totalAmount: String(totalAmount),
        status,
        ...extraData,
      },
    });

    if (paymentStatus) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: String(totalAmount),
          status: paymentStatus,
          method: 'simulated',
          transactionId,
          paidAt: paymentStatus === 'PAID' ? (paidAt ?? new Date()) : null,
        },
      });
    }

    if (['CONFIRMED', 'COMPLETED'].includes(status)) {
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { seatsAvailable: { decrement: 1 } },
      });
    }

    return booking;
  }

  await seedBooking({
    reference: 'RW-DEADBEEF',
    userId: userByEmail['passenger@test.rw'].id,
    schedule: futureVolcano[0],
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    transactionId: 'SEED-001',
  });

  await seedBooking({
    reference: 'RW-A11CE001',
    userId: userByEmail['alice@test.rw'].id,
    schedule: futureVolcano[0],
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    transactionId: 'SEED-002',
  });

  await seedBooking({
    reference: 'RW-A11CE002',
    userId: userByEmail['alice@test.rw'].id,
    schedule: futureVolcano[1],
    status: 'PENDING',
    paymentStatus: 'PENDING',
    transactionId: 'SEED-003',
  });

  await seedBooking({
    reference: 'RW-B0B00001',
    userId: userByEmail['bob@test.rw'].id,
    schedule: futureVolcano[2],
    status: 'CANCELLED',
  });

  await seedBooking({
    reference: 'RW-B0B00002',
    userId: userByEmail['bob@test.rw'].id,
    schedule: futureHorizon[0],
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    transactionId: 'SEED-005',
  });

  await seedBooking({
    reference: 'RW-CA01CA01',
    userId: userByEmail['carol@test.rw'].id,
    schedule: completedSchedule,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    transactionId: 'SEED-006',
    paidAt: addMinutes(completedSchedule.departureTime, -120),
    extraData: {
      boardedAt: addMinutes(completedSchedule.departureTime, -15),
      boardedById: userByEmail['operator@test.rw'].id,
      boardingNote: 'Boarded at the Kigali departure gate.',
    },
  });

  await seedBooking({
    reference: 'RW-PEND0001',
    userId: userByEmail['carol@test.rw'].id,
    schedule: futureHorizon[1],
    status: 'PENDING',
    paymentStatus: 'PENDING',
    transactionId: 'SEED-007',
  });

  const [companyCount, busCount, driverCount, routeCount, scheduleCount] = await Promise.all([
    prisma.company.count({ where: { isActive: true } }),
    prisma.bus.count(),
    prisma.driver.count({ where: { isActive: true } }),
    prisma.route.count({ where: { isActive: true } }),
    prisma.schedule.count(),
  ]);

  console.log('\nSeed summary');
  console.log(`  Active companies: ${companyCount}`);
  console.log(`  Buses:            ${busCount}`);
  console.log(`  Active drivers:   ${driverCount}`);
  console.log(`  Active routes:    ${routeCount}`);
  console.log(`  Schedules:        ${scheduleCount} (${schedulesCreated} created this run)`);
  console.log(`  Bookable dates:   ${DATE_STRINGS[0]} -> ${DATE_STRINGS[DATE_STRINGS.length - 1]}`);

  console.log('\nTest accounts (newly created accounts default to Password123)');
  console.log('  passenger@test.rw  -> passenger');
  console.log('  admin@test.rw      -> admin');
  console.log('  superadmin@test.rw -> super-admin');
  console.log('  operator@test.rw   -> Volcano Express operator');
  console.log('  operator2@test.rw  -> Horizon Express operator');
  console.log('  operator3@test.rw  -> Virunga Transit operator');
  console.log('  alice@test.rw      -> passenger');
  console.log('  bob@test.rw        -> passenger');
  console.log('  carol@test.rw      -> passenger');

  console.log('\nBooking references');
  console.log('  RW-DEADBEEF  passenger@test.rw  Volcano  CONFIRMED+PAID');
  console.log('  RW-A11CE001  alice@test.rw      Volcano  CONFIRMED+PAID');
  console.log('  RW-A11CE002  alice@test.rw      Volcano  PENDING');
  console.log('  RW-B0B00001  bob@test.rw        Volcano  CANCELLED');
  console.log('  RW-B0B00002  bob@test.rw        Horizon  CONFIRMED+PAID');
  console.log('  RW-CA01CA01  carol@test.rw      Volcano  COMPLETED');
  console.log('  RW-PEND0001  carol@test.rw      Horizon  PENDING');

  console.log('\nSearch examples');
  console.log(`  GET /api/schedules/search?from=Kigali&to=Musanze&date=${DATE_STRINGS[0]}&seats=1`);
  console.log(`  GET /api/schedules/search?from=Kigali&to=Butare&date=${DATE_STRINGS[1]}&seats=1`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
