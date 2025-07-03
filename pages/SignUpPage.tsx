import React, { useState, FormEvent, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Logo } from '../components/Logo';
import { authService } from '../services/authService';
import { useTranslation } from '../hooks/useTranslation';

interface SignUpPageProps {
  onSwitchToSignIn: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToSignIn }) => {
  const { signup, error: authContextError, clearError: clearAuthContextError, isLoading } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameError) { // Clear username error when user types
        setUsernameError(null);
    }
     if (formError) { // Clear general form error if it was related to username
        setFormError(null);
    }
    clearAuthContextError();
  }

  const validateUsername = useCallback(async (currentUsername: string) => {
    if (!currentUsername || currentUsername.trim().length < 3) {
      setUsernameError(t('signUp.error_username_length'));
      return false;
    }
    setIsCheckingUsername(true);
    setUsernameError(null); // Clear previous username error
    try {
      const result = await authService.checkUsernameExists(currentUsername);
      if (result.exists) {
        setUsernameError(result.message || t('signUp.error_username_unavailable'));
        return false;
      }
      setUsernameError(null); // Explicitly clear if available
      return true;
    } catch (e: any) {
      setUsernameError(e.message || t('signUp.error_failed'));
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  }, [t]);

  const handleUsernameBlur = async () => {
    if (username.trim()) {
      await validateUsername(username.trim());
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthContextError(); // Clear context error from previous attempts
    setUsernameError(null); // Clear username specific error

    if (!username.trim() || !password) {
      setFormError(t('signIn.error_required'));
      return;
    }
    if (username.trim().length < 3) {
        setUsernameError(t('signUp.error_username_length'));
        return;
    }
    if (password.length < 6) {
        setFormError(t('signUp.error_password_length'));
        return;
    }

    // Re-validate username on submit, in case blur was skipped or condition changed
    const isUsernameValid = await validateUsername(username.trim());
    if (!isUsernameValid) {
      // validateUsername already sets usernameError
      return;
    }

    try {
      await signup(username.trim(), password);
      // Navigation handled by MainWrapper
    } catch (err: any) {
      if (!usernameError) {
        setFormError(err.message || t('signUp.error_failed'));
      }
    }
  };
  
  const displayError = usernameError || formError || authContextError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] p-4">
      <div className="w-full max-w-md">
        <Logo className="mx-auto h-16 w-auto mb-8" />
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight text-neutral-100">
          {t('signUp.title')}
        </h2>
        <AuthForm
          username={username}
          setUsername={handleUsernameChange}
          onUsernameBlur={handleUsernameBlur}
          usernameError={usernameError}
          isCheckingUsername={isCheckingUsername}
          password={password}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
          submitText={t('signUp.submit')}
          error={displayError && !usernameError ? displayError : null}
          isLoading={isLoading || isCheckingUsername}
          showPasswordToggle={true}
        />
        <p className="mt-6 text-center text-sm text-neutral-400">
          {t('signUp.alreadyMember')}{' '}
          <button
            onClick={onSwitchToSignIn}
            className="font-medium text-red-500 hover:text-red-400 focus:outline-none focus:underline"
          >
            {t('signUp.signInLink')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;