/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr, locale = 'en-RW') {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time from a datetime string.
 */
export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-RW', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format price in Rwandan Francs.
 */
export function formatPrice(amount) {
  return `${Number(amount).toLocaleString()} RWF`;
}

/**
 * Truncate a string to a given length.
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}

/**
 * Get initials from a full name.
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
