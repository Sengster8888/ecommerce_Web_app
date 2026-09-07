import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway, QRGenerationResult } from '../interfaces/payment-gateway.interface.js';
import { Decimal } from '@prisma/client/runtime/library';
import { BakongKHQR, khqrData, IndividualInfo, MerchantInfo } from 'bakong-khqr';
import axios from 'axios';

@Injectable()
export class KhqrService implements PaymentGateway {
  private readonly logger = new Logger(KhqrService.name);
  private readonly bakongKhqr: BakongKHQR;

  constructor(private readonly configService: ConfigService) {
    this.bakongKhqr = new BakongKHQR();
  }

  /**
   * Generates a real dynamic EMVCo compliant Bakong KHQR code payload string with exact price/amount
   * and MD5 hash using the official bakong-khqr SDK.
   */
  async generateQR(orderId: bigint, amount: Decimal): Promise<QRGenerationResult> {
    try {
      const bakongAccountId = this.configService.get<string>('BAKONG_ACCOUNT_ID', 'account_id@kmba');
      const merchantName = this.configService.get<string>('BAKONG_MERCHANT_NAME', 'Cambodian Retail');
      const merchantCity = this.configService.get<string>('BAKONG_MERCHANT_CITY', 'Phnom Penh');
      const merchantId = this.configService.get<string>('BAKONG_MERCHANT_ID', '');
      const acquiringBank = this.configService.get<string>('BAKONG_ACQUIRING_BANK', 'Bakong Retail');
      const currencyStr = this.configService.get<string>('BAKONG_CURRENCY', 'USD').toUpperCase();
      
      const currency = currencyStr === 'KHR' ? khqrData.currency.khr : khqrData.currency.usd;
      const numericAmount = Number(amount);
      const expirationTimestamp = Date.now() + 15 * 60 * 1000; // 15 min expiry
      const billNumber = `ORD-${orderId}`;

      const optionalData = {
        amount: numericAmount,
        currency,
        billNumber,
        expirationTimestamp,
      };

      let response: any;

      if (merchantId) {
        // Generate Dynamic Merchant KHQR Payload
        const merchantInfo = new MerchantInfo(
          bakongAccountId,
          merchantName,
          merchantCity,
          merchantId,
          acquiringBank,
          optionalData,
        );
        response = this.bakongKhqr.generateMerchant(merchantInfo);
      } else {
        // Generate Dynamic Individual KHQR Payload
        const individualInfo = new IndividualInfo(
          bakongAccountId,
          merchantName,
          merchantCity,
          optionalData,
        );
        response = this.bakongKhqr.generateIndividual(individualInfo);
      }

      if (response.status?.code !== 0 || !response.data?.qr) {
        throw new Error(response.status?.message || 'Failed to generate Bakong KHQR token.');
      }

      const transactionId = `TXN-KHQR-${orderId}-${Date.now()}`;
      const expiresAt = new Date(expirationTimestamp);

      this.logger.log(`Generated dynamic Bakong KHQR for Order ${orderId} ($${numericAmount}). MD5: ${response.data.md5}`);

      return {
        qrData: response.data.qr,
        transactionId,
        md5: response.data.md5,
        expiresAt,
      };
    } catch (error: any) {
      this.logger.error(`KHQR Generation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to generate KHQR payload: ${error.message}`);
    }
  }

  /**
   * Verifies payment status with NBC Bakong Open API by MD5 hash signature
   */
  async verifyTransaction(md5: string): Promise<{ success: boolean; rawPayload: any }> {
    const apiBaseUrl = this.configService.get<string>('BAKONG_API_BASE_URL', 'https://api-bakong.nbc.gov.kh');
    const bakongToken = this.configService.get<string>('BAKONG_TOKEN', '');

    if (!bakongToken) {
      this.logger.warn('BAKONG_TOKEN is not configured in .env. Skipping external gateway check.');
      return { success: false, rawPayload: null };
    }

    try {
      const endpointUrl = apiBaseUrl.endsWith('/v1') 
        ? `${apiBaseUrl}/check_transaction_by_md5` 
        : `${apiBaseUrl}/v1/check_transaction_by_md5`;

      const response = await axios.post(
        endpointUrl,
        { md5 },
        {
          headers: {
            Authorization: `Bearer ${bakongToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const isSuccess = response.data?.responseCode === 0 && response.data?.data != null;
      return {
        success: isSuccess,
        rawPayload: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Bakong API verification failed for MD5 ${md5}: ${error.message}`);
      return { success: false, rawPayload: error.response?.data || error.message };
    }
  }
}
