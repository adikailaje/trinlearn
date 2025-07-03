import React from 'react';
import ReactDOM from 'react-dom/client';
import MainWrapper from './MainWrapper';
import { AuthProvider } from './contexts/AuthContext';
import { VoiceCommandProvider } from './contexts/VoiceCommandContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LiveInteractionProvider } from './contexts/LiveInteractionContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <VoiceCommandProvider>
          <LiveInteractionProvider>
            <MainWrapper />
          </LiveInteractionProvider>
        </VoiceCommandProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);