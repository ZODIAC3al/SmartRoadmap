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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CvService } from './cv.service';
import { AiUsageService } from '../billing/ai-usage.service';
import { AIEntitlementGuard, RequireAiFeature } from '../billing/ai-entitlement.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';
import {
  AtsAutoFixDto,
  AtsCheckDto,
  EnhanceDto,
  GenerateFromProfileDto,
  GenerateTailoredCvDto,
  SaveCvDto,
} from './dto/cv.dto';

const MAX_CV_BYTES = 15 * 1024 * 1024; // 15MB limit

@ApiTags('cv')
@ApiBearerAuth()
@Controller('cv')
@UseGuards(JwtAuthGuard)
export class CvController {
  constructor(
    private readonly cvService: CvService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  @Public()
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_CV_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!file) return cb(null, true);
        const lowerName = (file.originalname || '').toLowerCase();
        if (
          lowerName.endsWith('.pdf') ||
          lowerName.endsWith('.docx') ||
          lowerName.endsWith('.doc') ||
          lowerName.endsWith('.txt') ||
          file.mimetype.includes('pdf') ||
          file.mimetype.includes('word') ||
          file.mimetype.includes('document') ||
          file.mimetype.includes('octet-stream') ||
          file.mimetype.includes('text')
        ) {
          return cb(null, true);
        }
        return cb(null, true); // Allow file buffer to be parsed safely
      },
    }),
  )
  async uploadCv(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No resume file provided.');
    }
    try {
      const data = await this.cvService.parseCvFile(
        file.buffer,
        file.originalname,
      );
      return {
        success: true,
        data,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to parse resume "${file.originalname}": ${err?.message || 'Invalid file format or structure.'}`,
      );
    }
  }

  @UseGuards(AIEntitlementGuard)
  @RequireAiFeature('AI_CV_ANALYSIS')
  @Post('generate-tailored')
  @HttpCode(HttpStatus.OK)
  async generateTailored(
    @CurrentUser() user: JwtUser,
    @Body() dto: GenerateTailoredCvDto,
  ) {
    const { reservationId } = await this.aiUsageService.reserve(user, 'AI_CV_ANALYSIS');
    try {
      const data = await this.cvService.generateTailoredCv(user.sub, dto);
      await this.aiUsageService.finalize(reservationId, {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        inputTokens: 1200,
        outputTokens: 600,
        totalTokens: 1800,
        status: 'success',
      });
      return { success: true, data };
    } catch (err: any) {
      await this.aiUsageService.release(reservationId, err?.message);
      throw err;
    }
  }

  @UseGuards(AIEntitlementGuard)
  @RequireAiFeature('AI_CV_ANALYSIS')
  @Post('generate-from-profile')
  @HttpCode(HttpStatus.OK)
  async generateFromProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: GenerateFromProfileDto,
  ) {
    const { reservationId } = await this.aiUsageService.reserve(user, 'AI_CV_ANALYSIS');
    try {
      const data = await this.cvService.generateFromProfile(
        user.sub,
        dto?.targetJobTitle,
        dto?.jobDescription,
        dto?.forceRegenerate,
      );
      await this.aiUsageService.finalize(reservationId, {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        inputTokens: 1400,
        outputTokens: 700,
        totalTokens: 2100,
        status: 'success',
      });
      return { success: true, data };
    } catch (err: any) {
      await this.aiUsageService.release(reservationId, err?.message);
      throw err;
    }
  }

  @Post('ats-check')
  @HttpCode(HttpStatus.OK)
  async atsCheck(@CurrentUser() user: JwtUser, @Body() dto: AtsCheckDto) {
    return {
      success: true,
      analysis: await this.cvService.checkAts(user.sub, dto),
    };
  }

  @Post('ats-autofix')
  @HttpCode(HttpStatus.OK)
  async atsAutoFix(@CurrentUser() user: JwtUser, @Body() dto: AtsAutoFixDto) {
    return {
      success: true,
      data: await this.cvService.autoFixAts(user.sub, dto),
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

  @Get('list')
  async listCvs(@CurrentUser() user: JwtUser) {
    return {
      success: true,
      data: await this.cvService.listCvsByUserId(user.sub),
    };
  }

  @Post('create')
  async createCv(@CurrentUser() user: JwtUser, @Body() body: any) {
    return {
      success: true,
      data: await this.cvService.createCv(user.sub, body),
    };
  }

  @Get('item/:id')
  async getCvById(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return {
      success: true,
      data: await this.cvService.getCvById(id, user.sub),
    };
  }

  @Post(':id/duplicate')
  async duplicateCv(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return {
      success: true,
      data: await this.cvService.duplicateCv(id, user.sub),
    };
  }

  @Post(':id/delete')
  async deleteCv(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.cvService.deleteCv(id, user.sub);
  }

  @Get('me')
  getMine(@CurrentUser() user: JwtUser) {
    return this.cvService.getCvByUserId(user.sub);
  }

  @Get('user/:userId')
  getByUser(@CurrentUser() user: JwtUser, @Param('userId') userId: string) {
    assertSelfOrAdmin(user, userId);
    return this.cvService.getCvByUserId(userId);
  }
}
