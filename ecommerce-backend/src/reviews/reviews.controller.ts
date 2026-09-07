import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { SubmitRatingDto } from './dto/submit-rating.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Product Reviews & Ratings')
@Controller('products/:productId/ratings')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async rateProduct(
    @Param('productId') productId: string,
    @Req() req: any,
    @Body() dto: SubmitRatingDto,
  ) {
    const userId = req.user?.id;
    return this.reviewsService.submitProductRating(userId, BigInt(productId), dto.rating);
  }

  @Get('summary')
  async getRatingSummary(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatingSummary(BigInt(productId));
  }
}
