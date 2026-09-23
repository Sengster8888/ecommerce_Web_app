import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useProducts } from '../../features/products/hooks/useProducts';
import { fetchCart, addToCartApi } from '../../features/cart/api/cart.api';
import { parsePrice } from '../../utils/price.utils';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Product } from '../../features/products/types/product.types';

const MobileCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { user } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  const { products, loading: loadingProducts, total: totalProducts, setParams } = useProducts({ page: 1, limit: 50 });

  const [cartCount, setCartCount] = useState(0);
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

  const [countdown, setCountdown] = useState({ hours: '08', minutes: '42', seconds: '17' });

  // Simulate countdown for banner
  useEffect(() => {
    let seconds = 8 * 3600 + 42 * 60 + 17;
    const interval = setInterval(() => {
      if (seconds > 0) {
        seconds--;
        setCountdown({
          hours: String(Math.floor(seconds / 3600)).padStart(2, '0'),
          minutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'),
          seconds: String(seconds % 60).padStart(2, '0')
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setParams({
      page: 1,
      limit: 50,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery.trim() || undefined,
    });
  }, [selectedCategory, searchQuery, setParams]);

  // Derived icon for category pills
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('audio') || n.includes('headphone') || n.includes('sound')) return 'headphones';
    if (n.includes('phone') || n.includes('mobile')) return 'smartphone';
    if (n.includes('laptop') || n.includes('computer')) return 'laptop_mac';
    if (n.includes('watch') || n.includes('wearable')) return 'watch';
    if (n.includes('home') || n.includes('smart')) return 'home_iot_device';
    if (n.includes('game') || n.includes('console')) return 'sports_esports';
    if (n.includes('cloth') || n.includes('fashion') || n.includes('apparel')) return 'checkroom';
    if (n.includes('electronic') || n.includes('device')) return 'devices';
    return 'category';
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] pt-safe">
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
                  placeholder="Search products..."
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
              <div className="flex items-center gap-space-xs">
                <img 
                  alt="Brand logo" 
                  className="h-8 w-auto object-contain" 
                  src="https://res.cloudinary.com/twnsqgoa/image/upload/v1790070307/Untitled_design.png" 
                />
                <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface ml-space-2xs truncate max-w-[120px]">
                  Product Catalog
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button aria-label="Search catalog" className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-secondary active:scale-95 transition-all rounded-full" onClick={() => setIsSearchVisible(true)}>
                  <span className="material-symbols-outlined text-[24px]">search</span>
                </button>
                <div className="flex items-center justify-center pl-space-2xs cursor-pointer" onClick={() => navigate('/profile')}>
                  <img 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-outline-variant/30 bg-surface-container" 
                    src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || user?.fullName || 'Guest'}`} 
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface flex-1">
        <div className="flex flex-col w-full">
          
          {/* Interactive Category Scroll Bar */}
          <section className="w-full px-container-padding-mobile py-space-xs overflow-x-auto no-scrollbar flex items-center gap-space-xs">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`px-space-md py-space-xs rounded-full font-label-md text-label-md shrink-0 flex items-center gap-space-2xs transition-all ${selectedCategory === 'all' ? 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(128,131,255,0.45)]' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[16px]">widgets</span>
              <span>All Items ({totalProducts || 0})</span>
            </button>
            {categories?.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-space-md py-space-xs rounded-full font-label-md text-label-md shrink-0 flex items-center gap-space-2xs transition-all ${selectedCategory === String(cat.id) ? 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(128,131,255,0.45)]' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-[16px]">{getCategoryIcon(cat.name)}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </section>

          {/* Product Catalog Grid */}
          <section className="px-container-padding-mobile pb-space-2xl">
            <div className="grid grid-cols-2 gap-space-xs">
              {loadingProducts ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-surface-container-low animate-pulse p-space-xs border border-white/5"></div>
                ))
              ) : products.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <span className="material-symbols-outlined text-[48px] text-outline mb-2">search_off</span>
                  <p className="text-on-surface-variant font-body-sm">No products found.</p>
                </div>
              ) : products.map((product) => {
                const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) < 5;
                const inStock = (product.stock ?? 0) > 0;
                
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
                    <button aria-label="Favorite" className="absolute top-space-2xs right-space-2xs w-7 h-7 rounded-full bg-surface-container-lowest/70 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-error active:scale-90 transition-all">
                      <span className="material-symbols-outlined text-[16px]">favorite</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-col flex-1 mt-space-xs">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-label-sm text-label-sm text-on-surface">{product.rating || 0}</span>
                      <span className="font-body-sm text-[11px] text-outline">({product.reviewCount || 0})</span>
                    </div>
                    <h3 className="font-headline-sm text-body-md text-on-surface line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <div className="mt-auto pt-space-xs flex items-end justify-between">
                      <div className="min-w-0">
                        <div className="font-price-card text-price-card text-primary leading-tight">${parsePrice(product.price).toFixed(2)}</div>
                      </div>
                      <button aria-label="Add to Cart" onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }} className="cart-btn shrink-0 w-8 h-8 rounded-lg bg-secondary hover:bg-secondary-fixed text-on-secondary flex items-center justify-center shadow-[0_0_14px_rgba(76,215,246,0.35)] active:scale-90 transition-all">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </section>

          {/* Sticky Floating Filter / Sort Action Pill */}
          {/* <aside className="fixed bottom-20 inset-x-0 z-40 flex justify-center pointer-events-none px-container-padding-mobile">
            <button className="pointer-events-auto px-space-md py-space-xs rounded-full bg-surface-container-highest/90 backdrop-blur-xl text-on-surface font-label-md text-label-md flex items-center gap-space-xs shadow-[0_8px_30px_rgba(0,0,0,0.7)] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
              <span>Filter & Sort</span>
              <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-[10px] flex items-center justify-center font-bold">2</span>
            </button>
          </aside> */}

          {/* Toast Notification */}
          <div className={`fixed top-20 inset-x-4 z-50 transform transition-all duration-300 flex items-center justify-between p-space-sm rounded-xl bg-surface-container-highest shadow-[0_12px_32px_rgba(0,0,0,0.8)] ${toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-space-xs">
              <span className="w-7 h-7 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-[13px] text-on-surface">{toastMessage?.title}</span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">{toastMessage?.desc}</span>
              </div>
            </div>
            <span className="font-label-sm text-secondary font-semibold cursor-pointer" onClick={() => navigate('/cart')}>VIEW CART</span>
          </div>

        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-low/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">home</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Home</span>
          </a>
          <a aria-current="page" className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 group text-primary [&>div]:bg-primary/10 [&>div]:scale-105" href="#">
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

    </div>
  );
};

export default MobileCatalogPage;
