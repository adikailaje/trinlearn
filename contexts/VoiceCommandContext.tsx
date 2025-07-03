import React, { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { VoiceCommandStatus, VoiceCommandContextType, ActiveVoiceCommand } from '../types';
import { voiceCommandService } from '../services/voiceCommandService';

export const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

interface VoiceCommandProviderProps {
  children: ReactNode;
}

export const VoiceCommandProvider: React.FC<VoiceCommandProviderProps> = ({ children }) => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceCommandStatus>(VoiceCommandStatus.Idle);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCommand, setActiveCommand] = useState<ActiveVoiceCommand | null>(null);
  const isRecognitionAvailable = voiceCommandService.isAvailable();
  const stopCurrentListeningRef = useRef<(() => void) | null>(null);
  
  const navigationActions = useRef<Record<string, (params?: any) => void>>({});
  const scanActions = useRef<Record<string, (params?: any) => void>>({});

  const registerNavigationAction = useCallback((command: string, action: (params?: any) => void) => {
    navigationActions.current[command] = action;
  }, []);

  const registerScanAction = useCallback((command: string, action: (params?: any) => void) => {
    scanActions.current[command] = action;
  }, []);

  const executeCommand = useCallback((command: string, params?: any) => {
    console.log(`Context: Attempting to execute command: ${command} with params:`, params);
    if (navigationActions.current[command]) {
      navigationActions.current[command](params);
      setActiveCommand({ command, params, fullTranscript: transcript || command });
      setVoiceStatus(VoiceCommandStatus.Success);
      setTimeout(() => {
        if (voiceStatus === VoiceCommandStatus.Success) setVoiceStatus(VoiceCommandStatus.Idle);
        setActiveCommand(null);
      }, 1500); // Reset after a short delay
    } else if (scanActions.current[command]) {
      scanActions.current[command](params);
      setActiveCommand({ command, params, fullTranscript: transcript || command });
      setVoiceStatus(VoiceCommandStatus.Success);
       setTimeout(() => {
        if (voiceStatus === VoiceCommandStatus.Success) setVoiceStatus(VoiceCommandStatus.Idle);
        setActiveCommand(null);
      }, 1500);
    } else {
      console.warn(`No action registered for command: ${command}`);
      setError(`Command "${command.replace('VOICE_', '').replace(/_/g, ' ').toLowerCase()}" understood, but no action is configured.`);
      setVoiceStatus(VoiceCommandStatus.Error);
    }
  }, [transcript, voiceStatus]);


  const handleRecognitionResult = useCallback((command: string | null, fullTranscript: string, params?: any) => {
    setTranscript(fullTranscript);
    if (command) {
      console.log(`Context: Command recognized by service: ${command}, params:`, params);
      executeCommand(command, params);
    } else {
      setError(`Could not understand: "${fullTranscript}". Try again.`);
      setVoiceStatus(VoiceCommandStatus.Error);
    }
  }, [executeCommand]);

  const handleRecognitionError = useCallback((errorType: string, errorMessage?: string) => {
    setError(errorMessage || `Speech recognition error: ${errorType}`);
    setVoiceStatus(VoiceCommandStatus.Error);
  }, []);

  const handleRecognitionEnd = useCallback(() => {
    // Only transition to Idle if not actively processing or in success/error display state
    if (voiceStatus === VoiceCommandStatus.Listening) {
      setVoiceStatus(VoiceCommandStatus.Idle);
    }
  }, [voiceStatus]);

  const startListening = useCallback(() => {
    if (voiceStatus === VoiceCommandStatus.Listening || !isRecognitionAvailable) return;
    
    if (stopCurrentListeningRef.current) {
        stopCurrentListeningRef.current(); // Stop any previous instance
    }

    setVoiceStatus(VoiceCommandStatus.Listening);
    setError(null);
    setTranscript(null);
    setActiveCommand(null);
    
    stopCurrentListeningRef.current = voiceCommandService.startListening(
      handleRecognitionResult,
      handleRecognitionError,
      handleRecognitionEnd
    );
  }, [isRecognitionAvailable, handleRecognitionResult, handleRecognitionError, handleRecognitionEnd, voiceStatus]);

  const stopListening = useCallback(() => {
    if (stopCurrentListeningRef.current) {
        stopCurrentListeningRef.current();
        stopCurrentListeningRef.current = null;
    }
    if (voiceStatus === VoiceCommandStatus.Listening || voiceStatus === VoiceCommandStatus.Processing) {
      setVoiceStatus(VoiceCommandStatus.Idle);
    }
  }, [voiceStatus]);

  // Clear error/success messages after a delay
  useEffect(() => {
    let timer: number; // Changed from NodeJS.Timeout to number
    if (voiceStatus === VoiceCommandStatus.Error || voiceStatus === VoiceCommandStatus.Success) {
      timer = window.setTimeout(() => { // Use window.setTimeout for clarity in browser context
        setVoiceStatus(VoiceCommandStatus.Idle);
        setError(null);
        // Active command is cleared by executeCommand or if listening restarts
      }, 3000);
    }
    return () => window.clearTimeout(timer); // Use window.clearTimeout
  }, [voiceStatus]);


  const contextValue: VoiceCommandContextType = {
    voiceStatus,
    transcript,
    error,
    activeCommand,
    startListening,
    stopListening,
    isRecognitionAvailable,
    registerNavigationAction,
    registerScanAction,
    executeCommand,
  };

  return (
    <VoiceCommandContext.Provider value={contextValue}>
      {children}
    </VoiceCommandContext.Provider>
  );
};