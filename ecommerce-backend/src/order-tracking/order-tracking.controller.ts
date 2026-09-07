import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { OrderTrackingService } from './order-tracking.service.js';
import { AddTrackingNoteDto } from './dto/add-tracking-note.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('orders')
export class OrderTrackingController {
  constructor(private readonly trackingService: OrderTrackingService) {}

  /**
   * 1. Public Order Status Timeline (For Customers to track their packages)
   * Secured: Users can only query their own order records.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/tracking')
  async getTrackingTimeline(
    @Param('id') id: string,
    @Req() request: any,
  ) {
    const userId = request.user.id;
    const userRole = request.user.role;
    
    return this.trackingService.getOrderTimeline(BigInt(id), userId, userRole);
  }

  /**
   * 2. Insert Manual Operations/Courier Note (Admin Only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/tracking-notes')
  async addAdminTrackingNote(
    @Param('id') id: string,
    @Body() dto: AddTrackingNoteDto,
    @Req() request: any,
  ) {
    const adminId = request.user.id;
    return this.trackingService.addAdminNote(BigInt(id), adminId, dto);
  }
}
