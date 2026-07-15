import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@CurrentUser() user: JwtUser) {
    return {
      success: true,
      data: await this.notificationService.getForUser(user.sub),
    };
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return {
      success: true,
      data: await this.notificationService.markRead(id, user.sub),
    };
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: JwtUser) {
    return this.notificationService.markAllRead(user.sub);
  }

  @Post('push-subscription')
  async savePushSubscription(
    @CurrentUser() user: JwtUser,
    @Body() subscriptionDto: any,
  ) {
    await this.notificationService.saveSubscription(user.sub, subscriptionDto);
    return { success: true };
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.notificationService.delete(id, user.sub);
  }
}
