import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchWishlistIds, addToWishlist, removeFromWishlist } from '../api/wishlist.api';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface WishlistContextType {
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string | number) => Promise<void>;
  isWishlisted: (productId: string | number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    try {
      const ids = await fetchWishlistIds();
      setWishlistIds(new Set(ids.map(String)));
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const toggleWishlist = async (productId: string | number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const idStr = String(productId);
    const isCurrentlyWishlisted = wishlistIds.has(idStr);

    // Optimistic UI update
    setWishlistIds(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyWishlisted) {
        newSet.delete(idStr);
      } else {
        newSet.add(idStr);
      }
      return newSet;
    });

    try {
      if (isCurrentlyWishlisted) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      // Revert if API fails
      setWishlistIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyWishlisted) {
          newSet.add(idStr);
        } else {
          newSet.delete(idStr);
        }
        return newSet;
      });
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const isWishlisted = useCallback((productId: string | number) => {
    return wishlistIds.has(String(productId));
  }, [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isWishlisted, refreshWishlist: loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
