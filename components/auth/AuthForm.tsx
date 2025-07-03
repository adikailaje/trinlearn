import React, { FormEvent, useState } from 'react';
import { Loader } from '../Loader';
import { EyeIcon, EyeSlashIcon } from '../Icons';
import { useTranslation } from '../../hooks/useTranslation';

interface AuthFormProps {
  username?: string;
  setUsername?: (value: string) => void;
  onUsernameBlur?: () => void; // For username validation on blur
  usernameError?: string | null; // Specific error for username
  isCheckingUsername?: boolean; // To show loader next to username input
  password?: string;
  setPassword?: (value: string) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  submitText: string;
  error: string | null; // General form error
  isLoading: boolean; // For submit button
  showPasswordToggle?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  username,
  setUsername,
  onUsernameBlur,
  usernameError,
  isCheckingUsername,
  password,
  setPassword,
  handleSubmit,
  submitText,
  error, // General form error
  isLoading,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#1A1A1A] p-6 sm:p-8 rounded-lg shadow-xl border border-[#2C2C2C]">
      {setUsername && (
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-neutral-300">
            {t('signIn.username_label')}
          </label>
          <div className="mt-1 relative">
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={onUsernameBlur}
              className={`block w-full appearance-none rounded-md border bg-[#222222] px-3 py-2 text-neutral-100 placeholder-neutral-500 shadow-sm focus:outline-none sm:text-sm
                ${usernameError ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-[#333333] focus:border-red-500 focus:ring-red-500'}`}
              aria-describedby={usernameError ? "username-error" : undefined}
            />
            {isCheckingUsername && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Loader size="sm" className="text-neutral-400" />
              </div>
            )}
          </div>
          {usernameError && (
            <p className="mt-2 text-xs text-red-400" id="username-error">
              {usernameError}
            </p>
          )}
        </div>
      )}

      {setPassword && (
        <div>
          <label htmlFor="password"className="block text-sm font-medium text-neutral-300">
            {t('signIn.password_label')}
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPasswordToggle && showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full appearance-none rounded-md border border-[#333333] bg-[#222222] px-3 py-2 text-neutral-100 placeholder-neutral-500 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
            />
            {showPasswordToggle && (
                 <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-neutral-500 hover:text-neutral-300 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
            )}
          </div>
        </div>
      )}

      {error && !usernameError && ( // Only show general error if no specific username error is active
        <div className="rounded-md bg-red-700/30 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading || isCheckingUsername} // Disable submit if checking username or general loading
          className="flex w-full justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader size="sm" className="text-white" /> : submitText}
        </button>
      </div>
    </form>
  );
};