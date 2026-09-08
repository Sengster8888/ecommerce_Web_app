import { IsOptional, IsString, Length, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Sokha Chan', description: 'Customer full name' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @ApiPropertyOptional({ example: '012345678', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', description: 'Profile avatar image URL' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  avatarUrl?: string;
}
