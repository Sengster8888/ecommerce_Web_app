import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCart } from '../../features/cart/hooks/useCart';
import type { Category } from '../../features/products/types/product.types';

interface StorefrontHeaderProps {
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  cartCount?: number;
  cartTotal?: number;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  cartCount,
  cartTotal,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { totalCount: realCartCount, grandTotalUsd: realCartTotal } = useCart();

  const displayCartCount = cartCount !== undefined ? cartCount : realCartCount;
  const displayCartTotal = cartTotal !== undefined ? cartTotal : realCartTotal;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f131d]/90 backdrop-blur-xl border-b border-[#2a3246]/60 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="h-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Logo and Nav links */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/30 to-cyan-500/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-cyan-400 text-[22px]">devices</span>
            </div>
            <div className="flex flex-col">
              <span className="font-outfit font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                KHMER<span className="text-cyan-400">STORE</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-widest uppercase">
                Cambodia
              </span>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1.5">
            <Link
              to="/products"
              className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 text-sm font-medium transition-all rounded-lg"
            >
              Storefront
            </Link>
            <Link
              to="/orders"
              className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 text-sm font-medium transition-all rounded-lg"
            >
              Track Order
            </Link>
          </nav>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <div className="flex items-center h-11 bg-[#0a0e18]/80 border border-[#2a3246]/70 rounded-xl px-2 shadow-inner focus-within:border-indigo-500 transition-colors">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory && onSelectCategory(e.target.value)}
              className="bg-transparent text-slate-300 font-sans text-xs font-semibold px-2 py-1 focus:outline-none cursor-pointer border-r border-[#2a3246] max-w-[130px] truncate"
            >
              <option value="all" className="bg-[#171b26] text-white">
                All Categories
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)} className="bg-[#171b26] text-white">
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search gadgets, audio, smartphones in Cambodia..."
              className="w-full bg-transparent px-3 font-sans text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="button"
              className="h-8 w-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
          </div>
        </div>

        {/* Location & Cart & User Account */}
        <div className="flex items-center gap-3 shrink-0">

          <Link
            to="/cart"
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#1c1f2a] border border-cyan-500/20 hover:border-cyan-500/40 text-slate-100 transition-all shadow-[0_0_16px_rgba(6,182,212,0.15)] group"
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-cyan-400 group-hover:scale-110 transition-transform">
                shopping_bag
              </span>
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-slate-950 text-[10px] font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                {displayCartCount}
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] font-medium text-slate-400">
                {displayCartCount} {displayCartCount === 1 ? 'item' : 'items'}
              </span>
              <span className="font-outfit text-xs font-bold text-cyan-300 leading-none">
                ${displayCartTotal.toFixed(2)}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 pl-1">
            {isAuthenticated ? (
              <Link to="/profile" className="block relative rounded-full ring-2 ring-[#2a3246] hover:ring-indigo-500 transition-all">
                <div className="w-8 h-8 rounded-full bg-[#262a35] border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400 text-xs">
                  {user?.fullName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f131d] shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg bg-[#262a35] hover:bg-slate-700 text-white font-sans text-xs font-semibold transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
