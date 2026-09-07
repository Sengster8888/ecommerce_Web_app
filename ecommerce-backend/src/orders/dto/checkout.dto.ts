import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PaymentMethod {
  KHQR = 'khqr',
  COD = 'cod',
}

export class CheckoutDto {
  @IsNotEmpty()
  // Addresses use BigInt. We accept string/number from the client and convert to BigInt
  addressId: string | number;

  @IsEnum(PaymentMethod, {
    message: 'Payment method must be either "khqr" or "cod"',
  })
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  promoCode?: string;
}
