import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsDateString, 
  IsOptional, 
  IsBoolean, 
  IsArray, 
  Min, 
  Matches 
} from 'class-validator';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountScope {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
  CATEGORY = 'CATEGORY',
  PROMO_CODE = 'PROMO_CODE',
}

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DiscountType, { message: 'Type must be PERCENTAGE or FIXED_AMOUNT' })
  type: DiscountType;

  @IsEnum(DiscountScope, { message: 'Scope must be ALL_PRODUCTS, SPECIFIC_PRODUCTS, CATEGORY, or PROMO_CODE' })
  scope: DiscountScope;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Value must be greater than zero.' })
  value: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumOrderAmount?: number = 0.00;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Promo code must consist only of uppercase letters, numbers, underscores, or hyphens (e.g. WELCOME10)',
  })
  code?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsArray()
  productIds?: (string | number)[];

  @IsOptional()
  @IsArray()
  categoryIds?: (string | number)[];
}
