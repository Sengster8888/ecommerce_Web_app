import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { DiscountsModule } from '../discounts/discounts.module.js';

import { InvoicesService } from './invoices.service.js';

@Module({
  imports: [AuthModule, TelegramModule, DiscountsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, InvoicesService],
  exports: [OrdersService, InvoicesService],
})
export class OrdersModule {}
