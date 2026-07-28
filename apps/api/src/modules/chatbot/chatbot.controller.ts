import { Body, Controller, Get, Post, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('chatbot')
@ApiBearerAuth()
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('history')
  async getHistory(@CurrentUser() user: JwtUser) {
    const session = await this.chatbotService.getSession(user.sub);
    return session.messages;
  }

  @Post('message')
  async sendMessage(
    @CurrentUser() user: JwtUser,
    @Body('message') message: string,
  ) {
    const response = await this.chatbotService.handleMessage(
      user.sub,
      user.role,
      message,
    );
    return { response };
  }

  @Delete('reset')
  async resetChat(@CurrentUser() user: JwtUser) {
    await this.chatbotService.deleteSession(user.sub);
    return { success: true };
  }
}
