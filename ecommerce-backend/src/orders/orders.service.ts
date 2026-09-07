import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CheckoutDto, PaymentMethod } from './dto/checkout.dto.js';
import { TelegramService } from '../telegram/telegram.service.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const addressId = BigInt(dto.addressId);

    // 1. Validate delivery address ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new BadRequestException('Invalid delivery address selected.');
    }

    // 2. Retrieve user's active shopping cart and its items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your shopping cart is empty.');
    }

    // 3. Begin Interactive Prisma Transaction
    const newOrder = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;

      // Track items and verified stock updates
      const orderItemsData = [];

      for (const item of cart.items) {
        const product = item.product;

        // Fetch fresh product state within transaction with an implicit write-lock
        const dbProduct = await tx.product.findUnique({
          where: { id: product.id },
        });

        if (!dbProduct || dbProduct.status !== 'active') {
          throw new BadRequestException(`Product "${product.name}" is no longer active or available.`);
        }

        // Verify stock limits
        if (dbProduct.stock < item.quantity) {
          throw new ConflictException({
            statusCode: 409,
            errorCode: 'INSUFFICIENT_STOCK',
            message: `Product "${product.name}" has insufficient stock. Only ${dbProduct.stock} items remaining.`,
          });
        }

        // Calculate pricing
        const itemPrice = dbProduct.price;
        const lineTotal = Number(itemPrice) * item.quantity;
        subtotal += lineTotal;

        // Decrement product stock inside transaction
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
            // Auto-update status if inventory is depleted
            status: dbProduct.stock - item.quantity === 0 ? 'out_of_stock' : 'active',
          },
        });

        // Queue order item snapshot data
        orderItemsData.push({
          productId: product.id,
          productNameSnapshot: product.name,
          unitPrice: itemPrice,
          quantity: item.quantity,
          lineTotal: lineTotal,
        });
      }

      // Calculate flat rates/fees (Free Shipping: $0.00)
      const shippingFee = 0.00; 
      const totalAmount = subtotal + shippingFee;

      // Generate a human-readable order number (ORD-YYYYMMDD-XXXX)
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
      const orderNumber = `ORD-${datePart}-${randomPart}`;

      // Set initial state. For COD, default to CONFIRMED. For KHQR, starts PENDING/AWAITING_PAYMENT.
      const initialStatus = dto.paymentMethod === PaymentMethod.COD ? 'CONFIRMED' : 'PENDING';

      // 4. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          status: initialStatus,
          subtotal: subtotal,
          shippingFee: shippingFee,
          totalAmount: totalAmount,
          paymentMethod: dto.paymentMethod,
          items: {
            createMany: {
              data: orderItemsData,
            },
          },
        },
      });

      // 5. Initialize Payment Attempt Record
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: dto.paymentMethod,
          status: 'PENDING',
          amount: totalAmount,
        },
      });

      // 6. Write Initial Audit Log in OrderTracking
      await tx.orderTracking.create({
        data: {
          orderId: order.id,
          status: initialStatus,
          note: dto.paymentMethod === PaymentMethod.COD 
            ? 'Order auto-confirmed at creation time (COD Cash on Delivery).'
            : 'Order initialized, awaiting KHQR payment completion.',
        },
      });

      // 7. Clear Shopping Cart Items upon successful transaction
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    // 8. Outbound async notification (Safely executed outside of DB transactions)
    try {
      if (newOrder.paymentMethod === PaymentMethod.COD) {
        this.telegramService.sendNewOrderNotification(newOrder.id);
      }
    } catch (error: any) {
      this.logger.error(`Telegram notification failed to trigger: ${error.message}`);
    }

    return newOrder;
  }

  // --- QUERY UTILITIES ---

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderDetails(orderId: bigint, userId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        address: true,
        payments: true,
        orderTracking: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}
