import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminOrdersService } from './admin-orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService, PrismaService],
})
export class AdminOrdersModule {}
