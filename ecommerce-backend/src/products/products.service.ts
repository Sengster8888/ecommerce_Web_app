import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const slugExists = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (slugExists) {
      throw new ConflictException('Product slug already exists.');
    }

    const catId = BigInt(dto.categoryId);
    const category = await this.prisma.category.findUnique({ where: { id: catId } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        status: dto.status ?? 'active',
        categoryId: catId,
        images: dto.images ? {
          createMany: {
            data: dto.images.map((img) => ({
              imageUrl: img.imageUrl,
              isPrimary: img.isPrimary ?? false,
              sortOrder: img.sortOrder ?? 0,
            })),
          },
        } : undefined,
      },
      include: { images: true, category: true },
    });
  }

  async findAll(filters: { page: number; limit: number; categoryId?: string; search?: string }) {
    const { page, limit, categoryId, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId) {
      where.categoryId = BigInt(categoryId);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { images: { orderBy: { sortOrder: 'asc' } }, category: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: bigint) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async update(id: bigint, dto: Partial<CreateProductDto>) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product to update not found.');
    }

    let catId: bigint | undefined;
    if (dto.categoryId) {
      catId = BigInt(dto.categoryId);
      const catExists = await this.prisma.category.findUnique({ where: { id: catId } });
      if (!catExists) {
        throw new NotFoundException('Assigned category does not exist.');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        status: dto.status,
        categoryId: catId,
      },
      include: { images: true },
    });
  }

  async delete(id: bigint) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product to delete not found.');
    }

    // Historical Orders Referential Integrity Guard:
    const ordersCount = await this.prisma.orderItem.count({ where: { productId: id } });
    if (ordersCount > 0) {
      // If product has historic sales, archive instead of deleting to prevent relational failure
      await this.prisma.product.update({
        where: { id },
        data: { status: 'inactive' },
      });
      return;
    }

    await this.prisma.product.delete({ where: { id } });
  }
}
