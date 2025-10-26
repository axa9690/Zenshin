import React, { useState } from 'react';
import { Task, QuadrantType } from '../types';
import { QUADRANT_CONFIG } from '../constants';
import TaskCard from './TaskCard';

interface QuadrantProps {
  quadrantId: QuadrantType;
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onMoveBacklogToBoard: (backlogTaskId: string, quadrant: QuadrantType) => void;
}

const Quadrant: React.FC<QuadrantProps> = ({ quadrantId, tasks, onUpdateTask, onDeleteTask, onEditTask, onMoveBacklogToBoard }) => {
  const config = QUADRANT_CONFIG[quadrantId];
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('backlog-task-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('backlog-task-id')) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const backlogTaskId = e.dataTransfer.getData('backlog-task-id');
    if (backlogTaskId) {
      onMoveBacklogToBoard(backlogTaskId, quadrantId);
    }
  };

  const dragOverClasses = isDragOver ? 'outline-dashed outline-2 outline-blue-400 -outline-offset-4' : '';

  return (
    <div 
      className={`p-4 rounded-xl shadow-md flex flex-col ${config.bgColor} border ${config.borderColor} transition-all duration-200 ${dragOverClasses}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-4 flex-shrink-0">
        <h2 className={`text-lg font-bold text-slate-800`}>{config.title}</h2>
        <p className="text-sm text-slate-500">{config.description}</p>
      </div>
      <div className="space-y-3 flex-grow pr-1 -mr-1">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              borderColor={config.borderColor} 
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
            No tasks in this quadrant.
          </div>
        )}
      </div>
    </div>
  );
};

export default Quadrant;