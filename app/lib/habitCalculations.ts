// Habit calculations and validations

import { Habit, DailyRecord, ActiveDays } from '../types/habits';
import { timeRangesOverlap, getLastNDays, parseDateKey, getDayName } from './dateUtils';

/**
 * Check if a habit is active on a specific date
 */
export function isHabitActiveOnDate(habit: Habit, date: Date): boolean {
    if (!habit.isActive) return false;
    const dayName = getDayName(date);
    return habit.activeDays[dayName];
}

/**
 * Get habits that are active on a specific date
 */
export function getHabitsForDate(habits: Habit[], date: Date): Habit[] {
    return habits.filter(h => isHabitActiveOnDate(h, date));
}

/**
 * Check if a new habit time would overlap with existing habits on any shared day
 */
export function checkHabitOverlap(
    newStart: number,
    newEnd: number,
    newActiveDays: ActiveDays,
    existingHabits: Habit[],
    excludeHabitId?: string
): { overlaps: boolean; conflictingHabit?: Habit } {
    for (const habit of existingHabits) {
        if (excludeHabitId && habit.id === excludeHabitId) continue;
        if (!habit.isActive) continue;

        // Check if they share any active days
        const sharedDays = Object.keys(newActiveDays).some(
            day => newActiveDays[day as keyof ActiveDays] && habit.activeDays[day as keyof ActiveDays]
        );

        if (sharedDays && timeRangesOverlap(newStart, newEnd, habit.startTime, habit.endTime)) {
            return { overlaps: true, conflictingHabit: habit };
        }
    }
    return { overlaps: false };
}

/**
 * Check if a real time record would overlap with existing records on the same date
 */
export function checkRecordOverlap(
    newStart: number,
    newEnd: number,
    date: string,
    existingRecords: DailyRecord[],
    excludeRecordId?: string
): boolean {
    const dateRecords = existingRecords.filter(r =>
        r.date === date &&
        r.id !== excludeRecordId &&
        r.actualStartTime !== null &&
        r.actualEndTime !== null
    );

    return dateRecords.some(record =>
        timeRangesOverlap(newStart, newEnd, record.actualStartTime!, record.actualEndTime!)
    );
}

/**
 * Calculate the rolling 100-day percentage for a habit
 */
export function calculateRolling100Days(
    habit: Habit,
    records: DailyRecord[]
): number {
    const last100Days = getLastNDays(100);
    const habitRecords = records.filter(r => r.habitId === habit.id);

    let totalCompletionRate = 0;
    let activeDaysCount = 0;

    for (const dateKey of last100Days) {
        const date = parseDateKey(dateKey);

        // Only count days where the habit should be active
        if (!isHabitActiveOnDate(habit, date)) continue;

        // Don't count days before habit was created
        if (date < new Date(habit.createdAt)) continue;

        activeDaysCount++;

        const record = habitRecords.find(r => r.date === dateKey);
        if (record) {
            totalCompletionRate += record.completionRate;
        }
        // Days without record count as 0
    }

    if (activeDaysCount === 0) return 0;

    return (totalCompletionRate / activeDaysCount) * 100;
}

/**
 * Calculate completion rate based on actual vs expected duration
 */
export function calculateCompletionRate(
    actualDuration: number,
    expectedDuration: number
): number {
    if (expectedDuration <= 0) return 0;
    return Math.min(1, actualDuration / expectedDuration);
}

/**
 * Calculate current streak (consecutive days completed)
 */
export function calculateCurrentStreak(
    habit: Habit,
    records: DailyRecord[]
): number {
    const habitRecords = records.filter(r => r.habitId === habit.id);
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) { // Check up to a year back
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        if (!isHabitActiveOnDate(habit, date)) continue;
        if (date < new Date(habit.createdAt)) break;

        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const record = habitRecords.find(r => r.date === dateKey);

        if (record && record.completionRate >= 1) {
            streak++;
        } else if (i > 0) { // Allow today to be incomplete
            break;
        }
    }

    return streak;
}

/**
 * Generate default all-days-active object
 */
export function allDaysActive(): ActiveDays {
    return {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
    };
}

/**
 * Generate default no-days-active object
 */
export function noDaysActive(): ActiveDays {
    return {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
    };
}
