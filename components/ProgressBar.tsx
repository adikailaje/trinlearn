
import React from 'react';

interface ProgressBarProps {
  value: number; // Percentage value (0-100)
  label?: string;
  color?: string; // Tailwind color class e.g., 'bg-green-500'
  height?: string; // e.g., 'h-2.5'
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color = 'bg-red-500',
  height = 'h-2.5',
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
          <span>{label}</span>
          <span>{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-neutral-700 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
        ></div>
      </div>
    </div>
  );
};
