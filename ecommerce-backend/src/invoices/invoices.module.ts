import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  providers: [InvoicesService, PrismaService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
