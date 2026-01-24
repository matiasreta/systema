'use client';

import { useState, useEffect, useCallback } from 'react';
import { DailyRecord, Habit } from '../types/habits';
import * as supabaseStorage from '../lib/supabaseStorage';
import { calculateCompletionRate, checkRecordOverlap } from '../lib/habitCalculations';
import { getDateKey } from '../lib/dateUtils';

export function useDailyRecords() {
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load records from Supabase on mount
    useEffect(() => {
        async function loadRecords() {
            setIsLoading(true);
            try {
                const data = await supabaseStorage.getDailyRecords();
                setRecords(data);
                setError(null);
            } catch (err) {
                console.error('Error loading records:', err);
                setError('Error al cargar registros');
            } finally {
                setIsLoaded(true);
                setIsLoading(false);
            }
        }
        loadRecords();
    }, []);

    // Record habit completion
    const recordCompletion = useCallback(async (
        habit: Habit,
        date: Date,
        actualStartTime: number,
        actualEndTime: number
    ): Promise<{ success: boolean; error?: string; record?: DailyRecord }> => {
        const dateKey = getDateKey(date);

        // Check if already recorded for this habit on this date
        const existingRecord = records.find(
            r => r.habitId === habit.id && r.date === dateKey
        );
        if (existingRecord) {
            return { success: false, error: 'Ya registraste este hábito hoy' };
        }

        // Check for overlaps with other records on the same date
        if (checkRecordOverlap(actualStartTime, actualEndTime, dateKey, records)) {
            return { success: false, error: 'Este horario se solapa con otro registro de hoy' };
        }

        const actualDuration = actualEndTime - actualStartTime;
        const completionRate = calculateCompletionRate(actualDuration, habit.expectedDuration);

        const newRecord = await supabaseStorage.addDailyRecord({
            habitId: habit.id,
            date: dateKey,
            actualStartTime,
            actualEndTime,
            actualDuration,
            completionRate,
        });

        if (!newRecord) {
            return { success: false, error: 'Error al guardar el registro' };
        }

        setRecords(prev => [...prev, newRecord]);
        return { success: true, record: newRecord };
    }, [records]);

    // Get records for a specific date
    const getRecordsForDate = useCallback((date: Date): DailyRecord[] => {
        const dateKey = getDateKey(date);
        return records.filter(r => r.date === dateKey);
    }, [records]);

    // Get record for a specific habit on a specific date
    const getRecordForHabitOnDate = useCallback((habitId: string, date: Date): DailyRecord | undefined => {
        const dateKey = getDateKey(date);
        return records.find(r => r.habitId === habitId && r.date === dateKey);
    }, [records]);

    // Get all records for a habit
    const getRecordsForHabit = useCallback((habitId: string): DailyRecord[] => {
        return records.filter(r => r.habitId === habitId);
    }, [records]);

    // Delete a specific record (to undo a completion)
    const deleteRecord = useCallback(async (recordId: string): Promise<boolean> => {
        const success = await supabaseStorage.deleteDailyRecord(recordId);
        if (success) {
            setRecords(prev => prev.filter(r => r.id !== recordId));
        }
        return success;
    }, []);

    // Delete all records for a habit (used when deleting a habit)
    const deleteRecordsForHabit = useCallback(async (habitId: string): Promise<boolean> => {
        const success = await supabaseStorage.deleteRecordsByHabitId(habitId);
        if (success) {
            setRecords(prev => prev.filter(r => r.habitId !== habitId));
        }
        return success;
    }, []);

    return {
        records,
        isLoaded,
        isLoading,
        error,
        recordCompletion,
        getRecordsForDate,
        getRecordForHabitOnDate,
        getRecordsForHabit,
        deleteRecord,
        deleteRecordsForHabit,
    };
}
