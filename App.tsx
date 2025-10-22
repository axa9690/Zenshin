import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, BacklogTask, QuadrantType } from './types';
import TaskBoard from './components/TaskBoard';
import Backlog from './components/Backlog';
import TaskFormModal from './components/TaskFormModal';
import { PlusIcon, GoogleDriveIcon, SpinnerIcon, CloudCheckIcon, WarningIcon } from './components/Icons';
import useGoogleDrive from './hooks/useGoogleDrive';
import { useDebounce } from './hooks/useDebounce';


const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [
        { id: '1', title: 'Finish quarterly report', description: 'Compile all data and submit by EOD.', quadrant: QuadrantType.IMPORTANT_URGENT, date: getTodayString(), completed: false },
        { id: '2', title: 'Plan summer vacation', description: 'Research destinations and book flights.', quadrant: QuadrantType.IMPORTANT_NOT_URGENT, date: getTodayString(), completed: false },
        { id: '3', title: 'Reply to non-urgent emails', description: 'Clear out the inbox from yesterday.', quadrant: QuadrantType.NOT_IMPORTANT_URGENT, date: getTodayString(), completed: false },
        { id: '4', title: 'Organize digital files', description: 'Clean up desktop and project folders.', quadrant: QuadrantType.NOT_IMPORTANT_NOT_URGENT, date: getTodayString(), completed: true },
    ];
  });
  
  const [backlogTasks, setBacklogTasks] = useState<BacklogTask[]>(() => {
    const savedBacklog = localStorage.getItem('backlogTasks');
    return savedBacklog ? JSON.parse(savedBacklog) : [
        { id: 'b1', title: 'Draft new project proposal', description: '' },
        { id: 'b2', title: 'Learn a new JavaScript framework', description: 'Look into Svelte or SolidJS.' },
    ];
  });
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | BacklogTask | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'backlog'>('add');

  const handleDriveDataLoaded = useCallback((data: { tasks: Task[], backlogTasks: BacklogTask[] }) => {
    setTasks(data.tasks);
    setBacklogTasks(data.backlogTasks);
    console.log("Data from Google Drive has been loaded into the app state.");
  }, []);

  const { connect: connectToDrive, saveData: saveDataToDrive, syncStatus, isAuthenticated, error: driveError } = useGoogleDrive(handleDriveDataLoaded);
  
  const debouncedTasks = useDebounce(tasks, 1000);
  const debouncedBacklogTasks = useDebounce(backlogTasks, 1000);

  useEffect(() => {
    // This effect handles saving data to either Google Drive or local storage.
    if (isAuthenticated) {
      // Avoid saving immediately after loading from drive to prevent loops
      if (syncStatus !== 'syncing') {
        saveDataToDrive(debouncedTasks, debouncedBacklogTasks);
      }
    } else {
      // Fallback to local storage if not connected to Drive
      localStorage.setItem('tasks', JSON.stringify(debouncedTasks));
      localStorage.setItem('backlogTasks', JSON.stringify(debouncedBacklogTasks));
    }
  }, [debouncedTasks, debouncedBacklogTasks, isAuthenticated, saveDataToDrive, syncStatus]);

  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter(task => task.date === selectedDate);
  }, [tasks, selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const handleOpenModal = (mode: 'add' | 'edit' | 'backlog', task: Task | BacklogTask | null = null) => {
    setModalMode(mode);
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed'> & { id?: string; fromBacklogId?: string }) => {
    if (taskData.id) { // Editing existing task
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
    } else { // Adding new task
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        completed: false,
      };
      setTasks(prev => [...prev, newTask]);
      if(taskData.fromBacklogId) {
        setBacklogTasks(prev => prev.filter(bt => bt.id !== taskData.fromBacklogId));
      }
    }
    handleCloseModal();
  };

  const handleSaveBacklogTask = (taskData: Omit<BacklogTask, 'id'> & { id?: string }) => {
      if(taskData.id) { // Editing backlog task
        setBacklogTasks(prev => prev.map(t => t.id === taskData.id ? {...t, ...taskData} : t));
      } else { // Adding to backlog
        setBacklogTasks(prev => [...prev, { ...taskData, id: crypto.randomUUID()}]);
      }
      handleCloseModal();
  };

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);
  
  const handleDeleteBacklogTask = useCallback((taskId: string) => {
    setBacklogTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  }, []);

  const handleMoveBacklogToBoard = useCallback((backlogTaskId: string, quadrant: QuadrantType) => {
    const taskToMove = backlogTasks.find(t => t.id === backlogTaskId);
    if (!taskToMove) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskToMove.title,
      description: taskToMove.description,
      quadrant: quadrant,
      date: selectedDate,
      completed: false,
    };

    setTasks(prev => [...prev, newTask]);
    setBacklogTasks(prev => prev.filter(t => t.id !== backlogTaskId));
  }, [backlogTasks, selectedDate]);

  const renderDriveButton = () => {
    if (!isAuthenticated) {
        const isConnecting = syncStatus === 'syncing';
        return (
            <button
                onClick={connectToDrive}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-white text-slate-700 font-semibold px-4 py-2 rounded-lg shadow-sm border border-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
                {isConnecting ? <SpinnerIcon /> : <GoogleDriveIcon className="text-[#0F9D58]"/>}
                <span className="hidden sm:inline">{isConnecting ? 'Connecting...' : 'Sync with Drive'}</span>
            </button>
        );
    }
    
    let icon;
    let text;
    let colorClass;
    let title = '';

    switch(syncStatus) {
        case 'syncing':
            icon = <SpinnerIcon />;
            text = 'Syncing...';
            colorClass = 'text-slate-600';
            break;
        case 'synced':
            icon = <CloudCheckIcon />;
            text = 'Synced';
            colorClass = 'text-green-600';
            break;
        case 'error':
            icon = <WarningIcon />;
            text = 'Sync Error';
            colorClass = 'text-red-600';
            title = driveError || 'An unknown error occurred.';
            break;
        case 'idle':
        default:
            icon = <CloudCheckIcon />;
            text = 'Connected';
            colorClass = 'text-slate-600';
            break;
    }

    return (
        <div title={title} className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 ${colorClass}`}>
            {icon}
            <span className="hidden sm:inline">{text}</span>
        </div>
    );
}

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 tracking-tight">Eisenhower Matrix</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button onClick={() => changeDate(-1)} className="px-2 py-1 rounded-md hover:bg-slate-200 text-slate-600">&lt;</button>
                <input type="date" value={selectedDate} onChange={handleDateChange} className="bg-transparent text-center text-slate-700 font-semibold focus:outline-none" />
                <button onClick={() => changeDate(1)} className="px-2 py-1 rounded-md hover:bg-slate-200 text-slate-600">&gt;</button>
            </div>
            {renderDriveButton()}
            <button
              onClick={() => handleOpenModal('add')}
              className="flex items-center gap-2 bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors"
            >
              <PlusIcon />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow lg:w-3/4">
            <TaskBoard 
              tasks={tasksForSelectedDate} 
              onUpdateTask={handleUpdateTask} 
              onDeleteTask={handleDeleteTask} 
              onEditTask={(task) => handleOpenModal('edit', task)}
              onMoveBacklogToBoard={handleMoveBacklogToBoard} 
            />
          </div>
          <div className="lg:w-1/4">
            <Backlog 
              tasks={backlogTasks} 
              onAddTaskToBoard={(task) => handleOpenModal('backlog', task)}
              onAddBacklogTask={() => handleOpenModal('add')}
              onDeleteBacklogTask={handleDeleteBacklogTask}
            />
          </div>
        </div>
      </main>
      
      {isModalOpen && (
        <TaskFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSaveTask={handleSaveTask}
          onSaveBacklogTask={handleSaveBacklogTask}
          task={editingTask}
          mode={modalMode}
          currentDate={selectedDate}
        />
      )}
    </div>
  );
};

export default App;