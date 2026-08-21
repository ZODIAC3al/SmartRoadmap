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
import { UploadService, UploadFilePayload } from './upload.service';

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Image upload pipeline failed: ${message}`);
    }
  }

  @Post('pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No PDF file provided in upload request.');
    }

    try {
      const result = await this.uploadService.uploadEvidencePdf(file, 'evidence');
      return { success: true, url: result.url, key: result.key };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`PDF upload pipeline failed: ${message}`);
    }
  }

  @Post('evidence')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No evidence file provided in upload request.');
    }

    try {
      const result = await this.uploadService.uploadEvidencePdf(file, 'evidence');
      return { success: true, url: result.url, key: result.key };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Evidence upload pipeline failed: ${message}`);
    }
  }
}
