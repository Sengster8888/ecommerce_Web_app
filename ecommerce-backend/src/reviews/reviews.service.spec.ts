import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findUnique: vi.fn(),
      },
      order: {
        findFirst: vi.fn(),
      },
      review: {
        findUnique: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('submitProductRating', () => {
    it('should submit rating successfully for verified purchase with DELIVERED status', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 1n, name: 'Sample Watch' });
      prisma.order.findFirst.mockResolvedValue({ id: 10n, status: 'DELIVERED' });
      prisma.review.findUnique.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue({
        id: 100n,
        userId: 'user-uuid-1',
        productId: 1n,
        rating: 5,
      });

      const result = await service.submitProductRating('user-uuid-1', 1n, 5);

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid-1',
          status: 'DELIVERED',
          items: {
            some: {
              productId: 1n,
            },
          },
        },
      });
      expect(result.rating).toBe(5);
    });

    it('should throw BadRequestException if customer has not purchased the product or status is not DELIVERED', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 1n });
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.submitProductRating('user-uuid-1', 1n, 4),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user has already rated the product', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 1n });
      prisma.order.findFirst.mockResolvedValue({ id: 10n, status: 'DELIVERED' });
      prisma.review.findUnique.mockResolvedValue({ id: 50n, rating: 4 });

      await expect(
        service.submitProductRating('user-uuid-1', 1n, 5),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProductRatingSummary', () => {
    it('should calculate average rating and count', async () => {
      prisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.66666 },
        _count: { rating: 3 },
      });

      const summary = await service.getProductRatingSummary(1n);

      expect(summary.averageRating).toBe(4.7);
      expect(summary.totalRatingsCount).toBe(3);
    });
  });
});
