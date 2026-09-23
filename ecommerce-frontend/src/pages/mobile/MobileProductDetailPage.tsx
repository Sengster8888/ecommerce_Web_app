import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../features/products/types/product.types';

interface MobileProductDetailPageProps {
  product: Product;
  onAddToCart: () => void;
}

export const MobileProductDetailPage: React.FC<MobileProductDetailPageProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const primaryImage = product.images?.find((img) => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || 'https://placehold.co/600x600?text=No+Image';

  return (
    <div className="bg-surface min-h-screen text-on-surface font-sans pb-28">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 pt-safe sticky top-0 z-50 bg-surface/90 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="font-semibold text-lg tracking-tight">Product Details</h1>
        <button onClick={() => setIsFavorite(!isFavorite)} className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[24px]">
            {isFavorite ? 'favorite' : 'favorite_border'}
          </span>
          {!isFavorite && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
          )}
        </button>
      </header>

      <main className="px-5 mt-2">
        {/* Product Image Card */}
        <div className="relative w-full aspect-[4/3] bg-surface-container-lowest rounded-3xl overflow-visible mb-6 flex items-center justify-center shadow-sm">
          <img src={primaryImage} alt={product.name} className="w-3/4 h-3/4 object-contain drop-shadow-xl" />
          
          {/* Pagination dots */}
          {product.images && product.images.length > 1 && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full shadow-sm z-10">
              {product.images.map((_, idx) => (
                <div key={idx} className={`${idx === 0 ? 'w-2 h-2 bg-primary' : 'w-1.5 h-1.5 bg-primary/30'} rounded-full`}></div>
              ))}
            </div>
          )}

          {/* Rating Badge */}
          <div className="absolute -bottom-4 right-3 flex items-center gap-1 bg-surface-container-high px-3 py-1.5 rounded-full shadow-md z-10">
            <span className="text-secondary text-[14px]">★</span>
            <span className="font-bold text-sm text-on-surface">{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
            <span className="text-xs text-on-surface-variant">({product.reviewCount || 0})</span>
          </div>
        </div>

        {/* Title & Price */}
        <h2 className="text-2xl font-bold leading-tight mb-2 tracking-tight text-on-surface">{product.name}</h2>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-primary font-bold text-2xl">$ {product.price}</span>
          {product.discountPercentage ? (
            <span className="text-on-surface-variant line-through text-sm">${(Number(product.price) / (1 - product.discountPercentage / 100)).toFixed(2)}</span>
          ) : null}
        </div>

        {/* Description */}
        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
          {product.description}
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-surface-container rounded-2xl p-3 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant">
            <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center mb-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
            <span className="font-bold text-xs text-on-surface mb-0.5 text-center">Delivery</span>
            <span className="text-[10px] text-on-surface-variant text-center leading-tight">Free Standard<br/>Shipping</span>
          </div>
          <div className="bg-surface-container rounded-2xl p-3 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant">
            <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center mb-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            </div>
            <span className="font-bold text-xs text-on-surface mb-0.5 text-center">Warranty</span>
            <span className="text-[10px] text-on-surface-variant text-center leading-tight">1 Year<br/>Coverage</span>
          </div>
          <div className="bg-surface-container rounded-2xl p-3 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant">
            <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center mb-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <span className="font-bold text-xs text-on-surface mb-0.5 text-center">In Stock</span>
            <span className="text-[10px] text-on-surface-variant text-center leading-tight">{product.stock || 0} Units<br/>Available</span>
          </div>
        </div>
      </main>

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 w-full bg-surface pb-safe pt-2 px-5 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-50">
        <div className="flex items-center gap-3 mb-4">
          <button className="flex-1 bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-lg transition-colors active:scale-95 shadow-md">
            <span className="material-symbols-outlined">shopping_bag</span>
            Buy Now
          </button>
          <button onClick={onAddToCart} className="w-14 h-14 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl flex items-center justify-center transition-colors active:scale-95 shadow-md">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
