// Supabase Storage abstraction for Habits System
// Replaces localStorage with Supabase persistence

import { supabase } from './supabase';
import { Habit, DailyRecord, ActiveDays } from '../types/habits';

// Temporary anonymous user ID for development
// TODO: Replace with real auth when implementing authentication
const TEMP_USER_ID = 'a0000000-0000-0000-0000-000000000001';

// === TYPE TRANSFORMATIONS ===

interface SupabaseHabit {
    id: string;
    user_id: string;
    title: string;
    description: string;
    start_time: number;
    end_time: number;
    expected_duration: number;
    color: string;
    is_active: boolean;
    active_days: ActiveDays;
    created_at: string;
}

interface SupabaseRecord {
    id: string;
    user_id: string;
    habit_id: string;
    date: string;
    actual_start_time: number | null;
    actual_end_time: number | null;
    actual_duration: number;
    completion_rate: number;
    created_at: string;
}

// Transform Supabase habit to frontend format
function toFrontendHabit(h: SupabaseHabit): Habit {
    return {
        id: h.id,
        title: h.title,
        description: h.description || '',
        startTime: h.start_time,
        endTime: h.end_time,
        expectedDuration: h.expected_duration,
        color: h.color,
        isActive: h.is_active,
        activeDays: h.active_days,
        createdAt: h.created_at,
    };
}

// Transform Supabase record to frontend format
function toFrontendRecord(r: SupabaseRecord): DailyRecord {
    return {
        id: r.id,
        habitId: r.habit_id,
        date: r.date,
        actualStartTime: r.actual_start_time,
        actualEndTime: r.actual_end_time,
        actualDuration: r.actual_duration,
        completionRate: r.completion_rate,
        createdAt: r.created_at,
    };
}

// === HABITS ===

export async function getHabits(): Promise<Habit[]> {
    const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', TEMP_USER_ID)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching habits:', error);
        return [];
    }

    return (data || []).map(toFrontendHabit);
}

export async function addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit | null> {
    const { data, error } = await supabase
        .from('habits')
        .insert({
            user_id: TEMP_USER_ID,
            title: habit.title,
            description: habit.description,
            start_time: habit.startTime,
            end_time: habit.endTime,
            color: habit.color,
            is_active: habit.isActive,
            active_days: habit.activeDays,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding habit:', error.message, error.code, error.details, error.hint);
        return null;
    }

    return toFrontendHabit(data);
}

export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<boolean> {
    // Transform camelCase to snake_case for Supabase
    const supabaseUpdates: Record<string, unknown> = {};

    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.startTime !== undefined) supabaseUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) supabaseUpdates.end_time = updates.endTime;
    if (updates.color !== undefined) supabaseUpdates.color = updates.color;
    if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
    if (updates.activeDays !== undefined) supabaseUpdates.active_days = updates.activeDays;

    const { error } = await supabase
        .from('habits')
        .update(supabaseUpdates)
        .eq('id', habitId)
        .eq('user_id', TEMP_USER_ID);

    if (error) {
        console.error('Error updating habit:', error);
        return false;
    }

    return true;
}

export async function deleteHabit(habitId: string): Promise<boolean> {
    // First, delete all associated daily records (cascade)
    const recordsDeleted = await deleteRecordsByHabitId(habitId);
    if (!recordsDeleted) {
        console.error('Error deleting associated records for habit:', habitId);
        // Continue anyway to try to delete the habit
    }

    const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', TEMP_USER_ID);

    if (error) {
        console.error('Error deleting habit:', error);
        return false;
    }

    return true;
}

// Delete all records for a specific habit
export async function deleteRecordsByHabitId(habitId: string): Promise<boolean> {
    const { error } = await supabase
        .from('daily_records')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', TEMP_USER_ID);

    if (error) {
        console.error('Error deleting records by habit:', error);
        return false;
    }

    return true;
}

// === DAILY RECORDS ===

export async function getDailyRecords(): Promise<DailyRecord[]> {
    const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', TEMP_USER_ID)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching daily records:', error);
        return [];
    }

    return (data || []).map(toFrontendRecord);
}

export async function addDailyRecord(
    record: Omit<DailyRecord, 'id' | 'createdAt'>
): Promise<DailyRecord | null> {
    const { data, error } = await supabase
        .from('daily_records')
        .insert({
            user_id: TEMP_USER_ID,
            habit_id: record.habitId,
            date: record.date,
            actual_start_time: record.actualStartTime,
            actual_end_time: record.actualEndTime,
            completion_rate: record.completionRate,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding daily record:', error);
        return null;
    }

    return toFrontendRecord(data);
}

export async function getRecordsForDate(date: string): Promise<DailyRecord[]> {
    const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', TEMP_USER_ID)
        .eq('date', date);

    if (error) {
        console.error('Error fetching records for date:', error);
        return [];
    }

    return (data || []).map(toFrontendRecord);
}

// Delete a specific daily record
export async function deleteDailyRecord(recordId: string): Promise<boolean> {
    const { error } = await supabase
        .from('daily_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', TEMP_USER_ID);

    if (error) {
        console.error('Error deleting daily record:', error);
        return false;
    }

    return true;
}

// === HABIT STATS (from view) ===

export interface SupabaseHabitStats {
    habitId: string;
    rolling100Days: number;
    totalCompletedDays: number;
}

export async function getHabitStats(): Promise<SupabaseHabitStats[]> {
    const { data, error } = await supabase
        .from('habit_stats')
        .select('*')
        .eq('user_id', TEMP_USER_ID);

    if (error) {
        console.error('Error fetching habit stats:', error);
        return [];
    }

    return (data || []).map(s => ({
        habitId: s.habit_id,
        rolling100Days: s.rolling_100_days || 0,
        totalCompletedDays: s.total_completed_days || 0,
    }));
}
