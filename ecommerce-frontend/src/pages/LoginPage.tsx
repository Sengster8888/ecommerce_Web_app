import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
            <span className="hidden sm:inline-block ml-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
              Auth Portal
            </span>
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
                className={`font-label-sm text-label-sm px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  lang === 'EN'
                    ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('KH')}
                className={`font-label-sm text-label-sm px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  lang === 'KH'
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(100vh-11rem)]">
            {/* Left Showcase Panel (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col gap-6 relative pr-0 lg:pr-4">
              {/* Ambient backdrop */}
              <div className="absolute -top-16 -left-12 w-96 h-96 bg-primary-container/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
              <div className="absolute bottom-4 right-10 w-80 h-80 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

              {/* Overline Tag & Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high shadow-sm border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">
                    Kingdom of Wonder Gateway
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border border-white/5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    verified_user
                  </span>
                  <span>NBC Certified Merchant</span>
                </div>
              </div>

              {/* Hero Headline */}
              <div className="flex flex-col gap-3">
                <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight leading-tight">
                  Cambodia's{' '}
                  <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                    #1 Tech
                  </span>{' '}
                  &amp; Lifestyle Hub
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                  Seamlessly integrated with Bakong KHQR for split-second checkout, real-time logistics dispatch across all 25 provinces, and VIP consumer warranty shields.
                </p>
              </div>

              {/* Feature Bento Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Tile 1: Bakong KHQR */}
                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group shadow-md hover:bg-surface-container border border-white/5 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Bakong KHQR
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
                    Instant scan &amp; zero settlement fees via ABA, Acleda, Wing, and 40+ banks.
                  </p>
                </div>

                {/* Tile 2: 25 Provinces */}
                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group shadow-md hover:bg-surface-container border border-white/5 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      25 Provinces
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
                    Phnom Penh same-day dispatch and express regional routes via Virak Buntham &amp; J&amp;T.
                  </p>
                </div>

                {/* Tile 3: Official Care */}
                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group shadow-md hover:bg-surface-container border border-white/5 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">shield_with_heart</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Official Care
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
                    Authorized brand service, genuine import warranty, and VIP price freezes.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive Form (5 Columns) */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none pt-4 lg:pt-0">
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
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Bakong KHQR
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Direct Pay</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-white/5">
                <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                <span className="font-label-md text-label-md text-on-surface">
                  256-bit SSL Encrypted
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-white/5">
                <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                <span className="font-label-md text-label-md text-on-surface">
                  NBC Certified Gateway
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
              National Bank of Cambodia Compliant Merchant Gateway
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
