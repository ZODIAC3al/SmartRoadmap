import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { SendMessageDto } from './dto/message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // The hand-rolled `getUserIdFromToken()` helper that used to live in every
  // controller is gone — the global JwtAuthGuard populates `req.user` instead.
  @Post('send')
  async send(@CurrentUser() user: JwtUser, @Body() dto: SendMessageDto) {
    return { success: true, data: await this.messageService.send(user.sub, dto.recipientId, dto.content) };
  }

  @Get('conversations')
  async conversations(@CurrentUser() user: JwtUser) {
    return { success: true, data: await this.messageService.getConversations(user.sub) };
  }

  @Get('thread/:partnerId')
  async thread(@CurrentUser() user: JwtUser, @Param('partnerId') partnerId: string) {
    return { success: true, data: await this.messageService.getThread(user.sub, partnerId) };
  }
}
