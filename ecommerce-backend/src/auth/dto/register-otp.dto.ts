import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+855|0)[1-9]\d{7,8}$/, {
    message: 'Phone number must be a valid Cambodian format (+855... or 0...)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otpCode: string;
}
