import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service.js';
import { AddressesController } from './addresses.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AddressesController],
  providers: [AddressesService, PrismaService],
  exports: [AddressesService],
})
export class AddressesModule {}
