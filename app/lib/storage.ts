// LocalStorage abstraction for Habits System

import { Habit, DailyRecord } from '../types/habits';

const HABITS_KEY = 'systema_habits';
const RECORDS_KEY = 'systema_daily_records';

// === HABITS ===

export function getHabits(): Habit[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveHabits(habits: Habit[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export function addHabit(habit: Habit): void {
    const habits = getHabits();
    habits.push(habit);
    saveHabits(habits);
}

export function updateHabit(habitId: string, updates: Partial<Habit>): void {
    const habits = getHabits();
    const index = habits.findIndex(h => h.id === habitId);
    if (index !== -1) {
        habits[index] = { ...habits[index], ...updates };
        saveHabits(habits);
    }
}

export function deleteHabit(habitId: string): void {
    const habits = getHabits().filter(h => h.id !== habitId);
    saveHabits(habits);
}

// === DAILY RECORDS ===

export function getDailyRecords(): DailyRecord[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveDailyRecords(records: DailyRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function addDailyRecord(record: DailyRecord): void {
    const records = getDailyRecords();
    records.push(record);
    saveDailyRecords(records);
}

export function getRecordsForDate(date: string): DailyRecord[] {
    return getDailyRecords().filter(r => r.date === date);
}

export function getRecordsForHabit(habitId: string): DailyRecord[] {
    return getDailyRecords().filter(r => r.habitId === habitId);
}

export function getRecordForHabitOnDate(habitId: string, date: string): DailyRecord | undefined {
    return getDailyRecords().find(r => r.habitId === habitId && r.date === date);
}
