import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Req
} from '@nestjs/common';
import { DiscountsService } from './discounts.service.js';
import { ValidateDiscountDto } from './dto/validate-discount.dto.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Discounts & Promo Codes')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  // --- CUSTOMER VALIDATION GATEWAY ---

  @Post('validate')
  async validateDiscount(@Req() req: any, @Body() dto: ValidateDiscountDto) {
    const userId = req.user?.id;
    return this.discountsService.validateDiscount(
      dto.code,
      dto.cartSubtotal,
      dto.cartItems || [],
      userId,
    );
  }

  // --- ADMIN ONLY OPERATIONS (Strictly Guarded) ---

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.createDiscount(dto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listAll() {
    return this.discountsService.findAllDiscounts();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getOne(@Param('id') id: string) {
    return this.discountsService.findDiscountById(BigInt(id));
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discountsService.updateDiscount(BigInt(id), dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.discountsService.deleteDiscount(BigInt(id));
  }
}
