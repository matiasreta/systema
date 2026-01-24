'use client';

import { useState } from 'react';
import { Habit, DailyRecord, HabitStats } from '../types/habits';
import { formatTimeFromMinutes } from '../lib/dateUtils';

interface FloatingIslandProps {
    habits: Habit[];
    stats: Map<string, HabitStats>;
    onCreateHabit: () => void;
    onEditHabit: (habit: Habit) => void;
    onDeleteHabit: (habit: Habit) => void;
    disabled?: boolean;
}

export default function FloatingIsland({
    habits,
    stats,
    onCreateHabit,
    onEditHabit,
    onDeleteHabit,
    disabled = false
}: FloatingIslandProps) {
    const [showHabitList, setShowHabitList] = useState(false);

    const sortedHabits = [...habits].sort((a, b) => a.startTime - b.startTime);

    return (
        <>
            <div className="floating-island">
                <button
                    className="island-btn create-btn"
                    onClick={onCreateHabit}
                    disabled={disabled}
                    title="Crear hábito"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>

                <div className="island-divider" />

                <button
                    className="island-btn list-btn"
                    onClick={() => setShowHabitList(true)}
                    disabled={disabled}
                    title="Ver hábitos"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                </button>
            </div>

            {showHabitList && (
                <div className="habit-panel-overlay" onClick={() => setShowHabitList(false)}>
                    <div className="habit-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="panel-header">
                            <h3>Mis Hábitos</h3>
                            <button className="close-btn" onClick={() => setShowHabitList(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="panel-content">
                            {sortedHabits.length === 0 ? (
                                <div className="empty-state">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <p>No tienes hábitos creados</p>
                                    <button className="create-first-btn" onClick={() => { setShowHabitList(false); onCreateHabit(); }}>
                                        Crear mi primer hábito
                                    </button>
                                </div>
                            ) : (
                                <div className="habit-items">
                                    {sortedHabits.map(habit => {
                                        const habitStats = stats.get(habit.id);
                                        return (
                                            <div key={habit.id} className="habit-item">
                                                <div className="habit-color" style={{ background: habit.color }} />
                                                <div className="habit-info">
                                                    <span className="habit-title">{habit.title}</span>
                                                    <span className="habit-time">
                                                        {formatTimeFromMinutes(habit.startTime)} - {formatTimeFromMinutes(habit.endTime)}
                                                    </span>
                                                    {habitStats && (
                                                        <span className="habit-stats">
                                                            {habitStats.rolling100Days.toFixed(0)}% completado
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="habit-actions">
                                                    <button className="action-btn edit-btn" onClick={() => { setShowHabitList(false); onEditHabit(habit); }} title="Editar">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button className="action-btn delete-btn" onClick={() => onDeleteHabit(habit)} title="Eliminar">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="panel-footer">
                            <button className="add-habit-btn" onClick={() => { setShowHabitList(false); onCreateHabit(); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Nuevo hábito
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .floating-island {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 50;
        }

        .island-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f8fafc;
          color: #64748b;
        }

        .island-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .island-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .list-btn:hover:not(:disabled) {
          background: #f1f5f9;
          color: #1e293b;
        }

        .island-divider {
          width: 1px;
          height: 32px;
          background: #e2e8f0;
        }

        .habit-panel-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .habit-panel {
          background: #ffffff;
          border-radius: 20px;
          width: 90%;
          max-width: 400px;
          max-height: 80%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #94a3b8;
          text-align: center;
        }

        .empty-state svg {
          margin-bottom: 16px;
          color: #cbd5e1;
        }

        .empty-state p {
          margin: 0 0 20px 0;
          font-size: 0.95rem;
          color: #64748b;
        }

        .create-first-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-first-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .habit-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .habit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          transition: all 0.2s;
        }

        .habit-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .habit-color {
          width: 8px;
          height: 40px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .habit-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .habit-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .habit-time {
          font-size: 0.75rem;
          color: #64748b;
        }

        .habit-stats {
          font-size: 0.7rem;
          color: #10b981;
          font-weight: 500;
        }

        .habit-actions {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-btn {
          background: #e0e7ff;
          color: #6366f1;
        }

        .edit-btn:hover {
          background: #c7d2fe;
        }

        .delete-btn {
          background: #fee2e2;
          color: #ef4444;
        }

        .delete-btn:hover {
          background: #fecaca;
        }

        .panel-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
        }

        .add-habit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-habit-btn:hover {
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
      `}</style>
        </>
    );
}
