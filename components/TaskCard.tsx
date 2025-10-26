
import React, { useState } from 'react';
import { Task, QuadrantType } from '../types';
import { QUADRANT_CONFIG, QUADRANT_ORDER } from '../constants';
import { EditIcon, TrashIcon, ChevronDownIcon, CalendarIcon, CheckIcon } from './Icons';

interface TaskCardProps {
  task: Task;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  borderColor: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateTask, onDeleteTask, onEditTask, borderColor }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleCompleted = () => {
    onUpdateTask({ ...task, completed: !task.completed });
  };

  const handleMove = (newQuadrant: QuadrantType) => {
    onUpdateTask({ ...task, quadrant: newQuadrant });
    setIsMenuOpen(false);
  };
  
  const handlePostpone = (days: number) => {
    const currentDate = new Date(task.date);
    currentDate.setDate(currentDate.getDate() + days);
    onUpdateTask({ ...task, date: currentDate.toISOString().split('T')[0] });
    setIsMenuOpen(false);
  }

  return (
    <div className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${borderColor} ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
            <button onClick={toggleCompleted} className={`mt-1 w-5 h-5 flex-shrink-0 rounded-full border-2 ${task.completed ? `${borderColor.replace('border-', 'bg-')} border-transparent` : 'border-slate-300'} flex items-center justify-center transition-colors`}>
                {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
            </button>
            <div>
                <h3 className={`font-semibold text-slate-800 ${task.completed ? 'line-through' : ''}`}>{task.title}</h3>
                <p className={`text-sm text-slate-500 ${task.completed ? 'line-through' : ''}`}>{task.description}</p>
            </div>
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-slate-100">
            <ChevronDownIcon />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-25 border border-slate-200">
              <div className="py-1">
                <button onClick={() => { onEditTask(task); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><EditIcon /> Edit</button>
                <div className="border-t border-slate-200 my-1"></div>
                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-400">Move to</div>
                {QUADRANT_ORDER.filter(q => q !== task.quadrant).map(q => (
                    <button key={q} onClick={() => handleMove(q)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{QUADRANT_CONFIG[q].title}</button>
                ))}
                <div className="border-t border-slate-200 my-1"></div>
                 <div className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-400">Postpone</div>
                <button onClick={() => handlePostpone(1)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><CalendarIcon /> 1 Day</button>
                <button onClick={() => handlePostpone(7)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><CalendarIcon /> 1 Week</button>
                <div className="border-t border-slate-200 my-1"></div>
                <button onClick={() => onDeleteTask(task.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><TrashIcon /> Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;