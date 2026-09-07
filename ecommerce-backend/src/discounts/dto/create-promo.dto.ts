import { IsNotEmpty, IsString, IsEnum, IsNumber, IsDateString, Min, Matches } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Promo code must consist only of uppercase letters, numbers, underscores, or hyphens (e.g. WELCOME10)',
  })
  code: string;

  @IsEnum(['PERCENTAGE', 'FIXED'])
  discountType: 'PERCENTAGE' | 'FIXED';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Value must be greater than zero.' })
  value: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minSubtotal: number = 0.00;

  @IsNumber()
  @Min(1)
  maxUses: number = 100;

  @IsDateString()
  expiresAt: string;
}
