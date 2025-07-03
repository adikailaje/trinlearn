
import { VoiceCommandStatus } from '../types';

// SpeechRecognition types should be available globally from 'dom' lib in tsconfig.json
// If not, ensure "lib": ["dom", "esnext"] (or similar) is in tsconfig.json compilerOptions

// Minimal type declarations to satisfy TypeScript if lib "dom" isn't fully providing them

// For SpeechRecognition constructor/instance
interface SpeechRecognition extends EventTarget {
  // Properties
  grammars: any; // Should be SpeechGrammarList, use 'any' if SpeechGrammarList is also undefined
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  
  // Event handlers
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null; // Note: onnomatch uses SpeechRecognitionEvent
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;

  // Methods
  start(): void;
  stop(): void;
  abort(): void;

  _started?: boolean; // Custom property used in the code
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}
// Provide global declaration if these are not found by TS
// These tell TS that these variables exist in the global scope.
declare var SpeechRecognition: SpeechRecognitionStatic | undefined;
declare var webkitSpeechRecognition: SpeechRecognitionStatic | undefined;

// For SpeechRecognitionEvent
// Assuming SpeechRecognitionResultList is available from "dom" lib based on error hint
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList; 
}

// For SpeechRecognitionErrorEvent
type SpeechRecognitionErrorCode =
  | 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed'
  | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}


const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: SpeechRecognition | null = null;

const commandKeywords: { [key: string]: string[] } = {
  NAVIGATE_DASHBOARD: ['open dashboard', 'go to dashboard', 'show dashboard'],
  NAVIGATE_MY_WORK: ['open my work', 'go to my work', 'show my work'],
  NAVIGATE_SCAN: ['open scan', 'go to scan', 'start scanning page'],
  NAVIGATE_CHAT: ['open chat', 'go to chat', 'show chats'],
  NAVIGATE_REPORT_ISSUE: ['report issue', 'new report', 'create report'],
  NAVIGATE_SAFETY: ['open safety', 'go to safety', 'show safety'],
  NAVIGATE_PROFILE: ['open profile', 'go to profile', 'my profile'],
  NAVIGATE_SAVED_MACHINES: ['saved machines', 'my machines', 'show saved machines'],
  NAVIGATE_FLOOR_PLAN: ['floor plan', 'show floor plan', 'open floor plan'],

  VOICE_START_SCAN: ['start scan', 'begin scan', 'analyze machine'],
  VOICE_STOP_SCAN: ['stop scan', 'end scan', 'cancel analysis'],
  VOICE_SAVE_MACHINE: ['save machine', 'save this', 'remember this machine'],
  VOICE_FIND_MANUAL: ['find manual', 'search manual', 'get manual', 'find manual for this machine'],
  VOICE_TOGGLE_MIC: ['stop listening', 'mute microphone', 'disable voice'], // This can be handled by the button as well
};

const isApiAvailable = (): boolean => !!SpeechRecognitionAPI;

const initializeRecognition = (): SpeechRecognition | null => {
  if (!isApiAvailable()) {
    console.warn('Web Speech API is not available in this browser.');
    return null;
  }
  const instance = new SpeechRecognitionAPI();
  instance.continuous = false; // Listen for a single utterance
  instance.interimResults = false;
  instance.lang = 'en-US'; // Can be made configurable
  return instance;
};

export const voiceCommandService = {
  isAvailable: isApiAvailable,

  startListening: (
    onResult: (command: string | null, transcript: string, params?: any) => void,
    onError: (errorType: string, errorMessage?: string) => void,
    onEnd: () => void
  ): (() => void) => { // Returns a stop function
    if (!isApiAvailable()) {
      onError('not-supported', 'Speech recognition is not supported by your browser.');
      onEnd();
      return () => {};
    }

    if (recognition && (recognition as any)._started) { // Crude check if already started
        console.warn("Recognition already active, stopping previous instance.");
        recognition.stop();
    }

    recognition = initializeRecognition();
    if (!recognition) {
      onError('init-failed', 'Failed to initialize speech recognition.');
      onEnd();
      return () => {};
    }
    (recognition as any)._started = true;


    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('Voice transcript:', transcript);

      for (const commandKey in commandKeywords) {
        const keywords = commandKeywords[commandKey];
        if (keywords.some(keyword => transcript.includes(keyword))) {
          // Basic parameter extraction for "find manual for X Y" - very naive
          let params = {};
          if (commandKey === 'VOICE_FIND_MANUAL_FOR') { // Example - not fully robust
            const match = transcript.match(/find manual for (.+)/);
            if (match && match[1]) {
              const parts = match[1].split(' ');
              if (parts.length >= 2) {
                params = { make: parts[0], model: parts.slice(1).join(' ') };
              } else if (parts.length === 1) {
                 params = { makeOrModel: parts[0] };
              }
            }
          }
          onResult(commandKey, transcript, params);
          return; // Process first matched command
        }
      }
      onResult(null, transcript); // No command matched, but got transcript
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      (recognition as any)._started = false;
      if (event.error === 'no-speech') {
        onError('no-speech', 'No speech was detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        onError('audio-capture', 'Microphone problem. Ensure it is enabled and not in use by another app.');
      } else if (event.error === 'not-allowed') {
        onError('not-allowed', 'Microphone access denied. Please allow microphone permission in your browser settings.');
      } else {
        onError(event.error, event.message || 'An unknown speech recognition error occurred.');
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
      (recognition as any)._started = false;
      onEnd();
    };
    
    try {
      recognition.start();
      console.log('Speech recognition started.');
    } catch (e) {
        console.error("Error starting recognition:", e);
        onError('start-failed', 'Could not start speech recognition.');
        onEnd();
    }
    

    return () => {
      if (recognition && (recognition as any)._started) {
        recognition.stop();
        (recognition as any)._started = false;
        console.log('Speech recognition explicitly stopped.');
      }
    };
  },

  stopListening: (): void => {
    if (recognition && (recognition as any)._started) {
      recognition.stop();
      (recognition as any)._started = false;
      console.log('Speech recognition stopped via service call.');
    }
  },
};
