import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartsService } from './carts.service.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request } from 'express';

@Controller('cart')
@UseGuards(JwtAuthGuard) // Protect entire controller - cart operations require login
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  // 1. Get the authenticated user's shopping cart
  @Get()
  async getCart(@Req() request: Request) {
    const userId = (request.user as any).id;
    return this.cartsService.getOrCreateCart(userId);
  }

  // 2. Add an item to the shopping cart
  @Post('items')
  async addItem(
    @Req() request: Request,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const userId = (request.user as any).id;
    return this.cartsService.addItemToCart(userId, addToCartDto);
  }

  // 3. Update the quantity of an item in the cart
  @Patch('items/:itemId')
  async updateItemQuantity(
    @Req() request: Request,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const userId = (request.user as any).id;
    return this.cartsService.updateCartItem(userId, BigInt(itemId), updateCartItemDto.quantity);
  }

  // 4. Remove a single item from the cart
  @Delete('items/:itemId')
  async removeItem(
    @Req() request: Request,
    @Param('itemId') itemId: string,
  ) {
    const userId = (request.user as any).id;
    await this.cartsService.removeItemFromCart(userId, BigInt(itemId));
    return { message: 'Item removed from cart successfully.' };
  }

  // 5. Clear the entire cart
  @Delete()
  async clearCart(@Req() request: Request) {
    const userId = (request.user as any).id;
    await this.cartsService.clearCart(userId);
    return { message: 'Shopping cart cleared successfully.' };
  }
}
