'use client';

import { useState } from 'react';
import { Habit, HabitStats, DailyRecord } from '../types/habits';
import { formatTimeFromMinutes } from '../lib/dateUtils';
import HabitProgress from './HabitProgress';

interface HabitCardProps {
  habit: Habit;
  stats?: HabitStats;
  record?: DailyRecord;
  isSelected?: boolean;
  onSelect?: (habit: Habit) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
  onDeleteRecord?: (record: DailyRecord) => void;
  showActions?: boolean;
}

export default function HabitCard({
  habit,
  stats,
  record,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDeleteRecord,
  showActions = true
}: HabitCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCompleted = record && record.completionRate >= 1;
  const isPartial = record && record.completionRate > 0 && record.completionRate < 1;

  const handleClick = () => {
    if (!record && onSelect && !showDeleteConfirm) {
      onSelect(habit);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(habit);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`habit-card ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''} ${record ? 'has-record' : ''}`}
      onClick={handleClick}
    >
      {showDeleteConfirm ? (
        <div className="delete-confirm">
          <p className="confirm-text">¿Eliminar "{habit.title}"?</p>
          <div className="confirm-buttons">
            <button className="confirm-btn cancel" onClick={cancelDelete}>No</button>
            <button className="confirm-btn delete" onClick={confirmDelete}>Sí, eliminar</button>
          </div>
        </div>
      ) : (
        <>
          <div className="card-header">
            <div className="title-section">
              <span className="color-dot" style={{ background: habit.color }} />
              <h4 className="habit-title">{habit.title}</h4>
              {isCompleted && <span className="check-icon">✓</span>}
              {isPartial && <span className="partial-icon">◐</span>}
            </div>
            {showActions && !record && (
              <div className="action-buttons">
                {onEdit && (
                  <button
                    className="action-btn edit-btn"
                    onClick={(e) => { e.stopPropagation(); onEdit(habit); }}
                    title="Editar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    className="action-btn delete-btn"
                    onClick={handleDelete}
                    title="Eliminar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="time-range">
            {formatTimeFromMinutes(habit.startTime)} - {formatTimeFromMinutes(habit.endTime)}
          </div>

          {record && (
            <div className="record-info">
              <span className="record-label">Real:</span>
              <span className="record-time">
                {formatTimeFromMinutes(record.actualStartTime!)} - {formatTimeFromMinutes(record.actualEndTime!)}
              </span>
              <span className="record-rate">{(record.completionRate * 100).toFixed(0)}%</span>
              {onDeleteRecord && (
                <button
                  className="undo-btn"
                  onClick={(e) => { e.stopPropagation(); onDeleteRecord(record); }}
                  title="Deshacer registro"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {stats && (
            <div className="stats-section">
              <HabitProgress percentage={stats.rolling100Days} color={habit.color} size="small" />
              {stats.currentStreak > 0 && (
                <span className="streak">🔥 {stats.currentStreak} días</span>
              )}
            </div>
          )}

          {!record && onSelect && (
            <div className="action-hint">Click para registrar</div>
          )}
        </>
      )}

      <style jsx>{`
        .habit-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid ${habit.color};
        }

        .habit-card:hover:not(.has-record) {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .habit-card.selected {
          background: #f8fafc;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .habit-card.completed {
          opacity: 0.75;
        }

        .habit-card.has-record {
          cursor: default;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .habit-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }

        .check-icon {
          color: #10b981;
          font-weight: 700;
        }

        .partial-icon {
          color: #f59e0b;
          font-weight: 700;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: #f1f5f9;
        }

        .edit-btn:hover {
          color: #6366f1;
        }

        .delete-btn:hover {
          color: #ef4444;
        }

        .time-range {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 10px;
        }

        .record-info {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          padding: 8px 10px;
          border-radius: 8px;
          margin-bottom: 10px;
          font-size: 0.75rem;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .record-label {
          color: #10b981;
          font-weight: 600;
        }

        .record-time {
          color: #1e293b;
        }

        .record-rate {
          color: #64748b;
          font-weight: 600;
        }

        .undo-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          margin-left: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .undo-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .stats-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .streak {
          font-size: 0.7rem;
          color: #f59e0b;
        }

        .action-hint {
          margin-top: 10px;
          font-size: 0.7rem;
          color: #94a3b8;
          text-align: center;
        }

        .delete-confirm {
          text-align: center;
          padding: 8px 0;
        }

        .confirm-text {
          margin: 0 0 14px 0;
          font-size: 0.85rem;
          color: #1e293b;
        }

        .confirm-buttons {
          display: flex;
          gap: 10px;
        }

        .confirm-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .confirm-btn.cancel {
          background: #f1f5f9;
          color: #64748b;
        }

        .confirm-btn.cancel:hover {
          background: #e2e8f0;
        }

        .confirm-btn.delete {
          background: #ef4444;
          color: #fff;
        }

        .confirm-btn.delete:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}
