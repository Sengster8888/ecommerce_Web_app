var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
import { Injectable, BadRequestException, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    logger = new Logger(AuthService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async sendOtp(email, purpose) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
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
    async registerWithOtp(dto) {
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
    async login(email, pass) {
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
    async refreshTokens(refreshToken) {
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
        }
        catch {
            throw new UnauthorizedException('Access Denied');
        }
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            this.logger.log(`[SECURITY INFO] Forgot password requested for non-existent email: ${email}`);
            return;
        }
        await this.sendOtp(email, 'PASSWORD_RESET');
    }
    async resetPassword(dto) {
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
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new NotFoundException('User with this email was not found.');
        }
        const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: newPasswordHash,
                    refreshTokenHash: null
                },
            }),
            this.prisma.otpVerification.delete({
                where: { id: validOtp.id }
            })
        ]);
    }
    async updateRefreshTokenHash(userId, refreshToken) {
        const hashed = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: hashed },
        });
    }
    async generateTokens(userId, email, role) {
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
};
AuthService = AuthService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map