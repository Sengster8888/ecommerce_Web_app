import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderTrackingService } from './order-tracking.service.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrderTrackingService', () => {
  let service: OrderTrackingService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      order: {
        findUnique: vi.fn(),
      },
      orderTracking: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    service = new OrderTrackingService(prismaMock);
  });

  describe('logTransition', () => {
    it('should create an order tracking log entry', async () => {
      prismaMock.orderTracking.create.mockResolvedValue({ id: BigInt(1) });

      await service.logTransition(null, {
        orderId: BigInt(10),
        status: 'CONFIRMED',
        note: 'Order confirmed',
        changedByUserId: 'user-uuid-1',
      });

      expect(prismaMock.orderTracking.create).toHaveBeenCalledWith({
        data: {
          orderId: BigInt(10),
          status: 'CONFIRMED',
          note: 'Order confirmed',
          changedByUserId: 'user-uuid-1',
        },
      });
    });
  });

  describe('getOrderTimeline', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderTimeline(BigInt(10), 'user-1', 'customer')).rejects.toThrow(NotFoundException);
    });

    it('🔒 should throw ForbiddenException if customer attempts to access another user order timeline', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        userId: 'other-user-uuid',
        orderNumber: 'ORD-20260907-1001',
      });

      await expect(service.getOrderTimeline(BigInt(10), 'user-1', 'customer')).rejects.toThrow(ForbiddenException);
    });

    it('✅ should return chronological step history for order owner', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        userId: 'user-1',
        orderNumber: 'ORD-20260907-1001',
      });

      const date1 = new Date('2026-09-07T10:00:00Z');
      const date2 = new Date('2026-09-07T10:15:00Z');

      prismaMock.orderTracking.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          status: 'PENDING',
          note: 'Initialized',
          createdAt: date1,
          changedByUser: null,
        },
        {
          id: BigInt(2),
          status: 'CONFIRMED',
          note: 'Confirmed via KHQR',
          createdAt: date2,
          changedByUser: { name: 'Admin', role: 'admin' },
        },
      ]);

      const result = await service.getOrderTimeline(BigInt(10), 'user-1', 'customer');

      expect(result.orderNumber).toBe('ORD-20260907-1001');
      expect(result.timeline.length).toBe(2);
      expect(result.timeline[0].updatedBy.name).toBe('System');
      expect(result.timeline[1].updatedBy.name).toBe('Admin');
    });

    it('should allow admin to access any order timeline', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        userId: 'other-user-uuid',
        orderNumber: 'ORD-20260907-1001',
      });

      prismaMock.orderTracking.findMany.mockResolvedValue([]);

      const result = await service.getOrderTimeline(BigInt(10), 'admin-id', 'admin');
      expect(result.orderNumber).toBe('ORD-20260907-1001');
    });
  });

  describe('addAdminNote', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(service.addAdminNote(BigInt(10), 'admin-id', { note: 'Traffic delay' })).rejects.toThrow(NotFoundException);
    });

    it('should append admin note preserving current order status', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: BigInt(10),
        status: 'SHIPPED',
      });

      prismaMock.orderTracking.create.mockResolvedValue({
        id: BigInt(3),
        status: 'SHIPPED',
        note: 'Traffic delay',
      });

      const result = await service.addAdminNote(BigInt(10), 'admin-id', { note: 'Traffic delay' });

      expect(prismaMock.orderTracking.create).toHaveBeenCalledWith({
        data: {
          orderId: BigInt(10),
          status: 'SHIPPED',
          note: 'Traffic delay',
          changedByUserId: 'admin-id',
        },
      });
      expect(result.status).toBe('SHIPPED');
    });
  });
});
