
import { useContext } from 'react';
import { VoiceCommandContext } from '../contexts/VoiceCommandContext'; // Corrected import
import { VoiceCommandContextType } from '../types'; // Corrected import

export const useVoiceCommands = (): VoiceCommandContextType => {
  const context = useContext(VoiceCommandContext);
  if (context === undefined) {
    throw new Error('useVoiceCommands must be used within a VoiceCommandProvider');
  }
  return context;
};
