# Phase 4 Update: OTP-Based Email Verification and Token Rotation

This document guides you through implementing the updated authentication system in your NestJS backend. It incorporates **Access/Refresh Token Rotation** and **OTP Verification** for Registration, Logins, and Verification workflows using the updated `schema-v2.prisma` file.

---

## 1. Authentication Lifecycle with OTP & Dual Tokens

### A. Register Workflow with OTP Verification
To ensure only validated emails can register accounts in your Cambodian e-commerce system:
1. **Request OTP:** The frontend calls `POST /api/auth/otp/send` with `{ "email": "customer@example.com", "purpose": "REGISTER_VERIFY" }`.
2. **Generate & Store:** The backend generates a 6-digit random code, saves it to the `OtpVerification` table with an expiration (e.g., 5 minutes), and sends it to the customer's email.
3. **Register Request:** The frontend submits registration details along with the OTP: `POST /api/auth/register` containing `{ "name", "email", "password", "phone", "otpCode" }`.
4. **Validation & Creation:** 
   - Backend queries the `OtpVerification` table for a valid, non-expired OTP matching the email.
   - If valid, the password is encrypted, the user record is created in the `User` table with `isEmailVerified: true`, and the OTP record is deleted.

```
[Customer]                 [NestJS Backend]                  [PostgreSQL]
    |                              |                              |
    |---- 1. POST /otp/send ------>|                              |
    |                             [Gen Code]                      |
    |                              |---- 2. Create OTP record --->|
    |                              |<--- 3. Save Confirmed -------|
    |<--- 4. HTTP 201 (OTP Sent) --|                              |
    |                              |                              |
    |---- 5. POST /register ------>|                              |
    |   (includes otpCode)         |---- 6. Check OTP validity -->|
    |                              |<--- 7. Valid/Not Expired ----|
    |                             [Hash Pass]                     |
    |                              |---- 8. Create User --------->|
    |<--- 9. HTTP 201 Created -----|                              |
```

### B. Login with Refresh Token Implementation
To establish high security for both customers and admins:
1. **Login Request:** User submits email/password to `POST /api/auth/login`.
2. **Verify Credentials:** Backend validates password hash. If valid:
   - Checks if `isEmailVerified` is `true`. If `false`, rejects the request and prompts them to verify their email.
3. **Issue Tokens:**
   - **Access Token:** Short-lived JWT (expires in 15 minutes) returned in the response body.
   - **Refresh Token:** Long-lived JWT (expires in 7 days).
4. **Persistence:**
   - Hash the Refresh Token using Bcrypt.
   - Store the hash in `User.refreshTokenHash` inside PostgreSQL.
   - Set the raw Refresh Token as an **`HttpOnly`**, **`Secure`**, **`SameSite=Strict` cookie** on the HTTP response.

---

## 2. Updated Data Transfer Objects (DTOs)

Create the following validated DTOs to enforce clean payloads:

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
  // Validates Cambodian phone formats (e.g. +85512345678, 012345678, 0961234567)
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

---

## 3. NestJS Authentication Controller Implementation
Below is the controller design supporting OTP-send, OTP-register, login with cookies, token-refresh, and logout.

### `src/auth/auth.controller.ts`
```typescript
import { Controller, Post, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { RegisterOtpDto } from './dto/register-otp.dto';
import { LoginDto } from './dto/login.dto'; // Standard Email/Password DTO
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
      secure: process.env.NODE_ENV === 'production', // true in prod
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    // Return access token in response body
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
}
```

---

## 4. NestJS Service logic for OTP & Dual Tokens

### `src/auth/auth.service.ts`
```typescript
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterOtpDto } from './dto/register-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Generate and send a 6-digit OTP code
  async sendOtp(email: string, purpose: string): Promise<void> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Save to the database (creates record)
    await this.prisma.otpVerification.create({
      data: {
        email,
        code,
        purpose,
        expiresAt,
      },
    });

    // Integrated Email Sending Service (e.g. Nodemailer/SendGrid)
    console.log(`[EMAIL DISPATCH] To: ${email} | Subject: Your OTP Code is ${code} (Expires in 5 minutes)`);
  }

  // Register user after validating OTP
  async registerWithOtp(dto: RegisterOtpDto) {
    // 1. Verify OTP code
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

    // 2. Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    // 3. Hash Password & Create User
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: 'customer', // Default role
        isEmailVerified: true,
      },
    });

    // 4. Delete consumed OTP
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new BadRequestException('Email has not been verified yet.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Generate both tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save hashed refresh token to DB
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

      // Check if refresh token matches hash
      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Access Denied');
      }

      // Rotate both tokens
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
