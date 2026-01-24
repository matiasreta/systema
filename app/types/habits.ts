// Types for the Habits System

export interface ActiveDays {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
}

export interface Habit {
    id: string;
    title: string;
    description: string;
    startTime: number;         // minutes from midnight (0-1439)
    endTime: number;           // minutes from midnight (0-1439)
    expectedDuration: number;  // expected duration in minutes
    createdAt: string;         // ISO date string
    isActive: boolean;
    color: string;
    activeDays: ActiveDays;
}

export interface DailyRecord {
    id: string;
    habitId: string;
    date: string;               // 'YYYY-MM-DD' format
    actualStartTime: number | null;
    actualEndTime: number | null;
    actualDuration: number;     // minutes actually dedicated
    completionRate: number;     // 0.0 - 1.0
    createdAt: string;
}

export interface HabitStats {
    habitId: string;
    rolling100Days: number;     // 0.0 - 100.0 (percentage)
    currentStreak: number;      // consecutive days
    bestStreak: number;         // best historical streak
    totalCompletedDays: number;
    reachedMaxAt: string | null; // date of first 100%
}

// Helper type for day names
export type DayName = keyof ActiveDays;

export const DAY_NAMES: DayName[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const DAY_LABELS: Record<DayName, string> = {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mié',
    thursday: 'Jue',
    friday: 'Vie',
    saturday: 'Sáb',
    sunday: 'Dom'
};
