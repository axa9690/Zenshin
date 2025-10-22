import React from 'react';
import { BacklogTask } from '../types';
import { PlusIcon, TrashIcon, DragHandleIcon } from './Icons';

interface BacklogProps {
  tasks: BacklogTask[];
  onAddTaskToBoard: (task: BacklogTask) => void;
  onAddBacklogTask: () => void;
  onDeleteBacklogTask: (taskId: string) => void;
}

const Backlog: React.FC<BacklogProps> = ({ tasks, onAddTaskToBoard, onAddBacklogTask, onDeleteBacklogTask }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">Backlog</h2>
        <button onClick={onAddBacklogTask} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800">
            <PlusIcon />
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto flex-grow">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div 
              key={task.id} 
              draggable="true"
              onDragStart={(e) => {
                e.dataTransfer.setData('backlog-task-id', task.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className="group bg-slate-50 p-3 rounded-lg flex justify-between items-center cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <DragHandleIcon className="text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-700 truncate">{task.title}</h4>
                  <p className="text-sm text-slate-500 truncate">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pl-2">
                <button onClick={() => onAddTaskToBoard(task)} className="p-1 rounded-md text-blue-500 hover:bg-blue-100" title="Add to board">
                  <PlusIcon />
                </button>
                <button onClick={() => onDeleteBacklogTask(task.id)} className="p-1 rounded-md text-red-500 hover:bg-red-100" title="Delete">
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
            Backlog is empty.
          </div>
        )}
      </div>
    </div>
  );
};

export default Backlog;