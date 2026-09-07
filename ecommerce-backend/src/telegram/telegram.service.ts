import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly adminChatId: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID') || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Generates a beautifully formatted HTML message template for new orders
   * and dispatches it to the admin Telegram chat.
   */
  async sendNewOrderNotification(orderId: bigint): Promise<void> {
    if (!this.botToken || !this.adminChatId) {
      this.logger.warn('Telegram bot token or admin chat ID not configured. Skipping notification.');
      return;
    }

    try {
      // 1. Fetch complete order details with relations
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          address: true,
          items: true,
        },
      });

      if (!order) {
        this.logger.error(`Order with ID ${orderId.toString()} not found. Notification aborted.`);
        return;
      }

      // 2. Format localized delivery address
      const addr = order.address;
      const addressString = `${addr.streetLine}, ${addr.commune}, ${addr.city}, ${addr.province}`;

      // 3. Construct HTML Notification String
      const isManualReview = order.status === 'PENDING';
      const titleEmoji = isManualReview ? '🛒' : '✅';
      const statusText = isManualReview ? 'PENDING (Needs Review)' : 'CONFIRMED (Auto)';

      let message = `${titleEmoji} <b>NEW ORDER REGISTERED</b>\n`;
      message += `--------------------------------------\n`;
      message += `<b>Order:</b> #${order.orderNumber}\n`;
      message += `<b>Customer:</b> ${order.user.name}\n`;
      message += `<b>Phone:</b> ${order.address.phone}\n`;
      message += `<b>Address:</b> ${addressString}\n`;
      message += `<b>Payment:</b> ${order.paymentMethod.toUpperCase()}\n`;
      message += `<b>Fulfillment Status:</b> <code>${statusText}</code>\n`;
      message += `--------------------------------------\n`;
      message += `<b>Products:</b>\n`;

      order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.productNameSnapshot} x ${item.quantity} (<i>$${Number(item.unitPrice).toFixed(2)}</i>)\n`;
      });

      message += `--------------------------------------\n`;
      message += `<b>Total Amount:</b> <code>$${Number(order.totalAmount).toFixed(2)}</code>\n\n`;

      // 4. Construct appropriate keyboard actions
      let inlineKeyboard = [];
      if (isManualReview) {
        message += `💡 <i>An administrator must verify stock levels and manual payment before confirming this order.</i>`;
        inlineKeyboard = [
          [
            { text: '✅ Confirm Order', callback_data: `confirm:${order.id.toString()}` },
            { text: '❌ Reject Order', callback_data: `reject:${order.id.toString()}` },
          ],
        ];
      } else {
        message += `💡 <i>Stock has been decremented and the order is auto-confirmed. Tap below only to cancel under emergency conditions.</i>`;
        inlineKeyboard = [
          [
            { text: '🚨 Cancel Order', callback_data: `cancel:${order.id.toString()}` },
          ],
        ];
      }

      // 5. Send message via Telegram Bot HTTP API
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.adminChatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });

      // 6. Log transaction successfully in database
      if (response.data?.ok) {
        const telegramMessageId = response.data.result.message_id.toString();
        await this.prisma.telegramMessage.create({
          data: {
            orderId: order.id,
            telegramChatId: this.adminChatId,
            telegramMessageId,
            messageType: isManualReview ? 'NEW_ORDER_REVIEW' : 'NEW_ORDER_AUTO',
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      }
    } catch (error: any) {
      // Capture error gracefully to prevent blocking checkout transaction thread
      this.logger.error(`Failed to send Telegram order notification: ${error.message}`, error.stack);
      
      // Store failure state for audit logs
      try {
        await this.prisma.telegramMessage.create({
          data: {
            orderId,
            telegramChatId: this.adminChatId,
            telegramMessageId: 'FAILED_API_CALL',
            messageType: 'NEW_ORDER',
            status: 'FAILED',
          },
        });
      } catch (dbError: any) {
        this.logger.error(`Could not write fallback log to DB: ${dbError.message}`);
      }
    }
  }

  /**
   * Modifies an existing message in the chat, removing buttons and writing status updates
   */
  async editTelegramMessage(chatId: string, messageId: string, newText: string): Promise<void> {
    if (!this.botToken) return;
    try {
      await axios.post(`${this.baseUrl}/editMessageText`, {
        chat_id: chatId,
        message_id: parseInt(messageId, 10),
        text: newText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [] }, // Clear actions to prevent duplicate inputs
      });
    } catch (error: any) {
      this.logger.error(`Failed to edit message ${messageId}: ${error.message}`);
    }
  }

  /**
   * Notifies Telegram client that the webhook callback query was received successfully
   * (Removes the loading spinner from the user's screen)
   */
  async answerCallback(callbackQueryId: string, alertText: string): Promise<void> {
    if (!this.botToken) return;
    try {
      await axios.post(`${this.baseUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text: alertText,
        show_alert: false,
      });
    } catch (error: any) {
      this.logger.error(`Failed to answer callback ${callbackQueryId}: ${error.message}`);
    }
  }
}
