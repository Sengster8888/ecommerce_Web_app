import type { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { RegisterOtpDto } from './dto/register-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendOtp(sendOtpDto: SendOtpDto): Promise<{
        message: string;
    }>;
    register(registerDto: RegisterOtpDto): Promise<{
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
    login(loginDto: LoginDto, response: Response): Promise<{
        accessToken: string;
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
    }>;
    refresh(request: Request, response: Response): Promise<{
        accessToken: string;
    }>;
    logout(request: Request, response: Response): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
