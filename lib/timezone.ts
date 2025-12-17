/**
 * Timezone utilities for LinkLens
 * All dates in Supabase are UTC. We convert to user's timezone for display.
 *
 * STANDARD FORMAT:
 * - Compact display: "UTC+7" or "UTC-8"
 * - Full display: "Asia/Bangkok (UTC+7)"
 * - Dropdown: City name with UTC offset
 */

// Get browser's timezone (instant, no network call)
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// Get timezone offset in hours (e.g., +7 for Bangkok, -8 for SF)
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

// Format UTC offset string (e.g., "UTC+7", "UTC-8", "UTC+5:30")
export function formatUTCOffset(offset: number): string {
  if (offset === 0) return 'UTC';
  const sign = offset >= 0 ? '+' : '';
  // Handle half-hour offsets (e.g., India UTC+5:30)
  if (offset % 1 !== 0) {
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.round((Math.abs(offset) % 1) * 60);
    return `UTC${sign}${offset >= 0 ? hours : -hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `UTC${sign}${offset}`;
}

// Get timezone display string - ALWAYS returns UTC offset format (e.g., "UTC+7")
export function getTimezoneAbbr(timezone: string, date: Date = new Date()): string {
  const offset = getTimezoneOffset(timezone, date);
  return formatUTCOffset(offset);
}

// Get full timezone display (e.g., "Asia/Bangkok (UTC+7)")
export function getTimezoneFullDisplay(timezone: string): string {
  const offset = getTimezoneOffset(timezone);
  const offsetStr = formatUTCOffset(offset);

  // Get city name from IANA timezone
  const cityName = getTimezoneCityName(timezone);
  return `${cityName} (${offsetStr})`;
}

// Extract city name from IANA timezone (e.g., "Asia/Bangkok" -> "Bangkok")
export function getTimezoneCityName(timezone: string): string {
  if (timezone === 'UTC') return 'UTC';
  const parts = timezone.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  return city;
}

// Convert UTC date to timezone
export function toTimezone(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
}

// Get hour (0-23) in specific timezone
export function getHourInTimezone(utcDate: Date | string, timezone: string): number {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(date)
  );
}

// Get day of week (0-6, Sun-Sat) in specific timezone
export function getDayOfWeekInTimezone(utcDate: Date | string, timezone: string): number {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const localDate = toTimezone(date, timezone);
  return localDate.getDay();
}

// Get date string (YYYY-MM-DD) in specific timezone
export function getDateStringInTimezone(utcDate: Date | string, timezone: string): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

// Get week start date (Sunday) in specific timezone
export function getWeekStartInTimezone(utcDate: Date | string, timezone: string): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const localDate = toTimezone(date, timezone);
  const dayOfWeek = localDate.getDay();
  const weekStart = new Date(localDate);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  return getDateStringInTimezone(weekStart, 'UTC');
}

// Get month key (YYYY-MM) in specific timezone
export function getMonthKeyInTimezone(utcDate: Date | string, timezone: string): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  return `${year}-${month}`;
}

// Format date for display
export function formatDateInTimezone(
  utcDate: Date | string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    ...options,
  }).format(date);
}

// Format time for display (e.g., "3:24 PM")
export function formatTimeInTimezone(
  utcDate: Date | string,
  timezone: string
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Format datetime for display (e.g., "Dec 12, 2025 3:24 PM")
export function formatDateTimeInTimezone(
  utcDate: Date | string,
  timezone: string
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Format hour range (e.g., "3PM - 5PM")
export function formatHourRange(startHour: number, endHour: number): string {
  const formatHour = (h: number) => {
    const hour12 = h % 12 || 12;
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${hour12}${suffix}`;
  };
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

// Convert local datetime-local input to UTC ISO string for saving
export function localInputToUTC(localDateString: string, timezone: string): string {
  if (!localDateString) return '';

  const [datePart, timePart] = localDateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  const localDate = new Date(year, month - 1, day, hours, minutes, 0);
  const offset = getTimezoneOffset(timezone, localDate);
  const utcDate = new Date(localDate.getTime() - offset * 60 * 60 * 1000);

  return utcDate.toISOString();
}

// Convert UTC to local datetime-local format for input display
export function utcToLocalInput(utcDateString: string, timezone: string): string {
  if (!utcDateString) return '';

  const date = new Date(utcDateString);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const dayVal = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;

  return `${year}-${month}-${dayVal}T${hour}:${minute}`;
}

// Common timezone list for dropdown - STANDARDIZED FORMAT
// Label format: "City" (just the city name for clean display)
// Display shows: City name + UTC offset
export const COMMON_TIMEZONES = [
  { value: 'Pacific/Honolulu', label: 'Honolulu', offset: -10 },
  { value: 'America/Anchorage', label: 'Anchorage', offset: -9 },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: -8 },
  { value: 'America/Denver', label: 'Denver', offset: -7 },
  { value: 'America/Chicago', label: 'Chicago', offset: -6 },
  { value: 'America/New_York', label: 'New York', offset: -5 },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: -3 },
  { value: 'UTC', label: 'UTC', offset: 0 },
  { value: 'Europe/London', label: 'London', offset: 0 },
  { value: 'Europe/Paris', label: 'Paris', offset: 1 },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 1 },
  { value: 'Africa/Cairo', label: 'Cairo', offset: 2 },
  { value: 'Europe/Moscow', label: 'Moscow', offset: 3 },
  { value: 'Asia/Dubai', label: 'Dubai', offset: 4 },
  { value: 'Asia/Kolkata', label: 'Mumbai', offset: 5.5 },
  { value: 'Asia/Bangkok', label: 'Bangkok', offset: 7 },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 8 },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 8 },
  { value: 'Asia/Seoul', label: 'Seoul', offset: 9 },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 9 },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 11 },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: 13 },
];

