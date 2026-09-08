import { Injectable, BadRequestException, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // Fetch the logged-in user profile, omitting security credentials
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User profile does not exist.');
    }

    // Strip sensitive hashes before sending back to client
    const { passwordHash: _, refreshTokenHash: __, ...result } = user;
    return result;
  }

  // Update customer profile (name, phone, avatarUrl)
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new NotFoundException('User profile does not exist.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    const { passwordHash: _, refreshTokenHash: __, ...result } = updatedUser;
    return result;
  }

  // Change password for logged-in user
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile does not exist.');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Account does not have a password set (registered via OAuth). Please use password reset or contact support.',
      );
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        refreshTokenHash: null, // Invalidate existing sessions on other devices
      },
    });

    return { message: 'Password changed successfully. Please log in again if needed.' };
  }

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

    await this.mailService.sendOtpEmail(email, code, purpose);
  }

  // Step 1: Initiate registration form submission (validates, hashes password, saves payload & emails OTP)
  async initiateRegistration(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    const name = dto.name || [dto.firstName, dto.lastName].filter(Boolean).join(' ') || 'User';
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const payload = JSON.stringify({
      name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });

    // Remove any previous registration OTPs for this email to avoid state pollution
    await this.prisma.otpVerification.deleteMany({
      where: { email: dto.email, purpose: 'REGISTER_VERIFY' },
    });

    await this.prisma.otpVerification.create({
      data: {
        email: dto.email,
        code,
        purpose: 'REGISTER_VERIFY',
        payload,
        expiresAt,
      },
    });

    await this.mailService.sendOtpEmail(dto.email, code, 'REGISTER_VERIFY');

    return {
      message: 'Registration form submitted successfully. An OTP code has been sent to your email.',
      email: dto.email,
    };
  }

  // Step 2: Verify OTP code and create account in database
  async verifyRegistrationOtp(dto: VerifyOtpDto) {
    const validOtp = await this.prisma.otpVerification.findFirst({
      where: {
        email: dto.email,
        code: dto.otpCode,
        purpose: 'REGISTER_VERIFY',
        expiresAt: { gte: new Date() },
      },
    });

    if (!validOtp || !validOtp.payload) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    const pendingUser = JSON.parse(validOtp.payload);

    const newUser = await this.prisma.user.create({
      data: {
        name: pendingUser.name,
        email: pendingUser.email,
        phone: pendingUser.phone,
        passwordHash: pendingUser.passwordHash,
        role: 'customer',
        isEmailVerified: true,
      },
    });

    await this.prisma.otpVerification.delete({ where: { id: validOtp.id } });

    const { passwordHash: _, refreshTokenHash: __, ...result } = newUser;
    return {
      message: 'Account created successfully.',
      user: result,
    };
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

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account was registered using Google. Please log in with Google.');
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

  // Handle Google Login / Registration
  async validateOAuthUser(profile: { email: string; firstName: string; lastName: string }) {
    const email = profile.email.toLowerCase();
    
    // 1. Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. If user does not exist, create a new one (Auto-registration)
    if (!user) {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      user = await this.prisma.user.create({
        data: {
          email,
          name: fullName || 'Google User',
          role: 'customer',
          isEmailVerified: true, // Google already verified their ownership of the email
        },
      });
    }

    // 3. Generate internal Auth & Refresh Tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 4. Update internal refresh token hash in DB
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;

    return {
      ...tokens,
      user: userResponse,
    };
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
