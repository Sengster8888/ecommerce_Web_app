var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { RegisterOtpDto } from './dto/register-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async sendOtp(sendOtpDto) {
        await this.authService.sendOtp(sendOtpDto.email, sendOtpDto.purpose);
        return { message: 'OTP code has been sent successfully to your email.' };
    }
    async register(registerDto) {
        return this.authService.registerWithOtp(registerDto);
    }
    async login(loginDto, response) {
        const tokens = await this.authService.login(loginDto.email, loginDto.password);
        response.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            accessToken: tokens.accessToken,
            user: tokens.user,
        };
    }
    async refresh(request, response) {
        const refreshToken = request.cookies['refresh_token'];
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }
        const tokens = await this.authService.refreshTokens(refreshToken);
        response.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { accessToken: tokens.accessToken };
    }
    async logout(request, response) {
        const user = request.user;
        await this.authService.logout(user?.id);
        response.clearCookie('refresh_token');
        return { message: 'Logged out successfully, session invalidated.' };
    }
    async forgotPassword(dto) {
        await this.authService.forgotPassword(dto.email);
        return {
            message: 'If the email is registered in our system, an OTP code has been sent to it.'
        };
    }
    async resetPassword(dto) {
        await this.authService.resetPassword(dto);
        return { message: 'Your password has been reset successfully. Please log in with your new credentials.' };
    }
};
__decorate([
    Post('otp/send'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    Post('register'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Post('login'),
    __param(0, Body()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Post('refresh'),
    __param(0, Req()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    UseGuards(JwtAuthGuard),
    Post('logout'),
    __param(0, Req()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    Post('password/forgot'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    Post('password/reset'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
AuthController = __decorate([
    Controller('auth'),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map