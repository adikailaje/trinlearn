
import React, { useState, FormEvent, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Logo } from '../components/Logo';
import { authService } from '../services/authService'; // Import authService for direct check

interface SignUpPageProps {
  onSwitchToSignIn: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToSignIn }) => {
  const { signup, error: authContextError, clearError: clearAuthContextError, isLoading } = useAuth();
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
      setUsernameError("Username must be at least 3 characters.");
      return false;
    }
    setIsCheckingUsername(true);
    setUsernameError(null); // Clear previous username error
    try {
      const result = await authService.checkUsernameExists(currentUsername);
      if (result.exists) {
        setUsernameError(result.message || "Username not available.");
        return false;
      }
      setUsernameError(null); // Explicitly clear if available
      return true;
    } catch (e: any) {
      setUsernameError(e.message || "Error checking username.");
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

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
      setFormError("Username and password are required.");
      return;
    }
    if (username.trim().length < 3) {
        setUsernameError("Username must be at least 3 characters long.");
        return;
    }
    if (password.length < 6) {
        setFormError("Password must be at least 6 characters long.");
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
      // Error from signup (authContext) will be displayed by AuthForm if not handled by usernameError
      // If the error is about username, it might already be caught by usernameError.
      // We prioritize usernameError if it's set. Otherwise, show general formError.
      if (!usernameError) {
        setFormError(err.message || "Failed to sign up.");
      }
    }
  };
  
  const displayError = usernameError || formError || authContextError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] p-4">
      <div className="w-full max-w-md">
        <Logo className="mx-auto h-16 w-auto mb-8" />
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight text-neutral-100">
          Create a new account
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
          submitText="Sign Up"
          error={displayError && !usernameError ? displayError : null} // Show general error if no specific username error
          isLoading={isLoading || isCheckingUsername}
          showPasswordToggle={true}
        />
        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToSignIn}
            className="font-medium text-red-500 hover:text-red-400 focus:outline-none focus:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
