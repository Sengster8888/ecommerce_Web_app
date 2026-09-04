import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Length, Matches, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}

export class CreateProductDto {
  @IsNotEmpty()
  categoryId: string | number;

  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 220)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens.',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Price must be greater than 0.' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Stock cannot be negative.' })
  stock: number;

  @IsOptional()
  @IsString()
  status?: string = 'active'; // 'active', 'inactive', 'out_of_stock'

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
