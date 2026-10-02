import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { ProductCard } from '../components/storefront/ProductCard';
import { fetchWishlist } from '../features/wishlist/api/wishlist.api';
import type { Product } from '../features/products/types/product.types';
import { ToastNotification } from '../components/storefront/ToastNotification';
import { useAuth } from '../features/auth/hooks/useAuth';
import { fetchCart, addToCartApi } from '../features/cart/api/cart.api';
import { MobileAppBar } from '../components/layout/MobileAppBar';
import { useIsMobile } from '../hooks/useIsMobile';

export const WishlistPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [, setCartCount] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
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
    if (!user) {
      navigate('/login');
      return;
    }

    const loadFavorites = async () => {
      try {
        const data = await fetchWishlist();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load wishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFavorites();
    loadCart();
  }, [user, navigate]);

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    setCartCount((prev) => prev + quantity);
    await addToCartApi({ productId: product.id, quantity });
    await loadCart();
    showToast(`${product.name.split(' ')[0]} added to cart!`);
  };

  const MobileView = () => (
    <div className="bg-surface text-on-surface min-h-screen pb-safe">
      <MobileAppBar title="My Favorites" showBackButton />
      <main className="pt-20 px-container-padding-mobile pb-12">
        {loading ? (
          <div className="flex items-center justify-center pt-20"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center">
            <span className="material-symbols-outlined text-[64px] text-outline mb-4">favorite_border</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">No favorites yet</h2>
            <p className="font-body-md text-on-surface-variant mt-2 max-w-[250px]">Tap the heart icon on any product to save it here.</p>
            <button onClick={() => navigate('/products')} className="mt-8 px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-fixed-dim transition-colors">Start Shopping</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-sm">
            {products.map(p => (
              <ProductCard 
                key={p.id}
                product={p}
                onQuickView={() => navigate(`/products/${p.id}`)}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>
      <ToastNotification message={toastMessage || ''} isVisible={isToastVisible} />
    </div>
  );

  const DesktopView = () => (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <StorefrontHeader />
      <main className="w-full pt-28 pb-12 flex-1 relative z-10 flex flex-col">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              My Favorites
            </h1>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container h-80 rounded-2xl"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-low rounded-2xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-[64px] text-outline mb-4">favorite_border</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Your wishlist is empty</h2>
              <p className="font-body-md text-on-surface-variant mt-2 max-w-sm">Keep track of items you love by tapping the heart icon.</p>
              <button onClick={() => navigate('/products')} className="mt-8 px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-fixed-dim transition-colors">Browse Products</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onQuickView={() => navigate(`/products/${product.id}`)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <StorefrontFooter />
      <ToastNotification message={toastMessage || ''} isVisible={isToastVisible} />
    </div>
  );

  return isMobile ? <MobileView /> : <DesktopView />;
};

export default WishlistPage;
