import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateThreadDto, MessagingService, SendMessageDto } from './messaging.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { UploadService } from '../upload/upload.service';

@ApiTags('messaging')
@ApiBearerAuth()
@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('threads')
  getThreads(@CurrentUser() user: JwtUser) {
    return this.messagingService.getUserThreads(user.sub);
  }

  @Post('threads')
  getOrCreateThread(@CurrentUser() user: JwtUser, @Body() dto: CreateThreadDto) {
    return this.messagingService.getOrCreateThread(user.sub, dto);
  }

  @Get('threads/:threadId/messages')
  getThreadMessages(
    @CurrentUser() user: JwtUser,
    @Param('threadId') threadId: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.getThreadMessages(
      threadId,
      user.sub,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Post('messages')
  sendMessage(@CurrentUser() user: JwtUser, @Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(user.sub, dto);
  }

  @Patch('threads/:threadId/read')
  @HttpCode(HttpStatus.OK)
  markThreadRead(@CurrentUser() user: JwtUser, @Param('threadId') threadId: string) {
    return this.messagingService.markThreadRead(threadId, user.sub);
  }

  /**
   * Upload a file attachment to IDrive S3 for use in a message.
   * Returns { url, name, type, size }
   */
  @Post('upload-attachment')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadService.uploadEvidencePdf(
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      'messaging-attachments',
    );
    return {
      url: result.url,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Search users to start a conversation with.
   * Returns a list of users matching the query, filtered by role.
   */
  @Get('users/search')
  searchUsers(
    @CurrentUser() user: JwtUser,
    @Query('q') q: string,
    @Query('role') role?: string,
  ) {
    return this.messagingService.searchMessagingUsers(user.sub, q, role);
  }
}
