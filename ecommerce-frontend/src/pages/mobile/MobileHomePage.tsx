import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, usePopularProducts, useDiscountedProducts, useProducts } from '../../features/products/hooks/useProducts';
import { fetchCart, addToCartApi } from '../../features/cart/api/cart.api';
import { parsePrice } from '../../utils/price.utils';
import { ToastNotification } from '../../components/storefront/ToastNotification';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Product } from '../../features/products/types/product.types';

export const MobileHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { products: popularProducts, loading: loadingPopular } = usePopularProducts(10);
  const { products: discountedProducts, loading: loadingDiscounted } = useDiscountedProducts(10);
  const { products, loading: loadingProducts, total: totalProducts, setParams } = useProducts({ page: 1, limit: 16 });
  const { user } = useAuth();

  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);

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
    showToast(`${product.name} added to bag!`);
  };

  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    if (!discountedProducts || discountedProducts.length === 0) return;
    const endDates = discountedProducts
      .filter((p) => p.discountEndDate)
      .map((p) => new Date(p.discountEndDate as string).getTime());
    
    if (endDates.length === 0) return;
    
    const closestEnd = Math.min(...endDates);
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      let totalSeconds = Math.floor((closestEnd - now) / 1000);
      if (totalSeconds > 0) {
        setCountdown({
          hours: String(Math.floor(totalSeconds / 3600)).padStart(2, '0'),
          minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
          seconds: String(totalSeconds % 60).padStart(2, '0')
        });
      } else {
        setCountdown({ hours: '00', minutes: '00', seconds: '00' });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [discountedProducts]);

  // const getCategoryIcon = (name: string) => {
  //   const n = name.toLowerCase();
  //   if (n.includes('audio') || n.includes('headphone') || n.includes('sound')) return 'headphones';
  //   if (n.includes('phone') || n.includes('mobile')) return 'smartphone';
  //   if (n.includes('laptop') || n.includes('computer')) return 'laptop_mac';
  //   if (n.includes('watch') || n.includes('wearable')) return 'watch';
  //   if (n.includes('home') || n.includes('smart')) return 'home_iot_device';
  //   if (n.includes('game') || n.includes('console')) return 'sports_esports';
  //   return 'category';
  // };

  useEffect(() => {
    setParams({
      page: 1,
      limit: 16,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery.trim() || undefined,
    });
  }, [selectedCategory, searchQuery, setParams]);

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md flex flex-col min-h-screen selection:bg-primary selection:text-on-primary">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] pt-safe">
        <div className="h-16 px-container-padding-mobile flex items-center justify-between">
          {isSearchVisible ? (
            <div className="flex items-center w-full gap-space-xs">
              <div className="relative flex items-center flex-1 h-10">
                <div className="absolute left-3 flex items-center pointer-events-none text-outline-variant">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  autoFocus
                  className="w-full h-full pl-10 pr-10 rounded-full bg-surface-container-high text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none transition-all"
                  placeholder="Search gadgets, headphones, laptops..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 flex items-center justify-center text-outline-variant hover:text-on-surface active:scale-95"
                    onClick={() => setSearchQuery('')}
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
              <button 
                className="text-secondary font-label-md shrink-0 active:opacity-70 px-2" 
                onClick={() => { setIsSearchVisible(false); setSearchQuery(''); }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-space-sm min-w-0 flex-1 cursor-pointer" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                <img 
                  alt="Brand logo" 
                  className="h-32 w-auto object-contain flex-shrink-0 rounded-md" 
                  src="https://res.cloudinary.com/twnsqgoa/image/upload/v1790070307/Untitled_design.png" 
                />
              </div>
              <div className="flex items-center gap-space-xs flex-shrink-0">
                <button aria-label="Search catalog" className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-secondary active:scale-95 transition-all rounded-full" onClick={() => setIsSearchVisible(true)}>
                  <span className="material-symbols-outlined text-[24px]">search</span>
                </button>
                <div className="pl-space-2xs cursor-pointer flex items-center justify-center" onClick={() => navigate('/profile')}>
                  <img 
                    alt="Profile" 
                    src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || user?.fullName || 'Guest'}`} 
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-outline-variant/30 bg-surface-container"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full space-y-space-lg px-container-padding-mobile pb-space-xl">
          


          {/* WATER FESTIVAL BANNER */}
          {/* <section className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br from-surface-container to-surface-container-low shadow-xl flex items-center justify-center">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-secondary/15 blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/20 blur-xl pointer-events-none"></div>
            <h3 className="text-xl font-headline-md font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary relative z-10">Water Festival Sale!</h3>
          </section> */}

          {/* FLASH DEALS */}
          {!searchQuery && (
            <section className="flex flex-col space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-error-container text-error shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Discount</h3>
                  <div className="px-2 py-0.5 rounded-full bg-surface-container text-error font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    <span>{countdown.hours}:{countdown.minutes}:{countdown.seconds}</span>
                  </div>
                </div>
                <a className="font-label-sm text-label-sm text-secondary font-semibold hover:underline" href="#">See All →</a>
              </div>
              
              <div className="flex gap-space-sm overflow-x-auto no-scrollbar py-1 -mx-container-padding-mobile px-container-padding-mobile">
                {loadingDiscounted ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-48 h-64 flex-shrink-0 rounded-xl bg-surface-container animate-pulse"></div>
                  ))
                ) : (discountedProducts || []).slice(0, 5).map((p) => {
                  const hasDiscount = p.discountPercentage && p.discountPercentage > 0;
                  const discountPct = p.discountPercentage || 0;
                  const originalPrice = hasDiscount ? (parsePrice(p.price) / (1 - discountPct / 100)).toFixed(0) : 0;
                  
                  return (
                    <div key={p.id} className="w-48 flex-shrink-0 p-3 rounded-xl bg-surface-container flex flex-col justify-between space-y-2 shadow-lg relative group cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                      {hasDiscount ? <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-error text-on-error font-label-sm text-label-sm font-bold">-{discountPct}%</div> : null}
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center">
                        <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={p.name} src={p.images?.[0]?.imageUrl || "https://placehold.co/400?text=Product"} />
                      </div>
                      <div className="space-y-1">
                        <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">{p.brand || 'Store'}</span>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">{p.name}</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="font-price-card text-price-card text-secondary font-bold">${p.price}</span>
                          {hasDiscount ? <span className="font-label-sm text-label-sm text-outline-variant line-through">${originalPrice}</span> : null}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} className="w-full h-9 mt-1 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center justify-center gap-1 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add to Bag</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          

          {/* TRENDING PRODUCTS */}
          {!searchQuery && (
            <section className="flex flex-col space-y-space-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Products Trending
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Curated for tech lovers & creators
                  </p>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm flex items-center gap-1">
                  <span>Popular</span>
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                </button>
              </div>
              
              <div className="flex gap-space-sm overflow-x-auto no-scrollbar py-1 -mx-container-padding-mobile px-container-padding-mobile">
                {loadingPopular ? (
                   Array.from({ length: 4 }).map((_, i) => (
                     <div key={i} className="w-44 h-64 flex-shrink-0 rounded-xl bg-surface-container animate-pulse"></div>
                   ))
                ) : (popularProducts || []).map((p) => (
                <div key={p.id} className="w-44 flex-shrink-0 p-3 rounded-xl bg-surface-container flex flex-col justify-between space-y-2 shadow-md hover:shadow-xl transition-all relative cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest">
                    <img className="w-full h-full object-cover" alt={p.name} src={p.images?.[0]?.imageUrl || "https://placehold.co/400?text=Product"} />
                    <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-high/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[16px]">favorite</span>
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">{p.rating || '4.9'}</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">{p.name}</h4>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                      <span className="font-price-card text-price-card text-on-surface font-bold">${p.price}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} aria-label="Add to cart" className="w-10 h-10 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container flex items-center justify-center active:scale-90 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}

          {/* CATEGORIES */}
          <section className="flex flex-col space-y-space-xs pt-2">
            <div className="flex gap-space-sm overflow-x-auto no-scrollbar py-1 -mx-container-padding-mobile px-container-padding-mobile">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-colors border ${selectedCategory === 'all' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low hover:text-on-surface'}`}
              >
                All Products ({totalProducts || 0})
              </button>
              {categories?.map((cat) => (
                <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-colors border ${selectedCategory === String(cat.id) ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low hover:text-on-surface'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>

          {/* ALL PRODUCTS (or Search Results) */}
          <section className="flex flex-col space-y-space-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {(searchQuery || selectedCategory !== 'all') ? 'Search Results' : 'All Products'}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {totalProducts || 0} items found
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-space-sm">
              {loadingProducts ? (
                 Array.from({ length: 4 }).map((_, i) => (
                   <div key={i} className="h-64 rounded-xl bg-surface-container animate-pulse"></div>
                 ))
              ) : products.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <span className="material-symbols-outlined text-[48px] text-outline mb-2">search_off</span>
                  <p className="text-on-surface-variant font-body-sm">No products found.</p>
                </div>
              ) : products.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-surface-container flex flex-col justify-between space-y-2 shadow-md hover:shadow-xl transition-all relative cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest">
                    <img className="w-full h-full object-cover" alt={p.name} src={p.images?.[0]?.imageUrl || "https://placehold.co/400?text=Product"} />
                    <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-high/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[16px]">favorite</span>
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">{p.rating || '4.9'}</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">{p.name}</h4>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                      <span className="font-price-card text-price-card text-on-surface font-bold">${p.price}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} aria-label="Add to cart" className="w-10 h-10 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container flex items-center justify-center active:scale-90 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TELEGRAM BANNER */}
          <section className="w-full rounded-xl bg-surface-container-high p-space-md flex items-center gap-space-sm shadow-lg relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-secondary/15 flex-shrink-0 flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(76,215,246,0.3)]">
              <span className="material-symbols-outlined text-[26px]">support_agent</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">Phnom Penh Concierge</h4>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">
                Need quick advice? Chat live with our team on Telegram 24/7 (Khmer & English).
              </p>
            </div>
            <a className="h-10 px-3.5 rounded-xl bg-secondary hover:bg-secondary-fixed-dim text-on-secondary font-label-sm text-label-sm font-bold flex items-center gap-1 flex-shrink-0 active:scale-95 transition-all shadow-md" href="https://t.me/" rel="noopener noreferrer" target="_blank">
              <span>Chat</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </a>
          </section>

        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-low/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          <a aria-current="page" className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 group text-primary [&>div]:bg-primary/10 [&>div]:scale-105" href="#">
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">home</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Home</span>
          </a>
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/products'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">grid_view</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Catalog</span>
          </a>
          <a className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/cart'); }}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-container text-on-secondary font-label-sm text-label-sm leading-none flex items-center justify-center font-bold shadow-[0_0_12px_rgba(3,181,211,0.5)]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Cart</span>
          </a>
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/orders'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">receipt_long</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Orders</span>
          </a>
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">person</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Profile</span>
          </a>
        </div>
      </nav>

      <ToastNotification message={toastMessage} isVisible={isToastVisible} />
    </div>
  );
};

export default MobileHomePage;
