import React from 'react';
import type { Product } from '../../features/products/types/product.types';
import { parsePrice, formatKHR } from '../../utils/price.utils';

interface WaterFestivalBannerProps {
  heroProduct?: Product | null;
  onQuickViewHero?: (product: Product) => void;
}

export const WaterFestivalBanner: React.FC<WaterFestivalBannerProps> = ({
  heroProduct,
  onQuickViewHero,
}) => {
  const heroImage =
    heroProduct?.images?.find((img) => img.isPrimary)?.imageUrl ||
    heroProduct?.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';

  const priceNum = parsePrice(heroProduct?.price || 0);
  const khrPrice = formatKHR(priceNum);

  return (
    <section className="relative w-full overflow-hidden bg-surface-container-lowest border-b border-white/5">
      {/* Ambient back glow spheres */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-primary-container/15 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-space-md lg:px-container-padding-desktop py-space-xl relative z-10">
        <div className="rounded-xl bg-surface-container-low p-space-lg lg:p-space-2xl shadow-xl backdrop-blur-md relative overflow-hidden border border-white/10">
          {/* Decorative corner icon */}
          <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[240px] text-secondary">devices</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            <div className="lg:col-span-7 flex flex-col items-start space-y-space-md">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">
                Next-Gen Tech Unleashed. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-tertiary">
                  Exclusive Festival Privilege Pricing.
                </span>
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                Equip your workspace and lifestyle with curated high-performance audio, computing, and smart wearables. Guaranteed 100% genuine inventory backed by 1-year authorized nationwide Cambodia warranty.
              </p>
            </div>

            {/* Gala Highlight Visual */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-surface-container p-space-xs border border-white/10">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-surface-container-highest group">
                  <img
                    src={heroImage}
                    alt={heroProduct?.name || 'Gala Hero Choice'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute bottom-3 right-3 px-space-sm py-space-2xs rounded-lg bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-headline-sm text-headline-sm border border-white/10">
                    ${priceNum.toFixed(2)}{' '}
                    <span className="font-body-sm text-body-sm text-tertiary ml-1">
                      (៛ {khrPrice})
                    </span>
                  </div>

                  {heroProduct && onQuickViewHero && (
                    <button
                      type="button"
                      onClick={() => onQuickViewHero(heroProduct)}
                      className="absolute inset-x-4 bottom-14 py-space-xs rounded-lg bg-primary/95 text-on-primary font-label-md text-label-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 shadow-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Quick View Hero Item
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

