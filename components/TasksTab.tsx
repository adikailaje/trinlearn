
import React from 'react';
import { Task } from '../types';
import { CheckCircleIcon } from './Icons'; 

interface TasksTabProps {
  tasks: Task[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
  disabled?: boolean; 
}

const TasksTab: React.FC<TasksTabProps> = ({ tasks, onTaskToggle, disabled }) => {
  if (!tasks || tasks.length === 0) {
    return <p className="text-neutral-500 italic">No specific tasks listed for this work item.</p>;
  }

  const completedTasksCount = tasks.filter(task => task.completed).length;
  const totalTasksCount = tasks.length;
  const progressPercentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <div className="flex justify-between items-center text-sm text-neutral-400 mb-1">
          <span>Progress</span>
          <span>{completedTasksCount} / {totalTasksCount} Tasks Completed</span>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2.5">
          <div 
            className="bg-red-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Task completion progress"
          ></div>
        </div>
      </div>

      {tasks.map((task, index) => (
        <div 
          key={task.id} 
          className={`flex items-start p-3 rounded-md transition-colors duration-150
                      ${task.completed ? 'bg-green-700/20 border border-green-600/50' : 'bg-[#252525] border border-[#383838]'}`}
        >
          <input
            type="checkbox"
            id={`task-${task.id}`}
            checked={task.completed}
            onChange={(e) => !disabled && onTaskToggle(task.id, e.target.checked)}
            disabled={disabled}
            className="mt-1 h-5 w-5 rounded border-neutral-500 bg-neutral-600 text-red-500 focus:ring-red-400 focus:ring-offset-0 focus:ring-offset-[#252525] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          />
          <label 
            htmlFor={`task-${task.id}`} 
            className={`ml-3 block text-sm flex-grow min-w-0 ${task.completed ? 'text-green-300 line-through' : 'text-neutral-200'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="font-medium mr-2 text-neutral-500">{(index + 1)}.</span>
            <span className="break-words">{task.description}</span>
          </label>
          {task.completed && <CheckCircleIcon className="w-5 h-5 text-green-400 ml-2 flex-shrink-0" title="Task Completed"/>}
        </div>
      ))}
      {/* DEMO_MARKER: This component uses demo data from myWorkService.ts via WorkOrderDetailPage. */}
    </div>
  );
};

export default TasksTab;
