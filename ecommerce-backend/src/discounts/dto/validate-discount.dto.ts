import { IsOptional, IsString, IsNumber, Min, IsArray } from 'class-validator';

export class CartItemDiscountContext {
  productId: string | number;
  categoryId?: string | number;
  unitPrice: number;
  quantity: number;
}

export class ValidateDiscountDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsNumber()
  @Min(0)
  cartSubtotal: number;

  @IsOptional()
  @IsArray()
  cartItems?: CartItemDiscountContext[];
}
