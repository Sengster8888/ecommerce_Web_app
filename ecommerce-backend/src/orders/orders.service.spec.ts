import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import { vi } from 'vitest';

describe('Order Creation Concurrency (Race Condition Test)', () => {
  let ordersService: OrdersService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService, 
        PrismaService,
        {
          provide: TelegramService,
          useValue: {
            sendOrderNotification: vi.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    ordersService = moduleRef.get<OrdersService>(OrdersService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  it('🔒 Should confirm exactly one order and block the second with stock error', async () => {
    // 1. Setup Test Data (Category, Product, Users, Addresses, Carts)
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-cat-' + Date.now(),
      }
    });

    const testProduct = await prisma.product.create({
      data: {
        name: 'Limited Edition Silk Scarves',
        slug: 'limited-silk-scarves-' + Date.now(),
        description: 'Authentic Cambodian silk.',
        price: 45.00,
        stock: 1, // Crucial: Only 1 item
        status: 'active',
        categoryId: testCategory.id, 
      },
    });

    const userA = await prisma.user.create({
      data: {
        name: 'Test User A',
        email: `testa-${Date.now()}@example.com`,
        role: 'customer',
        addresses: {
          create: {
            label: 'Home',
            recipientName: 'A',
            phone: '123',
            province: 'P',
            city: 'C',
            commune: 'C',
            streetLine: 'S',
          }
        },
        carts: { create: {} }
      },
      include: { addresses: true, carts: true }
    });

    const userB = await prisma.user.create({
      data: {
        name: 'Test User B',
        email: `testb-${Date.now()}@example.com`,
        role: 'customer',
        addresses: {
          create: {
            label: 'Home',
            recipientName: 'B',
            phone: '123',
            province: 'P',
            city: 'C',
            commune: 'C',
            streetLine: 'S',
          }
        },
        carts: { create: {} }
      },
      include: { addresses: true, carts: true }
    });

    // 2. Add item to both carts
    await prisma.cartItem.create({
      data: { cartId: userA.carts!.id, productId: testProduct.id, quantity: 1 }
    });
    await prisma.cartItem.create({
      data: { cartId: userB.carts!.id, productId: testProduct.id, quantity: 1 }
    });
    
    // 3. Simulate simultaneous checkout attempts
    const [resultA, resultB] = await Promise.allSettled([
      ordersService.checkout(userA.id, { addressId: Number(userA.addresses[0].id), paymentMethod: 'cod' as any }),
      ordersService.checkout(userB.id, { addressId: Number(userB.addresses[0].id), paymentMethod: 'cod' as any }),
    ]);

    // 4. Validate that exactly one succeeded and one was rejected
    const succeeded = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const rejected = [resultA, resultB].filter((r) => r.status === 'rejected');

    expect(succeeded.length).toBe(1); // Only 1 customer secured the purchase
    expect(rejected.length).toBe(1);  // The other customer was rejected safely

    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect([400, 409]).toContain(rejectedReason.status);

    // 5. Clean up test records
    await prisma.order.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    await prisma.category.delete({ where: { id: testCategory.id } });
  });
});
