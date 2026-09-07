# Phase 13: Discounts & Ratings Modules (Post-MVP Specifications) - Version 2

This integration guide outlines the database mappings and NestJS architectural design for two crucial catalog expansion features: **Ratings & Reviews** (fully verified) and **Discounts & Promo Codes** (recalculating checkout subtotals). 

To preserve code simplicity and maintain clean database records, the rating system **excludes textual comments**—focusing strictly on verified numeric ratings—while the discount engine supports both automated catalog markdown prices and checkout-level promo code validations.

**Version 2 Updates:** Added complete administrative capabilities for creating, updating, deleting, and auditing promo codes securely via Admin-Only API endpoints.

---

## 1. Relational Database Mappings (Prisma Schema Updates)

Add these two models to your Prisma schema to establish the relational structures for promotional codes and verified product ratings.

### Database Models
```prisma
/// 14. PROMO CODES MODEL
/// Defines coupon structures for percentage or flat-rate checkout discounts.
model PromoCode {
  id           BigInt   @id @default(autoincrement()) @db.BigInt
  code         String   @unique @db.VarChar(50) // e.g., 'KHMERNEWYEAR10'
  discountType String   @map("discount_type") @db.VarChar(20) // 'PERCENTAGE' or 'FIXED'
  value        Decimal  @db.Decimal(12, 2) // Representing percentage (e.g., 10.00%) or flat USD
  minSubtotal  Decimal  @default(0.00) @map("min_subtotal") @db.Decimal(12, 2) // Minimum cart total to activate
  maxUses      Int      @default(100) @map("max_uses") @db.Integer
  usedCount    Int      @default(0) @map("used_count") @db.Integer
  expiresAt    DateTime @map("expires_at") @db.Timestamp
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamp
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamp

  orders       Order[]

  @@map("promo_codes")
}

/// 15. VERIFIED REVIEWS MODEL
/// Chronological 1-5 star ratings. Does not include optional comment texts to maintain thin data profiles.
model Review {
  id        BigInt   @id @default(autoincrement()) @db.BigInt
  productId BigInt   @map("product_id") @db.BigInt
  userId    String   @map("user_id") @db.Uuid
  rating    Int      @db.Integer // Must be strictly constrained (1 to 5)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // One customer can only submit one rating per product to prevent star-boosting exploits
  @@unique([userId, productId])
  @@map("reviews")
}
```

### Relational Adjustments to Existing Models
To complete these relationships, update your existing models inside your Prisma schema:
1.  **Add to `Product` model:** `reviews Review[]`
2.  **Add to `User` model:** `reviews Review[]`
3.  **Add to `Order` model:**
    *   `promoCodeId BigInt? @map("promo_code_id") @db.BigInt`
    *   `discountAmount Decimal @default(0.00) @map(\"discount_amount\") @db.Decimal(12, 2)` (Deducted from the order `subtotal` before applying shipping fees)
    *   `promoCode PromoCode? @relation(fields: [promoCodeId], references: [id], onDelete: SetNull)`

---

## 2. Directory Structures

Integrate these modules under your active NestJS backend architecture:

```text
src/
├── discounts/
│   ├── dto/
│   │   ├── create-promo.dto.ts      // Admin payload validation (New)
│   │   ├── update-promo.dto.ts      // Admin update validation (New)
│   │   └── validate-promo.dto.ts    // Customer checkout payload
│   ├── discounts.controller.ts      // Public and Admin REST gateways (Updated)
│   ├── discounts.service.ts         // Calculation engine and Admin CRUD (Updated)
│   └── discounts.module.ts
└── reviews/
    ├── dto/
    │   └── submit-rating.dto.ts     // Restricts ratings between 1 and 5 stars
    ├── reviews.controller.ts        // Exposes public reads and secure writes
    ├── reviews.service.ts           // Enforces "Verified Purchase" verification loops
    └── reviews.module.ts
```

---

## 3. Verified Purchase Ratings (No-Comment Structure)

This service restricts ratings strictly to customers who have bought the product and whose order state is set to `DELIVERED`.

### A. Submit Rating DTO (`src/reviews/dto/submit-rating.dto.ts`)
```typescript
import { IsInt, Min, Max } from 'class-validator';

export class SubmitRatingDto {
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1 star.' })
  @Max(5, { message: 'Rating cannot exceed 5 stars.' })
  rating: number;
}
```

