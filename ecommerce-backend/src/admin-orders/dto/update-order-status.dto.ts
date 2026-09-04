import { IsNotEmpty, IsString, IsOptional, IsIn, Length } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'], {
    message: 'Invalid order status transition target.',
  })
  status: string;

  @IsString()
  @IsOptional()
  @Length(1, 255, { message: 'Tracking details or note must be under 255 characters.' })
  note?: string;

  @IsString()
  @IsOptional()
  @Length(1, 255, { message: 'Rejection reason must be under 255 characters.' })
  rejectionReason?: string;
}
