import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchCart } from '../../features/cart/api/cart.api';

const navItems = [
  { id: 'home', label: 'Home', icon: 'home', path: '/' },
  { id: 'products', label: 'Catalog', icon: 'grid_view', path: '/products' },
  { id: 'cart', label: 'Cart', icon: 'shopping_bag', path: '/cart' },
  { id: 'orders', label: 'Orders', icon: 'local_shipping', path: '/orders' },
  { id: 'profile', label: 'Profile', icon: 'person', path: '/profile' },
];

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const cart = await fetchCart();
        if (cart && cart.items) {
          setCartCount(cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0));
        }
      } catch (err) { }
    };
    loadCart();
  }, [location.pathname]); // Refresh cart when navigating

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-low/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.7)] md:hidden">
      <div className="flex justify-around items-center h-16 px-space-xs">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 group ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
                <motion.span
                  whileTap={{ scale: 0.85 }}
                  className="material-symbols-outlined text-[22px] z-10"
                >
                  {item.icon}
                </motion.span>

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-full scale-105"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Cart Badge */}
                {item.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-container text-on-secondary font-label-sm text-label-sm leading-none flex items-center justify-center font-bold shadow-[0_0_12px_rgba(3,181,211,0.5)] z-20">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-label-sm text-label-sm font-medium tracking-tight">
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
