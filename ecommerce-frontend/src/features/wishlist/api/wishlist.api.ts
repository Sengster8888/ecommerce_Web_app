import { apiClient } from '../../../api/axios';
import type { Product } from '../../products/types/product.types';

export const fetchWishlist = async (): Promise<Product[]> => {
  const response = await apiClient.get('/wishlist');
  return response.data;
};

export const fetchWishlistIds = async (): Promise<string[]> => {
  const response = await apiClient.get('/wishlist/ids');
  return response.data;
};

export const addToWishlist = async (productId: string | number): Promise<void> => {
  await apiClient.post(`/wishlist/${productId}`);
};

export const removeFromWishlist = async (productId: string | number): Promise<void> => {
  await apiClient.delete(`/wishlist/${productId}`);
};
