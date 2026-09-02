import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsIn(['REGISTER_VERIFY', 'LOGIN_MFA', 'PASSWORD_RESET'])
  purpose: string;
}
