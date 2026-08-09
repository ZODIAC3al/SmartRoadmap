import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppwriteService } from './appwrite.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('audio')
export class AudioController {
  constructor(private readonly appwrite: AppwriteService) {}

  @Public()
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const uploaded = await this.appwrite.uploadAudio(file);

    return {
      success: true,
      fileId: uploaded.$id,
      url: this.appwrite.getAudioUrl(uploaded.$id),
    };
  }
}
