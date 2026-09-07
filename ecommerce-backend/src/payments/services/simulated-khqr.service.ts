import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway, QRGenerationResult } from '../interfaces/payment-gateway.interface.js';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';

@Injectable()
export class SimulatedKhqrService implements PaymentGateway {
  constructor(private readonly configService: ConfigService) {}

  async generateQR(orderId: bigint, amount: Decimal): Promise<QRGenerationResult> {
    try {
      const merchantName = this.configService.get<string>('BAKONG_MERCHANT_NAME', 'Cambodian Retail');
      const merchantCity = this.configService.get<string>('BAKONG_MERCHANT_CITY', 'Phnom Penh');
      const transactionId = `TXN-KHQR-${orderId}-${Date.now()}`;
      
      // In production, this string will be generated/fetched via Bakong's Open API using BAKONG_API_TOKEN & BAKONG_MERCHANT_ID
      const rawEmvcoPayload = `00020101021226380009nbc.org.kh52045811530384054041.005802KH5916${merchantName}6008${merchantCity}62240720${transactionId}`;
      
      // Compute the MD5 hash representing the transaction signature
      const md5 = crypto.createHash('md5').update(rawEmvcoPayload).digest('hex');
      
      // Set payment expiration window (standard: 15 minutes)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      return {
        qrData: rawEmvcoPayload,
        transactionId,
        md5,
        expiresAt,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate mock KHQR payload.');
    }
  }

  async verifyTransaction(transactionId: string): Promise<{ success: boolean; rawPayload: any }> {
    return {
      success: true,
      rawPayload: { simulated: true, checkedAt: new Date() },
    };
  }
}
