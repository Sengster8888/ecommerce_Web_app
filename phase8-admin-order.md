# Phase 8: Admin Order Management & Tracking Audit Trail

This guide outlines the implementation of **Phase 8 (Admin Order Management & Audit Trails)** for your NestJS and Prisma backend. It defines the secure endpoints and business logic required for administrators to manage, filter, update, and track order lifecycles while automatically maintaining an append-only transaction log in the database.

---

## 1. Architectural Design

### A. Strict Role-Based Access Control (RBAC)
While customers are only authorized to read their own personal order history (`GET /api/orders/my`), administrators must be granted unrestricted read and write privileges across all orders. All endpoints in this phase are secured via:
1.  **`JwtAuthGuard`:** Authenticates the user session via access token validation.
2.  **`RolesGuard`:** Restricts actions based on the user's role payload (enforcing `@Roles('admin')`).

### B. Append-Only Order Tracking (Audit Trail)
For high-integrity auditing and customer transparency, administrators must never change an order's status without creating an immutable trail. 
Whenever an order's status transitions (e.g., `CONFIRMED` ➔ `PROCESSING`), the application must perform the update within a **Prisma Interactive Transaction (`$transaction`)** that:
1.  Updates the `status` column in the `Order` table.
2.  Inserts a new event log into the `OrderTracking` (or `order_tracking`) table, detailing the target status, the administrator's `userId` who performed the update, and an optional custom note or reason (e.g., shipping carrier tracking number or rejection reason).

### C. BigInt ID Formatting
Since your order and tracking schemas utilize PostgreSQL `BIGINT` keys, all controller inputs must safely parse stringified parameter IDs using clean conversion routines, and output JSON payloads must be processed by the `BigIntSerializerInterceptor` implemented in Phase 5 to prevent client-side JSON crashes.

---

## 2. Data Transfer Objects (DTOs)

Create the following validated DTOs inside `src/orders/dto/` to structure admin update parameters:

### Admin Order Query DTO (`src/orders/dto/admin-order-query.dto.ts`)
```typescript
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminOrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['khqr', 'cod'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search by orderNumber or customer name/email
}
```

### Update Order Status DTO (`src/orders/dto/update-order-status.dto.ts`)
```typescript
import { IsNotEmpty, IsString, IsOptional, IsIn, Length } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'], {
    message: 'Invalid order status transition target.',
  })
  status: string;

  @IsString()
  @IsOptional()
  @Length(1, 255, { message: 'Tracking details or note must be under 255 characters.' })
  note?: string;

  @IsString()
  @IsOptional()
  @Length(1, 255, { message: 'Rejection reason must be under 255 characters.' })
  rejectionReason?: string;
}
```

---

## 3. NestJS Admin Order Controller

Add the following admin endpoints to your orders controller. 

### `src/orders/admin-orders.controller.ts`
```typescript
import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Restrict this entire controller to administrators
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  // 1. Get Paginated Orders with Advanced Filters
  @Get()
  async getAllOrders(@Query() query: AdminOrderQueryDto) {
    return this.adminOrdersService.findAll(query);
  }

  // 2. Get Admin Dashboard Summary Statistics
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminOrdersService.getDashboardStats();
  }

  // 3. Get Single Order Detail with Tracking Logs and Customer Info
  @Get(':id')
  async getOrderDetail(@Param('id') id: string) {
    return this.adminOrdersService.findOne(BigInt(id));
  }

  // 4. Update Order Status (Triggers State-Machine Validations and Logs Event)
  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id; // Extract executing admin's ID from JWT payload
    const updatedOrder = await this.adminOrdersService.updateStatus(
      BigInt(id),
      dto,
      adminId,
    );
    return {
      message: `Order status updated to ${dto.status} successfully.`,
      order: updatedOrder,
    };
  }
}
```

---

## 4. NestJS Admin Order Service

The service encapsulates the core transactional logic. It includes state machine validation (e.g., preventing an order from moving backwards from `DELIVERED` to `PROCESSING`) and wraps mutations in Prisma transactions.

### `src/orders/admin-orders.service.ts`
```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

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
```

---

## 5. Integrating Notification Webhooks (Telegram Support)

As detailed in your **System Requirements (Section 12)**, keeping shop administrators updated on status shifts inside familiar mobile applications is a core design requirement of this platform.

When an order status transition completes inside `updateStatus()`, you should dispatch event-driven webhooks to notify your Telegram Bot Handler:

```typescript
// Integration Pattern: Triggering Bot Alerts Inside updateStatus()
// Call this after a successful database $transaction commit:

try {
  await this.telegramBotService.sendOrderAlert({
    orderNumber: updatedOrder.orderNumber,
    newStatus: targetStatus,
    adminNote: dto.note,
  });
} catch (error) {
  // Silent fallback: Log the failure of the alert, but DO NOT block/rollback the database state
  console.error(`[TELEGRAM ALERT FAILED] Failed to notify admins of state shift:`, error);
}
```

This completes the backend pipeline for managing orders and generating complete system transparency for admins and customers.
