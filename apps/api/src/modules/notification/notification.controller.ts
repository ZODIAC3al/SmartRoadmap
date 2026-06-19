import { Controller, Get, Patch, Post, Delete, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthService } from '../auth/auth.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
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

  @Get()
  async getNotifications(@Headers('authorization') authHeader?: string) {
    const userId = this.getUserIdFromToken(authHeader);
    const notifications = await this.notificationService.getForUser(userId);
    return { success: true, data: notifications };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    const userId = this.getUserIdFromToken(authHeader);
    const notification = await this.notificationService.markRead(id, userId);
    return { success: true, data: notification };
  }

  @Post('read-all')
  async markAllRead(@Headers('authorization') authHeader?: string) {
    const userId = this.getUserIdFromToken(authHeader);
    const result = await this.notificationService.markAllRead(userId);
    return result;
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    const userId = this.getUserIdFromToken(authHeader);
    const result = await this.notificationService.delete(id, userId);
    return result;
  }
}
