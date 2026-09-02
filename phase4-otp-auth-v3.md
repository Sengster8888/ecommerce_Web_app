# Phase 4 (v3 Update): OTP-Based Authentication, Dual Tokens, and Password Reset Flow

This updated guide (v3) incorporates a complete security workflow for **Access/Refresh Token Rotation**, **OTP Email Verification**, and **OTP-driven Forgot & Reset Password** logic using your latest database schemas.

---

## 1. Authentication Lifecycle with OTP & Dual Tokens

### A. Register Workflow with OTP Verification
To ensure only validated emails can register accounts:
1. **Request OTP:** The frontend calls `POST /api/auth/otp/send` with `{ "email": "customer@example.com", "purpose": "REGISTER_VERIFY" }`.
2. **Generate & Store:** The backend generates a 6-digit random code, saves it to the `OtpVerification` table with an expiration (e.g., 5 minutes), and sends it to the customer's email.
3. **Register Request:** The frontend submits registration details along with the OTP: `POST /api/auth/register` containing `{ "name", "email", "password", "phone", "otpCode" }`.
4. **Validation & Creation:** 
   - Backend queries `OtpVerification` for a valid, non-expired OTP matching the email.
   - If valid, the password is encrypted, the user record is created in `User` with `isEmailVerified: true`, and the OTP record is deleted.

---

### B. Forgot & Reset Password Workflow with OTP Verification
To allow users to recover their accounts securely without passwords:
1. **Request Password Reset OTP:** The user clicks "Forgot Password" and enters their email. The frontend calls `POST /api/auth/password/forgot` with `{ "email": "customer@example.com" }`.
2. **User Verification & OTP Generation:**
   - The backend checks if the user exists. If yes, it generates a secure 6-digit OTP code for the purpose `PASSWORD_RESET` and saves it in the database with a 5-minute expiry.
   - *Security Note:* To prevent email enumeration attacks, the API returns a generic success response indicating that "if the account exists, an OTP has been dispatched."
3. **Reset Password Request:** The user retrieves the code from their email and enters a new password. The frontend submits: `POST /api/auth/password/reset` with `{ "email", "otpCode", "newPassword" }`.
4. **Verification, Hashing, and Session Invalidation:**
   - The backend validates the OTP against the email and `PASSWORD_RESET` purpose.
   - If correct, it hashes the new password and updates the database.
   - **Crucial Security Step (Session Invalidation):** The backend updates the user's `refreshTokenHash` to `null`. This instantly revokes all active sessions, forcing the user (and anyone who might have compromised their account) to re-authenticate on all devices.
   - The consumed OTP code is deleted from the database.

```
[Customer]                    [NestJS Backend]                   [PostgreSQL]
    |                                 |                               |\n    |---- 1. POST /password/forgot -->|                               |\n    |                                [Check if User Exists]           |\n    |                                [Gen 6-digit OTP]                |\n    |                                 |---- 2. Save OTP (expires) --->|\n    |                                 |<--- 3. Save Confirmed --------|\n    |<--- 4. HTTP 200 (OTP Sent) -----|                               |\n    |                                 |                               |\n    |---- 5. POST /password/reset ---->|                               |\n    |   (email, otpCode, newPassword) |---- 6. Check OTP validity --->|\n    |                                 |<--- 7. Valid/Not Expired -----|\n    |                                [Hash newPassword]               |\n    |                                 |---- 8. Update Password &      |\n    |                                 |        Set refreshTokenHash=null |\n    |                                 |        Delete consumed OTP --->|\n    |<--- 9. HTTP 200 Success --------|                               |
```

---

### C. Login with Refresh Token Implementation
1. **Login Request:** User submits email/password to `POST /api/auth/login`.
2. **Verify Credentials:** Backend validates password hash. If valid, checks if `isEmailVerified` is `true`.
3. **Issue Tokens:**
   - **Access Token:** Short-lived JWT (expires in 15 minutes) returned in the response body.
   - **Refresh Token:** Long-lived JWT (expires in 7 days).
4. **Persistence:**
   - Hash the Refresh Token using Bcrypt and store it in `User.refreshTokenHash`.
   - Set the raw Refresh Token as an **`HttpOnly`**, **`Secure`**, **`SameSite=Strict` cookie** on the HTTP response to protect against XSS.

---

## 2. Data Transfer Objects (DTOs)

Create the following validated DTOs inside `src/auth/dto/`:

### Send OTP DTO (`src/auth/dto/send-otp.dto.ts`)
```typescript
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsIn(['REGISTER_VERIFY', 'LOGIN_MFA', 'PASSWORD_RESET'])
  purpose: string;
}
```

