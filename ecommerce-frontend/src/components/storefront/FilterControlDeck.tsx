import React from 'react';
import type { GetProductsParams } from '../../features/products/types/product.types';

interface FilterControlDeckProps {
  params: GetProductsParams;
  onUpdateParams: (newParams: Partial<GetProductsParams>) => void;
  totalCount: number;
}

export const FilterControlDeck: React.FC<FilterControlDeckProps> = ({
  params,
  onUpdateParams,
  totalCount,
}) => {
  return (
    <section className="w-full bg-surface py-space-md">
      <div className="max-w-7xl mx-auto px-space-md lg:px-container-padding-desktop">
        <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-sm rounded-xl border border-white/5">
          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Price Tier Dropdown */}
            <div className="relative">
              <select
                value={params.priceTier || 'all'}
                onChange={(e) =>
                  onUpdateParams({ priceTier: e.target.value as GetProductsParams['priceTier'] })
                }
                className="appearance-none bg-surface-container text-on-surface font-label-md text-label-md pl-space-sm pr-space-xl py-space-xs rounded-lg cursor-pointer focus:outline-none border border-white/5"
              >
                <option value="all">Price: All Tiers</option>
                <option value="under100">Under $100 USD (~400,000៛)</option>
                <option value="100-500">$100 - $500 USD</option>
                <option value="500-1500">$500 - $1,500 USD</option>
                <option value="above1500">$1,500+ Flagship</option>
              </select>
              <span className="material-symbols-outlined text-outline pointer-events-none absolute right-2 top-2.5 text-[18px]">
                expand_more
              </span>
            </div>

            {/* In-Stock Switch */}
            <label className="flex items-center gap-space-xs cursor-pointer px-space-xs select-none">
              <input
                type="checkbox"
                checked={params.inStockOnly ?? true}
                onChange={(e) => onUpdateParams({ inStockOnly: e.target.checked })}
                className="w-4 h-4 rounded bg-surface-container text-primary accent-primary cursor-pointer"
              />
              <span className="font-label-sm text-label-sm text-on-surface">
                In Stock in Cambodia
              </span>
            </label>
          </div>

          {/* Results Count & Sorting */}
          <div className="flex items-center gap-space-sm ml-auto">
            <span className="font-body-sm text-body-sm text-outline hidden sm:inline">
              Showing {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </span>
            <div className="relative">
              <select
                value={params.sortBy || 'popular'}
                onChange={(e) =>
                  onUpdateParams({ sortBy: e.target.value as GetProductsParams['sortBy'] })
                }
                className="appearance-none bg-surface-container text-on-surface font-label-md text-label-md pl-space-sm pr-space-xl py-space-xs rounded-lg cursor-pointer focus:outline-none border border-white/5"
              >
                <option value="popular">Sort: Most Popular</option>
                <option value="newest">Sort: Newest Arrival</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <span className="material-symbols-outlined text-outline pointer-events-none absolute right-2 top-2.5 text-[18px]">
                sort
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
