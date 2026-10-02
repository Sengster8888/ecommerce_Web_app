import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePopularProducts, useDiscountedProducts } from '../features/products/hooks/useProducts';
import { fetchCart, addToCartApi } from '../features/cart/api/cart.api';
import type { Product } from '../features/products/types/product.types';

import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { ProductCard } from '../components/storefront/ProductCard';
import { ToastNotification } from '../components/storefront/ToastNotification';

const CollectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const collectionType = searchParams.get('collection');
  
  const title = collectionType === 'trending' ? 'Trending Products' : 
               (collectionType === 'discounted' ? 'Flash Sale' : 'Products');

  const limit = 50;
  const popularHook = usePopularProducts(limit);
  const discountHook = useDiscountedProducts(limit);

  const isTrending = collectionType === 'trending';
  const isDiscounted = collectionType === 'discounted';

  const products = isTrending ? popularHook.products : (isDiscounted ? discountHook.products : []);
  const loading = isTrending ? popularHook.loading : (isDiscounted ? discountHook.loading : false);

  const [, setCartCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);

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
    loadCart();
  }, []);

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    setCartCount((prev) => prev + quantity);
    await addToCartApi({ productId: product.id, quantity });
    await loadCart();
    showToast(`${product.name} added to cart!`);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <StorefrontHeader />
      
      <main className="w-full pt-28 pb-12 flex-1 relative z-10 flex flex-col">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              {title}
            </h1>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container h-80 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onQuickView={() => {}} // Desktop feature, could wire up if needed
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <StorefrontFooter />

      <ToastNotification 
        isVisible={isToastVisible} 
        message={toastMessage || ''} 
      />
    </div>
  );
};

export default CollectionPage;
