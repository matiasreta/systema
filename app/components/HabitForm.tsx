'use client';

import { useState } from 'react';
import { ActiveDays, DAY_NAMES, DAY_LABELS } from '../types/habits';
import { allDaysActive } from '../lib/habitCalculations';
import { formatTimeFromMinutes } from '../lib/dateUtils';

interface HabitFormProps {
  onSubmit: (
    title: string,
    description: string,
    startTime: number,
    endTime: number,
    activeDays: ActiveDays,
    color: string
  ) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  initialValues?: {
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    activeDays: ActiveDays;
    color: string;
  };
  isEditing?: boolean;
}

// Fixed color for all habits - red as primary tracking color
const HABIT_COLOR = '#ef4444';

export default function HabitForm({ onSubmit, onCancel, initialValues, isEditing }: HabitFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [startTime, setStartTime] = useState(initialValues?.startTime ?? 540); // 9AM
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? 600); // 10AM
  const [activeDays, setActiveDays] = useState<ActiveDays>(initialValues?.activeDays ?? allDaysActive());
  const [error, setError] = useState<string | null>(null);

  const handleDayToggle = (day: keyof ActiveDays) => {
    setActiveDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (startTime >= endTime) {
      setError('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    const hasAnyDay = Object.values(activeDays).some(v => v);
    if (!hasAnyDay) {
      setError('Debes seleccionar al menos un día');
      return;
    }

    const result = await onSubmit(title, description, startTime, endTime, activeDays, HABIT_COLOR);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const timeOptions = [];
  for (let i = 0; i < 144; i++) {
    const minutes = i * 10;
    timeOptions.push({ value: minutes, label: formatTimeFromMinutes(minutes) });
  }

  return (
    <div className="habit-form-overlay">
      <form className="habit-form" onSubmit={handleSubmit}>
        <h3 className="form-title">{isEditing ? 'Editar hábito' : 'Nuevo hábito'}</h3>

        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Título</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: Ejercicio matutino"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción (opcional)</label>
          <textarea
            className="form-textarea"
            placeholder="Añade detalles sobre este hábito"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="time-selectors">
          <div className="time-field">
            <label className="form-label">Desde</label>
            <select value={startTime} onChange={(e) => setStartTime(Number(e.target.value))}>
              {timeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="time-field">
            <label className="form-label">Hasta</label>
            <select value={endTime} onChange={(e) => setEndTime(Number(e.target.value))}>
              {timeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Días activos</label>
          <div className="days-buttons">
            {DAY_NAMES.map(day => (
              <button
                key={day}
                type="button"
                className={`day-btn ${activeDays[day] ? 'active' : ''}`}
                onClick={() => handleDayToggle(day)}
                style={activeDays[day] ? { background: HABIT_COLOR, borderColor: HABIT_COLOR } : {}}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>



        <div className="form-buttons">
          <button type="button" className="form-btn cancel-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="form-btn create-btn" style={{ background: HABIT_COLOR }}>
            {isEditing ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .habit-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .habit-form {
          background: #ffffff;
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
        }

        .form-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.85rem;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 8px;
        }

        .form-input, .form-textarea {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #1e293b;
          font-size: 0.9rem;
          padding: 12px 14px;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #94a3b8;
        }

        .form-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .time-selectors {
          display: flex;
          gap: 16px;
          margin-bottom: 18px;
        }

        .time-field {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .time-field select {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #1e293b;
          padding: 12px 14px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-field select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .days-buttons {
          display: flex;
          gap: 6px;
        }

        .day-btn {
          flex: 1;
          padding: 10px 4px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .day-btn:hover:not(.active) {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .day-btn.active {
          color: #fff;
        }

        .form-buttons {
          display: flex;
          gap: 14px;
          margin-top: 24px;
        }

        .form-btn {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: #f1f5f9;
          color: #64748b;
        }

        .cancel-btn:hover {
          background: #e2e8f0;
        }

        .create-btn {
          color: #fff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .create-btn:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
