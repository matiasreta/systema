'use client';

import { useState, useEffect, useCallback } from 'react';
import { Habit, ActiveDays } from '../types/habits';
import * as supabaseStorage from '../lib/supabaseStorage';
import { checkHabitOverlap, allDaysActive } from '../lib/habitCalculations';

export function useHabits() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load habits from Supabase on mount
    useEffect(() => {
        async function loadHabits() {
            setIsLoading(true);
            try {
                const data = await supabaseStorage.getHabits();
                setHabits(data);
                setError(null);
            } catch (err) {
                console.error('Error loading habits:', err);
                setError('Error al cargar hábitos');
            } finally {
                setIsLoaded(true);
                setIsLoading(false);
            }
        }
        loadHabits();
    }, []);

    // Create a new habit
    const createHabit = useCallback(async (
        title: string,
        description: string,
        startTime: number,
        endTime: number,
        activeDays: ActiveDays = allDaysActive(),
        color: string = '#00ff00'
    ): Promise<{ success: boolean; error?: string; habit?: Habit }> => {
        // Validate time range
        if (startTime >= endTime) {
            return { success: false, error: 'La hora de inicio debe ser anterior a la hora de fin' };
        }

        // Check for overlaps
        const { overlaps, conflictingHabit } = checkHabitOverlap(
            startTime,
            endTime,
            activeDays,
            habits
        );

        if (overlaps && conflictingHabit) {
            return {
                success: false,
                error: `Este horario se solapa con "${conflictingHabit.title}"`
            };
        }

        const newHabit = await supabaseStorage.addHabit({
            title,
            description,
            startTime,
            endTime,
            expectedDuration: endTime - startTime,
            isActive: true,
            color,
            activeDays,
        });

        if (!newHabit) {
            return { success: false, error: 'Error al guardar el hábito' };
        }

        setHabits(prev => [...prev, newHabit]);
        return { success: true, habit: newHabit };
    }, [habits]);

    // Update an existing habit
    const updateHabit = useCallback(async (
        habitId: string,
        updates: Partial<Omit<Habit, 'id' | 'createdAt'>>
    ): Promise<{ success: boolean; error?: string }> => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) {
            return { success: false, error: 'Hábito no encontrado' };
        }

        const newStart = updates.startTime ?? habit.startTime;
        const newEnd = updates.endTime ?? habit.endTime;
        const newActiveDays = updates.activeDays ?? habit.activeDays;

        // Check for overlaps if time or days changed
        if (updates.startTime !== undefined || updates.endTime !== undefined || updates.activeDays !== undefined) {
            const { overlaps, conflictingHabit } = checkHabitOverlap(
                newStart,
                newEnd,
                newActiveDays,
                habits,
                habitId
            );

            if (overlaps && conflictingHabit) {
                return {
                    success: false,
                    error: `Este horario se solapa con "${conflictingHabit.title}"`
                };
            }
        }

        // Update expectedDuration if times changed
        const finalUpdates = {
            ...updates,
            expectedDuration: newEnd - newStart
        };

        const success = await supabaseStorage.updateHabit(habitId, finalUpdates);
        if (!success) {
            return { success: false, error: 'Error al actualizar el hábito' };
        }

        setHabits(prev => prev.map(h =>
            h.id === habitId ? { ...h, ...finalUpdates } : h
        ));

        return { success: true };
    }, [habits]);

    // Deactivate a habit (soft delete)
    const deactivateHabit = useCallback(async (habitId: string) => {
        const success = await supabaseStorage.updateHabit(habitId, { isActive: false });
        if (success) {
            setHabits(prev => prev.map(h =>
                h.id === habitId ? { ...h, isActive: false } : h
            ));
        }
    }, []);

    // Delete a habit permanently
    const deleteHabit = useCallback(async (habitId: string) => {
        const success = await supabaseStorage.deleteHabit(habitId);
        if (success) {
            setHabits(prev => prev.filter(h => h.id !== habitId));
        }
    }, []);

    // Get active habits only
    const activeHabits = habits.filter(h => h.isActive);

    return {
        habits,
        activeHabits,
        isLoaded,
        isLoading,
        error,
        createHabit,
        updateHabit,
        deactivateHabit,
        deleteHabit,
    };
}
