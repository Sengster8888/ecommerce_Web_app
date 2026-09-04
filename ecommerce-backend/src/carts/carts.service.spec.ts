import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

import { vi } from 'vitest';

describe('CartsService - Stock Check Verification', () => {
  let service: CartsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findUnique: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
    },
    cartItem: {
      upsert: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('❌ Should throw BadRequestException if requested quantity exceeds product stock', async () => {
    // Mock standard product with low stock
    mockPrismaService.product.findUnique.mockResolvedValue({
      id: BigInt(1),
      name: 'Test Product',
      stock: 5, // Only 5 items in stock
      status: 'active',
    });

    // Mock existing cart with no items
    mockPrismaService.cart.findUnique.mockResolvedValue({
      id: BigInt(1),
      userId: 'user-uuid',
      items: [],
    });

    await expect(
      service.addItemToCart('user-uuid', { productId: '1', quantity: 10 }), // Requesting 10 items
    ).rejects.toThrow(BadRequestException);
  });
});