### B. Reviews Service (`src/reviews/reviews.service.ts`)
```typescript
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProductRating(userId: string, productId: bigint, rating: number) {
    // 1. Verify that the product actually exists
    const productExists = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExists) {
      throw new BadRequestException('Product not found.');
    }

    // 2. Verified Purchase check: Look for a completed, delivered order containing this product
    const verifiedPurchase = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED', // Only buyers with finalized, delivered orders can rate
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!verifiedPurchase) {
      throw new BadRequestException(
        'You can only rate products that you have purchased and have been successfully delivered.',
      );
    }

    // 3. Double-submission prevention check
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already rated this product. Updates should use a PUT request.');
    }

    // 4. Record the verified rating
    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
      },
    });
  }

  // Calculate moving average rating for catalog display
  async getProductRatingSummary(productId: bigint) {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      averageRating: aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : 0,
      totalRatingsCount: aggregate._count.rating,
    };
  }
}
```

### C. Reviews Controller (`src/reviews/reviews.controller.ts`)
```typescript
import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('products/:productId/ratings')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async rateProduct(
    @Param('productId') productId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitRatingDto,
  ) {
    return this.reviewsService.submitProductRating(userId, BigInt(productId), dto.rating);
  }

  @Get('summary')
  async getRatingSummary(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatingSummary(BigInt(productId));
  }
}
```

---

## 4. Promo Code Validation & Subtotal Recalculation

This engine handles active coupon checks and executes transactional subtractions.

### A. Promo Validation DTO (`src/discounts/dto/validate-promo.dto.ts`)
```typescript
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class ValidatePromoDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  cartSubtotal: number;
}
```

