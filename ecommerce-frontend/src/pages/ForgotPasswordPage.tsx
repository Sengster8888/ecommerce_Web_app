import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ForgotPasswordForm } from '../features/auth/components/ForgotPasswordForm';

export const ForgotPasswordPage: React.FC = () => {
  const [lang, setLang] = useState<'EN' | 'KH'>('EN');

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Ambient Orbs */}
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
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-surface-container-high text-primary font-semibold text-label-lg transition-colors"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start min-h-[calc(100vh-11rem)]">
            {/* Left Column (6 Cols) */}
            <div className="lg:col-span-6 flex flex-col gap-6 lg:pr-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm tracking-wider uppercase shadow-sm border border-white/5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                  Secure Recovery Protocol
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm border border-white/5 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Bank-Grade 256-bit SSL
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  Account Recovery &amp; Identity Verification
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                  Regain instant access to your verified Cambodian E-Store profile, order history, and Bakong KHQR wallet credentials.
                </p>
              </div>

              {/* 3 Security Pillars */}
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 shadow-md hover:bg-surface-container-high transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center shrink-0 text-primary shadow-[0_0_16px_rgba(192,193,255,0.25)]">
                    <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Email One-Time Security Passcode (OTP)
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      We dispatch a time-sensitive 6-digit cryptographic verification PIN directly to your email inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 shadow-md hover:bg-surface-container-high transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center shrink-0 text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.25)]">
                    <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        Protected Bakong KHQR Wallet
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm font-semibold bg-tertiary/10 text-tertiary">
                        Safe Mode
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Your payment tokens and linked NBC Bakong merchant authorizations remain frozen until full verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 shadow-md hover:bg-surface-container-high transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center shrink-0 text-secondary shadow-[0_0_16px_rgba(76,215,246,0.25)]">
                    <span className="material-symbols-outlined text-[24px]">headset_mic</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      24/7 Security Assistance
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Immediate bilingual live concierge support in Phnom Penh available for account recovery escalations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Card (6 Cols) */}
            <div className="lg:col-span-6">
              <ForgotPasswordForm />
            </div>
          </div>

          {/* Bottom 3 Trust Cards */}
          <div className="mt-12 pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5">
            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[20px]">phonelink_lock</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                  Bakong Token Shield
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Wallet keys remain encrypted at device rest
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-secondary">
                <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                  5-Minute Expiration
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Strict PIN validity windows prevent replay attacks
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-tertiary">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                  Dedicated Khmer Concierge
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Mon - Sun: 7:00 AM - 11:00 PM (ICT UTC+7)
                </span>
              </div>
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

export default ForgotPasswordPage;
