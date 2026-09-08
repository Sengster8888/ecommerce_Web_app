import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AddressesService', () => {
  let service: AddressesService;
  let prisma: any;

  const mockAddress = {
    id: BigInt(1),
    userId: 'user-uuid-1',
    label: 'Home',
    recipientName: 'Sokha Chan',
    phone: '012345678',
    province: 'Phnom Penh',
    city: 'Khan Toul Kork',
    commune: 'Sangkat Boeung Kak II',
    streetLine: 'Street 592, House #12B',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      address: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create address and make it default if first address', async () => {
    prisma.address.count.mockResolvedValue(0);
    prisma.address.create.mockResolvedValue(mockAddress);

    const result = await service.createAddress('user-uuid-1', {
      label: 'Home',
      recipientName: 'Sokha Chan',
      phone: '012345678',
      province: 'Phnom Penh',
      city: 'Khan Toul Kork',
      commune: 'Sangkat Boeung Kak II',
      streetLine: 'Street 592, House #12B',
    });

    expect(prisma.address.count).toHaveBeenCalledWith({ where: { userId: 'user-uuid-1' } });
    expect(prisma.address.create).toHaveBeenCalled();
    expect(result).toEqual(mockAddress);
  });

  it('should throw NotFoundException if address does not exist', async () => {
    prisma.address.findUnique.mockResolvedValue(null);

    await expect(service.getAddressById('user-uuid-1', BigInt(99))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException if address belongs to another user', async () => {
    prisma.address.findUnique.mockResolvedValue(mockAddress);

    await expect(service.getAddressById('user-uuid-other', BigInt(1))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should delete address and reassign default if deleted address was default', async () => {
    prisma.address.findUnique.mockResolvedValue(mockAddress);
    prisma.address.delete.mockResolvedValue(mockAddress);
    prisma.address.findFirst.mockResolvedValue({ ...mockAddress, id: BigInt(2), isDefault: false });

    const response = await service.deleteAddress('user-uuid-1', BigInt(1));

    expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: BigInt(1) } });
    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: BigInt(2) },
      data: { isDefault: true },
    });
    expect(response).toEqual({ message: 'Address deleted successfully.' });
  });
});
