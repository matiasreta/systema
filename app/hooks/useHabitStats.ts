'use client';

import { useMemo } from 'react';
import { Habit, DailyRecord, HabitStats } from '../types/habits';
import { calculateRolling100Days, calculateCurrentStreak } from '../lib/habitCalculations';

export function useHabitStats(habits: Habit[], records: DailyRecord[]) {
    const stats = useMemo(() => {
        const statsMap = new Map<string, HabitStats>();

        for (const habit of habits) {
            const rolling100Days = calculateRolling100Days(habit, records);
            const currentStreak = calculateCurrentStreak(habit, records);

            // Count total completed days (100% completion)
            const habitRecords = records.filter(r => r.habitId === habit.id);
            const totalCompletedDays = habitRecords.filter(r => r.completionRate >= 1).length;

            // Check if ever reached 100%
            let reachedMaxAt: string | null = null;
            if (rolling100Days >= 100) {
                // Find the date when it first reached 100%
                // For now, just set to today if currently at 100%
                reachedMaxAt = new Date().toISOString();
            }

            statsMap.set(habit.id, {
                habitId: habit.id,
                rolling100Days,
                currentStreak,
                bestStreak: currentStreak, // TODO: Track historical best
                totalCompletedDays,
                reachedMaxAt,
            });
        }

        return statsMap;
    }, [habits, records]);

    const getStatsForHabit = (habitId: string): HabitStats | undefined => {
        return stats.get(habitId);
    };

    const getAverageCompletion = (): number => {
        if (habits.length === 0) return 0;
        let total = 0;
        for (const [, stat] of stats) {
            total += stat.rolling100Days;
        }
        return total / habits.length;
    };

    return {
        stats,
        getStatsForHabit,
        getAverageCompletion,
    };
}
