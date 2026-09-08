import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Create a new address for logged-in user
  async createAddress(userId: string, dto: CreateAddressDto) {
    const isDefault = dto.isDefault ?? false;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      } else {
        // If this is the user's first address, automatically make it default
        const existingCount = await tx.address.count({ where: { userId } });
        if (existingCount === 0) {
          return tx.address.create({
            data: {
              ...dto,
              userId,
              isDefault: true,
            },
          });
        }
      }

      return tx.address.create({
        data: {
          ...dto,
          userId,
          isDefault,
        },
      });
    });
  }

  // 2. Retrieve all addresses for logged-in user
  async getUserAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // 3. Get single address by ID (with ownership verification)
  async getAddressById(userId: string, addressId: bigint) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found.');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this address.');
    }

    return address;
  }

  // 4. Update address
  async updateAddress(userId: string, addressId: bigint, dto: UpdateAddressDto) {
    await this.getAddressById(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: dto,
      });
    });
  }

  // 5. Set an address as default
  async setDefaultAddress(userId: string, addressId: bigint) {
    await this.getAddressById(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  // 6. Delete an address
  async deleteAddress(userId: string, addressId: bigint) {
    const address = await this.getAddressById(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      // If deleted address was default, set the latest remaining address as default
      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }

      return { message: 'Address deleted successfully.' };
    });
  }
}
