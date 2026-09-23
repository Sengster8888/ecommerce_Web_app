import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../../../api/endpoints';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      // Error handled by AuthContext and displayed in UI
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="relative bg-surface-container-low/95 backdrop-blur-2xl rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden border border-white/10 flex flex-col gap-5">
      {/* Top Specular Glow Line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-container/40 to-transparent"></div>

      {/* Header & Logo Section */}
      <div className="flex flex-col gap-2 text-center items-center">
        <div className="relative mb-2">
          <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/30 to-secondary/30"></div>
            <span className="material-symbols-outlined text-secondary text-[30px] relative z-10" style={{ fontVariationSettings: '"FILL" 1' }}>account_balance_wallet</span>
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-tertiary shadow-sm flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest"></span>
          </div>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          Welcome Back
        </h2>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-error-container/80 text-on-error-container text-body-sm font-body-sm flex items-center justify-between border border-error/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="hover:opacity-80 text-on-error-container cursor-pointer p-1"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Auth Form */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface-variant font-medium flex items-center justify-between"
            htmlFor="login-email"
          >
            <span>Email Address</span>
          </label>

          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-on-surface-variant flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sokha.chan@example.com"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container-high transition-all shadow-inner border border-white/5 focus:border-primary/40"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface-variant font-medium flex items-center justify-between"
            htmlFor="login-password"
          >
            <span>Account Password</span>
          </label>

          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-on-surface-variant flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-12 pl-11 pr-12 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container-high transition-all shadow-inner border border-white/5 focus:border-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 p-1 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg flex items-center justify-center cursor-pointer"
              aria-label="Toggle password visibility"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-surface-container text-primary-container focus:ring-0 focus:outline-none cursor-pointer accent-primary"
            />
            <span className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">
              Remember me for 7 days
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="font-label-md text-label-md text-secondary hover:text-secondary-fixed transition-colors font-medium hover:underline focus:outline-none ml-2"
          >
            Forgot password?
          </Link>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-primary-container via-inverse-primary to-secondary text-on-primary font-label-lg text-label-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(99,102,241,0.45)] active:scale-[0.98] transition-transform overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-surface-container-highest"></div>
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant/70 font-semibold px-1">
          Or Continue With
        </span>
        <div className="h-px flex-1 bg-surface-container-highest"></div>
      </div>

      {/* Social Authentication */}
      <div className="gap-3 flex justify-center">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full h-12 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm flex items-center justify-center gap-3 text-on-surface font-label-lg text-label-lg active:scale-[0.98] cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
            <path
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
              fill="#4285F4"
            ></path>
            <path
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
              fill="#34A853"
            ></path>
            <path
              d="M5.28 14.27a7.22 7.22 0 0 1 0-4.54V6.58H1.26a12.02 12.02 0 0 0 0 10.84l4.02-3.15z"
              fill="#FBBC05"
            ></path>
            <path
              d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.96 6.72-4.96z"
              fill="#EA4335"
            ></path>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Sign Up Redirection */}
      <div className="flex items-center justify-center gap-2 pt-2 pb-1 text-center">
        <span className="font-body-md text-body-md text-on-surface-variant">Don't have an account?</span>
        <Link
          to="/register"
          className="font-label-lg text-label-lg text-primary hover:text-primary-fixed transition-colors underline-offset-4 hover:underline"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
};
