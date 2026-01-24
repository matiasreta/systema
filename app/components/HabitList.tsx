'use client';

import { Habit, DailyRecord, HabitStats } from '../types/habits';
import HabitCard from './HabitCard';

interface HabitListProps {
  habits: Habit[];
  records: DailyRecord[];
  stats: Map<string, HabitStats>;
  selectedHabit: Habit | null;
  onSelectHabit: (habit: Habit | null) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
  onDeleteRecord?: (record: DailyRecord) => void;
}

export default function HabitList({
  habits,
  records,
  stats,
  selectedHabit,
  onSelectHabit,
  onEditHabit,
  onDeleteHabit,
  onDeleteRecord
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="empty-text">No tienes hábitos para hoy</p>
        <p className="empty-hint">Crea un hábito para comenzar</p>

        <style jsx>{`
          .empty-state {
            padding: 32px 24px;
            text-align: center;
          }

          .empty-icon {
            color: #cbd5e1;
            margin-bottom: 12px;
          }

          .empty-text {
            color: #64748b;
            font-size: 0.9rem;
            font-weight: 500;
            margin: 0 0 4px 0;
          }

          .empty-hint {
            color: #94a3b8;
            font-size: 0.8rem;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // Sort habits by start time
  const sortedHabits = [...habits].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="habit-list">
      {sortedHabits.map(habit => {
        const record = records.find(r => r.habitId === habit.id);
        const habitStats = stats.get(habit.id);
        const isSelected = selectedHabit?.id === habit.id;

        return (
          <HabitCard
            key={habit.id}
            habit={habit}
            stats={habitStats}
            record={record}
            isSelected={isSelected}
            onSelect={() => onSelectHabit(isSelected ? null : habit)}
            onEdit={onEditHabit}
            onDelete={onDeleteHabit}
            onDeleteRecord={onDeleteRecord}
          />
        );
      })}

      <style jsx>{`
        .habit-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
