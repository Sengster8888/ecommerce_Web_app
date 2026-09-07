import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsService } from './discounts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { DiscountScope, DiscountType } from './dto/create-discount.dto.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DiscountsService (Unified Discounts)', () => {
  let service: DiscountsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      discount: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      discountProduct: {
        deleteMany: vi.fn(),
      },
      discountCategory: {
        deleteMany: vi.fn(),
      },
      order: {
        count: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  describe('validateDiscount (PROMO_CODE Scope)', () => {
    it('should validate PERCENTAGE promo code discount successfully', async () => {
      prisma.discount.findUnique.mockResolvedValue({
        id: 1n,
        name: 'Summer Sale Promo',
        code: 'SUMMER20',
        scope: DiscountScope.PROMO_CODE,
        type: DiscountType.PERCENTAGE,
        value: new Decimal('20.00'),
        minimumOrderAmount: new Decimal('50.00'),
        maxDiscountAmount: null,
        usageLimit: 100,
        usageCount: 10,
        usageLimitPerUser: null,
        isActive: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });

      const result = await service.validateDiscount('summer20', 100);

      expect(result.code).toBe('SUMMER20');
      expect(result.discountAmount).toBe(20);
      expect(result.newSubtotal).toBe(80);
    });

    it('should apply maxDiscountAmount cap if calculated discount exceeds cap', async () => {
      prisma.discount.findUnique.mockResolvedValue({
        id: 2n,
        name: 'Big Spender Discount',
        code: 'BIG50',
        scope: DiscountScope.PROMO_CODE,
        type: DiscountType.PERCENTAGE,
        value: new Decimal('50.00'),
        minimumOrderAmount: new Decimal('100.00'),
        maxDiscountAmount: new Decimal('30.00'), // Cap at $30
        usageLimit: 100,
        usageCount: 0,
        usageLimitPerUser: null,
        isActive: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });

      const result = await service.validateDiscount('BIG50', 200); // 50% of 200 = 100, but capped at 30

      expect(result.discountAmount).toBe(30);
      expect(result.newSubtotal).toBe(170);
    });

    it('should throw BadRequestException if user exceeds per-user usage limit', async () => {
      prisma.discount.findUnique.mockResolvedValue({
        id: 3n,
        name: 'Single Use Coupon',
        code: 'ONCEONLY',
        scope: DiscountScope.PROMO_CODE,
        type: DiscountType.FIXED_AMOUNT,
        value: new Decimal('10.00'),
        minimumOrderAmount: new Decimal('0.00'),
        usageLimit: 100,
        usageCount: 5,
        usageLimitPerUser: 1,
        isActive: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });

      prisma.order.count.mockResolvedValue(1); // User already used it 1 time

      await expect(service.validateDiscount('ONCEONLY', 50, [], 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateDiscount (Automatic Store-Wide & Specific Scopes)', () => {
    it('should automatically select best ALL_PRODUCTS automatic discount when no code is passed', async () => {
      prisma.discount.findMany.mockResolvedValue([
        {
          id: 10n,
          name: 'Storewide 10% Off',
          scope: DiscountScope.ALL_PRODUCTS,
          type: DiscountType.PERCENTAGE,
          value: new Decimal('10.00'),
          minimumOrderAmount: new Decimal('0.00'),
          maxDiscountAmount: null,
          usageLimit: null,
          usageCount: 0,
          usageLimitPerUser: null,
          discountProducts: [],
          discountCategories: [],
        },
      ]);

      const result = await service.validateDiscount(undefined, 100);

      expect(result.discountId).toBe('10');
      expect(result.discountAmount).toBe(10);
      expect(result.newSubtotal).toBe(90);
    });

    it('should apply discount only to items matching SPECIFIC_PRODUCTS', async () => {
      prisma.discount.findMany.mockResolvedValue([
        {
          id: 20n,
          name: 'Product 1 Special Sale',
          scope: DiscountScope.SPECIFIC_PRODUCTS,
          type: DiscountType.PERCENTAGE,
          value: new Decimal('50.00'), // 50% off Product 1
          minimumOrderAmount: new Decimal('0.00'),
          maxDiscountAmount: null,
          usageLimit: null,
          usageCount: 0,
          usageLimitPerUser: null,
          discountProducts: [{ productId: 1n }],
          discountCategories: [],
        },
      ]);

      const cartItems = [
        { productId: 1n, unitPrice: 100, quantity: 1 }, // Eligible for 50% = 50 off
        { productId: 2n, unitPrice: 200, quantity: 1 }, // Ineligible
      ];

      const result = await service.validateDiscount(undefined, 300, cartItems);

      expect(result.discountAmount).toBe(50);
      expect(result.newSubtotal).toBe(250);
    });
  });

  describe('Admin Operations', () => {
    it('should create a promo code discount', async () => {
      prisma.discount.findUnique.mockResolvedValue(null);
      prisma.discount.create.mockResolvedValue({
        id: 1n,
        name: 'Welcome Coupon',
        code: 'WELCOME10',
        scope: DiscountScope.PROMO_CODE,
      });

      const dto = {
        name: 'Welcome Coupon',
        type: DiscountType.PERCENTAGE,
        scope: DiscountScope.PROMO_CODE,
        value: 10,
        code: 'welcome10',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
      };

      const result = await service.createDiscount(dto as any);
      expect(result.code).toBe('WELCOME10');
    });

    it('should prevent deleting discount linked to historical orders', async () => {
      prisma.discount.findUnique.mockResolvedValue({ id: 1n, name: 'Active Discount' });
      prisma.order.count.mockResolvedValue(3);

      await expect(service.deleteDiscount(1n)).rejects.toThrow(BadRequestException);
    });
  });
});
