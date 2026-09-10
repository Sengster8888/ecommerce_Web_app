import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useCategories } from '../features/products/hooks/useProducts';
import { fetchCart, addToCartApi } from '../features/cart/api/cart.api';
import type { Product } from '../features/products/types/product.types';
import { parsePrice } from '../utils/price.utils';

import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { WaterFestivalBanner } from '../components/storefront/WaterFestivalBanner';
import { CategoryRibbon } from '../components/storefront/CategoryRibbon';
import { FilterControlDeck } from '../components/storefront/FilterControlDeck';
import { ProductCard } from '../components/storefront/ProductCard';
import { ProductQuickViewModal } from '../components/storefront/ProductQuickViewModal';

import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { ToastNotification } from '../components/storefront/ToastNotification';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { products, loading, error, params, setParams } = useProducts({ page: 1, limit: 16 });

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0.0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);

  // Load existing cart on mount
  const loadCart = useCallback(async () => {
    try {
      const cart = await fetchCart();
      if (cart && cart.items) {
        let count = 0;
        let total = 0;
        cart.items.forEach((item: any) => {
          count += item.quantity;
          total += parsePrice(item.product?.price || 0) * item.quantity;
        });
        setCartItemsCount(count);
        setCartTotal(total);
      }
    } catch (err) {
      console.warn('Failed to load cart on mount:', err);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Directly filter & sort real backend products array
  const displayProducts = useMemo(() => {
    let items = products || [];

    // Filter by Category
    if (selectedCategory !== 'all') {
      items = items.filter(
        (p) =>
          String(p.categoryId) === selectedCategory ||
          String(p.category?.id) === selectedCategory
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }

    // Filter by Stock Status
    if (params.inStockOnly) {
      items = items.filter((p) => (p.stock ?? 0) > 0 && p.status !== 'out_of_stock');
    }

    // Filter by Price Tier
    if (params.priceTier && params.priceTier !== 'all') {
      items = items.filter((p) => {
        const price = parsePrice(p.price);
        if (params.priceTier === 'under100') return price < 100;
        if (params.priceTier === '100-500') return price >= 100 && price <= 500;
        if (params.priceTier === '500-1500') return price >= 500 && price <= 1500;
        if (params.priceTier === 'above1500') return price > 1500;
        return true;
      });
    }

    // Sorting
    if (params.sortBy) {
      items = [...items].sort((a, b) => {
        const priceA = parsePrice(a.price);
        const priceB = parsePrice(b.price);
        if (params.sortBy === 'price-low') return priceA - priceB;
        if (params.sortBy === 'price-high') return priceB - priceA;
        if (params.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return Number(b.id) - Number(a.id);
      });
    }

    return items;
  }, [products, selectedCategory, searchQuery, params]);

  // Toast feedback trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2800);
  };

  // Cart action handlers
  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    const pPrice = parsePrice(product.price);
    setCartItemsCount((prev) => prev + quantity);
    setCartTotal((prev) => prev + pPrice * quantity);

    await addToCartApi({ productId: product.id, quantity });
    await loadCart();
    showToast(`${product.name} (x${quantity}) added to cart!`);
  };

  const handleBuyNowKHQR = async (product: Product, quantity: number = 1) => {
    await handleAddToCart(product, quantity);
    setQuickViewProduct(null);
    navigate('/checkout');
  };

  const heroProduct = displayProducts[0] || null;

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* 1. Storefront Navigation Header */}
      <StorefrontHeader
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartItemsCount}
        cartTotal={cartTotal}
      />

      <main className="w-full pt-20 bg-surface flex-1 flex flex-col">
        {/* 2. Water Festival Gala Hero Deal Banner */}
        <WaterFestivalBanner
          heroProduct={heroProduct}
          onQuickViewHero={(p) => setQuickViewProduct(p)}
        />

        {/* 3. Category Filter Pill Ribbon */}
        <CategoryRibbon
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalProductsCount={displayProducts.length}
        />

        {/* 4. Filter & Sorting Deck */}
        <FilterControlDeck
          params={params}
          onUpdateParams={(newP) => setParams((prev) => ({ ...prev, ...newP }))}
          totalCount={displayProducts.length}
        />

        {/* 5. Product Catalog Showcase Grid */}
        <section className="w-full bg-surface py-space-lg pb-space-3xl flex-1">
          <div className="max-w-7xl mx-auto px-space-md lg:px-container-padding-desktop">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-80 rounded-xl bg-surface-container-low animate-pulse p-space-sm border border-white/5"
                  ></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-space-2xl bg-surface-container-low rounded-xl border border-red-500/20 p-space-xl">
                <span className="material-symbols-outlined text-[48px] text-red-400 mb-space-xs">
                  cloud_off
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-space-2xs">
                  Backend API Connection Error
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mb-space-md">
                  {error}
                </p>
                <p className="font-body-sm text-body-sm text-outline mb-space-md">
                  Please verify that NestJS backend server is running at <code>http://localhost:4000/api</code>.
                </p>
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-space-3xl bg-surface-container-low rounded-xl border border-white/5 p-space-xl">
                <span className="material-symbols-outlined text-[64px] text-outline mb-space-sm">
                  inventory_2
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-space-2xs">
                  No Backend Products Found
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mb-space-md">
                  The catalog query returned 0 products from the database. Add products via Admin panel or seed database.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setParams({ page: 1, limit: 16 });
                  }}
                  className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md font-bold cursor-pointer hover:bg-primary-fixed-dim"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                  />
                ))}
              </div>
            )}


          </div>
        </section>
      </main>

      {/* 6. Cambodian Storefront Footer */}
      <StorefrontFooter />

      {/* 7. Product Quick Detail View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p, qty) => {
          handleAddToCart(p, qty);
          setQuickViewProduct(null);
        }}
        onBuyNowKHQR={handleBuyNowKHQR}
      />

      {/* 8. Toast Feedback Alert */}
      <ToastNotification message={toastMessage} isVisible={isToastVisible} />
    </div>
  );
};

export default ProductsPage;
