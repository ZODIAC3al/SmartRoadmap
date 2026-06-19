import { Controller, Post, Get, Body, Param, UploadedFile, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvService } from './cv.service';

@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(@UploadedFile() file: any) {
    if (!file) {
      // If no file was uploaded, return a simulated empty payload or trigger mock
      return this.cvService.parseCvFile(Buffer.from(''), 'mock-resume.pdf');
    }
    return this.cvService.parseCvFile(file.buffer, file.originalname);
  }

  @Post('enhance')
  @HttpCode(HttpStatus.OK)
  async enhanceDescription(@Body('text') text: string) {
    const enhanced = await this.cvService.enhanceDescription(text);
    return { success: true, text: enhanced };
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  async saveCv(
    @Body('userId') userId: string,
    @Body('data') data: any,
  ) {
    const saved = await this.cvService.saveCv(userId, data);
    return { success: true, data: saved };
  }

  @Get('user/:userId')
  async getCv(@Param('userId') userId: string) {
    return this.cvService.getCvByUserId(userId);
  }
}
