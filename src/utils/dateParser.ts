// ============================================================================
// DATE PARSER & SYNC UTILITY FOR WEDDING INVITATIONS
// Intelligent parser supporting Indonesian date & time strings, numeric formats,
// and ISO formats to ensure Countdown Section is 100% synchronized with Hero Section.
// ============================================================================

const INDONESIAN_MONTH_MAP: Record<string, number> = {
  // Indonesian full & short
  januari: 1,
  jan: 1,
  februari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agu: 8,
  agt: 8,
  ags: 8,
  agust: 8,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  desember: 12,
  des: 12,
  december: 12,
  dec: 12,
};

/**
 * Extract hours and minutes from an optional time string like "08:00 WIB", "08.00 - 10:00", "11:30"
 */
export function extractTimeComponents(timeText?: string): { hour: number; minute: number } {
  if (!timeText || typeof timeText !== 'string') {
    return { hour: 8, minute: 0 }; // Default 08:00 pagi
  }

  const match = timeText.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const hour = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const minute = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    return { hour, minute };
  }

  return { hour: 8, minute: 0 };
}

/**
 * Parse an Indonesian / standard date string into a Date object or timestamp (ms).
 * Handles:
 * - "Sabtu, 24 Oktober 2026"
 * - "24 Oktober 2026"
 * - "24/10/2026" or "24-10-2026"
 * - "2026-10-24"
 * - ISO string "2026-10-24T08:00:00+07:00"
 */
export function parseEventDate(
  dateText?: string,
  timeText?: string
): { date: Date; timestamp: number } | null {
  if (!dateText || typeof dateText !== 'string') return null;

  const trimmed = dateText.trim();
  if (!trimmed) return null;

  const { hour, minute } = extractTimeComponents(timeText);

  // 1. Direct standard ISO with time or Date string
  if (trimmed.includes('T') || trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
    const directDate = new Date(trimmed);
    if (!isNaN(directDate.getTime())) {
      // If only date was in string (length 10 e.g. "2026-10-24"), apply hour & minute
      if (trimmed.length <= 10) {
        const [y, m, d] = trimmed.split('-').map(Number);
        const localDate = new Date(y, m - 1, d, hour, minute, 0);
        return { date: localDate, timestamp: localDate.getTime() };
      }
      return { date: directDate, timestamp: directDate.getTime() };
    }
  }

  // 2. Format DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numericMatch = trimmed.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10);
    const year = parseInt(numericMatch[3], 10);

    const date = new Date(year, month - 1, day, hour, minute, 0);
    if (!isNaN(date.getTime())) {
      return { date, timestamp: date.getTime() };
    }
  }

  // 3. Format "Sabtu, 24 Oktober 2026" or "24 Oktober 2026"
  const cleanLower = trimmed.toLowerCase();
  const indoWordMatch = cleanLower.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (indoWordMatch) {
    const day = parseInt(indoWordMatch[1], 10);
    const monthStr = indoWordMatch[2];
    const year = parseInt(indoWordMatch[3], 10);

    const monthNum = INDONESIAN_MONTH_MAP[monthStr];
    if (monthNum) {
      const date = new Date(year, monthNum - 1, day, hour, minute, 0);
      if (!isNaN(date.getTime())) {
        return { date, timestamp: date.getTime() };
      }
    }
  }

  // 4. Fallback: Native JavaScript Date parser
  const nativeParsed = new Date(trimmed);
  if (!isNaN(nativeParsed.getTime())) {
    return { date: nativeParsed, timestamp: nativeParsed.getTime() };
  }

  return null;
}

/**
 * Converts any date string to ISO format (e.g. YYYY-MM-DDTHH:mm:ss+07:00)
 */
export function parseIndonesianDateToISO(dateText?: string, timeText?: string): string | null {
  const result = parseEventDate(dateText, timeText);
  if (!result) return null;

  const y = result.date.getFullYear();
  const m = String(result.date.getMonth() + 1).padStart(2, '0');
  const d = String(result.date.getDate()).padStart(2, '0');
  const h = String(result.date.getHours()).padStart(2, '0');
  const min = String(result.date.getMinutes()).padStart(2, '0');

  return `${y}-${m}-${d}T${h}:${min}:00+07:00`;
}
