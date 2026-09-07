import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddTrackingNoteDto } from './dto/add-tracking-note.dto.js';

@Injectable()
export class OrderTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Core Logger Method: Appends an immutable tracking entry to the log.
   * Can be invoked from any service (Orders, Payments, Webhook, etc.) during status shifts.
   */
  async logTransition(tx: any, params: {
    orderId: bigint;
    status: string;
    note?: string;
    changedByUserId?: string;
  }): Promise<void> {
    const prismaClient = tx || this.prisma;

    await prismaClient.orderTracking.create({
      data: {
        orderId: params.orderId,
        status: params.status,
        note: params.note || null,
        changedByUserId: params.changedByUserId || null,
      },
    });
  }

  /**
   * 2. Expose Order Status Timeline to Customer (with Ownership Guard)
   */
  async getOrderTimeline(orderId: bigint, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, orderNumber: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    // Security Guard: Prevent cross-user tracking leaks. Customers can only track their own orders.
    if (userRole !== 'admin' && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to track this order.');
    }

    const history = await this.prisma.orderTracking.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }, // Maintain chronological sequence
      include: {
        changedByUser: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return {
      orderNumber: order.orderNumber,
      orderId: orderId.toString(),
      timeline: history.map((event) => ({
        id: event.id.toString(),
        status: event.status,
        note: event.note,
        timestamp: event.createdAt,
        updatedBy: event.changedByUser 
          ? { name: event.changedByUser.name, role: event.changedByUser.role }
          : { name: 'System', role: 'automation' },
      })),
    };
  }

  /**
   * 3. Admin Custom Activity Log Entry (e.g. Courier delays, address modifications)
   */
  async addAdminNote(orderId: bigint, adminId: string, dto: AddTrackingNoteDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return this.prisma.orderTracking.create({
      data: {
        orderId,
        status: order.status, // Preserve the current order status
        note: dto.note,
        changedByUserId: adminId,
      },
    });
  }
}
