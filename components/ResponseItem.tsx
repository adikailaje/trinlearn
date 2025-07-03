
import React, { useState } from 'react';
import { GeminiResponse } from '../types';
import { SparklesIcon, ExclamationCircleIcon, BookmarkIcon, ChevronRightIcon } from './Icons'; 
import { Loader } from './Loader';

interface ResponseItemProps {
  response: GeminiResponse;
  onSaveMachine?: (response: GeminiResponse) => Promise<void>; // Changed to pass full response
  onClick?: (response: GeminiResponse) => void;
}

export const ResponseItem: React.FC<ResponseItemProps> = ({ response, onSaveMachine, onClick }) => {
  const formattedTimestamp = new Date(response.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Auto-save is possible if it's an identified machine, user is logged in, and onSaveMachine prop is provided.
  const canAutoSave = response.make && response.modelName && !response.isError && onSaveMachine;
  const isIdentifiedMachine = response.make && response.modelName && !response.isError;
  const isClickable = isIdentifiedMachine && onClick;

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!canAutoSave) return;
    setIsSaving(true);
    setJustSaved(false);
    try {
      await onSaveMachine(response); // Pass the full response object
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000); 
    } catch (error) {
      console.error("Failed to auto-save machine:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleItemClick = () => {
    if (isClickable) {
      onClick(response);
    }
  };

  const mainClassNames = `p-4 rounded-lg shadow-lg flex flex-col sm:flex-row gap-4 transition-all duration-150 ease-in-out 
    ${response.isError ? 
      'bg-red-800/30 border border-red-700/60 hover:border-red-600' : 
      'bg-[#202020] border border-[#333333] hover:border-[#444444]'}
    ${isClickable ? 'cursor-pointer hover:shadow-xl hover:ring-1 hover:ring-red-500/50' : ''}`;

  const content = (
    <>
      <div className="flex-shrink-0 text-center sm:text-left">
        <img 
          src={response.frameDataUrl} 
          alt="Captured frame" 
          className="w-28 h-28 object-cover rounded-md border border-[#404040] shadow-sm mx-auto sm:mx-0"
        />
        <p className="text-xs text-neutral-500 mt-1.5">{formattedTimestamp}</p>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center">
            {response.isError ? 
              <ExclamationCircleIcon className="w-5 h-5 mr-2 text-red-400 flex-shrink-0" /> :
              <SparklesIcon className="w-5 h-5 mr-2 text-red-400 flex-shrink-0" /> 
            }
            <p className={`text-sm font-bold truncate ${response.isError ? 'text-red-300' : 'text-neutral-100'}`}>
              {response.isError ? 'Analysis Error' : (isIdentifiedMachine ? 'Machine Identified' : 'Viewfield Result')}
            </p>
          </div>
          {isClickable && (
            <ChevronRightIcon className="w-5 h-5 text-neutral-500 group-hover:text-red-400 transition-colors" />
          )}
        </div>
        <p className={`text-sm ${response.isError ? 'text-red-200' : 'text-neutral-200'} whitespace-pre-wrap break-words`}>
          {response.description}
        </p>
        
        {typeof response.confidence === 'number' && !response.isError && (
          <div className="mt-2.5 space-y-0.5">
            <p className="text-xs text-neutral-400">
              <span className="font-semibold text-neutral-500">Certainty:</span> {response.confidence}%
            </p>
          </div>
        )}

        {canAutoSave && (
          <div className="mt-3">
            <button
              onClick={handleSaveClick}
              disabled={isSaving || justSaved}
              className={`flex items-center justify-center px-3 py-1.5 rounded-md font-semibold text-xs transition-colors duration-150 ease-in-out
                ${justSaved ? 'bg-green-600 text-white cursor-default' : 
                (isSaving ? 'bg-neutral-500 text-neutral-300 cursor-wait' : 
                'bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75')}
              `}
              title="Save this machine (if Auto-Save is on)"
            >
              {isSaving ? <Loader size="sm" className="mr-1.5 w-3 h-3" /> : <BookmarkIcon className="w-4 h-4 mr-1.5" />}
              {isSaving ? 'Saving...' : (justSaved ? 'Saved!' : 'Auto-Save This')}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return isClickable ? (
    <button type="button" onClick={handleItemClick} className={`${mainClassNames} w-full text-left group`}>
      {content}
    </button>
  ) : (
    <div className={`${mainClassNames} group`}>
      {content}
    </div>
  );
};
