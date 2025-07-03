

import React from 'react';
import { AuthView } from '../types'; // Import AuthView from types.ts
import { 
  HomeIconFilled, 
  DocumentListIconFilled, 
  CameraIconFilled, 
  ChatBubbleFilledIcon, 
  ChartBarIconFilled, 
  ShieldIconFilled,
  MapIcon // Added MapIcon for Floor Plan
} from './Icons';

interface BottomNavItem {
  label: string;
  view: AuthView;
  icon: React.ElementType;
}

interface BottomNavBarProps {
  currentView: AuthView;
  onNavigate: (view: AuthView) => void;
}

const navItems: BottomNavItem[] = [
  { label: 'Dashboard', view: AuthView.Dashboard, icon: HomeIconFilled },
  { label: 'My Work', view: AuthView.MyWork, icon: DocumentListIconFilled },
  { label: 'Scan', view: AuthView.Scan, icon: CameraIconFilled },
  { label: 'Safety', view: AuthView.Safety, icon: ShieldIconFilled },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, onNavigate }) => {
  const mainAppViews = [
    AuthView.Dashboard, AuthView.MyWork, AuthView.Scan, 
    AuthView.ReportIssue, AuthView.Safety, AuthView.ChatList, AuthView.FloorPlanView
  ];
  if (!mainAppViews.includes(currentView)) {
    // Safety page is not in mainAppViews by default, let's ensure it's included or handle it
    // For now, if it's Safety, we still show the bar. This depends on desired UX.
    // If FloorPlanEdit is active, nav bar should probably be hidden.
    if (currentView !== AuthView.Safety && currentView !== AuthView.FloorPlanEdit) { // Hide for FloorPlanEdit
         return null;
    }
  }
  
  const itemsToDisplay = navItems.filter(item => {
    if (item.view === AuthView.Safety && !mainAppViews.includes(AuthView.Safety)) return false; // Optional: if Safety is conditional
    return true;
  });

  const gridColsClass = `grid-cols-${itemsToDisplay.length}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#2C2C2C] shadow-t-xl z-50">
      <div className={`max-w-screen-xl mx-auto px-1 grid ${gridColsClass}`}>
        {itemsToDisplay.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className={`flex flex-col items-center justify-center p-3 font-medium focus:outline-none transition-colors duration-150 ease-in-out
                ${isActive ? 'text-red-500 border-t-2 border-red-500 -mt-px' : 'text-neutral-400 hover:text-red-400'}`}
              aria-current={isActive ? 'page' : undefined}
              title={item.label} 
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'text-red-500' : 'text-neutral-500 group-hover:text-red-400'}`} />
              {/* Text label can be added back if desired for small screens, or via media query */}
              {/* <span className={`text-xs mt-0.5 ${isActive ? 'text-red-500' : 'text-neutral-500 group-hover:text-red-400'}`}>{item.label}</span> */}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;