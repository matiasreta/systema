// Date utilities for the Habits System

/**
 * Get date key in format 'YYYY-MM-DD'
 */
export function getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse date key back to Date object
 */
export function parseDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Get the day name (monday, tuesday, etc.) from a Date
 */
export function getDayName(date: Date): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    return days[date.getDay()] as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
}

/**
 * Get array of date keys for the last N days (including today)
 */
export function getLastNDays(n: number, fromDate: Date = new Date()): string[] {
    const dates: string[] = [];
    for (let i = 0; i < n; i++) {
        const date = new Date(fromDate);
        date.setDate(date.getDate() - i);
        dates.push(getDateKey(date));
    }
    return dates;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Format time from minutes to readable string (e.g., 1020 -> "5:00PM")
 */
export function formatTimeFromMinutes(minutes: number): string {
    const hour = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${mins.toString().padStart(2, '0')}${period}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
    start1: number, end1: number,
    start2: number, end2: number
): boolean {
    return start1 < end2 && start2 < end1;
}
