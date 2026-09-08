import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Navbar */}
      <header className="h-16 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-white/10 px-container-padding-mobile md:px-container-padding-desktop flex items-center justify-between">
        <Link to="/" className="flex items-center gap-space-xs">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface">Kroma Store</span>
        </Link>

        <div className="flex items-center gap-space-md">
          {isAuthenticated ? (
            <div className="flex items-center gap-space-sm">
              <span className="font-body-md text-on-surface-variant">
                Welcome, <strong className="text-on-surface">{user?.fullName || user?.email}</strong>
              </span>
              <button
                type="button"
                onClick={logout}
                className="px-space-sm py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary font-label-lg font-semibold hover:bg-primary transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-container-padding-mobile text-center py-space-2xl">
        <div className="max-w-2xl flex flex-col gap-space-md">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-high border border-white/10 mx-auto">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-sm uppercase tracking-wider text-tertiary">
              Cambodia Digital Commerce
            </span>
          </div>

          <h1 className="font-display-hero text-display-hero text-on-surface">
            Welcome to <span className="text-primary">Kroma Store</span>
          </h1>

          <p className="font-body-lg text-on-surface-variant">
            {isAuthenticated
              ? `You are logged in as ${user?.email}. Your token-authenticated session is active!`
              : 'Sign in to access your orders, saved wishlist, and Bakong KHQR wallet.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-space-md pt-space-md">
            {isAuthenticated ? (
              <>
                <Link
                  to="/products"
                  className="px-space-lg py-space-sm rounded-xl bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Browse Catalog
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-space-lg py-space-sm rounded-xl bg-surface-container-high text-on-surface font-label-lg font-semibold border border-white/10 hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-space-xl py-space-sm rounded-xl bg-gradient-to-r from-primary-container via-primary to-secondary text-on-primary font-label-lg font-bold shadow-[0_0_24px_rgba(128,131,255,0.35)] hover:shadow-[0_0_32px_rgba(76,215,246,0.5)] transition-all"
              >
                Sign In Now
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
