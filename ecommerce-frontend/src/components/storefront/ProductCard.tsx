import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../features/products/types/product.types';
import { parsePrice, formatKHR } from '../../utils/price.utils';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
}) => {
  const priceNum = parsePrice(product.price);
  const khrPrice = formatKHR(priceNum);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';

  const isInStock = (product.stock ?? 0) > 0 && product.status !== 'out_of_stock';
  const rating = product.rating && product.rating > 0 ? product.rating.toFixed(1) : '4.8';
  const reviewCount = product.reviewCount ?? 0;
  const productDetailUrl = `/products/${product.id}`;

  return (
    <div className="group flex flex-col rounded-xl bg-surface-container-low p-space-sm shadow-md hover:shadow-xl hover:border-primary/40 border border-white/5 transition-all duration-300 relative">
      {/* Image Stage Link */}
      <Link to={productDetailUrl} className="relative aspect-square w-full rounded-lg overflow-hidden bg-surface-container-highest mb-space-xs block">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Stock Badge */}
        <span className="absolute top-2 left-2 px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 backdrop-blur text-tertiary font-label-sm text-label-sm flex items-center gap-1 border border-tertiary/20">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isInStock ? 'bg-tertiary animate-pulse' : 'bg-red-400'
            }`}
          ></span>
          {isInStock ? (product.stock <= 3 ? `Only ${product.stock} Left` : 'In Stock') : 'Out of Stock'}
        </span>

        {/* Express Delivery Badge */}
        <span className="absolute top-2 right-2 px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 backdrop-blur text-secondary font-label-sm text-label-sm border border-secondary/20">
          PP Express
        </span>

        {/* Quick Details Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute inset-x-3 bottom-3 py-space-xs rounded-lg bg-surface-container-highest/95 backdrop-blur text-on-surface font-label-md text-label-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-space-2xs shadow-lg cursor-pointer hover:bg-primary hover:text-on-primary z-10"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          Quick Details
        </button>
      </Link>

      {/* Category & Rating */}
      <div className="flex items-center justify-between gap-space-xs mb-space-2xs">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider truncate">
          {product.category?.name || 'Hardware'}
        </span>
        <div className="flex items-center gap-1 text-tertiary shrink-0">
          <span
            className="material-symbols-outlined text-[14px]"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            star
          </span>
          <span className="font-label-sm text-label-sm">
            {rating} ({reviewCount})
          </span>
        </div>
      </div>

      {/* Product Title Link */}
      <Link to={productDetailUrl} className="block group/title">
        <h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover/title:text-primary transition-colors">
          {product.name}
        </h3>
      </Link>
      <p className="font-body-sm text-body-sm text-outline truncate mb-space-sm">
        {product.description}
      </p>

      {/* Pricing & Add to Cart Footer */}
      <div className="mt-auto pt-space-xs flex items-center justify-between">
        <Link to={productDetailUrl} className="flex flex-col">
          <span className="font-price-card text-price-card text-on-surface">
            ${priceNum.toFixed(2)}
          </span>
          <span className="font-label-sm text-label-sm text-outline">~{khrPrice} KHR</span>
        </Link>

        <button
          type="button"
          disabled={!isInStock}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`px-space-sm py-space-xs rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1 shadow-md cursor-pointer ${
            isInStock
              ? 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
              : 'bg-surface-container text-outline cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
          Add
        </button>
      </div>
    </div>
  );
};
