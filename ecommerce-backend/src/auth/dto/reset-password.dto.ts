import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otpCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long' })
  newPassword: string;
}
