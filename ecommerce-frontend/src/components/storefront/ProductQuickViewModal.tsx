import React, { useState, useEffect } from 'react';
import type { Product } from '../../features/products/types/product.types';
import { parsePrice, formatKHR } from '../../utils/price.utils';

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNowKHQR: (product: Product, quantity: number) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNowKHQR,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      const primaryImg =
        product.images?.find((img) => img.isPrimary)?.imageUrl ||
        product.images?.[0]?.imageUrl ||
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
      setSelectedImage(primaryImg);
      setQuantity(1);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const priceNum = parsePrice(product.price);
  const origPriceNum = (priceNum * 1.18).toFixed(2);
  const khrPrice = formatKHR(priceNum);

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images.map((i) => i.imageUrl)
      : [selectedImage];

  const rating = product.rating && product.rating > 0 ? product.rating.toFixed(1) : '4.8';
  const reviewCount = product.reviewCount ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-space-md transition-all duration-300 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface-container-low rounded-xl shadow-2xl p-space-lg lg:p-space-xl border border-white/10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-space-2xs rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface transition-colors flex items-center justify-center cursor-pointer border border-white/10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-xl">
          {/* Visual Column */}
          <div className="md:col-span-6 flex flex-col gap-space-sm">
            <div className="aspect-square w-full rounded-xl bg-surface-container-highest overflow-hidden relative shadow-inner border border-white/5">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <span className="absolute top-3 left-3 px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 backdrop-blur text-tertiary font-label-sm text-label-sm flex items-center gap-1 border border-tertiary/20">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                Official Model
              </span>
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-space-xs">
                {galleryImages.slice(0, 4).map((imgUrl, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`aspect-square rounded-lg bg-surface-container p-0.5 cursor-pointer shadow-sm border transition-all ${
                      selectedImage === imgUrl ? 'border-primary' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Information Column */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div className="space-y-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="px-space-xs py-space-2xs rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold border border-primary/20">
                  FLAGSHIP CHOICE
                </span>
                <div className="flex items-center gap-1 text-tertiary">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    star
                  </span>
                  <span className="font-label-sm text-label-sm">
                    {rating} / 5.0 ({reviewCount} Reviews)
                  </span>
                </div>
              </div>

              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                {product.name}
              </h2>

              {/* Price Display (USD & KHR) */}
              <div className="p-space-sm rounded-lg bg-surface-container flex items-baseline justify-between border border-white/5">
                <div>
                  <span className="font-price-hero text-price-hero text-secondary font-bold">
                    ${priceNum.toFixed(2)}
                  </span>
                  <span className="ml-2 font-body-sm text-body-sm text-outline line-through">
                    ${origPriceNum}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-label-md text-label-md text-tertiary font-bold">
                    ៛ {khrPrice} KHR
                  </span>
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Action Buttons & Quantity Stepper */}
            <div className="pt-space-md mt-space-sm flex flex-col sm:flex-row items-center gap-space-sm border-t border-white/5">
              <div className="flex items-center bg-surface-container rounded-lg p-1 w-full sm:w-auto justify-between sm:justify-start border border-white/5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded bg-surface-container-high text-on-surface hover:text-secondary flex items-center justify-center font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-space-md font-label-lg text-label-lg text-on-surface">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded bg-surface-container-high text-on-surface hover:text-secondary flex items-center justify-center font-bold cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => onAddToCart(product, quantity)}
                className="w-full sm:flex-1 py-space-xs px-space-md rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                Add to Cart
              </button>

              <button
                type="button"
                onClick={() => onBuyNowKHQR(product, quantity)}
                className="w-full sm:flex-1 py-space-xs px-space-md rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim font-label-md text-label-md transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                Buy with KHQR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
