import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Create a category
  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('A category with this slug already exists.');
    }

    let parentId: bigint | null = null;
    if (dto.parentCategoryId) {
      parentId = BigInt(dto.parentCategoryId);
      const parentExists = await this.prisma.category.findUnique({ where: { id: parentId } });
      if (!parentExists) {
        throw new NotFoundException('Specified parent category does not exist.');
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        imageUrl: dto.imageUrl,
        parentCategoryId: parentId,
      },
    });
  }

  // 2. Fetch all categories parsed into a recursive tree hierarchy
  async findHierarchyTree() {
    return this.prisma.category.findMany({
      where: { parentCategoryId: null }, // Start with top-level parents
      include: {
        subCategories: {
          include: {
            subCategories: true, // Resolves multi-tier menus for React catalog nav
          },
        },
      },
    });
  }

  // 3. Find specific category with its children
  async findOne(id: bigint) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { subCategories: true, products: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  // 4. Update category (incorporates circular loop prevention)
  async update(id: bigint, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    let parentId: bigint | null | undefined = undefined;

    if (dto.parentCategoryId !== undefined) {
      if (dto.parentCategoryId === null) {
        parentId = null;
      } else {
        parentId = BigInt(dto.parentCategoryId);
        
        // Anti-Loop Guard: Prevent assigning a category as its own child
        if (parentId === id) {
          throw new BadRequestException('A category cannot be its own parent.');
        }

        const parentExists = await this.prisma.category.findUnique({ where: { id: parentId } });
        if (!parentExists) {
          throw new NotFoundException('Specified parent category does not exist.');
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        imageUrl: dto.imageUrl,
        parentCategoryId: parentId,
      },
    });
  }

  // 5. Secure Delete Guard
  async delete(id: bigint): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // Referential Integrity Guard: Block deletions of categories that house active products
    if (category._count.products > 0) {
      throw new ConflictException(
        `Cannot delete this category because it contains ${category._count.products} products. Reassign or delete those products first.`,
      );
    }

    // Cascade safety: Prisma is configured with 'onDelete: SetNull' for categories.
    // Deleting this category automatically detaches it from subcategories safely.
    await this.prisma.category.delete({
      where: { id },
    });
  }
}
