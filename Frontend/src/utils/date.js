/**
 * Centralized Indian Standard Time (IST) Date/Time Formatter (en-IN).
 * All backend dates are stored in UTC and rendered consistently in IST.
 */

const TIMEZONE = 'Asia/Kolkata';
const LOCALE = 'en-IN';

/**
 * Formats a date into "DD MMM YYYY, HH:MM AM/PM" in IST.
 * Example: "05 Nov 2026, 02:30 PM"
 */
export function formatDateTimeIST(date) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Formats a date into "DD MMM YYYY" in IST.
 * Example: "05 Nov 2026"
 */
export function formatDateIST(date) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Formats time into "HH:MM AM/PM" in IST.
 * Example: "02:30 PM"
 */
export function formatTimeIST(date) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Formats a relative timestamp (e.g. "5m ago", "2h ago", "Yesterday") in IST context.
 */
export function formatRelativeIST(date) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return formatDateIST(date);
  } catch {
    return '—';
  }
}

