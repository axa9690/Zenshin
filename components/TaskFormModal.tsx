
import React, { useState, useEffect, useMemo } from 'react';
import { Task, BacklogTask, QuadrantType, AIStatus } from '../types';
import { QUADRANT_CONFIG, QUADRANT_ORDER } from '../constants';
import { useAICategorization } from '../hooks/useAICategorization';
import { useDebounce } from '../hooks/useDebounce';
import { SpinnerIcon, CheckIcon, WarningIcon } from './Icons';

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
  const [showManualOverride, setShowManualOverride] = useState(false);

  // AI Categorization
  const {
    result: aiResult,
    status: aiStatus,
    isLoading: isAILoading,
    error: aiError,
    fromCache: aiFromCache,
    retry,
    isAvailable: aiAvailable
  } = useAICategorization();

  // Debounce inputs for AI analysis
  const debouncedTitle = useDebounce(title, 500);
  const debouncedDescription = useDebounce(description, 500);

  // Auto-trigger AI categorization when inputs change and conditions are met
  useEffect(() => {
    if (
      aiAvailable &&
      !showManualOverride &&
      (addToBoard || mode === 'edit') &&
      debouncedTitle.trim().length >= 3 &&
      mode !== 'backlog'
    ) {
      // Don't analyze if we're editing an existing task with the same content
      if (task && 'quadrant' in task) {
        const contentUnchanged = task.title === debouncedTitle.trim() &&
                               task.description === debouncedDescription.trim();
        if (contentUnchanged) {
          return;
        }
      }

      categorizeWithAI(debouncedTitle.trim(), debouncedDescription.trim());
    }
  }, [debouncedTitle, debouncedDescription, aiAvailable, showManualOverride, addToBoard, mode]);

  // Categorize task with AI
  const categorizeWithAI = async (titleText: string, descriptionText: string) => {
    try {
      await retry();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Auto-select quadrant when AI provides a result
  useEffect(() => {
    if (aiResult && !showManualOverride && aiStatus === AIStatus.SUCCESS) {
      setQuadrant(aiResult.quadrant);
    }
  }, [aiResult, showManualOverride, aiStatus]);

  // Determine if AI should be shown
  const shouldShowAI = useMemo(() => {
    return aiAvailable && (addToBoard || mode === 'edit') && mode !== 'backlog';
  }, [aiAvailable, addToBoard, mode]);

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-700">{getTitle()}</h2>
          {shouldShowAI && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              AI-Powered
            </span>
          )}
        </div>
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

          {/* AI Analysis Section */}
          {shouldShowAI && title.trim().length >= 3 && (
            <div className="mb-4">
              {isAILoading && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <SpinnerIcon />
                  <span className="text-sm text-blue-700">
                    AI analyzing task importance{aiFromCache ? ' (from cache)' : ''}...
                  </span>
                </div>
              )}

              {aiResult && !showManualOverride && (
                <div className={`p-3 border rounded-md ${
                  aiStatus === AIStatus.UNCERTAIN
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <CheckIcon className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        Assigned to: {QUADRANT_CONFIG[aiResult.quadrant].title}
                        {aiFromCache && (
                          <span className="ml-1 text-xs text-slate-500">(cached)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        AI reasoning: {aiResult.reasoning}
                      </p>
                      {aiStatus === AIStatus.UNCERTAIN && (
                        <p className="text-xs text-yellow-700 mt-1">
                          AI is uncertain - you may want to verify this categorization
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualOverride(true)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Choose manually instead
                  </button>
                </div>
              )}

              {aiError && !showManualOverride && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <WarningIcon className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700">AI categorization failed</p>
                      <p className="text-xs text-red-600 mt-1">{aiError}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => categorizeWithAI(title.trim(), description.trim())}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                    <span className="text-xs text-slate-400">or</span>
                    <button
                      type="button"
                      onClick={() => setShowManualOverride(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Choose manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'add' && (
              <div className="flex items-center mb-4">
                  <input id="addToBoard" type="checkbox" checked={addToBoard} onChange={(e) => setAddToBoard(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                  <label htmlFor="addToBoard" className="ml-2 block text-sm text-gray-900">Add to board</label>
              </div>
          )}

          {(addToBoard || mode === 'edit') && (
            <>
              {(showManualOverride || !shouldShowAI || title.trim().length < 3) && (
                <div className="mb-4">
                  <label htmlFor="quadrant" className="block text-sm font-medium text-slate-700">
                    Quadrant {shouldShowAI && title.trim().length >= 3 && '(Manual Selection)'}
                  </label>
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
              )}

              {aiResult && !showManualOverride && shouldShowAI && title.trim().length >= 3 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selected Quadrant (AI Recommendation)
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        aiResult.quadrant === QuadrantType.IMPORTANT_URGENT ? 'bg-red-500' :
                        aiResult.quadrant === QuadrantType.IMPORTANT_NOT_URGENT ? 'bg-blue-500' :
                        aiResult.quadrant === QuadrantType.NOT_IMPORTANT_URGENT ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium text-slate-700">
                        {QUADRANT_CONFIG[aiResult.quadrant].title}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
