import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service.js';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthService (2-Step OTP Registration)', () => {
  let service: AuthService;
  let prisma: any;
  let mailService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      otpVerification: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 1 }),
        findFirst: vi.fn(),
        delete: vi.fn().mockResolvedValue({ id: 1 }),
      },
    };

    mailService = {
      sendOtpEmail: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: vi.fn() } },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('initiateRegistration', () => {
    it('should save pending payload to otpVerification and send OTP email without creating user record', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        phone: '012345678',
      };

      const result = await service.initiateRegistration(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.otpVerification.create).toHaveBeenCalled();
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(dto.email, expect.any(String), 'REGISTER_VERIFY');
      expect(result.message).toContain('OTP code has been sent');
    });

    it('should throw BadRequestException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'john@example.com' });

      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        phone: '012345678',
      };

      await expect(service.initiateRegistration(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.otpVerification.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyRegistrationOtp', () => {
    it('should create user record in database when valid OTP and payload are provided', async () => {
      const mockPayload = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '012345678',
        passwordHash: '$2b$12$hashedPasswordExample',
      });

      prisma.otpVerification.findFirst.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        code: '123456',
        purpose: 'REGISTER_VERIFY',
        payload: mockPayload,
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '012345678',
        passwordHash: '$2b$12$hashedPasswordExample',
        role: 'customer',
        isEmailVerified: true,
      });

      const dto = {
        email: 'john@example.com',
        otpCode: '123456',
      };

      const result = await service.verifyRegistrationOtp(dto);

      expect(prisma.otpVerification.findFirst).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '012345678',
          passwordHash: '$2b$12$hashedPasswordExample',
          role: 'customer',
          isEmailVerified: true,
        },
      });
      expect(prisma.otpVerification.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.user.email).toBe('john@example.com');
      expect(result.message).toContain('Account created successfully');
    });

    it('should throw BadRequestException if OTP code is invalid or expired', async () => {
      prisma.otpVerification.findFirst.mockResolvedValue(null);

      const dto = {
        email: 'john@example.com',
        otpCode: '999999',
      };

      await expect(service.verifyRegistrationOtp(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user name, phone, and avatarUrl successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Old Name',
        email: 'john@example.com',
        phone: '00000000',
        avatarUrl: null,
      });

      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        name: 'New Name',
        email: 'john@example.com',
        phone: '012345678',
        avatarUrl: 'https://cloudinary.com/avatar.jpg',
        passwordHash: 'secret',
        refreshTokenHash: 'token',
      });

      const result = await service.updateProfile('user-1', {
        name: 'New Name',
        phone: '012345678',
        avatarUrl: 'https://cloudinary.com/avatar.jpg',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: 'New Name',
          phone: '012345678',
          avatarUrl: 'https://cloudinary.com/avatar.jpg',
        },
      });

      expect(result.name).toBe('New Name');
      expect(result.avatarUrl).toBe('https://cloudinary.com/avatar.jpg');
      expect((result as any).passwordHash).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully when current password matches', async () => {
      const bcrypt = await import('bcrypt');
      const hashedOldPassword = await bcrypt.hash('OldPassword123!', 10);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: hashedOldPassword,
      });

      prisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.changePassword('user-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewSuperPassword123!',
      });

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result.message).toContain('Password changed successfully');
    });

    it('should throw BadRequestException if current password does not match', async () => {
      const bcrypt = await import('bcrypt');
      const hashedOldPassword = await bcrypt.hash('OldPassword123!', 10);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: hashedOldPassword,
      });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewSuperPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
