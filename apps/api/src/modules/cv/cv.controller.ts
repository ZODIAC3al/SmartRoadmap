import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CvService } from './cv.service';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';
import { EnhanceDto, SaveCvDto } from './dto/cv.dto';

const MAX_CV_BYTES = 5 * 1024 * 1024;

@ApiTags('cv')
@ApiBearerAuth()
@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_CV_BYTES, files: 1 },
      fileFilter: (_req, file, cb) =>
        file.mimetype === 'application/pdf'
          ? cb(null, true)
          : cb(
              new BadRequestException('Only PDF resumes are supported.'),
              false,
            ),
    }),
  )
  uploadCv(@UploadedFile() file?: Express.Multer.File) {
    // Was: silently returning mock parse results when no file was sent.
    if (!file?.buffer?.length) {
      throw new BadRequestException('No PDF file provided.');
    }
    return this.cvService.parseCvFile(file.buffer, file.originalname);
  }

  @Post('enhance')
  @HttpCode(HttpStatus.OK)
  async enhance(@Body() dto: EnhanceDto) {
    return {
      success: true,
      text: await this.cvService.enhanceDescription(dto.text),
    };
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  async save(@CurrentUser() user: JwtUser, @Body() dto: SaveCvDto) {
    return {
      success: true,
      data: await this.cvService.saveCv(user.sub, dto.data),
    };
  }

  @Get('me')
  getMine(@CurrentUser() user: JwtUser) {
    return this.cvService.getCvByUserId(user.sub);
  }

  @Get('user/:userId')
  getByUser(@CurrentUser() user: JwtUser, @Param('userId') userId: string) {
    assertSelfOrAdmin(user, userId); // was: anyone could read anyone's CV
    return this.cvService.getCvByUserId(userId);
  }
}
