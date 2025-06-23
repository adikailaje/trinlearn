import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Logo } from '../components/Logo';

interface SignInPageProps {
  onSwitchToSignUp: () => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ onSwitchToSignUp }) => {
  const { login, error: authError, clearError, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    if (!username || !password) {
      setFormError("Username and password are required.");
      return;
    }
    try {
      await login(username, password);
      // Navigation will be handled by MainWrapper due to isAuthenticated changing
    } catch (err: any) {
      setFormError(err.message || "Failed to sign in.");
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
          Sign in to your account
        </h2>
        <AuthForm
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
          submitText="Sign In"
          error={displayError}
          isLoading={isLoading}
          showPasswordToggle={true}
        />
        <p className="mt-6 text-center text-sm text-neutral-400">
          Not a member?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="font-medium text-red-500 hover:text-red-400 focus:outline-none focus:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;