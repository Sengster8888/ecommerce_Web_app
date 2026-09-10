import { useState, useEffect, useCallback } from 'react';
import {
  fetchCart,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from '../api/cart.api';
import { validateDiscountApi } from '../../checkout/api/checkout.api';
import { parsePrice } from '../../../utils/price.utils';

export const exchangeRate = 4100; // 1 USD = 4,100 KHR

export const useCart = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | number | null>(null);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  const loadCartData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      if (data && data.items) {
        setCartItems(data.items);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error('Error loading cart data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartData();
  }, [loadCartData]);

  // Subtotal Calculation
  const subtotal = cartItems.reduce((acc, item) => {
    const price = parsePrice(item.product?.price || 0);
    return acc + price * item.quantity;
  }, 0);

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Grand Total Calculation
  const grandTotalUsd = Math.max(0, subtotal - discountAmount);
  const grandTotalKhr = Math.round(grandTotalUsd * exchangeRate);

  // Update Item Quantity
  const handleUpdateQuantity = async (itemId: string | number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdatingItemId(itemId);
    try {
      await updateCartItemApi(itemId, newQuantity);
      setCartItems((prev) =>
        prev.map((item) => (String(item.id) === String(itemId) ? { ...item, quantity: newQuantity } : item))
      );
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Remove Single Item
  const handleRemoveItem = async (itemId: string | number) => {
    setUpdatingItemId(itemId);
    try {
      await removeCartItemApi(itemId);
      setCartItems((prev) => prev.filter((item) => String(item.id) !== String(itemId)));
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Clear Entire Cart
  const handleClearCart = async () => {
    setLoading(true);
    try {
      await clearCartApi();
      setCartItems([]);
      setAppliedPromo(null);
      setDiscountAmount(0);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply Promo Voucher Code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(null);

    const itemsContext = cartItems.map((item) => ({
      productId: item.productId,
      categoryId: item.product?.categoryId,
      unitPrice: parsePrice(item.product?.price || 0),
      quantity: item.quantity,
    }));

    const result = await validateDiscountApi(promoCode.trim(), subtotal, itemsContext);
    if (result.isValid || result.discountAmount > 0) {
      setAppliedPromo(promoCode.trim().toUpperCase());
      setDiscountAmount(result.discountAmount);
      setPromoError(null);
    } else {
      setPromoError(result.message || 'Invalid or expired promo code.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCode('');
    setPromoError(null);
  };

  return {
    cartItems,
    loading,
    updatingItemId,
    subtotal,
    totalCount,
    discountAmount,
    grandTotalUsd,
    grandTotalKhr,
    promoCode,
    setPromoCode,
    appliedPromo,
    promoError,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleApplyPromo,
    handleRemovePromo,
    refreshCart: loadCartData,
  };
};
