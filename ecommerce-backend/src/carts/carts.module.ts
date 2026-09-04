import { Module } from '@nestjs/common';
import { CartsController } from './carts.controller.js';
import { CartsService } from './carts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [CartsController],
  providers: [CartsService, PrismaService],
  exports: [CartsService],
})
export class CartsModule {}
