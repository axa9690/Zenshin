
import React, { useState, useEffect } from 'react';
import { Task, BacklogTask, QuadrantType } from '../types';
import { QUADRANT_CONFIG, QUADRANT_ORDER } from '../constants';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (taskData: Omit<Task, 'id' | 'completed'> & { id?: string; fromBacklogId?: string }) => void;
  onSaveBacklogTask: (taskData: Omit<BacklogTask, 'id'> & { id?: string }) => void;
  task: Task | BacklogTask | null;
  mode: 'add' | 'edit' | 'backlog';
  currentDate: string;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSaveTask, onSaveBacklogTask, task, mode, currentDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quadrant, setQuadrant] = useState<QuadrantType>(QuadrantType.IMPORTANT_URGENT);
  const [date, setDate] = useState(currentDate);
  const [addToBoard, setAddToBoard] = useState(mode !== 'add');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      if ('quadrant' in task) {
        setQuadrant(task.quadrant);
        setDate(task.date);
        setAddToBoard(true);
      } else {
        setDate(currentDate);
        setAddToBoard(true); // backlog task is always added to board
      }
    } else {
      setTitle('');
      setDescription('');
      setQuadrant(QuadrantType.IMPORTANT_URGENT);
      setDate(currentDate);
      setAddToBoard(mode !== 'add');
    }
  }, [task, currentDate, mode]);
  
  if (!isOpen) return null;
  
  const getTitle = () => {
      if (mode === 'edit') return 'Edit Task';
      if (mode === 'backlog') return 'Add Task to Board';
      return 'Add New Task';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (addToBoard || mode === 'edit') {
      onSaveTask({
        id: (task && 'quadrant' in task) ? task.id : undefined,
        fromBacklogId: (task && !('quadrant' in task)) ? task.id : undefined,
        title,
        description,
        quadrant,
        date,
      });
    } else { // adding a new task to backlog
       onSaveBacklogTask({
          id: task?.id,
          title,
          description,
       });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-4">{getTitle()}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {mode === 'add' && (
              <div className="flex items-center mb-4">
                  <input id="addToBoard" type="checkbox" checked={addToBoard} onChange={(e) => setAddToBoard(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                  <label htmlFor="addToBoard" className="ml-2 block text-sm text-gray-900">Add to board</label>
              </div>
          )}

          {(addToBoard || mode === 'edit') && (
            <>
              <div className="mb-4">
                <label htmlFor="quadrant" className="block text-sm font-medium text-slate-700">Quadrant</label>
                <select
                  id="quadrant"
                  value={quadrant}
                  onChange={(e) => setQuadrant(e.target.value as QuadrantType)}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {QUADRANT_ORDER.map(qId => (
                    <option key={qId} value={qId}>{QUADRANT_CONFIG[qId].title}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
