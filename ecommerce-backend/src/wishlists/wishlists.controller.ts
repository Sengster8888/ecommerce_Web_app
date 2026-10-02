import { Controller, Get, Post, Delete, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { WishlistsService } from './wishlists.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  async getWishlist(@Req() req: any) {
    const userId = req.user.id;
    return this.wishlistsService.getWishlist(userId);
  }

  @Get('ids')
  async getWishlistProductIds(@Req() req: any) {
    const userId = req.user.id;
    return this.wishlistsService.getWishlistProductIds(userId);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.OK)
  async addProductToWishlist(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user.id;
    return this.wishlistsService.addProductToWishlist(userId, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  async removeProductFromWishlist(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user.id;
    return this.wishlistsService.removeProductFromWishlist(userId, productId);
  }
}
