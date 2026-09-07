import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderTrackingController } from './order-tracking.controller.js';
import { OrderTrackingService } from './order-tracking.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [OrderTrackingController],
  providers: [OrderTrackingService, PrismaService],
  exports: [OrderTrackingService],
})
export class OrderTrackingModule {}
