import { apiClient } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';
import type {
  Product,
  Category,
  GetProductsParams,
  PaginatedProductsResult,
} from '../types/product.types';

export const fetchProducts = async (
  params?: GetProductsParams
): Promise<PaginatedProductsResult> => {
  const response = await apiClient.get<any>(ENDPOINTS.PRODUCTS.LIST, {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 16,
      categoryId: params?.categoryId === 'all' ? undefined : params?.categoryId,
      search: params?.search || undefined,
    },
  });

  const resData = response.data;

  // Handles NestJS return format: { data: [...], meta: { total, page, lastPage } }
  if (resData && Array.isArray(resData.data)) {
    return {
      items: resData.data,
      total: resData.meta?.total ?? resData.data.length,
      page: resData.meta?.page ?? 1,
      limit: params?.limit || 16,
      totalPages: resData.meta?.lastPage ?? 1,
    };
  }

  if (Array.isArray(resData)) {
    return {
      items: resData,
      total: resData.length,
      page: 1,
      limit: resData.length,
      totalPages: 1,
    };
  }

  return {
    items: resData?.items || [],
    total: resData?.total || 0,
    page: resData?.page || 1,
    limit: resData?.limit || 16,
    totalPages: resData?.totalPages || 1,
  };
};

export const fetchProductById = async (id: string | number): Promise<Product> => {
  const response = await apiClient.get<Product>(ENDPOINTS.PRODUCTS.DETAIL(String(id)));
  return response.data;
};

export const fetchProductBySlug = async (slug: string): Promise<Product> => {
  const response = await apiClient.get<Product>(`${ENDPOINTS.PRODUCTS.LIST}/slug/${slug}`);
  return response.data;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>(ENDPOINTS.PRODUCTS.CATEGORIES);
  return response.data;
};
