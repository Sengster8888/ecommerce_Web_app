import { PartialType } from '@nestjs/mapped-types';
import { CreatePromoCodeDto } from './create-promo.dto.js';

export class UpdatePromoCodeDto extends PartialType(CreatePromoCodeDto) {}
