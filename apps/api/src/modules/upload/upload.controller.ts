import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException(
        'No image file provided in upload request.',
      );
    }

    // Quick validation on content type
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Invalid file type. Only image files are permitted.',
      );
    }

    try {
      const url = await this.uploadService.uploadImage(file);
      return { success: true, url };
    } catch (error: any) {
      throw new BadRequestException(
        `Image upload pipeline failed: ${error.message}`,
      );
    }
  }
}
