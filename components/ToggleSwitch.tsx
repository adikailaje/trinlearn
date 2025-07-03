import React from 'react';

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  Icon?: React.ElementType;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  id, 
  label, 
  checked, 
  onChange,
  disabled = false,
  Icon 
}) => {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="flex items-center text-sm font-medium text-neutral-300 cursor-pointer">
        {Icon && <Icon className={`w-5 h-5 mr-2 ${checked ? 'text-red-400' : 'text-neutral-500'}`} />}
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A]
                    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    ${checked ? 'bg-red-500' : 'bg-neutral-700'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out
                      ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
};
