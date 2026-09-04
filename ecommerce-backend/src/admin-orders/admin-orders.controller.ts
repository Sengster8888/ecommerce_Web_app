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
import { AdminOrdersService } from './admin-orders.service.js';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

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
