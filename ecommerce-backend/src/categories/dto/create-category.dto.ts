import { IsNotEmpty, IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Category name must be between 2 and 100 characters.' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens (e.g., smart-phones-tablets).',
  })
  slug: string;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid HTTP/HTTPS web link.' })
  @Length(2, 500)
  imageUrl?: string;

  @IsOptional()
  // Handles BigInt IDs incoming as numbers or numeric strings
  parentCategoryId?: string | number;
}
