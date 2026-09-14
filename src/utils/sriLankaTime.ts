/**
 * Sri Lanka Standard Time Utility (SLST - UTC+05:30 / Asia/Colombo)
 * Ensures all dates, times, and timestamps across Sri Sumana Maha Pirivena ERP
 * consistently use Sri Lankan timezone (Asia/Colombo) regardless of client device timezone.
 */

export const SRI_LANKA_TIMEZONE = 'Asia/Colombo';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

/**
 * Returns current Date object shifted to Sri Lanka Timezone (Asia/Colombo)
 */
export function getSriLankaDate(dateInput?: string | number | Date | null): Date {
  if (!dateInput) {
    return new Date(new Date().toLocaleString('en-US', { timeZone: SRI_LANKA_TIMEZONE }));
  }
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return new Date(new Date().toLocaleString('en-US', { timeZone: SRI_LANKA_TIMEZONE }));
  }
  return new Date(d.toLocaleString('en-US', { timeZone: SRI_LANKA_TIMEZONE }));
}

/**
 * Returns the current day index (0=Sun, 1=Mon, ..., 6=Sat) in Sri Lanka Time
 */
export function getSriLankaDayOfWeek(dateInput?: string | number | Date | null): number {
  const d = getSriLankaDate(dateInput);
  return d.getDay();
}

/**
 * Returns the DayKey ('monday' | 'tuesday' | ...) in Sri Lanka Time
 */
export function getSriLankaDayKey(dateInput?: string | number | Date | null): DayKey | null {
  const dayIdx = getSriLankaDayOfWeek(dateInput);
  switch (dayIdx) {
    case 1:
      return 'monday';
    case 2:
      return 'tuesday';
    case 3:
      return 'wednesday';
    case 4:
      return 'thursday';
    case 5:
      return 'friday';
    default:
      return null;
  }
}

/**
 * Returns total minutes from midnight in Sri Lanka Time (e.g. 07:40 AM = 460)
 */
export function getSriLankaMinutesOfDay(dateInput?: string | number | Date | null): number {
  const d = getSriLankaDate(dateInput);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Returns current Sri Lanka date in 'YYYY-MM-DD' format (e.g. for HTML date inputs or database queries)
 */
export function getSriLankaDateString(dateInput?: string | number | Date | null): string {
  const d = getSriLankaDate(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted Sri Lanka Time string (e.g. "02:30 PM" or "14:30:00")
 */
export function formatSriLankaTime(
  dateInput?: string | number | Date | null,
  includeSeconds: boolean = false
): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : (dateInput || new Date());
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    timeZone: SRI_LANKA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/**
 * Formats a Date to localized Sri Lanka standard date format
 * @example "2026-08-16", "August 16, 2026", "2026 අගෝස්තු 16"
 */
export function formatSriLankaDate(
  dateInput?: string | number | Date | null,
  locale: 'si' | 'en' = 'si',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: SRI_LANKA_TIMEZONE,
    year: 'numeric',
    month: options?.month || 'long',
    day: options?.day || 'numeric',
    ...options,
  };

  return d.toLocaleDateString(locale === 'si' ? 'si-LK' : 'en-US', defaultOptions);
}

/**
 * Formats full Sri Lanka Date and Time
 * @example "2026-08-18 • 02:30 PM"
 */
export function formatSriLankaDateTime(
  dateInput?: string | number | Date | null,
  locale: 'si' | 'en' = 'si',
  includeDayName: boolean = true,
  includeSeconds: boolean = false
): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const dateStr = d.toLocaleDateString(locale === 'si' ? 'si-LK' : 'en-US', {
    timeZone: SRI_LANKA_TIMEZONE,
    weekday: includeDayName ? 'short' : undefined,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = d.toLocaleTimeString('en-US', {
    timeZone: SRI_LANKA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });

  return `${dateStr} • ${timeStr}`;
}

/**
 * Returns dynamic Sri Lankan time-of-day greeting based on Sri Lanka Standard Time
 */
export function getSriLankaGreeting(locale: 'si' | 'en' = 'si'): string {
  const d = getSriLankaDate();
  const hour = d.getHours();
  if (hour < 12) {
    return locale === 'si' ? 'සුබ උදෑසනක්' : 'Good Morning';
  } else if (hour < 17) {
    return locale === 'si' ? 'සුබ දහවලක්' : 'Good Afternoon';
  } else {
    return locale === 'si' ? 'සුබ සැන්දෑවක්' : 'Good Evening';
  }
}