// Get formatted label for dropdown display (e.g., "Bangkok (UTC+7)")
export function getTimezoneLabel(tz: { value: string; label: string; offset: number }): string {
  return `${tz.label} (${formatUTCOffset(tz.offset)})`;
}

// Generate all date keys between start and end dates in a specific timezone
export function generateDateKeysInTimezone(
  startDate: Date,
  endDate: Date,
  timezone: string
): string[] {
  const keys: string[] = [];

  // Get start date string in timezone (YYYY-MM-DD)
  const startKey = getDateStringInTimezone(startDate, timezone);
  const endKey = getDateStringInTimezone(endDate, timezone);

  // Parse the start date string and iterate
  const [startYear, startMonth, startDay] = startKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = endKey.split('-').map(Number);

  let current = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 12, 0, 0));

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    keys.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return keys;
}

// Generate all week start keys between start and end dates in a specific timezone
export function generateWeekKeysInTimezone(
  startDate: Date,
  endDate: Date,
  timezone: string
): string[] {
  const keys: string[] = [];

  // Get date strings in timezone
  const startKey = getDateStringInTimezone(startDate, timezone);
  const endKey = getDateStringInTimezone(endDate, timezone);

  // Parse dates
  const [startYear, startMonth, startDay] = startKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = endKey.split('-').map(Number);

  // Start from the Sunday of the start week
  let current = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0));
  const dayOfWeek = current.getUTCDay();
  current.setUTCDate(current.getUTCDate() - dayOfWeek); // Go to Sunday

  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 12, 0, 0));

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    keys.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 7);
  }

  return keys;
}

// Generate all month keys between start and end dates in a specific timezone
export function generateMonthKeysInTimezone(
  startDate: Date,
  endDate: Date,
  timezone: string
): string[] {
  const keys: string[] = [];

  // Get start and end month keys in the selected timezone
  const startKey = getMonthKeyInTimezone(startDate, timezone);
  const endKey = getMonthKeyInTimezone(endDate, timezone);

  // Parse the keys (format: YYYY-MM)
  const [startYear, startMonth] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return keys;
}

// Format a date key (YYYY-MM-DD) for display
export function formatDateKeyForDisplay(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Format a month key (YYYY-MM) for display
export function formatMonthKeyForDisplay(
  monthKey: string,
  options: Intl.DateTimeFormatOptions = { month: 'short' }
): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Format a month key (YYYY-MM) for full display
export function formatMonthKeyForFullDisplay(
  monthKey: string
): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
