import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WishlistsService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const wishlistItems = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            },
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Map the results to return just the products with their standard format
    return wishlistItems.map(item => ({
      ...item.product,
      wishlistItemId: item.id.toString(),
      addedAt: item.createdAt,
    }));
  }

  async addProductToWishlist(userId: string, productId: string | bigint | number) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(productId) }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Upsert to handle existing item gracefully (prevent errors if user double-clicks favorite)
    const wishlistItem = await this.prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId: BigInt(productId),
        }
      },
      update: {},
      create: {
        userId,
        productId: BigInt(productId),
      }
    });

    return {
      message: 'Product added to wishlist',
      wishlistItemId: wishlistItem.id.toString()
    };
  }

  async removeProductFromWishlist(userId: string, productId: string | bigint | number) {
    try {
      await this.prisma.wishlistItem.delete({
        where: {
          userId_productId: {
            userId,
            productId: BigInt(productId),
          }
        }
      });
      return { message: 'Product removed from wishlist' };
    } catch (error) {
      // If it's already deleted or doesn't exist, just return success
      return { message: 'Product removed from wishlist' };
    }
  }

  // Get just the array of product IDs for quick UI syncing
  async getWishlistProductIds(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true }
    });
    return items.map(item => item.productId.toString());
  }
}
