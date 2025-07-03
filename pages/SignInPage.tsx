import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Logo } from '../components/Logo';
import { useTranslation } from '../hooks/useTranslation';

interface SignInPageProps {
  onSwitchToSignUp: () => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ onSwitchToSignUp }) => {
  const { login, error: authError, clearError, isLoading } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    if (!username || !password) {
      setFormError(t('signIn.error_required'));
      return;
    }
    try {
      await login(username, password);
      // Navigation will be handled by MainWrapper due to isAuthenticated changing
      
      // Request location permission if not already granted
      if (navigator.geolocation) {
        navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
          if (permissionStatus.state === 'granted') {
            console.info('Location permission already granted.');
          } else {
            console.info('Attempting to request location permission...');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.info('Location permission granted after request:', position);
                // Optionally, you could store a flag or use the position if needed immediately
              },
              (error) => {
                console.warn('Error or denial requesting location permission:', error.message);
                // Handle denial or error (e.g., show a non-intrusive message, but for now just log)
              },
              {
                enableHighAccuracy: false, 
                timeout: 10000,           // Increased timeout to give user time to respond
                maximumAge: Infinity       
              }
            );
          }
          // Handle changes in permission status if needed (e.g., user changes it in browser settings)
          permissionStatus.onchange = () => {
            console.log(`Geolocation permission state changed to: ${permissionStatus.state}`);
          };
        }).catch(queryError => {
            console.warn('Could not query geolocation permission status:', queryError.message);
        });
      } else {
        console.warn('Geolocation is not supported by this browser.');
      }

    } catch (err: any) {
       // Use a more specific key if available, otherwise a generic one
       if (err.message?.includes("Invalid")) {
         setFormError(t('signIn.error_invalid'));
       } else {
         setFormError(err.message || t('signIn.error_failed'));
       }
    }
  };
  
  // Use authError if it's present (from context, possibly from other auth actions)
  // otherwise use local formError.
  const displayError = authError || formError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] p-4">
      <div className="w-full max-w-md">
        <Logo className="mx-auto h-16 w-auto mb-8" />
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight text-neutral-100">
          {t('signIn.title')}
        </h2>
        <AuthForm
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
          submitText={t('signIn.submit')}
          error={displayError}
          isLoading={isLoading}
          showPasswordToggle={true}
        />
        <p className="mt-6 text-center text-sm text-neutral-400">
          {t('signIn.notAMember')}{' '}
          <button
            onClick={onSwitchToSignUp}
            className="font-medium text-red-500 hover:text-red-400 focus:outline-none focus:underline"
          >
            {t('signIn.signUpLink')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;