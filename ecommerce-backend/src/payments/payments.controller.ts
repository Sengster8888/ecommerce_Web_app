import { 
  Controller, 
  Post, 
  Get, 
  Patch,
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { PaymentsService } from './services/payments.service.js';
import { InitiatePaymentDto } from './dto/initiate-payment.dto.js';
import { SimulateCallbackDto } from './dto/simulate-callback.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 1. Create/Initiate/Retrieve a payment attempt for an order (Customer)
  // Implements internal caching - will safely reuse existing unexpired QR
  @UseGuards(JwtAuthGuard)
  @Post()
  async initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(BigInt(dto.orderId));
  }

  // 2. Query Payment Status (Customer / Admin)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getStatus(@Param('id') id: string) {
    return this.paymentsService.getPaymentStatus(BigInt(id));
  }

  // 3. Mark COD Payment as PAID upon delivery (Admin Only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/capture')
  async captureCod(@Param('id') id: string) {
    return this.paymentsService.captureCodPayment(BigInt(id));
  }

  // 4. Webhook Simulator (Trigger Payment Settle)
  @Post(':id/simulate-webhook')
  @HttpCode(HttpStatus.OK)
  async simulateWebhook(
    @Param('id') id: string,
    @Body() dto: SimulateCallbackDto
  ) {
    return this.paymentsService.processPaymentCallback(BigInt(id), dto);
  }
}
