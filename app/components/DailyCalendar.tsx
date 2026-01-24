'use client';

import { useEffect, useRef, useState } from 'react';
import { Habit, DailyRecord } from '../types/habits';
import { formatTimeFromMinutes, getDateKey as getDateKeyUtil } from '../lib/dateUtils';

export type AppMode = 'idle' | 'marking-real';

interface TimeSlot {
  minutes: number;
  label: string;
  isHourStart: boolean;
}

interface DailyCalendarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  habits: Habit[];
  records: DailyRecord[];
  selectedHabit: Habit | null;
  onRecordHabitTime: (startTime: number, endTime: number) => Promise<{ success: boolean; error?: string }>;
  onDateChange: (date: Date) => void;
  onSelectHabit?: (habit: Habit | null) => void;
  children?: React.ReactNode;
}

// Generate 144 slots (24 hours * 6 ten-minute intervals)
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let i = 0; i < 144; i++) {
    const minutes = i * 10;
    const hour = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const isHourStart = mins === 0;

    slots.push({
      minutes,
      label: isHourStart ? `${displayHour}${period}` : '',
      isHourStart,
    });
  }
  return slots;
};

const SLOT_HEIGHT = 10;
const TOTAL_HEIGHT = 144 * SLOT_HEIGHT;

export default function DailyCalendar({
  mode,
  onModeChange,
  habits,
  records,
  selectedHabit,
  onRecordHabitTime,
  onDateChange,
  onSelectHabit,
  children
}: DailyCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    onDateChange(newDate);
    clearSelection();
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    onDateChange(newDate);
    clearSelection();
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange(today);
    clearSelection();
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setShowConfirmForm(false);
    setError(null);
  };

  const handleSlotClick = (minutes: number) => {
    if (mode === 'idle') return;

    if (selectionStart === null) {
      setSelectionStart(minutes);
      setSelectionEnd(minutes);
    } else if (!showConfirmForm) {
      const start = Math.min(selectionStart, minutes);
      const end = Math.max(selectionStart, minutes);
      setSelectionStart(start);
      setSelectionEnd(end);
      setShowConfirmForm(true);
    }
  };

  const handleSlotHover = (minutes: number) => {
    if (mode === 'idle' || selectionStart === null || showConfirmForm) return;
    setSelectionEnd(minutes);
  };

  const handleConfirmRecord = async () => {
    if (selectionStart === null || selectionEnd === null) return;

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd) + 10;

    const result = await onRecordHabitTime(start, end);
    if (result.success) {
      clearSelection();
    } else if (result.error) {
      setError(result.error);
    }
  };

  const handleCancelRecord = () => {
    clearSelection();
    onModeChange('idle');
  };

  const isSlotInSelection = (minutes: number): boolean => {
    if (selectionStart === null) return false;
    const end = selectionEnd ?? selectionStart;
    const min = Math.min(selectionStart, end);
    const max = Math.max(selectionStart, end);
    return minutes >= min && minutes <= max;
  };

  const getCurrentTimeInMinutes = () => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  };

  const getTimeIndicatorPosition = () => {
    const totalMinutes = getCurrentTimeInMinutes();
    return (totalMinutes / 10) * SLOT_HEIGHT;
  };

  useEffect(() => {
    if (isToday() && currentTimeRef.current && containerRef.current) {
      const container = containerRef.current;
      const indicator = currentTimeRef.current;
      const containerHeight = container.clientHeight;
      const indicatorOffset = indicator.offsetTop;
      container.scrollTo({
        top: indicatorOffset - containerHeight / 3,
        behavior: 'auto',
      });
    } else if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 8 * 6 * SLOT_HEIGHT,
        behavior: 'auto',
      });
    }
  }, [selectedDate]);

  const formatSelectedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const formatted = selectedDate.toLocaleDateString('es-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const currentSlotMinutes = Math.floor(getCurrentTimeInMinutes() / 10) * 10;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="header-top">
          <div className="date-section">
            <h2 className="current-date">{formatSelectedDate()}</h2>
            {isToday() && <span className="time-text">{formatCurrentTime()}</span>}
          </div>
          <div className="navigation-buttons">
            <button className="nav-btn" onClick={goToPreviousDay}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button className={`today-btn ${isToday() ? 'today-active' : ''}`} onClick={goToToday}>Hoy</button>
            <button className="nav-btn" onClick={goToNextDay}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {mode === 'marking-real' && selectedHabit && (
          <div className="marking-indicator">
            <span>Registrando: <strong>{selectedHabit.title}</strong></span>
            <button className="cancel-btn-small" onClick={handleCancelRecord}>✕</button>
          </div>
        )}
      </div>

      <div className="time-grid-container" ref={containerRef}>
        <div className="hours-column">
          {timeSlots.map((slot) => (
            <div key={slot.minutes} className="hour-row">
              {slot.isHourStart && <span className="hour-text">{slot.label}</span>}
            </div>
          ))}
        </div>

        <div className="time-grid">
          {timeSlots.map((slot) => {
            const isSelected = isSlotInSelection(slot.minutes);
            const isSelecting = mode !== 'idle';
            const isCurrent = isToday() && currentSlotMinutes === slot.minutes;

            return (
              <div
                key={slot.minutes}
                className={`time-slot 
                  ${slot.isHourStart ? 'hour-start' : ''}
                  ${isCurrent ? 'current-slot' : ''}
                  ${isSelected ? 'selected-real' : ''}
                  ${isSelecting ? 'selecting-mode' : ''}
                `}
                onClick={() => handleSlotClick(slot.minutes)}
                onMouseEnter={() => handleSlotHover(slot.minutes)}
              >
                <div className="slot-content"></div>
              </div>
            );
          })}

          {/* Render habit ideal blocks - dotted outline 'holes' */}
          {habits.map(habit => {
            const top = (habit.startTime / 10) * SLOT_HEIGHT;
            const height = ((habit.endTime - habit.startTime) / 10) * SLOT_HEIGHT;
            const record = records.find(r => r.habitId === habit.id);
            const hasRecord = !!record;
            const isThisSelected = selectedHabit?.id === habit.id;

            return (
              <div
                key={`habit-${habit.id}`}
                className={`habit-block habit-ideal ${hasRecord ? 'has-record' : ''} ${isThisSelected ? 'selected' : ''} ${onSelectHabit && mode === 'idle' && !hasRecord ? 'clickable' : ''}`}
                style={{
                  top: `${top}px`,
                  height: `${height - 2}px`,
                }}
                onClick={() => {
                  if (onSelectHabit && mode === 'idle' && !hasRecord) {
                    onSelectHabit(habit);
                  }
                }}
              >
                <div className="habit-header">
                  <span className="habit-label">IDEAL: {habit.title.toUpperCase()}</span>
                  <span className="habit-duration">({formatTimeFromMinutes(habit.endTime - habit.startTime).replace(':', 'H ')}M)</span>
                </div>
                {hasRecord && <span className="habit-check">✓</span>}
              </div>
            );
          })}

          {/* Render habit real records - solid red fill */}
          {records.map(record => {
            if (record.actualStartTime === null || record.actualEndTime === null) return null;
            const habit = habits.find(h => h.id === record.habitId);
            if (!habit) return null;

            const top = (record.actualStartTime / 10) * SLOT_HEIGHT;
            const height = ((record.actualEndTime - record.actualStartTime) / 10) * SLOT_HEIGHT;
            const duration = record.actualEndTime - record.actualStartTime;
            const hours = Math.floor(duration / 60);
            const mins = duration % 60;
            const durationText = hours > 0 ? `${hours}H${mins > 0 ? ` ${mins}M` : ''}` : `${mins}M`;

            return (
              <div
                key={`record-${record.id}`}
                className="habit-block habit-real"
                style={{
                  top: `${top}px`,
                  height: `${height - 2}px`,
                }}
              >
                <div className="real-header">
                  <span className="real-label">REAL: {durationText}</span>
                </div>
                <div className="real-title">{habit.title}</div>
              </div>
            );
          })}

          {isToday() && (
            <div
              ref={currentTimeRef}
              className="time-indicator"
              style={{ top: `${getTimeIndicatorPosition()}px` }}
            >
              <div className="indicator-dot"></div>
              <div className="indicator-line"></div>
            </div>
          )}
        </div>
      </div>

      {showConfirmForm && (
        <div className="task-form-overlay">
          <div className="task-form">
            <h3 className="form-title">Registrar: {selectedHabit?.title}</h3>
            <div className="form-time">
              {formatTimeFromMinutes(Math.min(selectionStart!, selectionEnd!))} - {formatTimeFromMinutes(Math.max(selectionStart!, selectionEnd!) + 10)}
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-buttons">
              <button className="form-btn cancel-btn" onClick={handleCancelRecord}>Cancelar</button>
              <button className="form-btn create-btn" onClick={handleConfirmRecord}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {children}

      <style jsx>{`
        .calendar-container {
          width: 100%;
          max-width: 600px;
          height: 100vh;
          max-height: 800px;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
          position: relative;
        }

        .calendar-header {
          padding: 20px 24px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .date-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .current-date {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .time-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6366f1;
        }

        .navigation-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .nav-btn, .today-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          border-radius: 10px;
        }

        .nav-btn { 
          width: 36px; 
          height: 36px; 
        }
        
        .today-btn { 
          padding: 8px 16px; 
          font-size: 0.8rem;
        }
        
        .nav-btn:hover, .today-btn:hover { 
          background: #f1f5f9; 
          border-color: #cbd5e1;
          color: #1e293b;
        }
        
        .today-btn.today-active {
          background: #6366f1;
          border-color: #6366f1;
          color: #ffffff;
        }

        .marking-indicator {
          margin-top: 12px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
          border-radius: 10px;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .cancel-btn-small {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .cancel-btn-small:hover { 
          background: rgba(255, 255, 255, 0.3); 
        }

        .time-grid-container {
          flex: 1;
          overflow-y: auto;
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .time-grid-container::-webkit-scrollbar {
          width: 6px;
        }

        .time-grid-container::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .time-grid-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .hours-column {
          position: absolute;
          left: 0;
          top: 0;
          width: 56px;
          height: ${TOTAL_HEIGHT}px;
          z-index: 20;
          background: #ffffff;
          pointer-events: none;
          border-right: 1px solid #f1f5f9;
        }

        .hour-row {
          height: ${SLOT_HEIGHT}px;
          display: flex;
          align-items: flex-start;
          padding: 0 8px;
        }

        .hour-text {
          font-size: 0.65rem;
          font-weight: 500;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .time-grid {
          position: relative;
          height: ${TOTAL_HEIGHT}px;
          margin-left: 56px;
        }

        .time-slot {
          display: flex;
          height: ${SLOT_HEIGHT}px;
          position: relative;
        }

        .time-slot.hour-start {
          border-top: 1px solid #f1f5f9;
        }

        .time-slot.selecting-mode { cursor: crosshair; }
        
        .time-slot.current-slot:not(.selected-real) .slot-content { 
          background: #f1f5f9; 
        }
        
        .time-slot.selected-real .slot-content { 
          background: linear-gradient(90deg, #6366f1 0%, #818cf8 100%); 
        }

        .slot-content {
          flex: 1;
          position: relative;
        }

        .habit-block {
          position: absolute;
          left: 4px;
          right: 4px;
          padding: 8px 12px;
          border-radius: 12px;
          overflow: hidden;
          z-index: 4;
          pointer-events: none;
        }

        .habit-block.habit-ideal {
          border: 2px dashed rgba(239, 68, 68, 0.5);
          background: transparent;
        }

        .habit-block.habit-ideal.has-record {
          opacity: 0.4;
        }

        .habit-block.habit-ideal.selected {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }

        .habit-block.habit-ideal.clickable {
          pointer-events: auto;
          cursor: pointer;
        }

        .habit-block.habit-ideal.clickable:hover {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .habit-block.habit-real {
          left: 4px;
          right: 4px;
          z-index: 7;
          background: #ef4444;
          border: none;
          border-radius: 12px;
        }

        .habit-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .habit-label { 
          font-size: 0.7rem; 
          font-weight: 500; 
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .habit-duration {
          font-size: 0.65rem;
          color: #94a3b8;
        }
        
        .habit-check { 
          position: absolute; 
          top: 8px; 
          right: 10px; 
          font-size: 0.75rem; 
          color: #ef4444; 
          font-weight: 700; 
        }

        .real-header {
          display: flex;
          align-items: center;
        }

        .real-label { 
          font-size: 0.85rem; 
          font-weight: 700; 
          color: #ffffff;
          letter-spacing: 0.02em;
        }
        
        .real-title { 
          font-size: 0.7rem; 
          font-weight: 500; 
          color: rgba(255, 255, 255, 0.85); 
          margin-top: 2px; 
        }

        .time-indicator {
          position: absolute;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          z-index: 10;
          pointer-events: none;
        }

        .indicator-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          margin-left: -4px;
        }

        .indicator-line {
          flex: 1;
          height: 2px;
          background: #ef4444;
        }

        .task-form-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .task-form {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 360px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .form-title { 
          font-size: 1rem; 
          font-weight: 600; 
          color: #1e293b; 
          margin: 0 0 8px 0; 
        }
        
        .form-time { 
          font-size: 0.875rem; 
          color: #64748b; 
          margin-bottom: 16px; 
        }
        
        .form-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.8rem;
        }

        .form-buttons { 
          display: flex; 
          gap: 12px; 
        }

        .form-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .cancel-btn { 
          background: #f1f5f9; 
          color: #64748b; 
        }
        
        .cancel-btn:hover { 
          background: #e2e8f0; 
        }
        
        .create-btn { 
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); 
          color: #fff; 
        }
        
        .create-btn:hover {
          box-shadow: 0 4px 6px rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
}
