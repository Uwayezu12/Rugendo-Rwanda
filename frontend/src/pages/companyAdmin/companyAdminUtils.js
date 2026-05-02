export const LOCALE_BY_LANGUAGE = {
  en: 'en-RW',
  rw: 'rw-RW',
  fr: 'fr-FR',
  sw: 'sw',
};

export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
export const SCHEDULE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const BUS_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

export function formatDateTime(value, locale) {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value, locale) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMoney(value) {
  return `RWF ${Number(value || 0).toLocaleString('en-RW')}`;
}

export function toLocalDatetimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function routeLabel(route) {
  return route ? `${route.origin} -> ${route.destination}` : '-';
}

export function bookingStatusMeta(status, t) {
  switch (status) {
    case 'PENDING': return { label: t('bookingStatusPending'), className: 'badge-warning' };
    case 'CONFIRMED': return { label: t('bookingStatusConfirmed'), className: 'badge-success' };
    case 'CANCELLED': return { label: t('bookingStatusCancelled'), className: 'badge-error' };
    case 'COMPLETED': return { label: t('bookingStatusCompleted'), className: 'badge-brand' };
    default: return { label: status || '-', className: 'badge-brand' };
  }
}

export function paymentStatusMeta(status, t) {
  switch (status) {
    case 'PENDING': return { label: t('paymentStatusPending'), className: 'badge-warning' };
    case 'PAID': return { label: t('paymentStatusPaid'), className: 'badge-success' };
    case 'FAILED': return { label: t('paymentStatusFailed'), className: 'badge-error' };
    case 'REFUNDED': return { label: t('paymentStatusRefunded'), className: 'badge-brand' };
    default: return { label: '-', className: 'badge-brand' };
  }
}

export function scheduleStatusMeta(status, t) {
  switch (status) {
    case 'SCHEDULED': return { label: t('scheduleStatusScheduled'), className: 'badge-brand' };
    case 'IN_PROGRESS': return { label: t('scheduleStatusInProgress'), className: 'badge-warning' };
    case 'COMPLETED': return { label: t('scheduleStatusCompleted'), className: 'badge-success' };
    case 'CANCELLED': return { label: t('scheduleStatusCancelled'), className: 'badge-error' };
    default: return { label: status || '-', className: 'badge-brand' };
  }
}

export function busStatusMeta(status, t) {
  switch (status) {
    case 'ACTIVE': return { label: t('manageBusesStatusActive'), className: 'badge-success' };
    case 'INACTIVE': return { label: t('manageBusesStatusInactive'), className: 'badge-error' };
    case 'MAINTENANCE': return { label: t('manageBusesStatusMaintenance'), className: 'badge-warning' };
    default: return { label: status || '-', className: 'badge-brand' };
  }
}

export function activeStatusMeta(isActive, t) {
  return {
    label: isActive ? t('manageUsersActive') : t('manageUsersInactive'),
    className: isActive ? 'badge-success' : 'badge-error',
  };
}

export function requestError(err, fallback) {
  const fieldErrors = err?.response?.data?.errors;
  const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat().find(Boolean) : null;
  return firstFieldError || err?.response?.data?.message || fallback;
}
