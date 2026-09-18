import React, { useState } from 'react';
import type { Product } from '../../features/products/types/product.types';
import { ProductCard } from './ProductCard';

interface FeaturedProductsDeckProps {
  popularProducts: Product[];
  discountedProducts: Product[];
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  loadingPopular?: boolean;
  loadingDiscounted?: boolean;
}

export const FeaturedProductsDeck: React.FC<FeaturedProductsDeckProps> = ({
  popularProducts,
  discountedProducts,
  onQuickView,
  onAddToCart,
  loadingPopular = false,
  loadingDiscounted = false,
}) => {
  const [activeTab, setActiveTab] = useState<'popular' | 'discounted'>('popular');

  const displayedProducts = activeTab === 'popular' ? popularProducts : discountedProducts;
  const isLoading = activeTab === 'popular' ? loadingPopular : loadingDiscounted;

  return (
    <section className="relative w-full overflow-hidden bg-surface-container-lowest border-b border-white/5 py-space-xl">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-primary-container/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-space-md lg:px-container-padding-desktop relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-space-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Curated For You
            </h2>
            <p className="font-body-lg text-on-surface-variant mt-1">
              Discover top picks and exclusive deals.
            </p>
          </div>
          
          <div className="flex bg-surface-container p-1 rounded-lg mt-space-md md:mt-0 shadow-inner border border-white/5">
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-space-md py-space-xs rounded-md font-label-lg transition-all duration-300 ${
                activeTab === 'popular'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Trending Now
            </button>
            <button
              onClick={() => setActiveTab('discounted')}
              className={`px-space-md py-space-xs rounded-md font-label-lg transition-all duration-300 ${
                activeTab === 'discounted'
                  ? 'bg-tertiary text-on-tertiary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Exclusive Deals
            </button>
          </div>
        </div>

        <div className="relative">
          {isLoading ? (
            <div className="flex space-x-space-md overflow-x-auto pb-space-md snap-x snap-mandatory scroll-smooth">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="min-w-[280px] h-80 rounded-xl bg-surface-container-low animate-pulse p-space-sm border border-white/5 flex-shrink-0"
                />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-space-xl bg-surface-container-low rounded-xl border border-white/5">
              <span className="material-symbols-outlined text-[48px] text-outline mb-space-sm">
                inventory_2
              </span>
              <p className="font-body-md text-on-surface-variant">
                No products found for this section.
              </p>
            </div>
          ) : (
            <div className="flex space-x-space-md overflow-x-auto pb-space-md snap-x snap-mandatory scroll-smooth">
              {displayedProducts.map((product) => (
                <div key={product.id} className="min-w-[280px] max-w-[280px] flex-shrink-0 snap-start">
                  <ProductCard
                    product={product}
                    onQuickView={onQuickView}
                    onAddToCart={(qty) => onAddToCart(product, 1)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
