import prisma from '../../lib/prisma.js';
import { createNotification } from '../notifications/notifications.service.js';

export const ALLOWED_SETTINGS_KEYS = [
  'default_language',
  'default_theme',
  'maintenance_mode',
  'support_email',
  'support_phone',
  'booking_cancellation_window_hours',
  'max_seats_per_booking',
];

const AUTH_PANEL_SETTING_KEYS = ['support_email', 'support_phone'];

function mapSettings(rows, keys) {
  const result = {};

  for (const key of keys) {
    const row = rows.find((item) => item.key === key);
    result[key] = row ? row.value : null;
  }

  return result;
}

function getKigaliDayBounds(referenceDate = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(referenceDate);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const dateKey = `${year}-${month}-${day}`;

  return {
    dateKey,
    startOfDay: new Date(`${dateKey}T00:00:00+02:00`),
    endOfDay: new Date(`${dateKey}T23:59:59.999+02:00`),
  };
}

export async function getAllSettings() {
  try {
    const rows = await prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return mapSettings(rows, ALLOWED_SETTINGS_KEYS);
  } catch (err) {
    throw err;
  }
}

export async function upsertSetting(key, value) {
  try {
    const row = await prisma.platformSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true },
    });
    await Promise.all(
      superAdmins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: 'Platform Settings Updated',
          message: `Setting "${key}" was updated.`,
          type: 'SYSTEM',
          priority: 'NORMAL',
          actionUrl: '/super-admin/settings',
          metadata: { key },
        })
      )
    );

    return row;
  } catch (err) {
    throw err;
  }
}

export async function getPublicAuthPanelData() {
  const { dateKey, startOfDay, endOfDay } = getKigaliDayBounds();

  try {
    const [activeRouteCount, departuresTodayCount, activeCompanyCount, settingsRows] = await Promise.all([
      prisma.route.count({
        where: { isActive: true },
      }),
      prisma.schedule.count({
        where: {
          departureTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
          },
          route: {
            isActive: true,
          },
          company: {
            isActive: true,
          },
        },
      }),
      prisma.company.count({
        where: { isActive: true },
      }),
      prisma.platformSetting.findMany({
        where: {
          key: { in: AUTH_PANEL_SETTING_KEYS },
        },
      }),
    ]);

    const settings = mapSettings(settingsRows, AUTH_PANEL_SETTING_KEYS);

    return {
      snapshotDate: dateKey,
      activeRouteCount,
      departuresTodayCount,
      activeCompanyCount,
      supportEmail: settings.support_email,
      supportPhone: settings.support_phone,
    };
  } catch (err) {
    throw err;
  }
}
