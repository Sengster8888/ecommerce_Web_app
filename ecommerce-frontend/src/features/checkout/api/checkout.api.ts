import { apiClient } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';
import type {
  Address,
  CreateAddressDto,
  CheckoutPayload,
  OrderResult,
  DiscountValidationResult,
} from '../types/checkout.types';

export const fetchUserAddresses = async (): Promise<Address[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.ADDRESSES.LIST);
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch addresses:', error);
    return [];
  }
};

export const createAddressApi = async (dto: CreateAddressDto): Promise<Address | null> => {
  try {
    const response = await apiClient.post(ENDPOINTS.ADDRESSES.CREATE, dto);
    return response.data;
  } catch (error) {
    console.error('Failed to create address:', error);
    throw error;
  }
};

export const validateDiscountApi = async (
  code: string,
  cartSubtotal: number,
  cartItems: any[]
): Promise<DiscountValidationResult> => {
  try {
    const response = await apiClient.post(ENDPOINTS.DISCOUNTS.VALIDATE, {
      code,
      cartSubtotal,
      cartItems,
    });
    return response.data;
  } catch (error: any) {
    return {
      isValid: false,
      discountAmount: 0,
      message: error.response?.data?.message || 'Invalid or expired coupon code.',
    };
  }
};

export const submitCheckoutApi = async (payload: CheckoutPayload): Promise<OrderResult> => {
  const response = await apiClient.post(ENDPOINTS.ORDERS.CHECKOUT, payload);
  return response.data;
};
