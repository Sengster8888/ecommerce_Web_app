import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProductRating(userId: string, productId: bigint, rating: number) {
    // 1. Verify that the product actually exists
    const productExists = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExists) {
      throw new BadRequestException('Product not found.');
    }

    // 2. Verified Purchase check: Look for a completed, delivered order containing this product
    const verifiedPurchase = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED', // Only buyers with finalized, delivered orders can rate
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!verifiedPurchase) {
      throw new BadRequestException(
        'You can only rate products that you have purchased and have been successfully delivered.',
      );
    }

    // 3. Double-submission prevention check
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already rated this product.');
    }

    // 4. Record the verified rating
    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
      },
    });
  }

  // Calculate moving average rating for catalog display
  async getProductRatingSummary(productId: bigint) {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      averageRating: aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : 0,
      totalRatingsCount: aggregate._count.rating,
    };
  }
}
