import React from 'react';
import { Task, QuadrantType } from '../types';
import { QUADRANT_ORDER } from '../constants';
import Quadrant from './Quadrant';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onMoveBacklogToBoard: (backlogTaskId: string, quadrant: QuadrantType) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onUpdateTask, onDeleteTask, onEditTask, onMoveBacklogToBoard }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-full">
      {QUADRANT_ORDER.map((quadrantId) => (
        <Quadrant
          key={quadrantId}
          quadrantId={quadrantId}
          tasks={tasks.filter((task) => task.quadrant === quadrantId)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onMoveBacklogToBoard={onMoveBacklogToBoard}
        />
      ))}
    </div>
  );
};

export default TaskBoard;