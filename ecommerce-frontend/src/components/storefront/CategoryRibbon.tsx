import React from 'react';
import type { Category } from '../../features/products/types/product.types';

interface CategoryRibbonProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  totalProductsCount: number;
}

export const CategoryRibbon: React.FC<CategoryRibbonProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  totalProductsCount,
}) => {
  return (
    <section className="w-full bg-surface-container-lowest sticky top-20 z-30 shadow-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-space-md lg:px-container-padding-desktop py-space-sm">
        <div className="flex items-center justify-between gap-space-md overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-space-xs shrink-0" id="category-pills">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all cursor-pointer ${selectedCategory === 'all'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
            >
              All Products ({totalProductsCount})
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === String(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(String(cat.id))}
                  className={`px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all cursor-pointer whitespace-nowrap ${isSelected
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
