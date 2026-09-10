import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductDetail, useProducts } from '../features/products/hooks/useProducts';
import { fetchCart, addToCartApi } from '../features/cart/api/cart.api';
import { parsePrice, formatKHR } from '../utils/price.utils';

import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { ProductCard } from '../components/storefront/ProductCard';
import { ProductQuickViewModal } from '../components/storefront/ProductQuickViewModal';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { ToastNotification } from '../components/storefront/ToastNotification';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProductDetail(id || null);
  const { products: relatedProducts } = useProducts({ limit: 4 });

  // Tab & Interactive state
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Cart & Toast state
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0.0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

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

  useEffect(() => {
    if (product) {
      const primary =
        product.images?.find((img) => img.isPrimary)?.imageUrl ||
        product.images?.[0]?.imageUrl ||
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80';
      setSelectedImage(primary);
      setQuantity(1);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="bg-[#0f131d] font-sans text-on-surface antialiased min-h-screen flex flex-col">
        <StorefrontHeader cartCount={cartItemsCount} cartTotal={cartTotal} />
        <main className="w-full pt-28 pb-16 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 h-96 rounded-2xl bg-[#171b26] animate-pulse border border-[#2a3246]"></div>
            <div className="lg:col-span-5 h-96 rounded-2xl bg-[#171b26] animate-pulse border border-[#2a3246]"></div>
          </div>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-[#0f131d] font-sans text-on-surface antialiased min-h-screen flex flex-col">
        <StorefrontHeader cartCount={cartItemsCount} cartTotal={cartTotal} />
        <main className="w-full pt-28 pb-16 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center text-center">
          <div className="p-8 rounded-2xl bg-[#171b26] border border-[#2a3246] max-w-md w-full shadow-2xl">
            <span className="material-symbols-outlined text-[64px] text-cyan-400 mb-4">
              inventory_2
            </span>
            <h2 className="font-outfit text-2xl font-bold text-white mb-2">Product Not Found</h2>
            <p className="text-slate-400 text-sm mb-6">
              {error || 'The requested hardware product does not exist or has been removed.'}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Products Catalog
            </Link>
          </div>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  const priceNum = parsePrice(product.price);
  const khrPrice = formatKHR(priceNum);
  const isInStock = (product.stock ?? 0) > 0 && product.status !== 'out_of_stock';
  const rating = product.rating && product.rating > 0 ? product.rating.toFixed(1) : '4.8';
  const reviewCount = product.reviewCount ?? 0;

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images.map((i) => i.imageUrl)
      : [selectedImage];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2800);
  };

  const handleAddToCart = async () => {
    setCartItemsCount((prev) => prev + quantity);
    setCartTotal((prev) => prev + priceNum * quantity);
    await addToCartApi({ productId: product.id, quantity });
    await loadCart();
    showToast(`${product.name} (x${quantity}) added to cart!`);
  };

  const handleBuyNowKHQR = async () => {
    await handleAddToCart();
    navigate('/checkout');
  };

  return (
    <div className="bg-[#0f131d] font-sans text-on-surface antialiased min-h-screen flex flex-col">
      {/* Top Header Navigation */}
      <StorefrontHeader cartCount={cartItemsCount} cartTotal={cartTotal} />

      <main className="w-full pt-20 bg-[#0f131d] flex-1">
        <div className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full"></div>
          <div className="absolute top-80 right-10 w-96 h-96 bg-cyan-500/10 blur-[140px] pointer-events-none rounded-full"></div>

          {/* 1. Breadcrumbs Trail */}
          <nav className="py-4 flex items-center flex-wrap gap-2 text-slate-400 text-xs sm:text-sm font-medium">
            <Link to="/" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-base">home</span>
              <span>Home</span>
            </Link>
            <span className="text-slate-600">/</span>
            <Link to="/products" className="hover:text-indigo-400 transition-colors">
              Categories
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{product.category?.name || 'Hardware'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-semibold tracking-wide drop-shadow-[0_0_10px_rgba(6,182,212,0.4)] truncate max-w-[280px] sm:max-w-md">
              {product.name}
            </span>
          </nav>

          {/* 2. Main Showcase 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
            {/* Left Column: Image Gallery (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[#171b26]/80 backdrop-blur-xl border border-[#2a3246] shadow-[0_0_40px_rgba(99,102,241,0.15)] group flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-transparent to-cyan-500/5 pointer-events-none z-10"></div>
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none"></div>
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="relative z-10 w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                />

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1f2a]/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs font-semibold shadow-md">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>
                      verified
                    </span>
                    Official Certified Warranty
                  </span>
                </div>
              </div>

              {/* Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {galleryImages.slice(0, 5).map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-[#171b26] p-1 transition-all cursor-pointer ${
                        selectedImage === imgUrl
                          ? 'border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'border border-[#2a3246] opacity-60 hover:opacity-100 hover:border-indigo-500'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Checkout & Detail Panel (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5 bg-[#171b26]/70 backdrop-blur-xl border border-[#2a3246] p-6 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-[#6366f1] shadow-[0_0_12px_rgba(99,102,241,0.25)] uppercase tracking-wider">
                  {product.category?.name || 'Hardware'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ● {isInStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <h1 className="font-outfit text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating Summary */}
              <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-slate-400 pb-2 border-b border-[#2a3246]/60">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>
                      star
                    </span>
                  ))}
                </div>
                <span className="font-bold text-white ml-1">{rating}</span>
                <span className="text-slate-500">/ 5.0</span>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  ({reviewCount} Reviews)
                </button>
              </div>

              {/* Price Display */}
              <div className="p-4 rounded-xl bg-[#0a0e18]/60 border border-[#2a3246]/70 flex flex-col gap-2">
                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                  <span className="text-cyan-400 font-extrabold text-3xl sm:text-4xl tracking-tight drop-shadow-[0_0_18px_rgba(6,182,212,0.35)] font-outfit">
                    ${priceNum.toFixed(2)}
                  </span>
                  <span className="text-slate-400 font-medium text-sm sm:text-base">
                    ~៛ {khrPrice} KHR
                  </span>
                </div>
              </div>

              {/* Quantity Stepper & Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-[#0a0e18]/80 border border-[#2a3246] rounded-xl p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">remove</span>
                    </button>
                    <span className="w-10 text-center font-outfit font-bold text-white text-base">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!isInStock}
                    onClick={handleAddToCart}
                    className={`flex-1 h-12 rounded-xl text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg backdrop-blur-md transition-all cursor-pointer ${
                      isInStock
                        ? 'bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 active:scale-[0.98]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                    <span>Add to Cart</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!isInStock}
                  onClick={handleBuyNowKHQR}
                  className={`w-full h-12 rounded-xl text-slate-950 font-outfit font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isInStock
                      ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">bolt</span>
                  <span>Buy Now with Bakong KHQR</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Tabbed Information Section */}
          <div className="mt-16 flex flex-col" id="tabbed-section">
            <div className="flex items-center gap-2 border-b border-[#2a3246] pb-px overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('desc')}
                className={`px-6 py-3 rounded-t-xl font-outfit text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'desc'
                    ? 'font-semibold text-cyan-300 bg-[#171b26] border-t border-x border-[#2a3246] border-b-2 border-b-cyan-400 shadow-sm'
                    : 'font-medium text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`px-6 py-3 rounded-t-xl font-outfit text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'specs'
                    ? 'font-semibold text-cyan-300 bg-[#171b26] border-t border-x border-[#2a3246] border-b-2 border-b-cyan-400 shadow-sm'
                    : 'font-medium text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 rounded-t-xl font-outfit text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'font-semibold text-cyan-300 bg-[#171b26] border-t border-x border-[#2a3246] border-b-2 border-b-cyan-400 shadow-sm'
                    : 'font-medium text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Reviews ({reviewCount})
              </button>
            </div>

            <div className="p-6 sm:p-8 rounded-b-2xl rounded-tr-2xl bg-[#171b26]/70 backdrop-blur-xl border-x border-b border-[#2a3246] shadow-xl min-h-[360px]">
              {/* Tab 1: Description */}
              {activeTab === 'desc' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="font-outfit text-xl sm:text-2xl font-bold text-white">
                      Product Overview
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-2">
                      {product.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Specifications */}
              {activeTab === 'specs' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-outfit text-xl font-bold text-white">Technical Specifications</h2>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[#2a3246] bg-[#0a0e18]/50">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <tbody className="divide-y divide-[#2a3246]/70">
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <th className="py-3 px-4 font-semibold text-slate-400 w-1/3 sm:w-1/4 bg-[#171b26]/50">Product Name</th>
                          <td className="py-3 px-4 font-medium text-white">{product.name}</td>
                        </tr>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <th className="py-3 px-4 font-semibold text-slate-400 bg-[#171b26]/50">Category</th>
                          <td className="py-3 px-4 font-medium text-white">{product.category?.name || 'Hardware'}</td>
                        </tr>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <th className="py-3 px-4 font-semibold text-slate-400 bg-[#171b26]/50">Price</th>
                          <td className="py-3 px-4 font-medium text-cyan-400 font-semibold">${priceNum.toFixed(2)} USD (~{khrPrice} KHR)</td>
                        </tr>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <th className="py-3 px-4 font-semibold text-slate-400 bg-[#171b26]/50">Stock</th>
                          <td className="py-3 px-4 font-medium text-emerald-400 font-semibold">{product.stock} units available</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Reviews */}
              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-xl bg-[#0a0e18]/60 border border-[#2a3246]">
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-[#2a3246] pb-4 md:pb-0 md:pr-6">
                      <span className="font-outfit text-5xl font-extrabold text-white">{rating}</span>
                      <div className="flex text-amber-400 my-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>
                            star
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">Based on {reviewCount} customer reviews</p>
                    </div>
                    <div className="md:col-span-8 flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-10 text-slate-300 font-medium">5 star</span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: reviewCount > 0 ? '82%' : '0%' }}></div>
                        </div>
                        <span className="w-10 text-right text-slate-400 font-medium">{reviewCount > 0 ? '82%' : '0%'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Related Products Showcase */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-16 flex flex-col gap-6">
              <h2 className="font-outfit text-2xl font-bold text-white">Related Hardware Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.slice(0, 4).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onAddToCart={(p) => {
                      setCartItemsCount((prev) => prev + 1);
                      setCartTotal((prev) => prev + parsePrice(p.price));
                      showToast(`${p.name} added to cart!`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <StorefrontFooter />

      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p, qty) => {
          setCartItemsCount((prev) => prev + qty);
          setCartTotal((prev) => prev + parsePrice(p.price) * qty);
          showToast(`${p.name} added to cart!`);
          setQuickViewProduct(null);
        }}
        onBuyNowKHQR={() => {
          navigate('/checkout');
        }}
      />

      <ToastNotification message={toastMessage} isVisible={isToastVisible} />
    </div>
  );
};

export default ProductDetailPage;
