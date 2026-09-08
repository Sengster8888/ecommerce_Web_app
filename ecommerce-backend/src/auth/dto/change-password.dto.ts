import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!', description: 'Current user password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSuperPassword123!', description: 'New password to update' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'New password must be between 8 and 100 characters long.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }
  )
  newPassword: string;
}
