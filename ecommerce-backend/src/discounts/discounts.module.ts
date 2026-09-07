import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service.js';
import { DiscountsController } from './discounts.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [DiscountsController],
  providers: [DiscountsService, PrismaService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
