export interface Category {
  id: string | number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentCategoryId?: string | number | null;
  subCategories?: Category[];
}

export interface ProductImage {
  id: string | number;
  productId?: string | number;
  imageUrl: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface Product {
  id: string | number;
  categoryId: string | number;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock' | string;
  category?: Category;
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;

  // Visual/Storefront enriched fields (fallback values supplied if not in DB)
  rating?: number;
  reviewCount?: number;
  expressDelivery?: boolean;
  warranty?: string;
  brand?: string;
  specs?: string[];
  colorOptions?: { name: string; hex: string }[];
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  sortBy?: 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';
  priceTier?: 'all' | 'under100' | '100-500' | '500-1500' | 'above1500';
  brand?: string;
  inStockOnly?: boolean;
}

export interface PaginatedProductsResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
