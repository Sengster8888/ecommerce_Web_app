import { 
  Injectable, 
  ConflictException, 
  NotFoundException, 
  BadRequestException,
  Optional,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { KhqrService } from './khqr.service.js';
import { SimulateCallbackDto } from '../dto/simulate-callback.dto.js';
import { TelegramService } from '../../telegram/telegram.service.js';
import QRCode from 'qrcode';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly khqrService: KhqrService,
    @Optional() @Inject(TelegramService) private readonly telegramService?: TelegramService,
  ) {}

  // 1. Initiate/Retrieve a payment attempt for a PENDING order (KHQR)
  async initiatePayment(orderId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.paymentMethod !== 'khqr') {
      throw new BadRequestException('This order is not configured for KHQR payments.');
    }

    // A. Safety Check: If already paid, block generation
    const alreadyPaid = order.payments.some((p) => p.status === 'PAID');
    if (alreadyPaid) {
      throw new ConflictException('This order has already been paid.');
    }

    // B. Quota Optimization: Check for existing, unexpired PENDING payment
    const activePendingPayment = order.payments.find(
      (p) => p.status === 'PENDING' && p.expiresAt && p.expiresAt > new Date()
    );

    if (activePendingPayment && activePendingPayment.qrString) {
      // REUSE CRITICAL CACHE: Generate QR base64 locally from the saved EMVCo string
      // Consumes 0 external API requests
      const qrImageBase64 = await QRCode.toDataURL(activePendingPayment.qrString, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
      });

      console.log(`[QUOTA CACHE] Reused existing KHQR payload for order ${orderId}. Saving API call.`);

      return {
        paymentId: activePendingPayment.id,
        amount: activePendingPayment.amount,
        qrImageBase64,
        qrString: activePendingPayment.qrString,
        md5: activePendingPayment.md5,
        providerReference: activePendingPayment.providerReference,
        expiresAt: activePendingPayment.expiresAt,
        cached: true,
      };
    }

    // C. Cache Miss/Expired: Query gateway for a new token (Consumes API Quota)
    console.log(`[QUOTA DECREMENT] Requesting fresh KHQR payload for order ${orderId} from external gateway.`);
    const qrResult = await this.khqrService.generateQR(order.id, order.totalAmount);

    // Save the new payment log along with EMVCo raw string, MD5 signatures, and expiration boundary
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'khqr',
        status: 'PENDING',
        amount: order.totalAmount,
        providerReference: qrResult.transactionId,
        md5: qrResult.md5,
        qrString: qrResult.qrData,
        expiresAt: qrResult.expiresAt,
      },
    });

    // Generate QR base64 locally
    const qrImageBase64 = await QRCode.toDataURL(qrResult.qrData, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });

    return {
      paymentId: payment.id,
      amount: payment.amount,
      qrImageBase64,
      qrString: qrResult.qrData,
      md5: qrResult.md5,
      providerReference: qrResult.transactionId,
      expiresAt: qrResult.expiresAt,
      cached: false,
    };
  }

  // 2. Query Payment Status
  async getPaymentStatus(paymentId: bigint) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }
    return payment;
  }

  // 3. Process Webhook Callback in an Atomic Database Transaction
  async processPaymentCallback(paymentId: bigint, callbackDto: SimulateCallbackDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment attempt not found.');
    }

    if (payment.status !== 'PENDING') {
      throw new ConflictException('This payment attempt has already been processed.');
    }

    // CASE 1: Webhook indicates Payment Failed
    if (callbackDto.status === 'FAILED') {
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          providerReference: callbackDto.providerReference,
        },
      });
      return {
        payment: updatedPayment,
        orderStatus: payment.order.status,
      };
    }

    // CASE 2: Webhook indicates Payment Succeeded
    // Execute payment confirmation, inventory validation, and stock decrement atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-verify status within transaction lock
      const lockedPayment = await tx.payment.findUnique({
        where: { id: paymentId },
      });
      if (!lockedPayment || lockedPayment.status !== 'PENDING') {
        throw new ConflictException('Payment already processed within concurrent thread.');
      }

      // Mark payment status as PAID
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          providerReference: callbackDto.providerReference,
          paidAt: new Date(),
        },
      });

      const order = payment.order;
      for (const item of order.items) {
        // Atomic stock check and decrement
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // If stock is insufficient
        if (updatedProduct.count === 0) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PENDING' },
          });

          await tx.orderTracking.create({
            data: {
              orderId: order.id,
              status: 'PENDING',
              note: `Stock depleted for product ID ${item.productId} during payment window. Needs manual review.`,
            },
          });

          return {
            payment: updatedPayment,
            orderStatus: 'PENDING',
            warning: 'Payment received but stock depleted. Order held in review state.',
          };
        }
      }

      // Confirm order
      const confirmedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });

      await tx.orderTracking.create({
        data: {
          orderId: order.id,
          status: 'CONFIRMED',
          note: 'Order automatically confirmed via successful KHQR payment.',
        },
      });

      return {
        payment: updatedPayment,
        orderStatus: confirmedOrder.status,
      };
    });

    // Async notification for newly confirmed order
    if (result.orderStatus === 'CONFIRMED' && this.telegramService) {
      try {
        this.telegramService.sendNewOrderNotification(payment.orderId);
      } catch (err) {
        // Log handled silently
      }
    }

    return result;
  }

  // 4. Admin Manual Capture (for COD Cash Collection)
  async captureCodPayment(paymentId: bigint) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    if (payment.method !== 'cod') {
      throw new BadRequestException('Only COD payments can be manually captured.');
    }

    if (payment.status === 'PAID') {
      throw new ConflictException('Payment has already been marked as PAID.');
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }
}
