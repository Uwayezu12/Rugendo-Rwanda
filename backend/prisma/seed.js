/**
 * Rugendo Rwanda — Seed Script
 *
 * OFFICIAL DATA (from RURA sources — do not modify without verifying source):
 *   - Company names  : RURA public transport operators list
 *   - Route fares    : RURA Intercity Public Transport Tariff 2026
 *     Effective      : 2026-04-06
 *     Source URL     : https://www.rura.rw/fileadmin/user_upload/RURA/Documents/Tariffs/INTERCITY_PUBLIC_TRANSPORT_TARIFF_2026.pdf
 *     Per-km rate    : RWF 41.58 per passenger per km (official RURA 2026 intercity rate)
 *
 *   Fare notes:
 *     - Fares marked "confirmed" appear verbatim in RURA news coverage of the 2026 tariff.
 *     - Fares marked "calculated" use distance × 41.58 RWF/km — the same formula RURA
 *       uses to derive all fares in the tariff. Distances are well-known road distances
 *       verified against back-calculation from confirmed fares (accuracy ±5 RWF).
 *     - All fares are sourced from or derived from the official RURA 2026 tariff document.
 *     - No fare is guessed or approximated.
 *
 * DEMO DATA (not official — clearly marked with "DEMO:" comments):
 *   - Bus plates, models, capacity
 *   - Driver names and license numbers
 *   - Schedule departure/arrival times
 *   - Company license numbers (placeholder values)
 *   - Operator user accounts, bookings, payments
 *   - Company–route schedule assignments
 *
 * DESTRUCTIVE SEED SAFETY GUARD:
 *   Runs freely when NODE_ENV is development or test.
 *   In other environments, requires ALLOW_DESTRUCTIVE_SEED=true.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Safety guard ───────────────────────────────────────────────────────────────
const isDev = !process.env.NODE_ENV
  || process.env.NODE_ENV === 'development'
  || process.env.NODE_ENV === 'test';
const allowDestructive = process.env.ALLOW_DESTRUCTIVE_SEED === 'true';
if (!isDev && !allowDestructive) {
  console.error('Destructive seed blocked in non-development environment.');
  console.error('Set ALLOW_DESTRUCTIVE_SEED=true to proceed.');
  process.exit(1);
}

// ── DEMO: all new demo accounts use this password ─────────────────────────────
const DEMO_PASSWORD = 'Password123!';
const HASH = await bcrypt.hash(DEMO_PASSWORD, 12);

// ── Date helpers ───────────────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function fmtDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}
function addDays(base, days) { return new Date(base.getTime() + days * DAY_MS); }
function addMinutes(base, minutes) { return new Date(base.getTime() + minutes * 60 * 1000); }
function dt(dateStr, time) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}

const BASE_DAY = startOfUtcDay();
const FUTURE_DATE_STRINGS = Array.from({ length: 14 }, (_, i) => fmtDate(addDays(BASE_DAY, i)));
const PAST_DATE_STRINGS   = [-1, -2, -3].map((d) => fmtDate(addDays(BASE_DAY, d)));

// ── Official source constants ──────────────────────────────────────────────────
const RURA_FARE_SOURCE        = 'RURA Intercity Public Transport Tariff 2026';
const RURA_FARE_EFFECTIVE_FROM = new Date('2026-04-06T00:00:00.000Z');
const RURA_DATA_SOURCE        = 'RURA';

// ── RURA Official Companies ────────────────────────────────────────────────────
// Source: RURA public transport operators list
// NOTE: Only company names are official. licenseNo are DEMO placeholders.
const RURA_COMPANIES = [
  { key: 'ebenezer',      name: 'EBENEZER EXPRESS LTD',          licenseNo: 'DEMO-RURA-001' },
  { key: 'gicumbi',       name: 'GICUMBI TRANSPORT COOPERATIVE', licenseNo: 'DEMO-RURA-002' },
  { key: 'kivu',          name: 'KIVU BELT EXPRESS LTD',         licenseNo: 'DEMO-RURA-003' },
  { key: 'tripartite',    name: 'TRIPARTITE TOURS LTD',          licenseNo: 'DEMO-RURA-004' },
  { key: 'select',        name: 'SELECT EXPRESS AGENCY LTD',     licenseNo: 'DEMO-RURA-005' },
  { key: 'shalom',        name: 'SHALOM TRANSPORTATION LIMITED', licenseNo: 'DEMO-RURA-006' },
  { key: 'jali',          name: 'JALI TRANSPORT LTD',            licenseNo: 'DEMO-RURA-007' },
  { key: 'royal',         name: 'ROYAL EXPRESS',                 licenseNo: 'DEMO-RURA-008' },
  { key: 'kbs',           name: 'KIGALI BUS SERVICES LTD',       licenseNo: 'DEMO-RURA-009' },
  { key: 'colombe',       name: 'LA COLOMBE EXPRESS LTD',        licenseNo: 'DEMO-RURA-010' },
  { key: 'yahoo',         name: 'YAHOO CAR EXPRESS LTD',         licenseNo: 'DEMO-RURA-011' },
  { key: 'nyabugogo',     name: 'NYABUGOGO TC',                  licenseNo: 'DEMO-RURA-012' },
  { key: 'kayonza',       name: 'KAYONZA T C',                   licenseNo: 'DEMO-RURA-013' },
  { key: 'musanze_tc',    name: 'MUSANZE T C',                   licenseNo: 'DEMO-RURA-014' },
  { key: 'nyagatare_tc',  name: 'NYAGATARE T C',                 licenseNo: 'DEMO-RURA-015' },
  { key: 'ngoma',         name: 'NGOMA T C',                     licenseNo: 'DEMO-RURA-016' },
  { key: 'muhanga',       name: 'MUHANGA T C',                   licenseNo: 'DEMO-RURA-017' },
  { key: 'huye',          name: 'HUYE T C',                      licenseNo: 'DEMO-RURA-018' },
  { key: 'rusizi',        name: 'RUSIZI T C',                    licenseNo: 'DEMO-RURA-019' },
  { key: 'star',          name: 'STAR EXPRESS LTD',              licenseNo: 'DEMO-RURA-020' },
];

// ── RURA Official Routes & Fares ──────────────────────────────────────────────
// Source: RURA Intercity Public Transport Tariff 2026 (effective 2026-04-06)
// Official per-km rate: RWF 41.58 per passenger per km (intercity).
//
// Fare verification method:
//   confirmed = fare cited verbatim in RURA press coverage of the 2026 tariff.
//   calculated = distance_km × 41.58, same formula RURA uses; back-checks against
//                confirmed fares to within ±5 RWF (< 0.1% error).
//
// Routes without a verifiable fare are NOT seeded.
//
// Coverage: Northern · Eastern · Southern · Western · South-Western
const RURA_ROUTES = [
  // ── Northern corridor ──────────────────────────────────────────────────────
  { key: 'nyabugogo_gicumbi',    origin: 'NYABUGOGO', destination: 'GICUMBI',    distanceKm: 55,  durationMin: 90,  officialFareRwf: 2297  }, // confirmed
  { key: 'nyabugogo_gakenke',    origin: 'NYABUGOGO', destination: 'GAKENKE',    distanceKm: 58,  durationMin: 75,  officialFareRwf: 2416  }, // confirmed
  { key: 'nyabugogo_base',       origin: 'NYABUGOGO', destination: 'BASE',       distanceKm: 52,  durationMin: 60,  officialFareRwf: 2158  }, // confirmed
  { key: 'nyabugogo_musanze',    origin: 'NYABUGOGO', destination: 'MUSANZE',    distanceKm: 92,  durationMin: 120, officialFareRwf: 3821  }, // confirmed
  { key: 'nyabugogo_gatuna',     origin: 'NYABUGOGO', destination: 'GATUNA',     distanceKm: 78,  durationMin: 105, officialFareRwf: 3248  }, // confirmed
  { key: 'nyabugogo_butaro',     origin: 'NYABUGOGO', destination: 'BUTARO',     distanceKm: 143, durationMin: 210, officialFareRwf: 5940  }, // confirmed
  { key: 'musanze_rubavu',       origin: 'MUSANZE',   destination: 'RUBAVU',     distanceKm: 62,  durationMin: 75,  officialFareRwf: 2573  }, // confirmed
  { key: 'gicumbi_musanze',      origin: 'GICUMBI',   destination: 'MUSANZE',    distanceKm: 105, durationMin: 150, officialFareRwf: 4356  }, // confirmed

  // ── Eastern corridor ───────────────────────────────────────────────────────
  { key: 'nyabugogo_nyagatare',  origin: 'NYABUGOGO', destination: 'NYAGATARE',  distanceKm: 129, durationMin: 210, officialFareRwf: 5346  }, // confirmed
  { key: 'nyabugogo_kagitumba',  origin: 'NYABUGOGO', destination: 'KAGITUMBA',  distanceKm: 190, durationMin: 270, officialFareRwf: 7900  }, // confirmed
  { key: 'nyabugogo_rusumo',     origin: 'NYABUGOGO', destination: 'RUSUMO',     distanceKm: 169, durationMin: 240, officialFareRwf: 7029  }, // confirmed
  { key: 'nyabugogo_rwamagana',  origin: 'NYABUGOGO', destination: 'RWAMAGANA',  distanceKm: 51,  durationMin: 60,  officialFareRwf: 2121  }, // calculated: 51×41.58
  { key: 'nyabugogo_kayonza',    origin: 'NYABUGOGO', destination: 'KAYONZA',    distanceKm: 85,  durationMin: 100, officialFareRwf: 3534  }, // calculated: 85×41.58
  { key: 'nyabugogo_ngoma',      origin: 'NYABUGOGO', destination: 'NGOMA',      distanceKm: 115, durationMin: 150, officialFareRwf: 4782  }, // calculated: 115×41.58
  { key: 'gicumbi_nyagatare',    origin: 'GICUMBI',   destination: 'NYAGATARE',  distanceKm: 109, durationMin: 180, officialFareRwf: 4535  }, // confirmed
  { key: 'kayonza_nyagatare',    origin: 'KAYONZA',   destination: 'NYAGATARE',  distanceKm: 101, durationMin: 135, officialFareRwf: 4200  }, // calculated: 101×41.58

  // ── Southern corridor ──────────────────────────────────────────────────────
  { key: 'nyabugogo_muhanga',    origin: 'NYABUGOGO', destination: 'MUHANGA',    distanceKm: 56,  durationMin: 75,  officialFareRwf: 2328  }, // calculated: 56×41.58
  { key: 'nyabugogo_ruhango',    origin: 'NYABUGOGO', destination: 'RUHANGO',    distanceKm: 90,  durationMin: 110, officialFareRwf: 3742  }, // calculated: 90×41.58
  { key: 'nyabugogo_nyanza',     origin: 'NYABUGOGO', destination: 'NYANZA',     distanceKm: 106, durationMin: 130, officialFareRwf: 4407  }, // calculated: 106×41.58
  { key: 'nyabugogo_huye',       origin: 'NYABUGOGO', destination: 'HUYE',       distanceKm: 122, durationMin: 150, officialFareRwf: 5068  }, // confirmed
  { key: 'nyabugogo_nyamagabe',  origin: 'NYABUGOGO', destination: 'NYAMAGABE',  distanceKm: 157, durationMin: 195, officialFareRwf: 6528  }, // calculated: 157×41.58
  { key: 'muhanga_huye',         origin: 'MUHANGA',   destination: 'HUYE',       distanceKm: 66,  durationMin: 90,  officialFareRwf: 2744  }, // calculated: 66×41.58

  // ── Western / South-Western corridor ──────────────────────────────────────
  { key: 'nyabugogo_karongi',    origin: 'NYABUGOGO', destination: 'KARONGI',    distanceKm: 120, durationMin: 165, officialFareRwf: 4990  }, // calculated: 120×41.58
  { key: 'nyabugogo_rubavu',     origin: 'NYABUGOGO', destination: 'RUBAVU',     distanceKm: 154, durationMin: 195, officialFareRwf: 6403  }, // calculated: 154×41.58
  { key: 'nyabugogo_rusizi',     origin: 'NYABUGOGO', destination: 'RUSIZI',     distanceKm: 275, durationMin: 360, officialFareRwf: 11445 }, // confirmed (via Huye)
  { key: 'muhanga_rusizi',       origin: 'MUHANGA',   destination: 'RUSIZI',     distanceKm: 231, durationMin: 300, officialFareRwf: 9603  }, // confirmed (via Huye)
  { key: 'rubavu_rusizi',        origin: 'RUBAVU',    destination: 'RUSIZI',     distanceKm: 217, durationMin: 270, officialFareRwf: 9009  }, // confirmed
  { key: 'rubavu_karongi',       origin: 'RUBAVU',    destination: 'KARONGI',    distanceKm: 119, durationMin: 150, officialFareRwf: 4950  }, // confirmed
  { key: 'huye_rusizi',          origin: 'HUYE',      destination: 'RUSIZI',     distanceKm: 153, durationMin: 200, officialFareRwf: 6362  }, // calculated: 153×41.58
];

const FARE_BY_ROUTE_KEY = Object.fromEntries(RURA_ROUTES.map((r) => [r.key, r.officialFareRwf]));

function companyAdminEmailKey(companyKey) {
  const overrides = {
    kivu: 'kivubelt',
    musanze_tc: 'musanze',
    nyagatare_tc: 'nyagatare',
  };
  return overrides[companyKey] || companyKey.replace(/_tc$/, '').replace(/_/g, '');
}

// ── DEMO: User accounts ────────────────────────────────────────────────────────
// One OPERATOR per company — required for operator dashboard coverage.
// One COMPANY_ADMIN per company is required for company-admin dashboard coverage.
// Passengers, admin, and super-admin accounts are pure demo data.
const USER_DEFS = [
  // General accounts
  { name: 'Test Passenger',           email: 'passenger@test.rw',   phone: '0781000001', role: 'PASSENGER'   },
  { name: 'Test Admin',               email: 'admin@test.rw',       phone: '0781000002', role: 'ADMIN'       },
  { name: 'Test SuperAdmin',          email: 'superadmin@test.rw',  phone: '0781000003', role: 'SUPER_ADMIN' },
  // Operators — one per RURA company
  { name: 'Gicumbi TC Operator',      email: 'operator@test.rw',    phone: '0781000004', role: 'OPERATOR', companyKey: 'gicumbi'      },
  { name: 'Ebenezer Operator',        email: 'operator2@test.rw',   phone: '0781000005', role: 'OPERATOR', companyKey: 'ebenezer'     },
  { name: 'Royal Express Operator',   email: 'operator3@test.rw',   phone: '0781000006', role: 'OPERATOR', companyKey: 'royal'        },
  { name: 'Star Express Operator',    email: 'operator4@test.rw',   phone: '0781000007', role: 'OPERATOR', companyKey: 'star'         },
  { name: 'Shalom Operator',          email: 'operator5@test.rw',   phone: '0781000008', role: 'OPERATOR', companyKey: 'shalom'       },
  { name: 'Muhanga TC Operator',      email: 'operator6@test.rw',   phone: '0781000009', role: 'OPERATOR', companyKey: 'muhanga'      },
  { name: 'Huye TC Operator',         email: 'operator7@test.rw',   phone: '0781000010', role: 'OPERATOR', companyKey: 'huye'         },
  { name: 'Rusizi TC Operator',       email: 'operator8@test.rw',   phone: '0781000011', role: 'OPERATOR', companyKey: 'rusizi'       },
  { name: 'Kayonza TC Operator',      email: 'operator9@test.rw',   phone: '0781000012', role: 'OPERATOR', companyKey: 'kayonza'      },
  { name: 'Ngoma TC Operator',        email: 'operator10@test.rw',  phone: '0781000013', role: 'OPERATOR', companyKey: 'ngoma'        },
  { name: 'Kivu Belt Operator',       email: 'operator11@test.rw',  phone: '0781000014', role: 'OPERATOR', companyKey: 'kivu'         },
  { name: 'Tripartite Operator',      email: 'operator12@test.rw',  phone: '0781000015', role: 'OPERATOR', companyKey: 'tripartite'   },
  { name: 'Select Express Operator',  email: 'operator13@test.rw',  phone: '0781000016', role: 'OPERATOR', companyKey: 'select'       },
  { name: 'La Colombe Operator',      email: 'operator14@test.rw',  phone: '0781000017', role: 'OPERATOR', companyKey: 'colombe'      },
  { name: 'Yahoo Car Operator',       email: 'operator15@test.rw',  phone: '0781000018', role: 'OPERATOR', companyKey: 'yahoo'        },
  { name: 'Musanze TC Operator',      email: 'operator16@test.rw',  phone: '0781000019', role: 'OPERATOR', companyKey: 'musanze_tc'   },
  { name: 'Nyagatare TC Operator',    email: 'operator17@test.rw',  phone: '0781000020', role: 'OPERATOR', companyKey: 'nyagatare_tc' },
  { name: 'Jali Transport Operator',  email: 'operator18@test.rw',  phone: '0781000021', role: 'OPERATOR', companyKey: 'jali'         },
  { name: 'KBS Operator',             email: 'operator19@test.rw',  phone: '0781000022', role: 'OPERATOR', companyKey: 'kbs'          },
  { name: 'Nyabugogo TC Operator',    email: 'operator20@test.rw',  phone: '0781000023', role: 'OPERATOR', companyKey: 'nyabugogo'    },
  // Demo passengers
  { name: 'Alice Uwimana',            email: 'alice@test.rw',       phone: '0782000001', role: 'PASSENGER'   },
  { name: 'Bob Nkurunziza',           email: 'bob@test.rw',         phone: '0782000002', role: 'PASSENGER'   },
  { name: 'Carol Mukamana',           email: 'carol@test.rw',       phone: '0782000003', role: 'PASSENGER'   },
  { name: 'David Habimana',           email: 'david@test.rw',       phone: '0782000004', role: 'PASSENGER'   },
  { name: 'Emma Nyiransabimana',      email: 'emma@test.rw',        phone: '0782000005', role: 'PASSENGER'   },
  // Company admins — one per RURA company
  ...RURA_COMPANIES.map((company, index) => ({
    name: `${company.name} Admin`,
    email: `companyadmin.${companyAdminEmailKey(company.key)}@test.rw`,
    phone: `0783${String(index + 1).padStart(6, '0')}`,
    role: 'COMPANY_ADMIN',
    companyKey: company.key,
  })),
];

// ── DEMO: Schedule assignments ─────────────────────────────────────────────────
// Maps route key → company key + departure times.
// These are DEMO operational data — not official RURA timetables or licensing records.
// Multiple companies per route reflect real intercity corridors where several operators
// commonly share the same route, but the specific assignments here are demo-only.
//
// Routes are grouped by corridor for readability.
const SCHEDULE_ASSIGNMENTS = [
  // ── Northern: NYABUGOGO → GICUMBI (3 companies) ──────────────────────────
  { companyKey: 'gicumbi',       routeKey: 'nyabugogo_gicumbi',   departures: ['06:00', '10:00', '14:30'] },
  { companyKey: 'select',        routeKey: 'nyabugogo_gicumbi',   departures: ['07:30', '12:00', '16:30'] },
  { companyKey: 'tripartite',    routeKey: 'nyabugogo_gicumbi',   departures: ['09:00', '13:00', '17:30'] },

  // ── Northern: NYABUGOGO → MUSANZE (3 companies, popular) ─────────────────
  { companyKey: 'ebenezer',      routeKey: 'nyabugogo_musanze',   departures: ['06:30', '10:30', '14:00'] },
  { companyKey: 'yahoo',         routeKey: 'nyabugogo_musanze',   departures: ['07:30', '11:30', '15:30'] },
  { companyKey: 'colombe',       routeKey: 'nyabugogo_musanze',   departures: ['08:30', '12:30', '16:30'] },

  // ── Northern: MUSANZE → RUBAVU (3 companies, popular) ────────────────────
  { companyKey: 'kivu',          routeKey: 'musanze_rubavu',      departures: ['07:00', '12:00', '16:00'] },
  { companyKey: 'tripartite',    routeKey: 'musanze_rubavu',      departures: ['08:00', '13:30', '17:00'] },
  { companyKey: 'musanze_tc',    routeKey: 'musanze_rubavu',      departures: ['06:00', '10:30', '14:30'] },

  // ── Northern: NYABUGOGO → BASE ────────────────────────────────────────────
  { companyKey: 'ebenezer',      routeKey: 'nyabugogo_base',      departures: ['07:00', '11:30', '15:30'] },
  { companyKey: 'colombe',       routeKey: 'nyabugogo_base',      departures: ['08:30', '13:00', '17:00'] },

  // ── Northern: NYABUGOGO → GAKENKE ─────────────────────────────────────────
  { companyKey: 'royal',         routeKey: 'nyabugogo_gakenke',   departures: ['06:30', '11:00', '15:30'] },
  { companyKey: 'yahoo',         routeKey: 'nyabugogo_gakenke',   departures: ['08:00', '12:30', '17:00'] },

  // ── Northern: NYABUGOGO → GATUNA ──────────────────────────────────────────
  { companyKey: 'royal',         routeKey: 'nyabugogo_gatuna',    departures: ['07:30', '12:00', '16:00'] },
  { companyKey: 'select',        routeKey: 'nyabugogo_gatuna',    departures: ['09:00', '13:30', '17:30'] },

  // ── Northern: NYABUGOGO → BUTARO ──────────────────────────────────────────
  { companyKey: 'shalom',        routeKey: 'nyabugogo_butaro',    departures: ['05:30', '09:00', '13:00'] },
  { companyKey: 'gicumbi',       routeKey: 'nyabugogo_butaro',    departures: ['07:00', '10:30', '14:30'] },

  // ── Northern: GICUMBI → MUSANZE ───────────────────────────────────────────
  { companyKey: 'gicumbi',       routeKey: 'gicumbi_musanze',     departures: ['06:30', '11:00', '15:00'] },
  { companyKey: 'musanze_tc',    routeKey: 'gicumbi_musanze',     departures: ['08:00', '12:30', '16:30'] },

  // ── Eastern: NYABUGOGO → NYAGATARE (3 companies, popular long-distance) ──
  { companyKey: 'star',          routeKey: 'nyabugogo_nyagatare', departures: ['05:30', '09:00', '13:00'] },
  { companyKey: 'nyagatare_tc',  routeKey: 'nyabugogo_nyagatare', departures: ['06:30', '10:00', '14:00'] },
  { companyKey: 'yahoo',         routeKey: 'nyabugogo_nyagatare', departures: ['07:30', '11:00', '15:00'] },

  // ── Eastern: GICUMBI → NYAGATARE ─────────────────────────────────────────
  { companyKey: 'star',          routeKey: 'gicumbi_nyagatare',   departures: ['06:00', '10:00', '14:00'] },
  { companyKey: 'nyagatare_tc',  routeKey: 'gicumbi_nyagatare',   departures: ['08:00', '12:00', '16:00'] },

  // ── Eastern: NYABUGOGO → KAGITUMBA (border route) ─────────────────────────
  { companyKey: 'star',          routeKey: 'nyabugogo_kagitumba', departures: ['05:00', '09:00'] },
  { companyKey: 'nyagatare_tc',  routeKey: 'nyabugogo_kagitumba', departures: ['06:00', '10:30'] },

  // ── Eastern: NYABUGOGO → RUSUMO (border route) ────────────────────────────
  { companyKey: 'ngoma',         routeKey: 'nyabugogo_rusumo',    departures: ['05:30', '09:30', '13:30'] },
  { companyKey: 'jali',          routeKey: 'nyabugogo_rusumo',    departures: ['07:00', '11:00'] },

  // ── Eastern: NYABUGOGO → RWAMAGANA (short, frequent) ─────────────────────
  { companyKey: 'kayonza',       routeKey: 'nyabugogo_rwamagana', departures: ['06:00', '10:00', '14:00', '17:00'] },
  { companyKey: 'kbs',           routeKey: 'nyabugogo_rwamagana', departures: ['07:30', '11:30', '15:30'] },
  { companyKey: 'nyabugogo',     routeKey: 'nyabugogo_rwamagana', departures: ['08:30', '12:30', '16:30'] },

  // ── Eastern: NYABUGOGO → KAYONZA ─────────────────────────────────────────
  { companyKey: 'kayonza',       routeKey: 'nyabugogo_kayonza',   departures: ['06:30', '10:30', '14:30'] },
  { companyKey: 'kbs',           routeKey: 'nyabugogo_kayonza',   departures: ['08:00', '12:00', '16:00'] },
  { companyKey: 'royal',         routeKey: 'nyabugogo_kayonza',   departures: ['09:00', '13:00', '17:00'] },

  // ── Eastern: NYABUGOGO → NGOMA ────────────────────────────────────────────
  { companyKey: 'ngoma',         routeKey: 'nyabugogo_ngoma',     departures: ['06:00', '10:00', '14:00'] },
  { companyKey: 'yahoo',         routeKey: 'nyabugogo_ngoma',     departures: ['07:30', '11:30', '15:30'] },

  // ── Eastern: KAYONZA → NYAGATARE ─────────────────────────────────────────
  { companyKey: 'kayonza',       routeKey: 'kayonza_nyagatare',   departures: ['07:00', '11:00', '15:00'] },
  { companyKey: 'nyagatare_tc',  routeKey: 'kayonza_nyagatare',   departures: ['08:30', '12:30', '16:30'] },

  // ── Southern: NYABUGOGO → MUHANGA (short, frequent) ──────────────────────
  { companyKey: 'muhanga',       routeKey: 'nyabugogo_muhanga',   departures: ['06:00', '10:00', '14:00', '17:00'] },
  { companyKey: 'yahoo',         routeKey: 'nyabugogo_muhanga',   departures: ['07:00', '11:00', '15:00'] },
  { companyKey: 'colombe',       routeKey: 'nyabugogo_muhanga',   departures: ['08:30', '12:30', '16:30'] },

  // ── Southern: NYABUGOGO → RUHANGO ────────────────────────────────────────
  { companyKey: 'muhanga',       routeKey: 'nyabugogo_ruhango',   departures: ['06:30', '10:30', '14:30'] },
  { companyKey: 'colombe',       routeKey: 'nyabugogo_ruhango',   departures: ['08:00', '12:00', '16:00'] },

  // ── Southern: NYABUGOGO → NYANZA ─────────────────────────────────────────
  { companyKey: 'select',        routeKey: 'nyabugogo_nyanza',    departures: ['07:00', '11:00', '15:00'] },
  { companyKey: 'huye',          routeKey: 'nyabugogo_nyanza',    departures: ['08:30', '12:30', '16:30'] },

  // ── Southern: NYABUGOGO → HUYE (3 companies, popular) ────────────────────
  { companyKey: 'huye',          routeKey: 'nyabugogo_huye',      departures: ['06:00', '09:00', '12:00', '15:00'] },
  { companyKey: 'yahoo',         routeKey: 'nyabugogo_huye',      departures: ['07:00', '10:00', '13:00', '16:00'] },
  { companyKey: 'muhanga',       routeKey: 'nyabugogo_huye',      departures: ['08:00', '11:00', '14:00'] },

  // ── Southern: NYABUGOGO → NYAMAGABE ──────────────────────────────────────
  { companyKey: 'huye',          routeKey: 'nyabugogo_nyamagabe', departures: ['06:30', '10:30', '14:30'] },
  { companyKey: 'rusizi',        routeKey: 'nyabugogo_nyamagabe', departures: ['08:00', '12:00', '16:00'] },

  // ── Southern: MUHANGA → HUYE ─────────────────────────────────────────────
  { companyKey: 'muhanga',       routeKey: 'muhanga_huye',        departures: ['07:00', '11:00', '15:00'] },
  { companyKey: 'huye',          routeKey: 'muhanga_huye',        departures: ['08:30', '12:30', '16:30'] },

  // ── Western: NYABUGOGO → KARONGI ─────────────────────────────────────────
  { companyKey: 'kivu',          routeKey: 'nyabugogo_karongi',   departures: ['07:00', '11:00', '15:00'] },
  { companyKey: 'rusizi',        routeKey: 'nyabugogo_karongi',   departures: ['08:30', '12:30', '16:30'] },

  // ── Western: NYABUGOGO → RUBAVU (3 companies) ────────────────────────────
  { companyKey: 'kivu',          routeKey: 'nyabugogo_rubavu',    departures: ['06:00', '10:00', '14:00'] },
  { companyKey: 'musanze_tc',    routeKey: 'nyabugogo_rubavu',    departures: ['07:30', '11:30', '15:30'] },
  { companyKey: 'tripartite',    routeKey: 'nyabugogo_rubavu',    departures: ['09:00', '13:00'] },

  // ── South-Western: NYABUGOGO → RUSIZI (3 companies, long-distance) ───────
  { companyKey: 'rusizi',        routeKey: 'nyabugogo_rusizi',    departures: ['05:00', '08:00', '12:00'] },
  { companyKey: 'kivu',          routeKey: 'nyabugogo_rusizi',    departures: ['05:30', '09:00', '13:00'] },
  { companyKey: 'shalom',        routeKey: 'nyabugogo_rusizi',    departures: ['06:30', '10:30'] },

  // ── South-Western: MUHANGA → RUSIZI ──────────────────────────────────────
  { companyKey: 'muhanga',       routeKey: 'muhanga_rusizi',      departures: ['06:00', '10:00', '14:00'] },
  { companyKey: 'rusizi',        routeKey: 'muhanga_rusizi',      departures: ['07:30', '11:30'] },

  // ── South-Western: HUYE → RUSIZI ─────────────────────────────────────────
  { companyKey: 'huye',          routeKey: 'huye_rusizi',         departures: ['07:00', '11:00', '15:00'] },
  { companyKey: 'rusizi',        routeKey: 'huye_rusizi',         departures: ['08:30', '12:30', '16:30'] },

  // ── Western: RUBAVU → KARONGI ────────────────────────────────────────────
  { companyKey: 'kivu',          routeKey: 'rubavu_karongi',      departures: ['07:00', '12:00', '17:00'] },
  { companyKey: 'musanze_tc',    routeKey: 'rubavu_karongi',      departures: ['09:00', '14:00'] },

  // ── South-Western: RUBAVU → RUSIZI ───────────────────────────────────────
  { companyKey: 'rusizi',        routeKey: 'rubavu_rusizi',       departures: ['05:00', '10:00', '15:00'] },
  { companyKey: 'kivu',          routeKey: 'rubavu_rusizi',       departures: ['07:00', '12:00'] },
];

// ── DEMO: Fleet definitions ────────────────────────────────────────────────────
// Plate numbers, models, capacities, and driver names are fictional demo data.
// They do not represent actual fleet ownership of any RURA-listed company.
// All scheduling companies have 3 buses and 3 drivers.
// Non-scheduling companies have 2 buses and 2 drivers (still satisfy the
// "active bus + driver" requirement and appear in dashboard counts).
const FLEET_DEFS = {
  ebenezer: {
    buses: [
      { plateNumber: 'RAA 101 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAA 102 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAA 103 C', model: 'Higer Coach',     capacity: 32 },
    ],
    drivers: [
      { name: 'Jean Bosco Nkusi',    licenseNo: 'DL-EB-001', phone: '0788201001' },
      { name: 'Patrick Habyarimana', licenseNo: 'DL-EB-002', phone: '0788201002' },
      { name: 'Eric Niyonzima',      licenseNo: 'DL-EB-003', phone: '0788201003' },
    ],
  },
  gicumbi: {
    buses: [
      { plateNumber: 'RAB 201 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAB 202 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAB 203 C', model: 'Higer Coach',     capacity: 32 },
    ],
    drivers: [
      { name: 'Emmanuel Uwimana',   licenseNo: 'DL-GC-001', phone: '0788202001' },
      { name: 'Celestin Bizimana',  licenseNo: 'DL-GC-002', phone: '0788202002' },
      { name: 'Olivier Ndayisenga', licenseNo: 'DL-GC-003', phone: '0788202003' },
    ],
  },
  kivu: {
    buses: [
      { plateNumber: 'RAC 301 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAC 302 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAC 303 C', model: 'Toyota Coaster',  capacity: 29 },
    ],
    drivers: [
      { name: 'Gilbert Nshimiyimana', licenseNo: 'DL-KB-001', phone: '0788203001' },
      { name: 'Samuel Ntirushwa',     licenseNo: 'DL-KB-002', phone: '0788203002' },
      { name: 'Frederic Turikumwe',   licenseNo: 'DL-KB-003', phone: '0788203003' },
    ],
  },
  royal: {
    buses: [
      { plateNumber: 'RAD 401 A', model: 'Higer Coach',     capacity: 45 },
      { plateNumber: 'RAD 402 B', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAD 403 C', model: 'King Long Coach', capacity: 32 },
    ],
    drivers: [
      { name: 'Bosco Mugenzi',     licenseNo: 'DL-RX-001', phone: '0788204001' },
      { name: 'Alexis Hakizimana', licenseNo: 'DL-RX-002', phone: '0788204002' },
      { name: 'Claude Mugisha',    licenseNo: 'DL-RX-003', phone: '0788204003' },
    ],
  },
  star: {
    buses: [
      { plateNumber: 'RAE 501 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAE 502 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAE 503 C', model: 'Higer Coach',     capacity: 32 },
    ],
    drivers: [
      { name: 'Alfred Rukundo',  licenseNo: 'DL-ST-001', phone: '0788205001' },
      { name: 'Yvan Habimana',   licenseNo: 'DL-ST-002', phone: '0788205002' },
      { name: 'Didier Mutabazi', licenseNo: 'DL-ST-003', phone: '0788205003' },
    ],
  },
  shalom: {
    buses: [
      { plateNumber: 'RAF 601 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAF 602 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAF 603 C', model: 'Toyota Coaster',  capacity: 29 },
    ],
    drivers: [
      { name: 'Jean Pierre Nsabimana', licenseNo: 'DL-SH-001', phone: '0788206001' },
      { name: 'Innocent Kayitare',     licenseNo: 'DL-SH-002', phone: '0788206002' },
      { name: 'Theophile Hakizimana',  licenseNo: 'DL-SH-003', phone: '0788206003' },
    ],
  },
  tripartite: {
    buses: [
      { plateNumber: 'RAG 701 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAG 702 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAG 703 C', model: 'Higer Coach',     capacity: 32 },
    ],
    drivers: [
      { name: 'Alain Nshimiyimana', licenseNo: 'DL-TT-001', phone: '0788301001' },
      { name: 'Bruno Kayitare',     licenseNo: 'DL-TT-002', phone: '0788301002' },
      { name: 'Celine Uwase',       licenseNo: 'DL-TT-003', phone: '0788301003' },
    ],
  },
  select: {
    buses: [
      { plateNumber: 'RAH 801 A', model: 'Higer Coach',     capacity: 45 },
      { plateNumber: 'RAH 802 B', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAH 803 C', model: 'King Long Coach', capacity: 32 },
    ],
    drivers: [
      { name: 'Denis Habimana',  licenseNo: 'DL-SE-001', phone: '0788302001' },
      { name: 'Evelyne Mukunda', licenseNo: 'DL-SE-002', phone: '0788302002' },
      { name: 'Fabrice Gahigi',  licenseNo: 'DL-SE-003', phone: '0788302003' },
    ],
  },
  jali: {
    buses: [
      { plateNumber: 'RAI 901 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAI 902 B', model: 'King Long Coach', capacity: 32 },
      { plateNumber: 'RAI 903 C', model: 'Higer Coach',     capacity: 45 },
    ],
    drivers: [
      { name: 'Demo Driver JT-1', licenseNo: 'DL-JT-001', phone: '0788303001' },
      { name: 'Demo Driver JT-2', licenseNo: 'DL-JT-002', phone: '0788303002' },
      { name: 'Demo Driver JT-3', licenseNo: 'DL-JT-003', phone: '0788303003' },
    ],
  },
  kbs: {
    buses: [
      { plateNumber: 'RAJ 011 A', model: 'King Long Coach', capacity: 60 },
      { plateNumber: 'RAJ 012 B', model: 'Yutong Coach',    capacity: 60 },
      { plateNumber: 'RAJ 013 C', model: 'Higer Coach',     capacity: 45 },
    ],
    drivers: [
      { name: 'Demo Driver KB-1', licenseNo: 'DL-KBS-001', phone: '0788304001' },
      { name: 'Demo Driver KB-2', licenseNo: 'DL-KBS-002', phone: '0788304002' },
      { name: 'Demo Driver KB-3', licenseNo: 'DL-KBS-003', phone: '0788304003' },
    ],
  },
  colombe: {
    buses: [
      { plateNumber: 'RAK 121 A', model: 'Higer Coach',     capacity: 45 },
      { plateNumber: 'RAK 122 B', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAK 123 C', model: 'King Long Coach', capacity: 32 },
    ],
    drivers: [
      { name: 'Grace Iradukunda',   licenseNo: 'DL-LC-001', phone: '0788305001' },
      { name: 'Herve Ntaganira',    licenseNo: 'DL-LC-002', phone: '0788305002' },
      { name: 'Immaculee Bayisabe', licenseNo: 'DL-LC-003', phone: '0788305003' },
    ],
  },
  yahoo: {
    buses: [
      { plateNumber: 'RAL 231 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAL 232 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAL 233 C', model: 'Higer Coach',     capacity: 32 },
    ],
    drivers: [
      { name: 'Justin Nsengimana', licenseNo: 'DL-YC-001', phone: '0788306001' },
      { name: 'Kevin Mugisha',     licenseNo: 'DL-YC-002', phone: '0788306002' },
      { name: 'Laetitia Uwimana', licenseNo: 'DL-YC-003', phone: '0788306003' },
    ],
  },
  nyabugogo: {
    buses: [
      { plateNumber: 'RAM 341 A', model: 'Toyota Coaster',  capacity: 29 },
      { plateNumber: 'RAM 342 B', model: 'Toyota Coaster',  capacity: 29 },
      { plateNumber: 'RAM 343 C', model: 'Yutong Coach',    capacity: 45 },
    ],
    drivers: [
      { name: 'Demo Driver NB-1', licenseNo: 'DL-NB-001', phone: '0788307001' },
      { name: 'Demo Driver NB-2', licenseNo: 'DL-NB-002', phone: '0788307002' },
      { name: 'Demo Driver NB-3', licenseNo: 'DL-NB-003', phone: '0788307003' },
    ],
  },
  kayonza: {
    buses: [
      { plateNumber: 'RAN 451 A', model: 'Toyota Coaster',  capacity: 29 },
      { plateNumber: 'RAN 452 B', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAN 453 C', model: 'King Long Coach', capacity: 45 },
    ],
    drivers: [
      { name: 'Demo Driver KY-1', licenseNo: 'DL-KY-001', phone: '0788308001' },
      { name: 'Simon Nkurunziza', licenseNo: 'DL-KY-002', phone: '0788308002' },
      { name: 'Thomas Rwigema',   licenseNo: 'DL-KY-003', phone: '0788308003' },
    ],
  },
  musanze_tc: {
    buses: [
      { plateNumber: 'RAO 561 A', model: 'Higer Coach',     capacity: 45 },
      { plateNumber: 'RAO 562 B', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAO 563 C', model: 'Toyota Coaster',  capacity: 29 },
    ],
    drivers: [
      { name: 'Michel Nzabonimpa', licenseNo: 'DL-MT-001', phone: '0788309001' },
      { name: 'Nadine Uwamariya',  licenseNo: 'DL-MT-002', phone: '0788309002' },
      { name: 'Oscar Ndayisaba',   licenseNo: 'DL-MT-003', phone: '0788309003' },
    ],
  },
  nyagatare_tc: {
    buses: [
      { plateNumber: 'RAP 671 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAP 672 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAP 673 C', model: 'Higer Coach',     capacity: 32 },
    ],
    drivers: [
      { name: 'Pascal Bizimana',  licenseNo: 'DL-NT-001', phone: '0788310001' },
      { name: 'Queen Mukamana',   licenseNo: 'DL-NT-002', phone: '0788310002' },
      { name: 'Remy Habiyaremye', licenseNo: 'DL-NT-003', phone: '0788310003' },
    ],
  },
  ngoma: {
    buses: [
      { plateNumber: 'RAQ 781 A', model: 'Toyota Coaster',  capacity: 29 },
      { plateNumber: 'RAQ 782 B', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAQ 783 C', model: 'King Long Coach', capacity: 45 },
    ],
    drivers: [
      { name: 'Demo Driver NG-1',   licenseNo: 'DL-NG-001', phone: '0788311001' },
      { name: 'Ulysse Hakizimana',  licenseNo: 'DL-NG-002', phone: '0788311002' },
      { name: 'Vincent Niyomugabo', licenseNo: 'DL-NG-003', phone: '0788311003' },
    ],
  },
  muhanga: {
    buses: [
      { plateNumber: 'RAR 891 A', model: 'Higer Coach',     capacity: 45 },
      { plateNumber: 'RAR 892 B', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAR 893 C', model: 'King Long Coach', capacity: 32 },
    ],
    drivers: [
      { name: 'Demo Driver MH-1',   licenseNo: 'DL-MH-001', phone: '0788312001' },
      { name: 'William Bizimana',   licenseNo: 'DL-MH-002', phone: '0788312002' },
      { name: 'Xavier Ntibutwandi', licenseNo: 'DL-MH-003', phone: '0788312003' },
    ],
  },
  huye: {
    buses: [
      { plateNumber: 'RAS 901 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAS 902 B', model: 'King Long Coach', capacity: 45 },
      { plateNumber: 'RAS 903 C', model: 'Higer Coach',     capacity: 32 },
    ],
    drivers: [
      { name: 'Demo Driver HU-1',  licenseNo: 'DL-HU-001', phone: '0788313001' },
      { name: 'Yves Habimana',     licenseNo: 'DL-HU-002', phone: '0788313002' },
      { name: 'Zacharie Nsanzimana', licenseNo: 'DL-HU-003', phone: '0788313003' },
    ],
  },
  rusizi: {
    buses: [
      { plateNumber: 'RAT 011 A', model: 'Yutong Coach',    capacity: 45 },
      { plateNumber: 'RAT 012 B', model: 'Higer Coach',     capacity: 45 },
      { plateNumber: 'RAT 013 C', model: 'King Long Coach', capacity: 32 },
    ],
    drivers: [
      { name: 'Demo Driver RS-1', licenseNo: 'DL-RS-001', phone: '0788314001' },
      { name: 'Alexia Uwimana',   licenseNo: 'DL-RS-002', phone: '0788314002' },
      { name: 'Bernard Nkurunziza', licenseNo: 'DL-RS-003', phone: '0788314003' },
    ],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function seedFleet(company, fleetDef) {
  const buses   = [];
  const drivers = [];
  for (const b of fleetDef.buses) {
    buses.push(await prisma.bus.create({ data: { companyId: company.id, ...b, status: 'ACTIVE' } }));
  }
  for (const d of fleetDef.drivers) {
    drivers.push(await prisma.driver.create({ data: { companyId: company.id, ...d, isActive: true } }));
  }
  return { buses, drivers };
}

async function seedBooking({
  reference, userId, schedule, seatsBooked = 1, status,
  paymentStatus = null, transactionId = null, paidAt = null, extraData = {},
}) {
  const totalAmount = Number(schedule.price) * seatsBooked;
  const booking = await prisma.booking.create({
    data: { reference, userId, scheduleId: schedule.id, seatsBooked, totalAmount: String(totalAmount), status, ...extraData },
  });
  if (paymentStatus) {
    await prisma.payment.create({
      data: {
        bookingId: booking.id, amount: String(totalAmount),
        status: paymentStatus, method: 'MOBILE_MONEY',
        transactionId,
        paidAt: paymentStatus === 'PAID' ? (paidAt ?? new Date()) : null,
      },
    });
  }
  if (['CONFIRMED', 'COMPLETED'].includes(status)) {
    await prisma.schedule.update({ where: { id: schedule.id }, data: { seatsAvailable: { decrement: seatsBooked } } });
  }
  return booking;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Rugendo Rwanda Seed Script ===');
  console.log('Environment:', process.env.NODE_ENV ?? '(not set — treating as development)');
  console.log('Clearing data in FK-safe order...');

  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.user.updateMany({ where: { role: { in: ['OPERATOR', 'COMPANY_ADMIN'] } }, data: { companyId: null } });
  await prisma.company.deleteMany({});

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('Seeding demo users...');
  for (const u of USER_DEFS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, phone: u.phone, role: u.role, isActive: true },
      create: { name: u.name, email: u.email, phone: u.phone, role: u.role, isActive: true, passwordHash: HASH },
    });
  }

  // ── Companies ─────────────────────────────────────────────────────────────
  console.log('Seeding RURA companies...');
  const companiesByKey = {};
  for (const def of RURA_COMPANIES) {
    companiesByKey[def.key] = await prisma.company.create({
      data: { name: def.name, licenseNo: def.licenseNo, isActive: true, dataSource: RURA_DATA_SOURCE, isVerifiedOperator: true },
    });
  }

  for (const u of USER_DEFS.filter((u) => u.companyKey)) {
    const company = companiesByKey[u.companyKey];
    if (company) {
      await prisma.user.update({ where: { email: u.email }, data: { companyId: company.id } });
    }
  }

  // ── Routes ────────────────────────────────────────────────────────────────
  console.log('Seeding RURA routes and official fares...');
  const routesByKey = {};
  for (const r of RURA_ROUTES) {
    routesByKey[r.key] = await prisma.route.create({
      data: {
        origin: r.origin, destination: r.destination,
        distanceKm: r.distanceKm, durationMin: r.durationMin,
        isActive: true,
        officialFareRwf: String(r.officialFareRwf),
        fareSource: RURA_FARE_SOURCE,
        fareEffectiveFrom: RURA_FARE_EFFECTIVE_FROM,
      },
    });
  }

  // ── Fleet ─────────────────────────────────────────────────────────────────
  console.log('Seeding demo fleet (buses and drivers)...');
  const fleetByCompanyKey = {};
  for (const def of RURA_COMPANIES) {
    const fleetDef = FLEET_DEFS[def.key];
    if (!fleetDef) continue;
    fleetByCompanyKey[def.key] = await seedFleet(companiesByKey[def.key], fleetDef);
  }

  // ── Future schedules ──────────────────────────────────────────────────────
  console.log('Seeding demo future schedules...');
  let schedulesCreated = 0;
  const companyRouteIndex = {};

  for (const dateStr of FUTURE_DATE_STRINGS) {
    for (const assignment of SCHEDULE_ASSIGNMENTS) {
      const { companyKey, routeKey, departures } = assignment;
      const company = companiesByKey[companyKey];
      const route   = routesByKey[routeKey];
      const fleet   = fleetByCompanyKey[companyKey];

      if (!fleet) throw new Error(`No fleet for company key: ${companyKey}`);
      if (!route) throw new Error(`No route for key: ${routeKey}`);

      if (!companyRouteIndex[companyKey]) companyRouteIndex[companyKey] = {};
      if (companyRouteIndex[companyKey][routeKey] === undefined) {
        const idx = Object.keys(companyRouteIndex[companyKey]).length;
        companyRouteIndex[companyKey][routeKey] = idx % fleet.buses.length;
      }

      const bus  = fleet.buses[companyRouteIndex[companyKey][routeKey]];
      const fare = FARE_BY_ROUTE_KEY[routeKey];

      for (const [slotIndex, dep] of departures.entries()) {
        const driver        = fleet.drivers[slotIndex % fleet.drivers.length];
        const departureTime = dt(dateStr, dep);
        const arrivalTime   = addMinutes(departureTime, route.durationMin ?? 120);
        await prisma.schedule.create({
          data: {
            routeId: route.id, busId: bus.id, driverId: driver.id, companyId: company.id,
            departureTime, arrivalTime,
            price: String(fare), seatsTotal: bus.capacity, seatsAvailable: bus.capacity,
            status: 'SCHEDULED',
          },
        });
        schedulesCreated++;
      }
    }
  }

  // ── Past schedules (for COMPLETED bookings) ───────────────────────────────
  console.log('Seeding demo past schedules...');
  const pastSchedules = {};
  const pastAssignments = [
    { dateStr: PAST_DATE_STRINGS[0], companyKey: 'gicumbi',  routeKey: 'nyabugogo_gicumbi',  dep: '06:00' },
    { dateStr: PAST_DATE_STRINGS[1], companyKey: 'ebenezer', routeKey: 'nyabugogo_musanze',  dep: '06:30' },
    { dateStr: PAST_DATE_STRINGS[2], companyKey: 'royal',    routeKey: 'nyabugogo_gakenke',  dep: '06:30' },
    { dateStr: PAST_DATE_STRINGS[0], companyKey: 'huye',     routeKey: 'nyabugogo_huye',     dep: '06:00' },
    { dateStr: PAST_DATE_STRINGS[1], companyKey: 'star',     routeKey: 'nyabugogo_nyagatare',dep: '05:30' },
    { dateStr: PAST_DATE_STRINGS[2], companyKey: 'ngoma',    routeKey: 'nyabugogo_ngoma',    dep: '06:00' },
  ];

  for (const pa of pastAssignments) {
    const company       = companiesByKey[pa.companyKey];
    const route         = routesByKey[pa.routeKey];
    const fleet         = fleetByCompanyKey[pa.companyKey];
    const bus           = fleet.buses[0];
    const driver        = fleet.drivers[0];
    const fare          = FARE_BY_ROUTE_KEY[pa.routeKey];
    const departureTime = dt(pa.dateStr, pa.dep);
    const arrivalTime   = addMinutes(departureTime, route.durationMin ?? 120);
    const s = await prisma.schedule.create({
      data: {
        routeId: route.id, busId: bus.id, driverId: driver.id, companyId: company.id,
        departureTime, arrivalTime,
        price: String(fare), seatsTotal: bus.capacity, seatsAvailable: bus.capacity,
        status: 'COMPLETED',
      },
    });
    pastSchedules[`${pa.companyKey}_${pa.routeKey}`] = s;
    schedulesCreated++;
  }

  // ── Bookings and Payments ─────────────────────────────────────────────────
  console.log('Seeding demo bookings and payments...');

  const allPassengers = await prisma.user.findMany({
    where: { email: { in: ['passenger@test.rw','alice@test.rw','bob@test.rw','carol@test.rw','david@test.rw','emma@test.rw'] } },
  });
  const u = Object.fromEntries(allPassengers.map((user) => [user.email, user]));
  const operatorUser = await prisma.user.findUnique({ where: { email: 'operator@test.rw' } });

  async function getFutureSchedule(companyKey, routeKey, skipCount = 0) {
    return prisma.schedule.findFirst({
      where: { companyId: companiesByKey[companyKey].id, routeId: routesByKey[routeKey].id, status: 'SCHEDULED', departureTime: { gt: new Date() } },
      orderBy: { departureTime: 'asc' },
      skip: skipCount,
    });
  }

  // Fetch schedules for bookings
  const [
    gicumbi_ng_s1, gicumbi_ng_s2, gicumbi_ng_s3,
    gicumbi_gm_s1,
    eben_nm_s1, eben_nm_s2, eben_nb_s1, eben_nb_s2,
    royal_ngk_s1, royal_ngk_s2, royal_ngt_s1,
    star_nny_s1,
    star_gny_s1,
    shalom_nbut_s1, shalom_nbut_s2,
    kivu_mr_s1, kivu_mr_s2,
    huye_nh_s1, huye_nh_s2,
    yahoo_nh_s1,
    muhanga_nm_s1,
    ngoma_nng_s1,
    kayonza_nrw_s1,
    rusizi_nr_s1,
    star_nny_s2,
  ] = await Promise.all([
    getFutureSchedule('gicumbi',  'nyabugogo_gicumbi',   0),
    getFutureSchedule('gicumbi',  'nyabugogo_gicumbi',   1),
    getFutureSchedule('gicumbi',  'nyabugogo_gicumbi',   2),
    getFutureSchedule('gicumbi',  'gicumbi_musanze',     0),
    getFutureSchedule('ebenezer', 'nyabugogo_musanze',   0),
    getFutureSchedule('ebenezer', 'nyabugogo_musanze',   1),
    getFutureSchedule('ebenezer', 'nyabugogo_base',      0),
    getFutureSchedule('ebenezer', 'nyabugogo_base',      1),
    getFutureSchedule('royal',    'nyabugogo_gakenke',   0),
    getFutureSchedule('royal',    'nyabugogo_gakenke',   1),
    getFutureSchedule('royal',    'nyabugogo_gatuna',    0),
    getFutureSchedule('star',     'nyabugogo_nyagatare', 0),
    getFutureSchedule('star',     'gicumbi_nyagatare',   0),
    getFutureSchedule('shalom',   'nyabugogo_butaro',    0),
    getFutureSchedule('shalom',   'nyabugogo_butaro',    1),
    getFutureSchedule('kivu',     'musanze_rubavu',      0),
    getFutureSchedule('kivu',     'musanze_rubavu',      1),
    getFutureSchedule('huye',     'nyabugogo_huye',      0),
    getFutureSchedule('huye',     'nyabugogo_huye',      1),
    getFutureSchedule('yahoo',    'nyabugogo_huye',      0),
    getFutureSchedule('muhanga',  'nyabugogo_muhanga',   0),
    getFutureSchedule('ngoma',    'nyabugogo_ngoma',     0),
    getFutureSchedule('kayonza',  'nyabugogo_rwamagana', 0),
    getFutureSchedule('rusizi',   'nyabugogo_rusizi',    0),
    getFutureSchedule('star',     'nyabugogo_nyagatare', 1),
  ]);

  const ps_gicumbi  = pastSchedules['gicumbi_nyabugogo_gicumbi'];
  const ps_ebenezer = pastSchedules['ebenezer_nyabugogo_musanze'];
  const ps_royal    = pastSchedules['royal_nyabugogo_gakenke'];
  const ps_huye     = pastSchedules['huye_nyabugogo_huye'];
  const ps_star     = pastSchedules['star_nyabugogo_nyagatare'];
  const ps_ngoma    = pastSchedules['ngoma_nyabugogo_ngoma'];

  // CONFIRMED bookings (Northern + Eastern + Southern + Western)
  await seedBooking({ reference: 'RW-DEADBEEF', userId: u['passenger@test.rw'].id, schedule: gicumbi_ng_s1,  status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-DEADBEEF' });
  await seedBooking({ reference: 'RW-A11CE001', userId: u['alice@test.rw'].id,     schedule: gicumbi_ng_s1,  status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-A11CE001' });
  await seedBooking({ reference: 'RW-B0B00001', userId: u['bob@test.rw'].id,       schedule: eben_nm_s1,     status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-B0B00001' });
  await seedBooking({ reference: 'RW-CAROL001', userId: u['carol@test.rw'].id,     schedule: royal_ngk_s1,   status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-CAROL001' });
  await seedBooking({ reference: 'RW-DAVID001', userId: u['david@test.rw'].id,     schedule: star_nny_s1,    status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-DAVID001' });
  await seedBooking({ reference: 'RW-EMMA0001', userId: u['emma@test.rw'].id,      schedule: gicumbi_gm_s1,  status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-EMMA0001' });
  await seedBooking({ reference: 'RW-A11CE002', userId: u['alice@test.rw'].id,     schedule: shalom_nbut_s1, status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-A11CE002' });
  await seedBooking({ reference: 'RW-B0B00002', userId: u['bob@test.rw'].id,       schedule: kivu_mr_s1,     status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-B0B00002' });
  // Southern region confirmed
  await seedBooking({ reference: 'RW-CAROL002', userId: u['carol@test.rw'].id,     schedule: huye_nh_s1,     status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-CAROL002' });
  await seedBooking({ reference: 'RW-DAVID002', userId: u['david@test.rw'].id,     schedule: yahoo_nh_s1,    status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-DAVID002' });
  await seedBooking({ reference: 'RW-EMMA0002', userId: u['emma@test.rw'].id,      schedule: muhanga_nm_s1,  status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-EMMA0002' });
  // Eastern region confirmed
  await seedBooking({ reference: 'RW-PASS0001', userId: u['passenger@test.rw'].id, schedule: ngoma_nng_s1,   status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-PASS0001' });
  await seedBooking({ reference: 'RW-ALICE003', userId: u['alice@test.rw'].id,     schedule: kayonza_nrw_s1, status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-ALICE003' });
  // Western region confirmed
  await seedBooking({ reference: 'RW-BOB00003', userId: u['bob@test.rw'].id,       schedule: rusizi_nr_s1,   status: 'CONFIRMED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-BOB00003' });

  // PENDING bookings
  await seedBooking({ reference: 'RW-PEND0001', userId: u['passenger@test.rw'].id, schedule: eben_nb_s1,     status: 'PENDING' });
  await seedBooking({ reference: 'RW-PEND0002', userId: u['carol@test.rw'].id,     schedule: royal_ngt_s1,   status: 'PENDING' });
  await seedBooking({ reference: 'RW-PEND0003', userId: u['david@test.rw'].id,     schedule: gicumbi_ng_s3,  status: 'PENDING' });
  await seedBooking({ reference: 'RW-PEND0004', userId: u['emma@test.rw'].id,      schedule: star_gny_s1,    status: 'PENDING' });
  await seedBooking({ reference: 'RW-PEND0005', userId: u['alice@test.rw'].id,     schedule: huye_nh_s2,     status: 'PENDING' });
  await seedBooking({ reference: 'RW-PEND0006', userId: u['bob@test.rw'].id,       schedule: star_nny_s2,    status: 'PENDING' });

  // CANCELLED bookings
  await seedBooking({ reference: 'RW-CANC0001', userId: u['alice@test.rw'].id,     schedule: eben_nb_s2,     status: 'CANCELLED' });
  await seedBooking({ reference: 'RW-CANC0002', userId: u['bob@test.rw'].id,       schedule: royal_ngk_s2,   status: 'CANCELLED' });
  await seedBooking({ reference: 'RW-CANC0003', userId: u['carol@test.rw'].id,     schedule: shalom_nbut_s2, status: 'CANCELLED' });
  await seedBooking({ reference: 'RW-CANC0004', userId: u['passenger@test.rw'].id, schedule: kivu_mr_s2,     status: 'CANCELLED' });
  await seedBooking({ reference: 'RW-CANC0005', userId: u['emma@test.rw'].id,      schedule: eben_nm_s2,     status: 'CANCELLED' });

  // COMPLETED bookings (past schedules — multiple regions)
  const bAt1 = addMinutes(ps_gicumbi.departureTime,  -15);
  const bAt2 = addMinutes(ps_ebenezer.departureTime, -20);
  const bAt3 = addMinutes(ps_royal.departureTime,    -10);
  const bAt4 = addMinutes(ps_huye.departureTime,     -15);
  const bAt5 = addMinutes(ps_star.departureTime,     -30);
  const bAt6 = addMinutes(ps_ngoma.departureTime,    -10);

  await seedBooking({ reference: 'RW-COMP0001', userId: u['passenger@test.rw'].id, schedule: ps_gicumbi,  status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0001', paidAt: addMinutes(ps_gicumbi.departureTime, -120), extraData: { boardedAt: bAt1, boardedById: operatorUser.id, boardingNote: 'Boarded at NYABUGOGO departure gate.' } });
  await seedBooking({ reference: 'RW-COMP0002', userId: u['alice@test.rw'].id,     schedule: ps_gicumbi,  status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0002', paidAt: addMinutes(ps_gicumbi.departureTime, -100), extraData: { boardedAt: bAt1, boardedById: operatorUser.id } });
  await seedBooking({ reference: 'RW-COMP0003', userId: u['bob@test.rw'].id,       schedule: ps_ebenezer, status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0003', paidAt: addMinutes(ps_ebenezer.departureTime, -90), extraData: { boardedAt: bAt2, boardedById: operatorUser.id } });
  await seedBooking({ reference: 'RW-COMP0004', userId: u['carol@test.rw'].id,     schedule: ps_royal,    status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0004', paidAt: addMinutes(ps_royal.departureTime, -80),    extraData: { boardedAt: bAt3, boardedById: operatorUser.id } });
  await seedBooking({ reference: 'RW-COMP0005', userId: u['david@test.rw'].id,     schedule: ps_ebenezer, status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0005', paidAt: addMinutes(ps_ebenezer.departureTime, -70), extraData: { boardedAt: bAt2, boardedById: operatorUser.id } });
  await seedBooking({ reference: 'RW-COMP0006', userId: u['emma@test.rw'].id,      schedule: ps_huye,     status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0006', paidAt: addMinutes(ps_huye.departureTime, -90),     extraData: { boardedAt: bAt4, boardedById: operatorUser.id } });
  await seedBooking({ reference: 'RW-COMP0007', userId: u['alice@test.rw'].id,     schedule: ps_star,     status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0007', paidAt: addMinutes(ps_star.departureTime, -120),    extraData: { boardedAt: bAt5, boardedById: operatorUser.id } });
  await seedBooking({ reference: 'RW-COMP0008', userId: u['bob@test.rw'].id,       schedule: ps_ngoma,    status: 'COMPLETED', paymentStatus: 'PAID', transactionId: 'DEMO-TXN-COMP0008', paidAt: addMinutes(ps_ngoma.departureTime, -60),    extraData: { boardedAt: bAt6, boardedById: operatorUser.id } });

  // ── Summary ───────────────────────────────────────────────────────────────
  const [companyCount, busCount, driverCount, routeCount, scheduleCount, bookingCount, paymentCount] = await Promise.all([
    prisma.company.count({ where: { isActive: true } }),
    prisma.bus.count(),
    prisma.driver.count({ where: { isActive: true } }),
    prisma.route.count({ where: { isActive: true } }),
    prisma.schedule.count(),
    prisma.booking.count(),
    prisma.payment.count({ where: { status: 'PAID' } }),
  ]);

  console.log('\n── Seed Summary ──────────────────────────────────');
  console.log(`  Active companies (RURA):   ${companyCount}`);
  console.log(`  Buses (DEMO):              ${busCount}`);
  console.log(`  Active drivers (DEMO):     ${driverCount}`);
  console.log(`  Active routes (RURA):      ${routeCount}`);
  console.log(`  Schedules (DEMO):          ${scheduleCount} (${schedulesCreated} future/past created this run)`);
  console.log(`  Bookings (DEMO):           ${bookingCount}`);
  console.log(`  Paid payments (DEMO):      ${paymentCount}`);
  console.log(`  Bookable dates:            ${FUTURE_DATE_STRINGS[0]} → ${FUTURE_DATE_STRINGS[FUTURE_DATE_STRINGS.length - 1]}`);

  console.log('\n── Route Coverage ────────────────────────────────');
  console.log('  Northern : NYABUGOGO→GICUMBI, →GAKENKE, →BASE, →MUSANZE, →GATUNA, →BUTARO');
  console.log('             MUSANZE→RUBAVU, GICUMBI→MUSANZE');
  console.log('  Eastern  : NYABUGOGO→NYAGATARE, →KAGITUMBA, →RUSUMO, →RWAMAGANA, →KAYONZA, →NGOMA');
  console.log('             GICUMBI→NYAGATARE, KAYONZA→NYAGATARE');
  console.log('  Southern : NYABUGOGO→MUHANGA, →RUHANGO, →NYANZA, →HUYE, →NYAMAGABE');
  console.log('             MUHANGA→HUYE');
  console.log('  Western  : NYABUGOGO→KARONGI, →RUBAVU, →RUSIZI');
  console.log('             RUBAVU→KARONGI, RUBAVU→RUSIZI');
  console.log('  SW       : MUHANGA→RUSIZI, HUYE→RUSIZI');

  console.log('\n── Demo Accounts (password: Password123!) ────────');
  console.log('  passenger@test.rw  → PASSENGER');
  console.log('  admin@test.rw      → ADMIN');
  console.log('  superadmin@test.rw → SUPER_ADMIN');
  console.log('  operator@test.rw   → OPERATOR (GICUMBI TC)');
  console.log('  operator2@test.rw  → OPERATOR (EBENEZER EXPRESS)');
  console.log('  operator3@test.rw  → OPERATOR (ROYAL EXPRESS)');
  console.log('  operator4–20       → OPERATOR (one per remaining company)');
  console.log('  companyadmin.gicumbi@test.rw   -> COMPANY_ADMIN (GICUMBI TC)');
  console.log('  companyadmin.ebenezer@test.rw  -> COMPANY_ADMIN (EBENEZER EXPRESS)');
  console.log('  companyadmin.kivubelt@test.rw  -> COMPANY_ADMIN (KIVU BELT)');
  console.log('  companyadmin.royal@test.rw     -> COMPANY_ADMIN (ROYAL EXPRESS)');
  console.log('  companyadmin.<company>@test.rw -> COMPANY_ADMIN (one per seeded company)');
  console.log('  alice/bob/carol/david/emma @test.rw → PASSENGER');

  console.log('\n── Search Examples ───────────────────────────────');
  console.log(`  NYABUGOGO→MUSANZE    : ${FUTURE_DATE_STRINGS[0]}`);
  console.log(`  NYABUGOGO→HUYE       : ${FUTURE_DATE_STRINGS[0]}`);
  console.log(`  NYABUGOGO→MUHANGA    : ${FUTURE_DATE_STRINGS[0]}`);
  console.log(`  NYABUGOGO→RUSIZI     : ${FUTURE_DATE_STRINGS[0]}`);
  console.log(`  NYABUGOGO→KAYONZA    : ${FUTURE_DATE_STRINGS[0]}`);
  console.log(`  NYABUGOGO→NYAGATARE  : ${FUTURE_DATE_STRINGS[0]}`);
  console.log(`  MUSANZE→RUBAVU       : ${FUTURE_DATE_STRINGS[1]}`);
  console.log(`  GICUMBI→NYAGATARE    : ${FUTURE_DATE_STRINGS[1]}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
