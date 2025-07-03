

import React, { useState, useEffect, useRef } from 'react';
import { User, Role, FloorPlanData, FloorSectionDefinition, FloorSectionCategory } from '../types';
import { ChevronLeftIcon, PencilSquareIcon, HandRaisedIcon, TrashIcon, CheckCircleIcon, PlusCircleIcon, ArrowsPointingOutIcon } from '../components/Icons';
import { floorPlanService } from '../services/floorPlanService';
import { Loader } from '../components/Loader';

interface FloorPlanEditPageProps {
  currentUser: User | null;
  onNavigateBack: () => void;
}

type EditMode = 'select' | 'draw' | 'move';

const SECTION_CATEGORIES: FloorSectionCategory[] = ['Production', 'Storage', 'QC', 'Logistics', 'Office', 'Utility', 'Restricted', 'Other'];
const COLOR_PALETTE = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#64748b', '#ec4899', '#f472b6'];


const FloorPlanEditPage: React.FC<FloorPlanEditPageProps> = ({ currentUser, onNavigateBack }) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [mode, setMode] = useState<EditMode>('select');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Omit<FloorSectionDefinition, 'id' | 'name' | 'color' | 'category'> | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      const plans = await floorPlanService.getFloorPlans();
      setFloorPlans(plans);
      if (plans.length > 0) {
        setCurrentPlanId(plans[0].id);
      }
      setIsLoading(false);
    };
    loadPlans();
  }, []);

  const getSVGPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformedPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: Math.round(transformedPt.x), y: Math.round(transformedPt.y) };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'draw' || isDrawing) return;
    const point = getSVGPoint(e.clientX, e.clientY);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentRect({ x: point.x, y: point.y, width: 0, height: 0 });
    setSelectedSectionId(null);
  };

  const handleSectionMouseDown = (e: React.MouseEvent<SVGRectElement>, section: FloorSectionDefinition) => {
    e.stopPropagation(); // Prevent canvas mousedown
    if (mode === 'select') {
      setSelectedSectionId(section.id);
    } else if (mode === 'move') {
      setSelectedSectionId(section.id);
      setIsMoving(true);
      const point = getSVGPoint(e.clientX, e.clientY);
      setDragStartPoint({
        x: point.x - section.x,
        y: point.y - section.y
      });
    }
  };


  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDrawing && currentRect) {
        const point = getSVGPoint(e.clientX, e.clientY);
        const newRect = {
        x: Math.min(startPoint.x, point.x),
        y: Math.min(startPoint.y, point.y),
        width: Math.abs(point.x - startPoint.x),
        height: Math.abs(point.y - startPoint.y),
        };
        setCurrentRect(newRect);
    } else if (isMoving && selectedSectionId) {
        const point = getSVGPoint(e.clientX, e.clientY);
        const newX = point.x - dragStartPoint.x;
        const newY = point.y - dragStartPoint.y;

        setFloorPlans(prevPlans => prevPlans.map(p => 
            p.id === currentPlanId
            ? { ...p, sections: p.sections.map(s => s.id === selectedSectionId ? { ...s, x: newX, y: newY } : s) }
            : p
        ));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect) {
      setIsDrawing(false);
      if (currentRect.width > 5 && currentRect.height > 5 && currentPlan) {
        const newSection: FloorSectionDefinition = {
          ...currentRect,
          id: `section-${Date.now()}`,
          name: `New Section ${currentPlan.sections.length + 1}`,
          color: COLOR_PALETTE[currentPlan.sections.length % COLOR_PALETTE.length],
          category: 'Other',
          details: '',
        };
        
        setFloorPlans(prevPlans => prevPlans.map(p => 
          p.id === currentPlanId ? { ...p, sections: [...p.sections, newSection] } : p
        ));
        setSelectedSectionId(newSection.id);
      }
      setCurrentRect(null);
    }
    
    if (isMoving) {
        setIsMoving(false);
    }
  };

  const updateSelectedSection = (prop: keyof FloorSectionDefinition, value: any) => {
    if (!currentPlanId) return;
    setFloorPlans(prevPlans => prevPlans.map(p => 
      p.id === currentPlanId
        ? { ...p, sections: p.sections.map(s => s.id === selectedSectionId ? { ...s, [prop]: value } : s) }
        : p
    ));
  };
  
  const handleDeleteSection = () => {
    if (!currentPlanId || !selectedSectionId || !window.confirm("Are you sure you want to delete this section?")) return;
    setFloorPlans(prevPlans => prevPlans.map(p => 
      p.id === currentPlanId ? { ...p, sections: p.sections.filter(s => s.id !== selectedSectionId) } : p
    ));
    setSelectedSectionId(null);
  };

  const handleCreateNewPlan = () => {
    const newPlanName = prompt("Enter a name for the new floor plan:", `New Plan ${floorPlans.length + 1}`);
    if (newPlanName) {
      const newPlan: FloorPlanData = {
        id: `plan-${Date.now()}`,
        name: newPlanName,
        sections: [],
        planWidth: 800,
        planHeight: 600,
        lastUpdated: new Date().toISOString(),
      };
      
      const updatedPlans = [...floorPlans, newPlan];
      setFloorPlans(updatedPlans);
      setCurrentPlanId(newPlan.id);
    }
  };

  const handleDeleteCurrentPlan = () => {
    if (!currentPlanId || floorPlans.length <= 1 || !window.confirm(`Are you sure you want to delete the "${currentPlan?.name}" floor plan? This action cannot be undone.`)) return;
    const updatedPlans = floorPlans.filter(p => p.id !== currentPlanId);
    setFloorPlans(updatedPlans);
    setCurrentPlanId(updatedPlans[0]?.id || null);
  };
  
  const handleSaveAllPlans = async () => {
    if(!floorPlans) return;
    setIsSaving(true);
    await floorPlanService.saveFloorPlans(floorPlans);
    setIsSaving(false);
    onNavigateBack();
  };

  if (!currentUser || (currentUser.role !== Role.SuperAdmin && currentUser.role !== Role.Admin)) {
    return <div className="p-6 text-center text-red-500">Access Denied.</div>;
  }
  
  if (isLoading) {
    return <div className="flex-grow flex items-center justify-center"><Loader size="lg"/></div>;
  }
  
  const currentPlan = floorPlans.find(p => p.id === currentPlanId);
  const selectedSection = currentPlan?.sections.find(s => s.id === selectedSectionId);

  const getCanvasCursor = () => {
    if (isMoving) return 'grabbing';
    switch (mode) {
      case 'draw': return 'crosshair';
      case 'move': return 'grab';
      default: return 'default';
    }
  };

  return (
    <div className="flex-grow p-4 md:p-6 bg-[#0D0D0D] text-neutral-200 pb-24 flex flex-col gap-4">
      
      {/* Top section: Sidebar + Canvas */}
      <div className="flex flex-col md:flex-row gap-4 flex-grow">
        {/* Sidebar */}
        <div className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-[#1A1A1A] p-4 rounded-lg shadow-xl border border-[#2C2C2C] flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-3 border-b border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-100">Editor</h3>
            <button onClick={onNavigateBack} className="text-xs text-neutral-400 hover:text-red-400 p-1 rounded-md hover:bg-neutral-700">Back</button>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-neutral-400 block mb-1">Editing Plan</label>
            <select value={currentPlanId || ''} onChange={e => setCurrentPlanId(e.target.value)} className="w-full bg-neutral-800 p-1.5 rounded-md border border-neutral-600 text-sm">
              {floorPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={handleCreateNewPlan} className="flex-1 text-xs p-1.5 rounded-md flex items-center justify-center bg-sky-600 hover:bg-sky-500"><PlusCircleIcon className="w-4 h-4 mr-1"/>New</button>
              <button onClick={handleDeleteCurrentPlan} disabled={!currentPlanId || floorPlans.length <= 1} className="flex-1 text-xs p-1.5 rounded-md flex items-center justify-center bg-red-800 hover:bg-red-700 disabled:bg-neutral-600 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4 mr-1"/>Delete</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setMode('select')} className={`p-2 rounded-md flex items-center justify-center text-sm transition-colors ${mode === 'select' ? 'bg-red-600 text-white' : 'bg-neutral-600 hover:bg-neutral-500'}`}><HandRaisedIcon className="w-5 h-5 mr-1.5"/> Select</button>
              <button onClick={() => setMode('draw')} className={`p-2 rounded-md flex items-center justify-center text-sm transition-colors ${mode === 'draw' ? 'bg-red-600 text-white' : 'bg-neutral-600 hover:bg-neutral-500'}`}><PencilSquareIcon className="w-5 h-5 mr-1.5"/> Draw</button>
              <button onClick={() => setMode('move')} className={`p-2 rounded-md flex items-center justify-center text-sm transition-colors ${mode === 'move' ? 'bg-red-600 text-white' : 'bg-neutral-600 hover:bg-neutral-500'}`}><ArrowsPointingOutIcon className="w-5 h-5 mr-1.5"/> Move</button>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 space-y-3">
            <div className="text-center text-neutral-500 text-sm p-4 italic">
              <p>{mode === 'select' ? "Select a section on the canvas to edit its properties below." : ""}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-neutral-700">
              <button onClick={handleSaveAllPlans} disabled={isSaving} className="w-full flex items-center justify-center p-2.5 rounded-md font-semibold text-sm bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                  {isSaving ? <Loader size="sm" className="mr-2"/> : <CheckCircleIcon className="w-5 h-5 mr-2"/>}
                  {isSaving ? 'Saving...' : 'Save & Exit'}
              </button>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-grow bg-[#1A1A1A] p-2 rounded-lg shadow-xl border border-[#2C2C2C] flex items-center justify-center overflow-auto">
          {currentPlan ? (
            <svg 
                ref={svgRef} 
                viewBox={`0 0 ${currentPlan.planWidth} ${currentPlan.planHeight}`} 
                className={`max-w-full max-h-full bg-[#252525]`}
                style={{ cursor: getCanvasCursor() }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#333333" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {currentPlan.sections.map(section => (
                    <rect 
                        key={section.id} 
                        {...section} 
                        fill={section.color} 
                        stroke={selectedSectionId === section.id ? '#f59e0b' : '#1A1A1A'} 
                        strokeWidth="2" 
                        onMouseDown={(e) => handleSectionMouseDown(e, section)} 
                        className={`${mode === 'select' || mode === 'move' ? 'cursor-pointer' : ''} ${mode === 'move' ? 'hover:stroke-cyan-400' : ''}`}
                    />
                ))}
                
                {currentRect && <rect {...currentRect} fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeDasharray="3 3" />}
            </svg>
          ) : (
            <div className="text-center text-neutral-500 text-lg p-6">
              <p>No floor plan selected.</p>
              <p className="text-sm mt-2">Create a new plan to begin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedSection && (
        <div className="flex-shrink-0 bg-[#1A1A1A] p-4 rounded-lg shadow-xl border border-[#2C2C2C]">
            <h4 className="text-md font-semibold text-sky-300 truncate mb-4">Editing Section: {selectedSection.name}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-1">
                    <label className="text-xs text-neutral-400 block mb-1">Section Name</label>
                    <input type="text" value={selectedSection.name} onChange={e => updateSelectedSection('name', e.target.value)} className="w-full bg-neutral-800 p-1.5 rounded-md border border-neutral-600 text-sm"/>
                </div>
                <div className="lg:col-span-1">
                    <label className="text-xs text-neutral-400 block mb-1">Category</label>
                    <select value={selectedSection.category} onChange={e => updateSelectedSection('category', e.target.value)} className="w-full bg-neutral-800 p-1.5 rounded-md border border-neutral-600 text-sm">
                        {SECTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div className="lg:col-span-2">
                    <label className="text-xs text-neutral-400 block mb-1">Details / Notes</label>
                    <textarea value={selectedSection.details || ''} onChange={e => updateSelectedSection('details', e.target.value)} rows={1} className="w-full bg-neutral-800 p-1.5 rounded-md border border-neutral-600 text-sm"></textarea>
                </div>
                <div className="lg:col-span-3">
                    <label className="text-xs text-neutral-400 block mb-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                       {COLOR_PALETTE.map(color => (
                           <button key={color} onClick={() => updateSelectedSection('color', color)} style={{ backgroundColor: color }} className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${selectedSection.color === color ? 'ring-2 ring-offset-2 ring-offset-neutral-800 ring-white' : ''}`}></button>
                       ))}
                    </div>
                </div>
                <div className="lg:col-span-1 self-end">
                    <button onClick={handleDeleteSection} className="w-full p-2 rounded-md flex items-center justify-center text-sm bg-red-800 hover:bg-red-700 text-white"><TrashIcon className="w-4 h-4 mr-1.5"/> Delete Section</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanEditPage;
