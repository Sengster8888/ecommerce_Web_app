import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import login3DImage from '../assets/Untitled design.svg';
import { LoginForm } from '../features/auth/components/LoginForm';

export const LoginPage: React.FC = () => {
  const [lang, setLang] = useState<'EN' | 'KH'>('EN');

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-primary-container/10 blur-[120px]"></div>
        <div className="absolute top-1/3 -right-32 w-[450px] h-[450px] rounded-full bg-secondary-container/10 blur-[140px]"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-white/10 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
        <div className="h-16 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary-container/30 transition-colors">
                <span className="material-symbols-outlined text-primary text-[22px]">storefront</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                Kroma Store
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-surface-container-high text-primary font-semibold text-label-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-lg transition-colors"
            >
              Create Account
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-surface-container-low rounded-xl p-1 border border-white/5 gap-1">
              <button
                type="button"
                onClick={() => setLang('EN')}
                className={`font-label-sm text-label-sm px-3 py-1 rounded-lg transition-colors cursor-pointer ${lang === 'EN'
                    ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('KH')}
                className={`font-label-sm text-label-sm px-3 py-1 rounded-lg transition-colors cursor-pointer ${lang === 'KH'
                    ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                KH ភាសាខ្មែរ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="w-full pt-20 pb-12 flex-1 relative z-10 bg-transparent flex flex-col justify-center">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 lg:py-8">
          <div className="flex justify-center items-center min-h-[calc(100vh-11rem)]">
            {/* Interactive Form */}
            <div className="w-full max-w-md mx-auto pt-4 lg:pt-0">
              <LoginForm />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full relative z-10 bg-surface-container-lowest/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-1px_16px_rgba(0,0,0,0.4)] mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-white/5">
                <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                <span className="font-label-md text-label-md text-on-surface">
                  256-bit SSL Encrypted
                </span>
              </div>

            </div>
            <div className="flex items-center gap-4 text-on-surface-variant font-label-md text-label-md">
              <Link to="/security" className="hover:text-on-surface transition-colors">
                Security Standards
              </Link>
              <span className="text-outline-variant">•</span>
              <Link to="/support" className="hover:text-on-surface transition-colors">
                Live Assistance
              </Link>
              <span className="text-outline-variant">•</span>
              <Link to="/terms" className="hover:text-on-surface transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant font-body-sm text-body-sm border-t border-white/5 pt-3">
            <p>© 2026 Cambodian E-Store Network Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary">shield</span>
              
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
