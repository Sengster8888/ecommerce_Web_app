import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 150, { message: 'Name must be between 2 and 150 characters.' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }
  )
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+855|0)[1-9]\d{7,8}$/, {
    message: 'Phone number must be a valid Cambodian format (+855... or 0...)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits.' })
  otpCode: string;
}
