import { apiClient } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';

export interface RatingSummary {
  averageRating: number;
  totalRatingsCount: number;
}

export interface Review {
  id: string | number;
  productId: string | number;
  userId: string;
  rating: number;
  createdAt: string;
}

export const submitProductRatingApi = async (
  productId: string | number,
  rating: number
): Promise<Review> => {
  const response = await apiClient.post<Review>(
    ENDPOINTS.REVIEWS.SUBMIT_RATING(productId),
    { rating }
  );
  return response.data;
};

export const getProductRatingSummaryApi = async (
  productId: string | number
): Promise<RatingSummary> => {
  try {
    const response = await apiClient.get<RatingSummary>(
      ENDPOINTS.REVIEWS.GET_SUMMARY(productId)
    );
    return response.data || { averageRating: 0, totalRatingsCount: 0 };
  } catch (error) {
    console.error('Failed to fetch rating summary:', error);
    return { averageRating: 0, totalRatingsCount: 0 };
  }
};
