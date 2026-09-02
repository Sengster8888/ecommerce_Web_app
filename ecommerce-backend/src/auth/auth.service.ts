import { Injectable, BadRequestException, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterOtpDto } from './dto/register-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Generate and send a 6-digit OTP code
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

    this.logger.log(`[EMAIL DISPATCH] To: ${email} | Subject: Your OTP Code is ${code} (Expires in 5 minutes)`);
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
        secret: process.env.JWT_REFRESH_SECRET || 'your-ultra-secure-jwt-refresh-secret-change-in-production',
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
      this.logger.log(`[SECURITY INFO] Forgot password requested for non-existent email: ${email}`);
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

  private async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hashed },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'your-ultra-secure-jwt-secret-key-change-in-production',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-ultra-secure-jwt-refresh-secret-change-in-production',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
