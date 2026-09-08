import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', description: 'Label for the address e.g. Home, Work, Office' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  label: string;

  @ApiProperty({ example: 'Sokha Chan', description: 'Recipient full name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  recipientName: string;

  @ApiProperty({ example: '012345678', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phone: string;

  @ApiProperty({ example: 'Phnom Penh', description: 'Province or Capital' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  province: string;

  @ApiProperty({ example: 'Khan Toul Kork', description: 'City or District (Khan/Srok)' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @ApiProperty({ example: 'Sangkat Boeung Kak II', description: 'Commune (Sangkat/Khum)' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  commune: string;

  @ApiProperty({ example: 'Street 592, House #12B', description: 'Street line address detail' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  streetLine: string;

  @ApiPropertyOptional({ example: true, description: 'Set as default address for user' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