### B. Discounts Service (`src/discounts/discounts.service.ts`)
```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async validatePromoCode(code: string, subtotal: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new NotFoundException('Promo code not found.');
    }

    // 1. Expiration Gate
    if (new Date() > promo.expiresAt) {
      throw new BadRequestException('This promo code has expired.');
    }

    // 2. Limit Gate
    if (promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('This promo code has reached its maximum utilization limit.');
    }

    // 3. Minimum Basket Value Gate
    const decimalSubtotal = new Decimal(subtotal);
    if (decimalSubtotal.lt(promo.minSubtotal)) {
      throw new BadRequestException(
        `This coupon requires a minimum subtotal of $${promo.minSubtotal.toFixed(2)}.`,\n      );\n    }\n\n    // Calculate discount amount based on code structural types\n    let discountAmount = new Decimal(0);\n    if (promo.discountType === 'PERCENTAGE') {\n      // e.g. 10% discount: subtotal * (10 / 100)\n      const fractionalPercent = promo.value.div(100);\n      discountAmount = decimalSubtotal.mul(fractionalPercent);\n    } else if (promo.discountType === 'FIXED') {\n      discountAmount = promo.value;\n    }\n\n    // Guarantee discount does not exceed the absolute subtotal\n    if (discountAmount.gt(decimalSubtotal)) {\n      discountAmount = decimalSubtotal;\n    }\n\n    return {\n      promoCodeId: promo.id,\n      code: promo.code,\n      discountType: promo.discountType,\n      value: promo.value,\n      discountAmount: parseFloat(discountAmount.toFixed(2)),\n      newSubtotal: parseFloat(decimalSubtotal.sub(discountAmount).toFixed(2)),\n    };\n  }\n}\n```\n\n### C. Integrating Promo Code Calculation During Checkout\nWhen checking out an order inside your primary transactional loop (`src/orders/orders.service.ts`), integrate promo calculations inside your atomic `$transaction`:\n\n```typescript\n// Inside OrdersService checkout function ($transaction scope):\nlet calculatedDiscount = new Decimal(0);\nlet promoCodeId: bigint | null = null;\n\nif (dto.promoCode) {\n  // Validate using our discount verification engine\n  const promoDetails = await this.discountsService.validatePromoCode(\n    dto.promoCode,\n    subtotalAmount, // Calculated dynamically from active item snapshots\n  );\n\n  promoCodeId = BigInt(promoDetails.promoCodeId);\n  calculatedDiscount = new Decimal(promoDetails.discountAmount);\n\n  // Increment the promo utilization index atomically inside the active transaction\n  await tx.promoCode.update({\n    where: { id: promoCodeId },\n    data: {\n      usedCount: { increment: 1 },\n    },\n  });\n}\n\n// Calculate the final order total amount\nconst finalTotal = subtotalAmount.sub(calculatedDiscount).add(shippingFee);\n\n// Save the Order record with the structural historical snapshot\nconst order = await tx.order.create({\n  data: {\n    orderNumber,\n    userId,\n    addressId: BigInt(dto.addressId),\n    status: 'CONFIRMED',\n    subtotal: subtotalAmount,\n    discountAmount: calculatedDiscount, // Snapshot the discount applied\n    totalAmount: finalTotal,\n    paymentMethod: dto.paymentMethod,\n    promoCodeId: promoCodeId,\n  },\n});\n```\n\n---\n\n## 5. Admin Promo Code Management CRUD (New Version 2 Update)\n\nPromo codes must be completely controlled and managed by Administrators. This section covers the Admin validation payload, protected controller routes, and underlying database service mutations to construct the full CRUD module.\n\n### A. Admin DTO Declarations\n\nThese DTOs enforce inputs at the server boundaries, sanitizing uppercase patterns and restricting numerical structures.\n\n#### Create Promo Code DTO (`src/discounts/dto/create-promo.dto.ts`)\n```typescript\nimport { IsNotEmpty, IsString, IsEnum, IsNumber, IsDateString, Min, Matches } from 'class-validator';\n\nexport class CreatePromoCodeDto {\n  @IsString()\n  @IsNotEmpty()\n  @Matches(/^[A-Z0-9_-]+$/, {\n    message: 'Promo code must consist only of uppercase letters, numbers, underscores, or hyphens (e.g. WELCOME10)',\n  })\n  code: string;\n\n  @IsEnum(['PERCENTAGE', 'FIXED'])\n  discountType: 'PERCENTAGE' | 'FIXED';\n\n  @IsNumber({ maxDecimalPlaces: 2 })\n  @Min(0.01, { message: 'Value must be greater than zero.' })\n  value: number;\n\n  @IsNumber({ maxDecimalPlaces: 2 })\n  @Min(0)\n  minSubtotal: number = 0.00;\n\n  @IsNumber()\n  @Min(1)\n  maxUses: number = 100;\n\n  @IsDateString()\n  expiresAt: string;\n}\n```\n\n#### Update Promo Code DTO (`src/discounts/dto/update-promo.dto.ts`)\n```typescript\nimport { PartialType } from '@nestjs/mapped-types';\nimport { CreatePromoCodeDto } from './create-promo.dto';\n\nexport class UpdatePromoCodeDto extends PartialType(CreatePromoCodeDto) {}\n```\n\n### B. Admin CRUD Methods inside Discounts Service (`src/discounts/discounts.service.ts`)\n\nExpand your `DiscountsService` to implement standard Admin CRUD features with defensive uniqueness guards.\n\n```typescript\n// Add these methods inside the DiscountsService class:\n\n// 1. Create a Promo Code (Admin)\nasync createPromoCode(dto: CreatePromoCodeDto) {\n  const normalizedCode = dto.code.trim().toUpperCase();\n\n  const existing = await this.prisma.promoCode.findUnique({\n    where: { code: normalizedCode },\n  });\n\n  if (existing) {\n    throw new ConflictException('A promo code with this code already exists.');\n  }\n\n  return this.prisma.promoCode.create({\n    data: {\n      code: normalizedCode,\n      discountType: dto.discountType,\n      value: dto.value,\n      minSubtotal: dto.minSubtotal,\n      maxUses: dto.maxUses,\n      expiresAt: new Date(dto.expiresAt),\n    },\n  });\n}\n\n// 2. Find All Promo Codes (Admin)\nasync findAllPromoCodes() {\n  return this.prisma.promoCode.findMany({\n    orderBy: { createdAt: 'desc' },\n  });\n}\n\n// 3. Find One Promo Code (Admin)\nasync findPromoCodeById(id: bigint) {\n  const promo = await this.prisma.promoCode.findUnique({\n    where: { id },\n  });\n  if (!promo) {\n    throw new NotFoundException('Promo code not found.');\n  }\n  return promo;\n}\n\n// 4. Update Promo Code (Admin)\nasync updatePromoCode(id: bigint, dto: UpdatePromoCodeDto) {\n  const promo = await this.findPromoCodeById(id);\n\n  let normalizedCode = undefined;\n  if (dto.code) {\n    normalizedCode = dto.code.trim().toUpperCase();\n    if (normalizedCode !== promo.code) {\n      const existing = await this.prisma.promoCode.findUnique({\n        where: { code: normalizedCode },\n      });\n      if (existing) {\n        throw new ConflictException('A promo code with this code name already exists.');\n      }\n    }\n  }\n\n  return this.prisma.promoCode.update({\n    where: { id },\n    data: {\n      code: normalizedCode,\n      discountType: dto.discountType,\n      value: dto.value,\n      minSubtotal: dto.minSubtotal,\n      maxUses: dto.maxUses,\n      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,\n    },\n  });\n}\n\n// 5. Delete Promo Code (Admin)\nasync deletePromoCode(id: bigint) {\n  await this.findPromoCodeById(id);\n\n  // Check if coupon has historical order linkages (restrict deletion to maintain financial receipt integrity)\n  const linksCount = await this.prisma.order.count({\n    where: { promoCodeId: id },\n  });\n\n  if (linksCount > 0) {\n    throw new BadRequestException(\n      'Cannot delete promo code because it has historical checkout associations. Consider altering its expiration date to end its activity instead.',\n    );\n  }\n\n  await this.prisma.promoCode.delete({\n    where: { id },\n  });\n\n  return { success: true, message: 'Promo code deleted successfully.' };\n}\n```\n\n### C. Secure Admin Endpoints in Controller (`src/discounts/discounts.controller.ts`)\n\nConfigure your controllers to expose validation endpoints to customers while gating Admin actions with `JwtAuthGuard` and `RolesGuard`.\n\n```typescript\nimport { \n  Controller, \n  Post, \n  Get, \n  Put, \n  Delete, \n  Body, \n  Param, \n  Query, \n  UseGuards \n} from '@nestjs/common';\nimport { DiscountsService } from './discounts.service';\nimport { ValidatePromoDto } from './dto/validate-promo.dto';\nimport { CreatePromoCodeDto } from './dto/create-promo.dto';\nimport { UpdatePromoCodeDto } from './dto/update-promo.dto';\nimport { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';\nimport { RolesGuard } from '../auth/guards/roles.guard';\nimport { Roles } from '../auth/decorators/roles.decorator';\n\n@Controller('discounts')\nexport class DiscountsController {\n  constructor(private readonly discountsService: DiscountsService) {}\n\n  // --- CUSTOMER VALIDATION GATEWAYS ---\n\n  @Post('validate')\n  async validateCoupon(@Body() dto: ValidatePromoDto) {\n    return this.discountsService.validatePromoCode(dto.code, dto.cartSubtotal);\n  }\n\n  // --- ADMIN ONLY OPERATIONS (Strictly Guarded) ---\n\n  @Post('admin')\n  @UseGuards(JwtAuthGuard, RolesGuard)\n  @Roles('admin')\n  async create(@Body() dto: CreatePromoCodeDto) {\n    return this.discountsService.createPromoCode(dto);\n  }\n\n  @Get('admin')\n  @UseGuards(JwtAuthGuard, RolesGuard)\n  @Roles('admin')\n  async listAll() {\n    return this.discountsService.findAllPromoCodes();\n  }\n\n  @Get('admin/:id')\n  @UseGuards(JwtAuthGuard, RolesGuard)\n  @Roles('admin')\n  async getOne(@Param('id') id: string) {\n    return this.discountsService.findPromoCodeById(BigInt(id));\n  }\n\n  @Put('admin/:id')\n  @UseGuards(JwtAuthGuard, RolesGuard)\n  @Roles('admin')\n  async update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {\n    return this.discountsService.updatePromoCode(BigInt(id), dto);\n  }\n\n  @Delete('admin/:id')\n  @UseGuards(JwtAuthGuard, RolesGuard)\n  @Roles('admin')\n  async remove(@Param('id') id: string) {\n    return this.discountsService.deletePromoCode(BigInt(id));\n  }\n}\n```\n