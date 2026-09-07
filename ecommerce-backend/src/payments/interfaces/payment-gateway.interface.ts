import { Decimal } from '@prisma/client/runtime/library';

export interface QRGenerationResult {
  qrData: string;             // Raw EMVCo string decoded by banking apps
  transactionId: string;      // Unique gateway transaction ID
  md5: string;                // Hex md5 hash representing the transaction signature
  expiresAt: Date;            // Expiration boundary for this payment link (e.g., +15 minutes)
}

export interface PaymentGateway {
  generateQR(orderId: bigint, amount: Decimal): Promise<QRGenerationResult>;
  verifyTransaction(transactionId: string): Promise<{ success: boolean; rawPayload: any }>;
}
