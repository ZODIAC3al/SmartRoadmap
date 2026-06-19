import { Controller, Get, Post, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { MessageService } from './message.service';
import { AuthService } from '../auth/auth.service';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly authService: AuthService,
  ) {}

  private getUserIdFromToken(authHeader?: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.split(' ')[1];
    const decoded = this.authService.verifyToken(token);
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return decoded.sub;
  }

  @Post('send')
  async sendMessage(
    @Body('recipientId') recipientId: string,
    @Body('content') content: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.getUserIdFromToken(authHeader);
    const msg = await this.messageService.send(userId, recipientId, content);
    return { success: true, data: msg };
  }

  @Get('conversations')
  async getConversations(@Headers('authorization') authHeader?: string) {
    const userId = this.getUserIdFromToken(authHeader);
    const conversations = await this.messageService.getConversations(userId);
    return { success: true, data: conversations };
  }

  @Get('thread/:partnerId')
  async getThread(@Param('partnerId') partnerId: string, @Headers('authorization') authHeader?: string) {
    const userId = this.getUserIdFromToken(authHeader);
    const thread = await this.messageService.getThread(userId, partnerId);
    return { success: true, data: thread };
  }
}
