'use client';

import { useEffect, useRef, useState } from 'react';

export type TaskMode = 'idle' | 'setting-ideal' | 'marking-real';

// Time is stored as minutes from midnight (0-1439)
export interface Task {
  id: string;
  title: string;
  description: string;
  startTime: number; // minutes from midnight
  endTime: number;   // minutes from midnight
  type: 'ideal' | 'real';
  date: string;
  linkedIdealTaskId?: string;
  realTaskId?: string;
}

interface TimeSlot {
  minutes: number; // minutes from midnight
  label: string;
  isHourStart: boolean;
}

interface DailyCalendarProps {
  mode: TaskMode;
  onModeChange: (mode: TaskMode) => void;
  tasks: Task[];
  onTaskCreate: (task: Task) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  selectedIdealTask: Task | null;
  onSelectIdealTask: (task: Task | null) => void;
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

const formatTime = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${mins.toString().padStart(2, '0')}${period}`;
};

const SLOT_HEIGHT = 10; // 10px per 10-minute slot
const TOTAL_HEIGHT = 144 * SLOT_HEIGHT; // 1440px total

export default function DailyCalendar({
  mode,
  onModeChange,
  tasks,
  onTaskCreate,
  onTaskUpdate,
  selectedIdealTask,
  onSelectIdealTask
}: DailyCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

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

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const tasksForSelectedDate = tasks.filter(
    task => task.date === getDateKey(selectedDate)
  );

  const idealTasks = tasksForSelectedDate.filter(t => t.type === 'ideal');
  const realTasks = tasksForSelectedDate.filter(t => t.type === 'real');

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    clearSelection();
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    clearSelection();
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    clearSelection();
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setShowTaskForm(false);
    setTaskTitle('');
    setTaskDescription('');
    onSelectIdealTask(null);
    if (mode === 'marking-real') {
      onModeChange('idle');
    }
  };

  const handleTagClick = (task: Task) => {
    if (task.realTaskId) return;
    onSelectIdealTask(task);
    onModeChange('marking-real');
  };

  const handleSlotClick = (minutes: number) => {
    if (mode === 'idle') return;

    if (selectionStart === null) {
      setSelectionStart(minutes);
      setSelectionEnd(minutes);
    } else if (!showTaskForm) {
      const start = Math.min(selectionStart, minutes);
      const end = Math.max(selectionStart, minutes);
      setSelectionStart(start);
      setSelectionEnd(end);
      setShowTaskForm(true);
    }
  };

  const handleSlotHover = (minutes: number) => {
    if (mode === 'idle' || selectionStart === null || showTaskForm) return;
    setSelectionEnd(minutes);
  };

  const handleCreateTask = () => {
    if (selectionStart === null || selectionEnd === null) return;

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd) + 10; // +10 to include the last slot

    if (mode === 'setting-ideal') {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskTitle || 'Sin título',
        description: taskDescription,
        startTime: start,
        endTime: end,
        type: 'ideal',
        date: getDateKey(selectedDate),
      };
      onTaskCreate(newTask);
    } else if (mode === 'marking-real' && selectedIdealTask) {
      const newRealTask: Task = {
        id: Date.now().toString(),
        title: selectedIdealTask.title,
        description: selectedIdealTask.description,
        startTime: start,
        endTime: end,
        type: 'real',
        date: getDateKey(selectedDate),
        linkedIdealTaskId: selectedIdealTask.id,
      };
      onTaskCreate(newRealTask);
      onTaskUpdate(selectedIdealTask.id, { realTaskId: newRealTask.id });
    }

    clearSelection();
    onModeChange('idle');
  };

  const handleCancelTask = () => {
    clearSelection();
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
        top: 8 * 6 * SLOT_HEIGHT, // 8AM position
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
    return selectedDate.toLocaleDateString('es-ES', options).toUpperCase();
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get the current 10-minute slot
  const currentSlotMinutes = Math.floor(getCurrentTimeInMinutes() / 10) * 10;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="header-top">
          <div className="date-section">
            <h2 className="current-date">{formatSelectedDate()}</h2>
            {isToday() && <span className="time-text">[{formatCurrentTime()}]</span>}
          </div>
          <div className="navigation-buttons">
            <button className="nav-btn" onClick={goToPreviousDay}>◄</button>
            <button className={`today-btn ${isToday() ? 'today-active' : ''}`} onClick={goToToday}>HOY</button>
            <button className="nav-btn" onClick={goToNextDay}>►</button>
          </div>
        </div>

        {idealTasks.length > 0 && (
          <div className="task-tags-section">
            <span className="tags-label">TAREAS:</span>
            <div className="task-tags">
              {idealTasks.map(task => {
                const hasReal = !!task.realTaskId;
                const isSelected = selectedIdealTask?.id === task.id;
                return (
                  <button
                    key={task.id}
                    className={`task-tag ${hasReal ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleTagClick(task)}
                    disabled={hasReal || mode === 'setting-ideal'}
                  >
                    <span className="tag-title">{task.title}</span>
                    <span className="tag-time">{formatTime(task.startTime)}-{formatTime(task.endTime)}</span>
                    {hasReal && <span className="tag-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'marking-real' && selectedIdealTask && (
          <div className="marking-indicator">
            <span>MARCANDO: <strong>{selectedIdealTask.title}</strong></span>
            <button className="cancel-btn-small" onClick={clearSelection}>✕</button>
          </div>
        )}
      </div>

      <div className="time-grid-container" ref={containerRef}>
        <div className="time-grid">
          {timeSlots.map((slot) => {
            const isSelected = isSlotInSelection(slot.minutes);
            const isSelecting = mode !== 'idle';
            const isMarkingReal = mode === 'marking-real';
            const isCurrent = isToday() && currentSlotMinutes === slot.minutes;

            return (
              <div
                key={slot.minutes}
                className={`time-slot 
                  ${slot.isHourStart ? 'hour-start' : ''}
                  ${isCurrent ? 'current-slot' : ''}
                  ${isSelected ? (isMarkingReal ? 'selected-real' : 'selected-slot') : ''}
                  ${isSelecting ? 'selecting-mode' : ''}
                `}
                onClick={() => handleSlotClick(slot.minutes)}
                onMouseEnter={() => handleSlotHover(slot.minutes)}
              >
                <div className="time-label">
                  {slot.isHourStart && <span className="hour-text">{slot.label}</span>}
                </div>
                <div className="slot-content"></div>
              </div>
            );
          })}

          {/* Render task cards separately for better positioning */}
          {idealTasks.map(task => {
            const top = (task.startTime / 10) * SLOT_HEIGHT;
            const height = ((task.endTime - task.startTime) / 10) * SLOT_HEIGHT;
            const hasReal = !!task.realTaskId;

            return (
              <div
                key={task.id}
                className={`task-card task-ideal ${hasReal ? 'has-real' : ''}`}
                style={{ top: `${top}px`, height: `${height - 2}px` }}
              >
                <div className="task-time">IDEAL: {formatTime(task.startTime)} - {formatTime(task.endTime)}</div>
                <div className="task-title">{task.title}</div>
              </div>
            );
          })}

          {realTasks.map(task => {
            const top = (task.startTime / 10) * SLOT_HEIGHT;
            const height = ((task.endTime - task.startTime) / 10) * SLOT_HEIGHT;

            return (
              <div
                key={task.id}
                className="task-card task-real"
                style={{ top: `${top}px`, height: `${height - 2}px` }}
              >
                <div className="task-time">REAL: {formatTime(task.startTime)} - {formatTime(task.endTime)}</div>
                <div className="task-title">{task.title}</div>
              </div>
            );
          })}

          {isToday() && (
            <div
              ref={currentTimeRef}
              className="time-indicator"
              style={{ top: `${getTimeIndicatorPosition()}px` }}
            >
              <div className="indicator-line"></div>
            </div>
          )}
        </div>
      </div>

      {showTaskForm && (
        <div className="task-form-overlay">
          <div className={`task-form ${mode === 'marking-real' ? 'form-real' : ''}`}>
            <h3 className="form-title">
              {mode === 'setting-ideal' ? 'NUEVA TAREA IDEAL' : `TIEMPO REAL: ${selectedIdealTask?.title}`}
            </h3>
            <div className="form-time">
              {formatTime(Math.min(selectionStart!, selectionEnd!))} - {formatTime(Math.max(selectionStart!, selectionEnd!) + 10)}
            </div>

            {mode === 'setting-ideal' && (
              <>
                <input
                  type="text"
                  className="form-input"
                  placeholder="TÍTULO"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  className="form-textarea"
                  placeholder="DESCRIPCIÓN (OPCIONAL)"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </>
            )}

            <div className="form-buttons">
              <button className="form-btn cancel-btn" onClick={handleCancelTask}>CANCELAR</button>
              <button className="form-btn create-btn" onClick={handleCreateTask}>
                {mode === 'setting-ideal' ? 'CREAR' : 'CONFIRMAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          width: 100%;
          max-width: 600px;
          height: 100vh;
          max-height: 800px;
          display: flex;
          flex-direction: column;
          background: #000000;
          border: 4px solid #ffffff;
          overflow: hidden;
          font-family: 'Courier New', Courier, monospace;
          position: relative;
        }

        .calendar-header {
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 4px solid #000000;
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
          font-size: 0.9rem;
          font-weight: 900;
          color: #000000;
          letter-spacing: 0.08em;
          margin: 0;
        }

        .time-text {
          font-size: 1.1rem;
          font-weight: 900;
          color: #000000;
        }

        .navigation-buttons {
          display: flex;
          gap: 0;
        }

        .nav-btn, .today-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 3px solid #000000;
          color: #000000;
          cursor: pointer;
          font-weight: 900;
          font-family: 'Courier New', Courier, monospace;
        }

        .nav-btn { width: 32px; height: 32px; font-size: 0.85rem; }
        .today-btn { padding: 6px 12px; background: #000; color: #fff; font-size: 0.75rem; letter-spacing: 0.1em; }
        .nav-btn:hover { background: #000; color: #fff; }
        .today-btn:hover { background: #fff; color: #000; }

        .task-tags-section {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #e0e0e0;
        }

        .tags-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: #666;
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 6px;
        }

        .task-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .task-tag {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px 10px;
          background: #00ff00;
          border: 2px solid #00cc00;
          color: #000;
          cursor: pointer;
          font-family: 'Courier New', Courier, monospace;
          text-align: left;
          position: relative;
        }

        .task-tag:hover:not(:disabled) {
          background: #00cc00;
          transform: translate(-2px, -2px);
          box-shadow: 2px 2px 0 #000;
        }

        .task-tag:disabled { cursor: default; }
        .task-tag.completed { background: #ccc; border-color: #999; opacity: 0.7; }
        .task-tag.selected { background: #f00; border-color: #c00; color: #fff; }
        .tag-title { font-size: 0.7rem; font-weight: 900; }
        .tag-time { font-size: 0.55rem; opacity: 0.7; }
        .tag-check { position: absolute; top: 3px; right: 5px; font-size: 0.65rem; font-weight: 900; }

        .marking-indicator {
          margin-top: 8px;
          padding: 6px 10px;
          background: #f00;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
        }

        .cancel-btn-small {
          background: transparent;
          border: 2px solid #fff;
          color: #fff;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-weight: 900;
          font-size: 0.7rem;
        }

        .cancel-btn-small:hover { background: #fff; color: #f00; }

        .time-grid-container {
          flex: 1;
          overflow-y: auto;
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: #fff #000;
        }

        .time-grid {
          position: relative;
          height: ${TOTAL_HEIGHT}px;
        }

        .time-slot {
          display: flex;
          height: ${SLOT_HEIGHT}px;
          position: relative;
          border-bottom: 1px solid #1a1a1a;
        }

        .time-slot.hour-start {
          border-bottom: 1px solid #333;
        }

        .time-slot:hover { background: #111; }
        .time-slot.selecting-mode { cursor: crosshair; }
        .time-slot.selecting-mode:hover { background: #1a2f1a; }
        .time-slot.selected-slot { background: #00ff00 !important; }
        .time-slot.selected-real { background: #ff3333 !important; }
        .time-slot.selected-slot .hour-text,
        .time-slot.selected-real .hour-text { color: #000; }
        .time-slot.current-slot { background: #1a1a1a; }

        .time-label {
          width: 60px;
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          padding: 0 8px;
          border-right: 2px solid #222;
        }

        .hour-text {
          font-size: 0.7rem;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .slot-content {
          flex: 1;
          position: relative;
        }

        .task-card {
          position: absolute;
          left: 60px;
          padding: 3px 6px;
          border: 2px solid;
          overflow: hidden;
          z-index: 5;
          pointer-events: none;
        }

        .task-card.task-ideal {
          right: 50%;
          background: #00ff00;
          border-color: #00cc00;
          color: #000;
        }

        .task-card.task-ideal.has-real { opacity: 0.5; }

        .task-card.task-real {
          left: calc(50% + 60px);
          right: 0;
          background: #ff0000;
          border-color: #cc0000;
          color: #fff;
          z-index: 6;
        }

        .task-time { font-size: 0.5rem; font-weight: 700; opacity: 0.8; }
        .task-title { font-size: 0.65rem; font-weight: 900; margin-top: 1px; }

        .time-indicator {
          position: absolute;
          left: 60px;
          right: 0;
          display: flex;
          align-items: center;
          z-index: 10;
          pointer-events: none;
        }

        .indicator-line {
          flex: 1;
          height: 2px;
          background: #ff0000;
          box-shadow: 0 0 4px #ff0000;
        }

        .task-form-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .task-form {
          background: #000;
          border: 4px solid #0f0;
          padding: 20px;
          width: 90%;
          max-width: 380px;
        }

        .task-form.form-real { border-color: #f00; }
        .form-title { font-size: 0.9rem; font-weight: 900; color: #0f0; letter-spacing: 0.12em; margin: 0 0 6px 0; }
        .form-real .form-title { color: #f00; }
        .form-time { font-size: 0.75rem; color: #888; margin-bottom: 14px; }

        .form-input, .form-textarea {
          width: 100%;
          background: #111;
          border: 2px solid #333;
          color: #fff;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.85rem;
          padding: 10px;
          margin-bottom: 10px;
          box-sizing: border-box;
        }

        .form-input:focus, .form-textarea:focus { outline: none; border-color: #0f0; }
        .form-textarea { min-height: 70px; resize: vertical; }

        .form-buttons { display: flex; gap: 10px; }

        .form-btn {
          flex: 1;
          padding: 10px;
          border: 3px solid;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          cursor: pointer;
        }

        .cancel-btn { background: transparent; border-color: #666; color: #666; }
        .cancel-btn:hover { border-color: #fff; color: #fff; }
        .create-btn { background: #0f0; border-color: #0f0; color: #000; }
        .form-real .create-btn { background: #f00; border-color: #f00; color: #fff; }
      `}</style>
    </div>
  );
}
