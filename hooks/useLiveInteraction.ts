import { useContext } from 'react';
import { LiveInteractionContext } from '../contexts/LiveInteractionContext';
import { LiveInteractionContextType } from '../types';

export const useLiveInteraction = (): LiveInteractionContextType => {
  const context = useContext(LiveInteractionContext);
  if (context === undefined) {
    throw new Error('useLiveInteraction must be used within a LiveInteractionProvider');
  }
  return context;
};
