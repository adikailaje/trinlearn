
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  iconColorClass?: string;
  description?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColorClass = 'text-red-400',
  description,
  onClick,
  isLoading = false,
}) => {
  const cardClasses = `bg-[#1A1A1A] p-4 sm:p-5 rounded-lg shadow-xl border border-[#2C2C2C] transition-all duration-150 ${onClick ? 'hover:border-red-500/70 cursor-pointer' : ''}`;

  const content = (
    <>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm sm:text-md font-semibold text-neutral-300 truncate">{title}</h3>
        {Icon && <Icon className={`w-6 h-6 ${iconColorClass}`} />}
      </div>
      {isLoading ? (
         <div className="h-10 flex items-center">
            <div className="animate-pulse bg-neutral-700 h-6 w-1/2 rounded-md"></div>
         </div>
      ) : (
        <p className="text-2xl sm:text-3xl font-bold text-neutral-100 truncate">{value}</p>
      )}
      {description && !isLoading && <p className="text-xs text-neutral-500 mt-0.5 truncate">{description}</p>}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={`${cardClasses} w-full text-left`}>
      {content}
    </button>
  ) : (
    <div className={cardClasses}>
      {content}
    </div>
  );
};
