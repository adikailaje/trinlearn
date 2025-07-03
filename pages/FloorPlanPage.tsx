import React, { useState, useEffect } from 'react';
import { User, Role, FloorPlanData } from '../types';
import { PencilSquareIcon, LayersIcon, ExclamationTriangleIcon, ChevronDownIcon } from '../components/Icons'; 
import { floorPlanService } from '../services/floorPlanService';
import { Loader } from '../components/Loader';

interface FloorPlanPageProps {
  currentUser: User | null;
  onNavigateToEdit: () => void;
}

const FloorPlanPage: React.FC<FloorPlanPageProps> = ({ currentUser, onNavigateToEdit }) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const plans = await floorPlanService.getFloorPlans();
        setFloorPlans(plans);
        if (plans.length > 0) {
          setCurrentPlanId(plans[0].id);
        }
      } catch (e: any) {
        console.error("Failed to load floor plans:", e);
        setError("Could not load floor plans.");
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  const currentPlan = floorPlans.find(p => p.id === currentPlanId);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 bg-[#0D0D0D]">
        <Loader size="lg" />
        <p className="ml-4 text-neutral-400">Loading Floor Plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-red-400 bg-[#0D0D0D]">
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <p className="text-xl">Error Loading Floor Plans</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 md:p-6 space-y-6 bg-[#0D0D0D] text-neutral-200 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-auto sm:flex-grow">
          <label htmlFor="planSelect" className="text-xs text-neutral-400 mb-1 block">Selected Floor Plan</label>
          <select
            id="planSelect"
            value={currentPlanId || ''}
            onChange={(e) => setCurrentPlanId(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 text-sm rounded-md bg-[#222222] border border-[#333333] text-neutral-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none"
          >
            {floorPlans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
          <ChevronDownIcon className="w-5 h-5 text-neutral-400 absolute right-3 bottom-3 pointer-events-none"/>
        </div>
        {currentUser && (currentUser.role === Role.SuperAdmin || currentUser.role === Role.Admin) && (
          <div className="self-end">
            <button
                onClick={onNavigateToEdit}
                className="flex items-center px-4 py-2.5 rounded-md font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="Edit Floor Plan"
            >
                <PencilSquareIcon className="w-5 h-5 mr-1.5" /> Edit Plans
            </button>
          </div>
        )}
      </div>
      
      <div 
        className="bg-[#141414] p-1 sm:p-2 rounded-lg shadow-xl border border-[#2C2C2C] min-h-[65vh] flex items-center justify-center overflow-auto"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        <div className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center">
          {currentPlan ? (
            <svg 
              viewBox={`0 0 ${currentPlan.planWidth} ${currentPlan.planHeight}`} 
              className="max-w-full max-h-[60vh] sm:max-h-[65vh] transition-transform duration-300 ease-in-out"
            >
              {currentPlan.sections.map(section => (
                <g 
                  key={section.id}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={section.x}
                    y={section.y}
                    width={section.width}
                    height={section.height}
                    fill={section.color}
                    className="opacity-70 transition-all duration-200 ease-in-out hover:opacity-100"
                    stroke="#1A1A1A"
                    strokeWidth="1"
                    style={{ filter: hoveredSection === section.id ? 'brightness(1.2)' : 'brightness(1)' }}
                  />
                  <text
                    x={section.x + section.width / 2}
                    y={section.y + section.height / 2}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="10"
                    fill="#FFFFFF"
                    className="pointer-events-none font-semibold"
                    style={{ opacity: hoveredSection === section.id ? 0.8 : 0.5, transition: 'opacity 0.2s' }}
                  >
                    {section.name}
                  </text>

                  {hoveredSection === section.id && (
                      <foreignObject 
                          x={section.x + section.width / 2 - 110}
                          y={section.y + section.height / 2 - 70}
                          width="220" 
                          height="140"
                          style={{ overflow: 'visible' }}
                      >
                          <div 
                              className="bg-[#0D0D0D] text-white p-4 rounded-lg shadow-2xl border border-red-500/50 text-sm leading-tight animate-fadeIn"
                              style={{ zIndex: 100 }}
                          >
                              <p className="font-bold text-red-400 mb-1 text-base">{section.name}</p>
                              <p className="text-sm text-neutral-400 mb-2">Category: {section.category}</p>
                              <p className="text-sm text-neutral-300">{section.details || 'No additional details.'}</p>
                          </div>
                      </foreignObject>
                  )}
                </g>
              ))}
            </svg>
          ) : (
            <p className="text-neutral-600 text-lg italic">No floor plan selected or available.</p>
          )}

          {currentPlan && currentPlan.sections.length === 0 && (
            <p className="absolute text-neutral-600 text-lg italic">No sections defined for this floor plan yet.</p>
          )}
        </div>
      </div>
       <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FloorPlanPage;