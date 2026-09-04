import { Controller, Post, Get, Param, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@Req() req: Request, @Body() dto: CheckoutDto) {
    const userId = (req.user as any).id;
    return this.ordersService.checkout(userId, dto);
  }

  @Get()
  async getMyOrders(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  async getOrderById(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    const order = await this.ordersService.getOrderDetails(BigInt(id), userId);
    
    if (!order) {
      throw new NotFoundException('Order not found or access denied.');
    }
    return order;
  }
}
