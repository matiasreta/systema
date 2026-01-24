'use client';

import { useState } from 'react';
import DailyCalendar from "./components/DailyCalendar";
import FloatingIsland from './components/FloatingIsland';
import HabitForm from './components/HabitForm';
import { useHabits } from './hooks/useHabits';
import { useDailyRecords } from './hooks/useDailyRecords';
import { useHabitStats } from './hooks/useHabitStats';
import { Habit, ActiveDays } from './types/habits';
import { getHabitsForDate } from './lib/habitCalculations';

export type AppMode = 'idle' | 'marking-real';

export default function Home() {
  const [mode, setMode] = useState<AppMode>('idle');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Habits system
  const { activeHabits, isLoaded, createHabit, updateHabit, deleteHabit } = useHabits();
  const { records, recordCompletion, getRecordsForDate, deleteRecordsForHabit } = useDailyRecords();
  const { stats } = useHabitStats(activeHabits, records);

  // UI state
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Get habits for the selected date
  const habitsForDate = getHabitsForDate(activeHabits, selectedDate);
  const recordsForDate = getRecordsForDate(selectedDate);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedHabit(null);
    setMode('idle');
  };

  // Handle habit form submission
  const handleHabitSubmit = async (
    title: string,
    description: string,
    startTime: number,
    endTime: number,
    activeDays: ActiveDays,
    color: string
  ) => {
    if (editingHabit) {
      const result = await updateHabit(editingHabit.id, {
        title,
        description,
        startTime,
        endTime,
        activeDays,
        color
      });
      if (result.success) {
        setShowHabitForm(false);
        setEditingHabit(null);
      }
      return result;
    } else {
      const result = await createHabit(title, description, startTime, endTime, activeDays, color);
      if (result.success) {
        setShowHabitForm(false);
      }
      return result;
    }
  };

  // Handle habit selection for recording
  const handleSelectHabit = (habit: Habit | null) => {
    if (habit) {
      setSelectedHabit(habit);
      setMode('marking-real');
    } else {
      setSelectedHabit(null);
      setMode('idle');
    }
  };

  // Handle recording habit completion from calendar
  const handleRecordHabitTime = async (startTime: number, endTime: number): Promise<{ success: boolean; error?: string }> => {
    if (!selectedHabit) return { success: false, error: 'No hay hábito seleccionado' };

    const result = await recordCompletion(selectedHabit, selectedDate, startTime, endTime);
    if (result.success) {
      setSelectedHabit(null);
      setMode('idle');
    }
    return { success: result.success, error: result.error };
  };

  // Cancel marking real
  const handleCancelMarking = () => {
    setSelectedHabit(null);
    setMode('idle');
  };

  // Handle delete habit
  const handleDeleteHabit = async (habit: Habit) => {
    await deleteRecordsForHabit(habit.id);
    deleteHabit(habit.id);
    if (selectedHabit?.id === habit.id) {
      setSelectedHabit(null);
      setMode('idle');
    }
  };

  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span className="loading-text">Cargando...</span>
        </div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-text {
            color: #64748b;
            font-size: 0.875rem;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <DailyCalendar
        mode={mode}
        onModeChange={setMode}
        habits={habitsForDate}
        records={recordsForDate}
        selectedHabit={selectedHabit}
        onRecordHabitTime={handleRecordHabitTime}
        onDateChange={handleDateChange}
        onSelectHabit={handleSelectHabit}
      >
        <FloatingIsland
          habits={activeHabits}
          stats={stats}
          onCreateHabit={() => setShowHabitForm(true)}
          onEditHabit={(habit) => {
            setEditingHabit(habit);
            setShowHabitForm(true);
          }}
          onDeleteHabit={handleDeleteHabit}
          disabled={mode === 'marking-real'}
        />
      </DailyCalendar>

      {showHabitForm && (
        <HabitForm
          onSubmit={handleHabitSubmit}
          onCancel={() => {
            setShowHabitForm(false);
            setEditingHabit(null);
          }}
          initialValues={editingHabit ? {
            title: editingHabit.title,
            description: editingHabit.description,
            startTime: editingHabit.startTime,
            endTime: editingHabit.endTime,
            activeDays: editingHabit.activeDays,
            color: editingHabit.color,
          } : undefined}
          isEditing={!!editingHabit}
        />
      )}

      <style jsx>{`
        .app-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 24px;
          justify-content: center;
          align-items: center;
        }

        @media (max-width: 600px) {
          .app-container {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}

