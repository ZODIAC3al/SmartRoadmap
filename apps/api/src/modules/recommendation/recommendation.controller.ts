import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationStatus } from '../../schemas/recommendation.schema';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recService: RecommendationService) {}

  @Get()
  async getRecommendations(
    @Req() req: any,
    @Query('refresh') refresh?: string,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new BadRequestException('User identification missing');
    const forceRefresh = refresh === 'true' || refresh === '1';
    return this.recService.getRecommendations(userId, forceRefresh);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async forceRefresh(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new BadRequestException('User identification missing');
    return this.recService.generateFreshRecommendations(userId);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Req() req: any,
    @Param('id') recId: string,
    @Body('status') status: RecommendationStatus,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new BadRequestException('User identification missing');
    if (!Object.values(RecommendationStatus).includes(status)) {
      throw new BadRequestException('Invalid recommendation status');
    }
    return this.recService.updateStatus(userId, recId, status);
  }
}
