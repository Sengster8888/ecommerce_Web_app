import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller.js';
import { TelegramService } from './telegram.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminOrdersModule } from '../admin-orders/admin-orders.module.js';

@Module({
  imports: [AdminOrdersModule],
  controllers: [TelegramController],
  providers: [TelegramService, PrismaService],
  exports: [TelegramService],
})
export class TelegramModule {}
