import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateDiscountDto, DiscountScope, DiscountType } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';

export interface CartItemContext {
  productId: bigint | string | number;
  categoryId?: bigint | string | number;
  unitPrice: number;
  quantity: number;
}

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  // Calculate discount for promo code OR automatic discounts
  async validateDiscount(
    code?: string,
    cartSubtotal: number = 0,
    cartItems: CartItemContext[] = [],
    userId?: string,
  ) {
    const now = new Date();
    const decimalSubtotal = new Decimal(cartSubtotal);

    // Scenario A: Customer provided a PROMO CODE
    if (code && code.trim()) {
      const normalizedCode = code.trim().toUpperCase();

      const discount = await this.prisma.discount.findUnique({
        where: { code: normalizedCode },
        include: {
          discountProducts: true,
          discountCategories: true,
        },
      });

      if (!discount) {
        throw new NotFoundException('Invalid promo code.');
      }

      if (!discount.isActive) {
        throw new BadRequestException('This promo code is currently inactive.');
      }

      if (now < discount.startDate) {
        throw new BadRequestException('This promo code is not active yet.');
      }

      if (now > discount.endDate) {
        throw new BadRequestException('This promo code has expired.');
      }

      if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
        throw new BadRequestException('This promo code has reached its maximum utilization limit.');
      }

      // Check Per-User limit if userId is available
      if (userId && discount.usageLimitPerUser !== null) {
        const userUsageCount = await this.prisma.order.count({
          where: {
            userId,
            discountId: discount.id,
          },
        });

        if (userUsageCount >= discount.usageLimitPerUser) {
          throw new BadRequestException(
            `You have already reached the maximum usage limit (${discount.usageLimitPerUser} times) for this coupon.`,
          );
        }
      }

      // Check Minimum Order Amount
      if (decimalSubtotal.lt(discount.minimumOrderAmount)) {
        throw new BadRequestException(
          `This coupon requires a minimum order subtotal of $${discount.minimumOrderAmount.toFixed(2)}.`,
        );
      }

      const calculated = this.calculateDiscountAmount(discount, decimalSubtotal, cartItems);

      return {
        discountId: discount.id.toString(),
        name: discount.name,
        code: discount.code,
        type: discount.type,
        scope: discount.scope,
        value: discount.value,
        discountAmount: calculated.discountAmount,
        newSubtotal: parseFloat(decimalSubtotal.sub(new Decimal(calculated.discountAmount)).toFixed(2)),
      };
    }

    // Scenario B: Automatic Store-Wide / Product / Category Discount Lookup
    const activeAutomaticDiscounts = await this.prisma.discount.findMany({
      where: {
        scope: { in: ['ALL_PRODUCTS', 'SPECIFIC_PRODUCTS', 'CATEGORY'] },
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        discountProducts: true,
        discountCategories: true,
      },
    });

    let bestDiscount = null;
    let maxCalculatedAmount = new Decimal(0);

    for (const discount of activeAutomaticDiscounts) {
      if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
        continue;
      }

      if (decimalSubtotal.lt(discount.minimumOrderAmount)) {
        continue;
      }

      if (userId && discount.usageLimitPerUser !== null) {
        const userUsageCount = await this.prisma.order.count({
          where: { userId, discountId: discount.id },
        });
        if (userUsageCount >= discount.usageLimitPerUser) {
          continue;
        }
      }

      const calc = this.calculateDiscountAmount(discount, decimalSubtotal, cartItems);
      const calcDecimal = new Decimal(calc.discountAmount);

      if (calcDecimal.gt(maxCalculatedAmount)) {
        maxCalculatedAmount = calcDecimal;
        bestDiscount = {
          discountId: discount.id.toString(),
          name: discount.name,
          code: discount.code,
          type: discount.type,
          scope: discount.scope,
          value: discount.value,
          discountAmount: calc.discountAmount,
          newSubtotal: parseFloat(decimalSubtotal.sub(calcDecimal).toFixed(2)),
        };
      }
    }

    if (bestDiscount) {
      return bestDiscount;
    }

    return {
      discountId: null,
      discountAmount: 0,
      newSubtotal: parseFloat(decimalSubtotal.toFixed(2)),
    };
  }

  // Calculate monetary reduction based on scope, type, and capping limits
  private calculateDiscountAmount(
    discount: any,
    subtotal: Decimal,
    cartItems: CartItemContext[],
  ): { discountAmount: number } {
    let eligibleSubtotal = subtotal;

    // Filter subtotal if restricted to SPECIFIC_PRODUCTS or CATEGORY
    if (discount.scope === 'SPECIFIC_PRODUCTS' && discount.discountProducts?.length > 0) {
      const eligibleProductIds = new Set(
        discount.discountProducts.map((p: any) => p.productId.toString()),
      );
      let applicableSum = 0;
      for (const item of cartItems) {
        if (eligibleProductIds.has(item.productId.toString())) {
          applicableSum += item.unitPrice * item.quantity;
        }
      }
      eligibleSubtotal = new Decimal(applicableSum);
    } else if (discount.scope === 'CATEGORY' && discount.discountCategories?.length > 0) {
      const eligibleCategoryIds = new Set(
        discount.discountCategories.map((c: any) => c.categoryId.toString()),
      );
      let applicableSum = 0;
      for (const item of cartItems) {
        if (item.categoryId && eligibleCategoryIds.has(item.categoryId.toString())) {
          applicableSum += item.unitPrice * item.quantity;
        }
      }
      eligibleSubtotal = new Decimal(applicableSum);
    }

    let discountAmount = new Decimal(0);

    if (discount.type === 'PERCENTAGE') {
      const fractionalPercent = new Decimal(discount.value).div(100);
      discountAmount = eligibleSubtotal.mul(fractionalPercent);
    } else if (discount.type === 'FIXED_AMOUNT') {
      discountAmount = new Decimal(discount.value);
    }

    // Apply maxDiscountAmount cap if configured
    if (discount.maxDiscountAmount && discountAmount.gt(discount.maxDiscountAmount)) {
      discountAmount = new Decimal(discount.maxDiscountAmount);
    }

    // Ensure discount does not exceed the total subtotal
    if (discountAmount.gt(subtotal)) {
      discountAmount = subtotal;
    }

    return {
      discountAmount: parseFloat(discountAmount.toFixed(2)),
    };
  }

  // --- ADMIN MANAGEMENT OPERATIONS ---

  async createDiscount(dto: CreateDiscountDto) {
    let normalizedCode: string | null = null;

    if (dto.scope === DiscountScope.PROMO_CODE) {
      if (!dto.code) {
        throw new BadRequestException('A promo code string is required when scope is PROMO_CODE.');
      }
      normalizedCode = dto.code.trim().toUpperCase();

      const existing = await this.prisma.discount.findUnique({
        where: { code: normalizedCode },
      });
      if (existing) {
        throw new ConflictException('A discount with this promo code already exists.');
      }
    } else if (dto.code) {
      normalizedCode = dto.code.trim().toUpperCase();
      const existing = await this.prisma.discount.findUnique({
        where: { code: normalizedCode },
      });
      if (existing) {
        throw new ConflictException('A discount with this promo code already exists.');
      }
    }

    if (dto.scope === DiscountScope.SPECIFIC_PRODUCTS && (!dto.productIds || dto.productIds.length === 0)) {
      throw new BadRequestException('At least one product ID must be provided when scope is SPECIFIC_PRODUCTS.');
    }

    if (dto.scope === DiscountScope.CATEGORY && (!dto.categoryIds || dto.categoryIds.length === 0)) {
      throw new BadRequestException('At least one category ID must be provided when scope is CATEGORY.');
    }

    const discount = await this.prisma.discount.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        scope: dto.scope,
        value: dto.value,
        maxDiscountAmount: dto.maxDiscountAmount,
        minimumOrderAmount: dto.minimumOrderAmount ?? 0.00,
        code: normalizedCode,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        usageLimit: dto.usageLimit,
        usageLimitPerUser: dto.usageLimitPerUser,
        isActive: dto.isActive ?? true,
        discountProducts: dto.productIds?.length
          ? {
              create: dto.productIds.map((pId) => ({
                productId: BigInt(pId),
              })),
            }
          : undefined,
        discountCategories: dto.categoryIds?.length
          ? {
              create: dto.categoryIds.map((cId) => ({
                categoryId: BigInt(cId),
              })),
            }
          : undefined,
      },
      include: {
        discountProducts: true,
        discountCategories: true,
      },
    });

    return discount;
  }

  async findAllDiscounts() {
    return this.prisma.discount.findMany({
      include: {
        discountProducts: { include: { product: true } },
        discountCategories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDiscountById(id: bigint) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: {
        discountProducts: { include: { product: true } },
        discountCategories: { include: { category: true } },
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found.');
    }

    return discount;
  }

  async updateDiscount(id: bigint, dto: UpdateDiscountDto) {
    const existingDiscount = await this.findDiscountById(id);

    let normalizedCode = existingDiscount.code;
    if (dto.code !== undefined) {
      if (dto.code) {
        normalizedCode = dto.code.trim().toUpperCase();
        if (normalizedCode !== existingDiscount.code) {
          const duplicate = await this.prisma.discount.findUnique({
            where: { code: normalizedCode },
          });
          if (duplicate) {
            throw new ConflictException('A discount with this code already exists.');
          }
        }
      } else {
        normalizedCode = null;
      }
    }

    // Handle updating junction tables if productIds or categoryIds are provided
    if (dto.productIds !== undefined) {
      await this.prisma.discountProduct.deleteMany({
        where: { discountId: id },
      });
    }

    if (dto.categoryIds !== undefined) {
      await this.prisma.discountCategory.deleteMany({
        where: { discountId: id },
      });
    }

    return this.prisma.discount.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        scope: dto.scope,
        value: dto.value,
        maxDiscountAmount: dto.maxDiscountAmount,
        minimumOrderAmount: dto.minimumOrderAmount,
        code: normalizedCode,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        usageLimit: dto.usageLimit,
        usageLimitPerUser: dto.usageLimitPerUser,
        isActive: dto.isActive,
        discountProducts: dto.productIds?.length
          ? {
              create: dto.productIds.map((pId) => ({
                productId: BigInt(pId),
              })),
            }
          : undefined,
        discountCategories: dto.categoryIds?.length
          ? {
              create: dto.categoryIds.map((cId) => ({
                categoryId: BigInt(cId),
              })),
            }
          : undefined,
      },
      include: {
        discountProducts: true,
        discountCategories: true,
      },
    });
  }

  async deleteDiscount(id: bigint) {
    await this.findDiscountById(id);

    const linksCount = await this.prisma.order.count({
      where: { discountId: id },
    });

    if (linksCount > 0) {
      throw new BadRequestException(
        'Cannot delete discount because it has historical order associations. Deactivate it or update its end date instead.',
      );
    }

    await this.prisma.discount.delete({
      where: { id },
    });

    return { success: true, message: 'Discount deleted successfully.' };
  }
}
