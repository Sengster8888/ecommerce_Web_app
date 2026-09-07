import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class TelegramWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secretHeader = request.headers['x-telegram-bot-api-secret-token'];
    const expectedSecret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET_TOKEN');

    if (!expectedSecret || secretHeader !== expectedSecret) {
      throw new UnauthorizedException('Access Denied: Invalid Telegram Webhook Token');
    }

    return true;
  }
}
