import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './services/payments.service.js';
import { KhqrService } from './services/khqr.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';

@Module({
  imports: [AuthModule, TelegramModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, KhqrService, PrismaService],
  exports: [PaymentsService, KhqrService],
})
export class PaymentsModule {}
