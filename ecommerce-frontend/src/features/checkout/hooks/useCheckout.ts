import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCart } from '../../cart/api/cart.api';
import {
  fetchUserAddresses,
  createAddressApi,
  validateDiscountApi,
  submitCheckoutApi,
} from '../api/checkout.api';
import type { Address, CreateAddressDto, CheckoutPaymentMethod } from '../types/checkout.types';
import { parsePrice } from '../../../utils/price.utils';

export const exchangeRate = 4100; // 1 USD = 4,100 KHR

export const useCheckout = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | number | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('khqr');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // New Address Form State
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState<CreateAddressDto>({
    label: 'Home',
    recipientName: '',
    phone: '',
    province: 'Phnom Penh',
    city: '',
    commune: '',
    streetLine: '',
    isDefault: false,
  });

  const loadCheckoutData = useCallback(async () => {
    setCartLoading(true);
    try {
      const [cartData, addressList] = await Promise.all([
        fetchCart(),
        fetchUserAddresses(),
      ]);

      if (cartData && cartData.items) {
        setCartItems(cartData.items);
      } else {
        setCartItems([]);
      }

      if (addressList && addressList.length > 0) {
        setAddresses(addressList);
        const defaultAddr = addressList.find((a) => a.isDefault) || addressList[0];
        setSelectedAddressId(defaultAddr.id);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Error loading checkout data:', err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  // Subtotal Calculation
  const subtotal = cartItems.reduce((acc, item) => {
    const price = parsePrice(item.product?.price || 0);
    return acc + price * item.quantity;
  }, 0);

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Shipping Fee (Flat rate $0.00 / Free shipping)
  const shippingFee = 0;

  // Final Total
  const finalTotalUsd = Math.max(0, subtotal - discountAmount + shippingFee);
  const finalTotalKhr = Math.round(finalTotalUsd * exchangeRate);

  // Promo Code Validation
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

  // Add Address Handler
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrForm.recipientName || !newAddrForm.phone || !newAddrForm.streetLine || !newAddrForm.city) {
      alert('Please fill in all required address fields.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const created = await createAddressApi(newAddrForm);
      if (created) {
        setAddresses((prev) => [...prev, created]);
        setSelectedAddressId(created.id);
        setShowNewAddressForm(false);
        setNewAddrForm({
          label: 'Home',
          recipientName: '',
          phone: '',
          province: 'Phnom Penh',
          city: '',
          commune: '',
          streetLine: '',
          isDefault: false,
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Submit Order Checkout
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setSubmitError('Please select or add a delivery address to proceed.');
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await submitCheckoutApi({
        addressId: selectedAddressId,
        paymentMethod,
        promoCode: appliedPromo || undefined,
      });

      // Redirect to Order Detail / Confirmation page
      if (order && order.id) {
        navigate(`/orders/${order.id}`);
      } else {
        navigate('/orders');
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    cartItems,
    cartLoading,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    appliedPromo,
    discountAmount,
    promoError,
    subtotal,
    totalCount,
    shippingFee,
    finalTotalUsd,
    finalTotalKhr,
    handleApplyPromo,
    handleRemovePromo,
    showNewAddressForm,
    setShowNewAddressForm,
    newAddrForm,
    setNewAddrForm,
    handleCreateAddress,
    isSavingAddress,
    handlePlaceOrder,
    isSubmitting,
    submitError,
  };
};
