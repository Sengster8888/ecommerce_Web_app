import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { TelegramWebhookGuard } from './guards/telegram-webhook.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminOrdersService } from '../admin-orders/admin-orders.service.js';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly adminOrdersService: AdminOrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhook')
  @UseGuards(TelegramWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    // 1. Process Callback Queries (Button Taps)
    if (payload.callback_query) {
      const callbackQuery = payload.callback_query;
      const callbackData = callbackQuery.data; // e.g. "cancel:15" or "confirm:15"
      const callbackQueryId = callbackQuery.id;
      const originalMessage = callbackQuery.message;
      const messageId = originalMessage.message_id.toString();
      const chatId = originalMessage.chat.id.toString();

      // Extract details
      const [action, orderIdStr] = callbackData.split(':');
      const orderId = BigInt(orderIdStr);

      this.logger.log(`Received callback action '${action}' for Order ID ${orderIdStr}`);

      try {
        // Find order and audit trail details
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          await this.telegramService.answerCallback(callbackQueryId, '❌ Error: Order not found in database.');
          return { received: true };
        }

        let alertMessage = '';
        let updatedText = originalMessage.text;

        // Process based on action mapping
        if (action === 'cancel') {
          // Verify eligibility (e.g. must be CONFIRMED and not yet PROCESSING)
          if (order.status !== 'CONFIRMED') {
            await this.telegramService.answerCallback(callbackQueryId, `⚠️ Action aborted: Order is already in ${order.status} state.`);
            return { received: true };
          }

          await this.adminOrdersService.updateStatus(orderId, {
            status: 'CANCELLED',
            note: 'Cancelled by Admin via Telegram',
          }, null as any); // adminId is null for automated actions

          alertMessage = '🚨 Order has been cancelled and stock restored successfully.';
          updatedText += `\n\n--------------------------------------\n❌ <b>CANCELLED BY ADMIN VIA TELEGRAM</b>`;
        } 
        
        else if (action === 'confirm') {
          if (order.status !== 'PENDING') {
            await this.telegramService.answerCallback(callbackQueryId, `⚠️ Action aborted: Order is already ${order.status}.`);
            return { received: true };
          }

          await this.adminOrdersService.updateStatus(orderId, {
            status: 'CONFIRMED',
            note: 'Confirmed by Admin via Telegram',
          }, null as any);

          alertMessage = '✅ Order has been confirmed and stock reserved.';
          updatedText += `\n\n--------------------------------------\n✅ <b>MANUALLY CONFIRMED BY ADMIN VIA TELEGRAM</b>`;
        } 
        
        else if (action === 'reject') {
          if (order.status !== 'PENDING') {
            await this.telegramService.answerCallback(callbackQueryId, `⚠️ Action aborted: Order is already ${order.status}.`);
            return { received: true };
          }

          await this.adminOrdersService.updateStatus(orderId, {
            status: 'REJECTED',
            rejectionReason: 'Rejected by Admin via Telegram',
            note: 'Rejected by Admin via Telegram',
          }, null as any);

          alertMessage = '❌ Order has been rejected.';
          updatedText += `\n\n--------------------------------------\n❌ <b>REJECTED BY ADMIN VIA TELEGRAM</b>`;
        }

        // 2. Acknowledge and resolve Telegram Loading Spinner
        await this.telegramService.answerCallback(callbackQueryId, alertMessage);

        // 3. Edit original Telegram card and strip buttons to prevent concurrent double-taps
        await this.telegramService.editTelegramMessage(chatId, messageId, updatedText);

      } catch (error: any) {
        this.logger.error(`Error processing callback query: ${error.message}`, error.stack);
        await this.telegramService.answerCallback(
          callbackQueryId,
          `❌ Failed to update order state: ${error.message}`,
        );
      }
    }

    // Always return HTTP 200 to prevent Telegram from retrying the webhook payload endlessly
    return { received: true };
  }
}
