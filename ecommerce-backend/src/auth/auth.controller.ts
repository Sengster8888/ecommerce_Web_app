import { Controller, Post, Body, Res, Req, UseGuards, UnauthorizedException, Get, InternalServerErrorException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { RegisterOtpDto } from './dto/register-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post('otp/send')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    await this.authService.sendOtp(sendOtpDto.email, sendOtpDto.purpose);
    return { message: 'OTP code has been sent successfully to your email.' };
  }

  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(@Body() registerDto: RegisterOtpDto) {
    return this.authService.registerWithOtp(registerDto);
  }

  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
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
    const user = request.user as any;
    await this.authService.logout(user?.id);

    response.clearCookie('refresh_token');
    return { message: 'Logged out successfully, session invalidated.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() request: Request) {
    // request.user is set by the Passport JwtStrategy validate() function
    const user = request.user as any;
    return this.authService.getProfile(user?.id);
  }

  @UseGuards(ThrottlerGuard)
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

  // 1. Trigger Google Authentication page
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Passport redirects automatically to Google OAuth page
  }

  // 2. Google OAuth Callback Endpoint
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const oauthUser = req.user;
      if (!oauthUser) {
        throw new InternalServerErrorException('Google authentication failed.');
      }

      // Generate local JWT tokens
      const result = await this.authService.validateOAuthUser({
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
      });

      // Set the Refresh Token in HttpOnly cookie
      response.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect client back to React Frontend with the Access Token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      response.redirect(`${frontendUrl}/oauth/callback?token=${result.accessToken}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      response.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}