### Register with OTP DTO (`src/auth/dto/register-otp.dto.ts`)
```typescript
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
  // Validates Cambodian phone formats (e.g., +85512345678, 012345678, 0961234567)
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
```

### Forgot Password DTO (`src/auth/dto/forgot-password.dto.ts`)
```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

### Reset Password DTO (`src/auth/dto/reset-password.dto.ts`)
```typescript
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
```

---

## 3. NestJS Authentication Controller Implementation

The controller integrates the forgot and reset password endpoints seamlessly into your authentication routes.

### `src/auth/auth.controller.ts`
```typescript
import { Controller, Post, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { RegisterOtpDto } from './dto/register-otp.dto';
import { LoginDto } from './dto/login.dto'; // Standard Email/Password Login
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    await this.authService.sendOtp(sendOtpDto.email, sendOtpDto.purpose);
    return { message: 'OTP code has been sent successfully to your email.' };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterOtpDto) {
    return this.authService.registerWithOtp(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const tokens = await this.authService.login(loginDto.email, loginDto.password);
    
    // Set refresh token in HttpOnly Cookie
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    return {
      accessToken: tokens.accessToken,
      user: tokens.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Update cookie with rotated refresh token
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const userId = request.user['id'];
    await this.authService.logout(userId);

    // Clear client-side cookie
    response.clearCookie('refresh_token');
    return { message: 'Logged out successfully, session invalidated.' };
  }

  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { 
      message: 'If the email is registered in our system, an OTP code has been sent to it.' 
    };
  }

  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Your password has been reset successfully. Please log in with your new credentials.' };
  }
}
```

---

## 4. NestJS Service logic with Forgot/Reset Password Methods

Below is the complete, updated NestJS Service with added helper methods for generating OTPs, verifying password-reset codes, resetting passwords, and revoking active user sessions automatically.

### `src/auth/auth.service.ts`
```typescript
import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterOtpDto } from './dto/register-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Generate and send a 6-digit OTP code for generic operations
  async sendOtp(email: string, purpose: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await this.prisma.otpVerification.create({
      data: {
        email,
        code,
        purpose,
        expiresAt,
      },
    });

    // Integrated Email Sending Service placeholder
    console.log(`[EMAIL DISPATCH] To: ${email} | Subject: Your OTP Code is ${code} (Expires in 5 minutes)`);
  }

  // Register user after validating OTP
  async registerWithOtp(dto: RegisterOtpDto) {
    const validOtp = await this.prisma.otpVerification.findFirst({
      where: {
        email: dto.email,
        code: dto.otpCode,
        purpose: 'REGISTER_VERIFY',
        expiresAt: { gte: new Date() },
      },
    });

    if (!validOtp) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: 'customer',
        isEmailVerified: true,
      },
    });

    await this.prisma.otpVerification.delete({ where: { id: validOtp.id } });

    const { passwordHash: _, ...result } = newUser;
    return result;
  }

  // Verify credentials and return signed access & refresh tokens
  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Email has not been verified yet.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;

    return {
      ...tokens,
      user: userResponse,
    };
  }

  // Refresh expired access token using active refresh token
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh',
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access Denied');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Access Denied');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Access Denied');
    }
  }

  // Revoke refresh token on logout
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // Initiate Forgot Password Flow by checking existence and dispatching OTP
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Security Best Practice: Don't throw 404 to avoid email scanning.
    // Simply skip OTP generation and return success.
    if (!user) {
      console.log(`[SECURITY INFO] Forgot password requested for non-existent email: ${email}`);
      return;
    }

    // Generate and store OTP for PASSWORD_RESET
    await this.sendOtp(email, 'PASSWORD_RESET');
  }

  // Verify OTP and reset password
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // 1. Verify OTP code is valid and expires in the future
    const validOtp = await this.prisma.otpVerification.findFirst({
      where: {
        email: dto.email,
        code: dto.otpCode,
        purpose: 'PASSWORD_RESET',
        expiresAt: { gte: new Date() },
      },
    });

    if (!validOtp) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    // 2. Fetch User
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException('User with this email was not found.');
    }

    // 3. Hash new password and update user record
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      // Update User details & invalidate all active sessions for security
      this.prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash: newPasswordHash,
          refreshTokenHash: null // Logs out of all existing devices
        },
      }),
      // Delete the OTP verification record after successful consumption
      this.prisma.otpVerification.delete({
        where: { id: validOtp.id }
      })
    ]);
  }

  // Helper: Update hashed refresh token in database
  private async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hashed },
    });
  }

  // Helper: Token generation logic
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'super_secret',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
```
