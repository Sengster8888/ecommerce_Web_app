import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePopularProducts, useDiscountedProducts } from '../../features/products/hooks/useProducts';
import { fetchCart, addToCartApi } from '../../features/cart/api/cart.api';
import { parsePrice } from '../../utils/price.utils';
import type { Product } from '../../features/products/types/product.types';
import { MobileAppBar } from '../../components/layout/MobileAppBar';
import { useWishlist } from '../../features/wishlist/context/WishlistContext';

const MobileCollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionType = searchParams.get('collection'); // 'trending' | 'discounted'
  const { toggleWishlist, isWishlisted } = useWishlist();

  const limit = 50;
  const popularHook = usePopularProducts(limit);
  const discountHook = useDiscountedProducts(limit);

  const isTrending = collectionType === 'trending';
  const isDiscounted = collectionType === 'discounted';

  const products = isTrending ? popularHook.products : (isDiscounted ? discountHook.products : []);
  const loading = isTrending ? popularHook.loading : (isDiscounted ? discountHook.loading : false);

  const [, setCartCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<{title: string; desc: string} | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const loadCart = async () => {
    try {
      const cart = await fetchCart();
      if (cart && cart.items) {
        setCartCount(cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0));
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    setCartCount((prev) => prev + quantity);
    await addToCartApi({ productId: product.id, quantity });
    await loadCart();
    showToast(`${product.name.split(' ')[0]} added!`, 'Bakong KHQR checkout ready');
  };

  const title = isTrending ? "Trending Products" : (isDiscounted ? "Flash Sale" : "Products");

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-safe">
      <MobileAppBar title={title} showBackButton />

      <main className="pt-20 px-container-padding-mobile pb-12">
        {loading ? (
          <div className="grid grid-cols-2 gap-space-sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-surface-container h-64 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-sm">
            {products.map((product) => {
              const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) < 5;
              const inStock = (product.stock ?? 0) > 0;
              const originalPrice = product.price ? parsePrice(product.price) * 1.2 : 0;
              
              return (
                <div key={product.id} className="group relative flex flex-col rounded-xl bg-surface-container-low p-space-xs shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-highest flex items-center justify-center p-0">
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={product.name} src={product.images?.[0]?.imageUrl || "https://placehold.co/400?text=Product"} />
                    <div className="absolute top-space-2xs left-space-2xs">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-error-container/60 text-error font-label-sm text-label-sm backdrop-blur-md shadow-[0_0_10px_rgba(255,180,171,0.3)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                          Only {product.stock} Left
                        </span>
                      ) : inStock ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-tertiary-container/40 text-tertiary font-label-sm text-label-sm backdrop-blur-md shadow-[0_0_10px_rgba(78,222,163,0.35)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-high/60 text-outline font-label-sm text-label-sm backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }} aria-label="Favorite" className={`absolute top-space-2xs right-space-2xs w-7 h-7 rounded-full bg-surface-container-lowest/70 backdrop-blur-md flex items-center justify-center hover:text-error active:scale-90 transition-all ${isWishlisted(product.id) ? 'text-error' : 'text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isWishlisted(product.id) ? '"FILL" 1' : '"FILL" 0' }}>favorite</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-col flex-1 mt-space-xs">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-label-sm text-label-sm text-on-surface">{product.rating || 0}</span>
                    </div>
                    <h3 className="font-headline-sm text-body-md text-on-surface line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <div className="mt-auto pt-space-xs flex items-end justify-between">
                      <div className="min-w-0">
                        <div className="font-price-card text-price-card text-primary leading-tight">${parsePrice(product.price).toFixed(2)}</div>
                        {isDiscounted && <span className="font-label-sm text-label-sm text-outline-variant line-through">${originalPrice.toFixed(2)}</span>}
                      </div>
                      <button aria-label="Add to Cart" onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }} className="cart-btn shrink-0 w-8 h-8 rounded-lg bg-secondary hover:bg-secondary-fixed text-on-secondary flex items-center justify-center shadow-[0_0_14px_rgba(76,215,246,0.35)] active:scale-90 transition-all">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-4 z-50 flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-surface-container-high border border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-2xl p-space-sm flex items-center gap-space-sm min-w-[280px]">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">{toastMessage.title}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{toastMessage.desc}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCollectionPage;
