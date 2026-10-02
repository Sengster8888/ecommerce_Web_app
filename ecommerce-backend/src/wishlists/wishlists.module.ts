import { Module } from '@nestjs/common';
import { WishlistsController } from './wishlists.controller.js';
import { WishlistsService } from './wishlists.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [WishlistsController],
  providers: [WishlistsService, PrismaService],
  exports: [WishlistsService]
})
export class WishlistsModule {}
