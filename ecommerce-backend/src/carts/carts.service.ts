import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Retrieve active cart or create one lazily
  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true }, // Include only primary thumbnail for lighter payload
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return cart;
  }

  // Add item to cart with dynamic stock level check
  async addItemToCart(userId: string, dto: AddToCartDto) {
    const prodId = BigInt(dto.productId);

    // 1. Fetch current product and verify existence + status
    const product = await this.prisma.product.findUnique({
      where: { id: prodId },
    });

    if (!product || product.status !== 'active') {
      throw new NotFoundException('The requested product is not available.');
    }

    // 2. Fetch or create the user's cart
    const cart = await this.getOrCreateCart(userId);

    // 3. Check if product already exists in the cart to calculate target quantity
    const existingCartItem = cart.items.find((item) => item.productId === prodId);
    const targetQuantity = existingCartItem 
      ? existingCartItem.quantity + dto.quantity 
      : dto.quantity;

    // 4. Enforce inventory boundaries (Dynamically check stock levels)
    if (product.stock < targetQuantity) {
      throw new BadRequestException(
        `Insufficient stock available. Only ${product.stock} item(s) remain in stock, but you requested ${targetQuantity} total in your cart.`,
      );
    }

    // 5. Upsert the cart item
    return this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: prodId,
        },
      },
      update: { quantity: targetQuantity },
      create: {
        cartId: cart.id,
        productId: prodId,
        quantity: dto.quantity,
      },
      include: {
        product: true,
      },
    });
  }

  // Update item quantity with dynamic stock level check
  async updateCartItem(userId: string, itemId: bigint, quantity: number) {
    // 1. Find the cart item first
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found.');
    }

    // 2. Guard: Ensure the cart item belongs to the authenticated user
    if (cartItem.cart.userId !== userId) {
      throw new ForbiddenException('Access Denied: You do not own this shopping cart.');
    }

    // 3. Enforce inventory boundaries for the updated quantity
    if (cartItem.product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${cartItem.product.stock} item(s) are available, but you requested ${quantity}.`,
      );
    }

    // 4. Update the quantity
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
  }

  // Remove a single item from the cart
  async removeItemFromCart(userId: string, itemId: bigint): Promise<void> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found.');
    }

    if (cartItem.cart.userId !== userId) {
      throw new ForbiddenException('Access Denied: You do not own this shopping cart.');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  // Clear all items from user's cart
  async clearCart(userId: string): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Shopping cart not found.');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
