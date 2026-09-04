import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // --- PUBLIC ENDPOINTS ---

  @Get()
  async getProducts(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      categoryId,
      search,
    });
  }

  @Get('slug/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.findOne(BigInt(id));
  }

  // --- SECURE ADMIN ENDPOINTS ---

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateProduct(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.productsService.update(BigInt(id), dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteProduct(@Param('id') id: string) {
    await this.productsService.delete(BigInt(id));
    return { message: 'Product deleted successfully.' };
  }
}
