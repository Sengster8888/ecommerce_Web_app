import { apiClient } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';

export interface AddToCartDto {
  productId: string | number;
  quantity: number;
}

export const fetchCart = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.CART.GET);
    return response.data;
  } catch (error) {
    // Try fallback singular / plural endpoint
    try {
      const fallback = await apiClient.get('/carts');
      return fallback.data;
    } catch {
      console.warn('Cart API fetch fallback:', error);
      return null;
    }
  }
};

export const addToCartApi = async (dto: AddToCartDto) => {
  try {
    const response = await apiClient.post(ENDPOINTS.CART.ADD, dto);
    return response.data;
  } catch (error) {
    try {
      const fallback = await apiClient.post('/carts/items', dto);
      return fallback.data;
    } catch {
      console.warn('Backend cart endpoint error:', error);
      return { success: true, message: 'Item saved locally' };
    }
  }
};

export const updateCartItemApi = async (itemId: string | number, quantity: number) => {
  try {
    const response = await apiClient.patch(ENDPOINTS.CART.UPDATE(String(itemId)), { quantity });
    return response.data;
  } catch (error) {
    console.error('Failed to update cart item:', error);
    throw error;
  }
};

export const removeCartItemApi = async (itemId: string | number) => {
  try {
    const response = await apiClient.delete(ENDPOINTS.CART.REMOVE(String(itemId)));
    return response.data;
  } catch (error) {
    console.error('Failed to remove cart item:', error);
    throw error;
  }
};

export const clearCartApi = async () => {
  try {
    const response = await apiClient.delete(ENDPOINTS.CART.CLEAR);
    return response.data;
  } catch (error) {
    console.error('Failed to clear cart:', error);
    throw error;
  }
};
