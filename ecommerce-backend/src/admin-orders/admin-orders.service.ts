import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Fetch Paginated Orders with Multi-criteria Filtering
  async findAll(query: AdminOrderQueryDto) {
    const { page = 1, limit = 10, status, paymentMethod, search } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: whereClause }),
      this.prisma.order.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // 2. Fetch Single Order Details and Full Append-Only Status Audit History
  async findOne(id: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        address: true,
        items: true,
        payments: true,
        orderTracking: {
          include: {
            changedByUser: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' }, // Order tracking history: newest to oldest
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id.toString()} not found.`);
    }

    return order;
  }

  // 3. Update Order Status with Business-Rules and State-Machine Transitions
  async updateStatus(id: bigint, dto: UpdateOrderStatusDto, adminId: string) {
    // 1. Fetch current order
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id.toString()} not found.`);
    }

    const currentStatus = order.status;
    const targetStatus = dto.status;

    // 2. Execute Order State Machine Validation
    this.validateStateTransition(currentStatus, targetStatus);

    // 3. Mutate DB inside transactional boundary
    return this.prisma.$transaction(async (tx) => {
      // A. Perform update on the Order table
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
          rejectionReason: targetStatus === 'REJECTED' ? dto.rejectionReason : undefined,
        },
      });

      // B. Write append-only record in OrderTracking table for audit trailing
      await tx.orderTracking.create({
        data: {
          orderId: id,
          status: targetStatus,
          note: dto.note || `Status transitioned from ${currentStatus} to ${targetStatus}`,
          changedByUserId: adminId,
        },
      });

      // C. Safe-Restore inventory stock if order is Cancelled or Rejected
      if (targetStatus === 'CANCELLED' || targetStatus === 'REJECTED') {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity, // Return reserved items back to catalog stock
              },
            },
          });
        }
      }

      return updatedOrder;
    });
  }

  // 4. Fetch Core Dashboard KPI Metrics for Admin Users
  async getDashboardStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      revenueResult,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'PROCESSING' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.order.aggregate({
        where: { status: 'DELIVERED' }, // Earned revenue is only recognized on Delivered orders
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      totalRevenue: revenueResult._sum.totalAmount || 0,
    };
  }

  // Helper: Secure State-Machine Logic Guard
  private validateStateTransition(current: string, target: string) {
    // If order is already in a terminal state (DELIVERED, CANCELLED, REJECTED), do not allow shifts
    const terminalStates = ['DELIVERED', 'CANCELLED', 'REJECTED'];
    if (terminalStates.includes(current)) {
      throw new BadRequestException(
        `Cannot change status of a terminated order (Current: ${current}).`,
      );
    }

    // Rules defining forward progression only
    if (current === 'PENDING' && !['CONFIRMED', 'CANCELLED', 'REJECTED'].includes(target)) {
      throw new BadRequestException('Pending orders can only transition to Confirmed, Cancelled, or Rejected.');
    }

    if (current === 'CONFIRMED' && !['PROCESSING', 'CANCELLED'].includes(target)) {
      throw new BadRequestException('Confirmed orders can only transition to Processing or Cancelled.');
    }

    if (current === 'PROCESSING' && !['SHIPPED', 'CANCELLED'].includes(target)) {
      throw new BadRequestException('Processing orders can only transition to Shipped or Cancelled.');
    }

    if (current === 'SHIPPED' && !['DELIVERED', 'CANCELLED'].includes(target)) {
      throw new BadRequestException('Shipped orders can only transition to Delivered or Cancelled.');
    }
  }
}
