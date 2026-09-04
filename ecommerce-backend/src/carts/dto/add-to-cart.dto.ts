import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  // Product IDs are stored as BigInt. Accept number or string representation.
  productId: string | number;

  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
