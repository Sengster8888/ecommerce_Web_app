import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

@ApiTags('Customer Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiOperation({ summary: 'Create a new delivery address for logged-in user' })
  @Post()
  async create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.createAddress(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get all delivery addresses for logged-in user' })
  @Get()
  async findAll(@Req() req: any) {
    return this.addressesService.getUserAddresses(req.user.id);
  }

  @ApiOperation({ summary: 'Get a single delivery address by ID' })
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const addressId = this.parseBigIntId(id);
    return this.addressesService.getAddressById(req.user.id, addressId);
  }

  @ApiOperation({ summary: 'Update an existing delivery address' })
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const addressId = this.parseBigIntId(id);
    return this.addressesService.updateAddress(req.user.id, addressId, dto);
  }

  @ApiOperation({ summary: 'Set an address as default delivery address' })
  @Patch(':id/default')
  async setDefault(@Req() req: any, @Param('id') id: string) {
    const addressId = this.parseBigIntId(id);
    return this.addressesService.setDefaultAddress(req.user.id, addressId);
  }

  @ApiOperation({ summary: 'Delete a delivery address' })
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const addressId = this.parseBigIntId(id);
    return this.addressesService.deleteAddress(req.user.id, addressId);
  }

  private parseBigIntId(id: string): bigint {
    try {
      return BigInt(id);
    } catch {
      throw new BadRequestException('Invalid address ID format.');
    }
  }
}
