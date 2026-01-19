'use client';

import { useState } from 'react';
import DailyCalendar, { Task } from "./components/DailyCalendar";
import ConfigPanel, { TaskMode } from "./components/ConfigPanel";

export default function Home() {
  const [mode, setMode] = useState<TaskMode>('idle');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedIdealTask, setSelectedIdealTask] = useState<Task | null>(null);

  const handleTaskCreate = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleCancelMarkingReal = () => {
    setSelectedIdealTask(null);
  };

  // Check if there are any ideal tasks
  const hasIdealTasks = tasks.some(t => t.type === 'ideal');

  return (
    <div className="app-container">
      <DailyCalendar
        mode={mode}
        onModeChange={setMode}
        tasks={tasks}
        onTaskCreate={handleTaskCreate}
        onTaskUpdate={handleTaskUpdate}
        selectedIdealTask={selectedIdealTask}
        onSelectIdealTask={setSelectedIdealTask}
      />
      <ConfigPanel
        currentMode={mode}
        onModeChange={setMode}
        hasIdealTasks={hasIdealTasks}
        selectedIdealTask={selectedIdealTask}
        onCancelMarkingReal={handleCancelMarkingReal}
      />

      <style jsx>{`
        .app-container {
          display: flex;
          min-height: 100vh;
          background: #000000;
          padding: 20px;
          gap: 20px;
          justify-content: center;
          align-items: flex-start;
        }

        @media (max-width: 900px) {
          .app-container {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
