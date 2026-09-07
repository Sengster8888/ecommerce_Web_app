import { IsNotEmpty, IsNumberString } from 'class-validator';

export class InitiatePaymentDto {
  @IsNotEmpty()
  @IsNumberString()
  orderId: string; // BigInt safe string payload
}
