import React, { createContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { LiveInteractionContextType, LiveInteractionStatus } from '../types';

export const LiveInteractionContext = createContext<LiveInteractionContextType | undefined>(undefined);

interface SpeechRecognition extends EventTarget {
  grammars: any; lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null; onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null; onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null; onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null; onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null; onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null; onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null; onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null; onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null; onstart: ((this: SpeechRecognition, ev: Event) => any) | null; onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void; stop(): void; abort(): void;
}
interface SpeechRecognitionStatic { new(): SpeechRecognition; }
declare var SpeechRecognition: SpeechRecognitionStatic | undefined;
declare var webkitSpeechRecognition: SpeechRecognitionStatic | undefined;
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }
type SpeechRecognitionErrorCode = | 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
interface SpeechRecognitionErrorEvent extends Event { readonly error: SpeechRecognitionErrorCode; readonly message: string; }

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const LiveInteractionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<LiveInteractionStatus>(LiveInteractionStatus.IDLE);
  const [userTranscript, setUserTranscript] = useState<string | null>(null);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  const sentenceBuffer = useRef<string>('');
  const speakingQueue = useRef<string[]>([]);
  const lastUserTranscript = useRef<string>('');
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const isAvailable = !!SpeechRecognitionAPI && typeof window.speechSynthesis !== 'undefined' && 'WebSocket' in window;

  const cleanup = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
    ws.current = null;
    if (recognition.current) {
      recognition.current.abort();
    }
    recognition.current = null;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    speakingQueue.current = [];
    sentenceBuffer.current = '';
    lastUserTranscript.current = '';
    setUserTranscript(null);
    setAiResponseText(null);
    setError(null);
    setStatus(LiveInteractionStatus.IDLE);
  }, []);
  
  const speakNextInQueue = useCallback(() => {
    if (speakingQueue.current.length > 0) {
      const textToSpeak = speakingQueue.current.shift();
      if (textToSpeak) {
        setAiResponseText(prev => (prev ? `${prev} ${textToSpeak}` : textToSpeak).trim());
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onend = () => {
          speakNextInQueue();
        };
        utterance.onerror = (e) => {
          console.error('SpeechSynthesis error:', e);
          speakNextInQueue(); // Try next sentence
        };
        window.speechSynthesis.speak(utterance);
      }
    } else {
        if (ws.current?.readyState !== WebSocket.OPEN) {
            cleanup();
        }
    }
  }, [cleanup]);
  

  const startInteraction = useCallback(() => {
    if (status !== LiveInteractionStatus.IDLE && status !== LiveInteractionStatus.ERROR) return;

    cleanup();
    setStatus(LiveInteractionStatus.CONNECTING);
    setError(null);
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use a relative path assuming the dev server will proxy it.
    // The backend is configured to listen on `/api/live-voice`
    const wsUrl = `${wsProtocol}//${window.location.host}/api/live-voice`;

    try {
        ws.current = new WebSocket(wsUrl);
    } catch (e) {
        console.error("WebSocket creation failed:", e);
        setError("Failed to create WebSocket connection.");
        setStatus(LiveInteractionStatus.ERROR);
        return;
    }

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      ws.current?.send(JSON.stringify({ type: 'start' }));

      // Setup and start Speech Recognition
      recognition.current = new SpeechRecognitionAPI();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setUserTranscript(lastUserTranscript.current + final + interim);
      };

      recognition.current.onend = () => {
        if(lastUserTranscript.current) {
            setUserTranscript(lastUserTranscript.current); // Use last final transcript if recognition stops
        }
      }
      
      recognition.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("SpeechRecognition error:", event);
          setError(`Speech recognition error: ${event.error}`);
          setStatus(LiveInteractionStatus.ERROR);
      };

      try {
        recognition.current.start();
        setStatus(LiveInteractionStatus.LISTENING);
      } catch (recError) {
        console.error("SpeechRecognition start failed:", recError);
        setError("Could not start microphone.");
        setStatus(LiveInteractionStatus.ERROR);
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if(statusRef.current !== LiveInteractionStatus.SPEAKING && message.type === 'ai_chunk') {
          setStatus(LiveInteractionStatus.SPEAKING);
      }
      
      if (message.type === 'ai_chunk') {
        sentenceBuffer.current += message.data;
        const sentences = sentenceBuffer.current.split(/(?<=[.?!])\s/);
        sentenceBuffer.current = sentences.pop() || '';
        
        for (const sentence of sentences) {
            if (sentence.trim()) speakingQueue.current.push(sentence.trim());
        }
        
        if (!window.speechSynthesis.speaking) {
            speakNextInQueue();
        }

      } else if (message.type === 'ai_done') {
        if (sentenceBuffer.current.trim()) {
            speakingQueue.current.push(sentenceBuffer.current.trim());
            sentenceBuffer.current = '';
        }
        if (!window.speechSynthesis.speaking) {
            speakNextInQueue();
        }
        // Don't close websocket from client side yet, let server or cleanup handle it.

      } else if (message.type === 'error') {
        setError(`Server error: ${message.data}`);
        setStatus(LiveInteractionStatus.ERROR);
      }
    };

    ws.current.onerror = (e) => {
      console.error('WebSocket Error:', e);
      setError('WebSocket connection error.');
      setStatus(LiveInteractionStatus.ERROR);
    };
    
    ws.current.onclose = () => {
        console.log('WebSocket Disconnected');
        // If it's not speaking and queue is empty, clean up state.
        if(!window.speechSynthesis.speaking && speakingQueue.current.length === 0) {
            cleanup();
        }
    };
  }, [status, cleanup, speakNextInQueue]);

  const stopInteraction = useCallback(() => {
    if (status !== LiveInteractionStatus.LISTENING) return;

    if (recognition.current) {
        recognition.current.stop();
    }
    
    if (userTranscript && userTranscript.trim()) {
        setStatus(LiveInteractionStatus.PROCESSING);
        ws.current?.send(JSON.stringify({ type: 'user_transcript', data: userTranscript.trim() }));
    } else {
        cleanup(); // No speech, just close everything
    }
  }, [status, userTranscript, cleanup]);
  
  useEffect(() => {
      // Global cleanup on unmount
      return () => {
          cleanup();
      };
  }, [cleanup]);

  const value: LiveInteractionContextType = {
    status,
    userTranscript,
    aiResponseText,
    error,
    isAvailable,
    startInteraction,
    stopInteraction,
  };

  return (
    <LiveInteractionContext.Provider value={value}>
      {children}
    </LiveInteractionContext.Provider>
  );
};
