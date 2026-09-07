import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters.' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters.' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150, { message: 'Name must be between 2 and 150 characters.' })
  name?: string;

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
}
