import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, fetchProductById, fetchCategories } from '../api/products.api';
import type {
  Product,
  Category,
  GetProductsParams,
  PaginatedProductsResult,
} from '../types/product.types';

export function useProducts(initialParams?: GetProductsParams) {
  const [params, setParams] = useState<GetProductsParams>(initialParams || { page: 1, limit: 12 });
  const [data, setData] = useState<PaginatedProductsResult>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProducts(params);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load products from backend:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to connect to catalog API');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products: data.items,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
    loading,
    error,
    params,
    setParams,
    refetch: loadProducts,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchCategories()
      .then((res) => {
        if (isMounted) setCategories(res || []);
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'Failed to fetch categories');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, loading, error };
}

export function useProductDetail(id: string | number | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchProductById(id)
      .then((data) => {
        if (isMounted) setProduct(data);
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'Failed to fetch product details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { product, loading, error };
}
