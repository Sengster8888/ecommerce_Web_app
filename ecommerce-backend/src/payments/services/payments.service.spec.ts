import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentsService } from './payments.service.js';
import { KhqrService } from './khqr.service.js';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaMock: any;
  let khqrServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      product: {
        updateMany: vi.fn(),
      },
      orderTracking: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prismaMock)),
    };

    khqrServiceMock = {
      generateQR: vi.fn().mockResolvedValue({
        qrData: '0002010102122638...',
        transactionId: 'TXN-12345',
        md5: 'd41d8cd98f00b204e9800998ecf8427e',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      }),
    };

    service = new PaymentsService(prismaMock, khqrServiceMock);
  });

  describe('initiatePayment', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(service.initiatePayment(BigInt(1))).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order payment method is not khqr', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: BigInt(1),
        paymentMethod: 'cod',
        payments: [],
      });

      await expect(service.initiatePayment(BigInt(1))).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if order is already paid', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: BigInt(1),
        paymentMethod: 'khqr',
        payments: [{ status: 'PAID' }],
      });

      await expect(service.initiatePayment(BigInt(1))).rejects.toThrow(ConflictException);
    });

    it('should reuse cached QR payload if unexpired pending payment exists (cached: true)', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      prismaMock.order.findUnique.mockResolvedValue({
        id: BigInt(1),
        paymentMethod: 'khqr',
        totalAmount: new Decimal(100.0),
        payments: [
          {
            id: BigInt(10),
            status: 'PENDING',
            amount: new Decimal(100.0),
            qrString: 'cached_qr_payload',
            md5: 'cached_md5',
            providerReference: 'TXN-CACHED',
            expiresAt: futureDate,
          },
        ],
      });

      const result = await service.initiatePayment(BigInt(1));

      expect(result.cached).toBe(true);
      expect(result.qrString).toBe('cached_qr_payload');
      expect(khqrServiceMock.generateQR).not.toHaveBeenCalled();
    });

    it('should request new QR payload if pending payment is expired (cached: false)', async () => {
      const pastDate = new Date(Date.now() - 5 * 60 * 1000);
      prismaMock.order.findUnique.mockResolvedValue({
        id: BigInt(1),
        paymentMethod: 'khqr',
        totalAmount: new Decimal(100.0),
        payments: [
          {
            id: BigInt(10),
            status: 'PENDING',
            amount: new Decimal(100.0),
            qrString: 'expired_qr_payload',
            md5: 'expired_md5',
            providerReference: 'TXN-EXPIRED',
            expiresAt: pastDate,
          },
        ],
      });

      prismaMock.payment.create.mockResolvedValue({
        id: BigInt(11),
        amount: new Decimal(100.0),
      });

      const result = await service.initiatePayment(BigInt(1));

      expect(result.cached).toBe(false);
      expect(khqrServiceMock.generateQR).toHaveBeenCalledWith(BigInt(1), new Decimal(100.0));
      expect(prismaMock.payment.create).toHaveBeenCalled();
    });
  });

  describe('processPaymentCallback', () => {
    it('should process successful payment callback and confirm order', async () => {
      const paymentMock = {
        id: BigInt(10),
        status: 'PENDING',
        order: {
          id: BigInt(1),
          items: [{ productId: BigInt(101), quantity: 2 }],
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(paymentMock);
      prismaMock.payment.update.mockResolvedValue({ ...paymentMock, status: 'PAID' });
      prismaMock.product.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.order.update.mockResolvedValue({ id: BigInt(1), status: 'CONFIRMED' });

      const result = await service.processPaymentCallback(BigInt(10), {
        providerReference: 'TXN-12345',
        status: 'PAID',
      });

      expect(result.orderStatus).toBe('CONFIRMED');
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: BigInt(10) },
        data: expect.objectContaining({ status: 'PAID' }),
      });
    });
  });

  describe('captureCodPayment', () => {
    it('should allow admin to capture COD payment', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: BigInt(10),
        method: 'cod',
        status: 'PENDING',
      });

      prismaMock.payment.update.mockResolvedValue({
        id: BigInt(10),
        status: 'PAID',
      });

      const result = await service.captureCodPayment(BigInt(10));
      expect(result.status).toBe('PAID');
    });
  });
});
