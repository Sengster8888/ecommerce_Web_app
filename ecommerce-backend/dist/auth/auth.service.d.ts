import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { RegisterOtpDto } from './dto/register-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    sendOtp(email: string, purpose: string): Promise<void>;
    registerWithOtp(dto: RegisterOtpDto): Promise<{
        name: string;
        email: string;
        phone: string;
        id: string;
        createdAt: Date;
        refreshTokenHash: string | null;
        isEmailVerified: boolean;
        role: string;
        updatedAt: Date;
    }>;
    login(email: string, pass: string): Promise<{
        user: {
            name: string;
            email: string;
            phone: string;
            id: string;
            createdAt: Date;
            isEmailVerified: boolean;
            role: string;
            updatedAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(dto: ResetPasswordDto): Promise<void>;
    private updateRefreshTokenHash;
    private generateTokens;
}
