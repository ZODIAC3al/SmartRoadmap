import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoadmapService } from './roadmap.service';
import { AiUsageService } from '../billing/ai-usage.service';
import { AIEntitlementGuard, RequireAiFeature } from '../billing/ai-entitlement.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';
import {
  ExtendRoadmapDto,
  GenerateRoadmapDto,
  UpdateModuleStatusDto,
} from './dto/roadmap.dto';

@ApiTags('roadmap')
@ApiBearerAuth()
@Controller('roadmap')
@UseGuards(JwtAuthGuard)
export class RoadmapController {
  constructor(
    private readonly roadmapService: RoadmapService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  @UseGuards(AIEntitlementGuard)
  @RequireAiFeature('AI_ROADMAP')
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(@CurrentUser() user: JwtUser, @Body() dto: GenerateRoadmapDto) {
    const { reservationId } = await this.aiUsageService.reserve(user, 'AI_ROADMAP');
    try {
      const result = await this.roadmapService.generateRoadmap(
        user.sub,
        dto.targetRole,
        dto.skills ?? [],
      );
      await this.aiUsageService.finalize(reservationId, {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        inputTokens: 1500,
        outputTokens: 800,
        totalTokens: 2300,
        status: 'success',
      });
      return result;
    } catch (err: any) {
      await this.aiUsageService.release(reservationId, err?.message);
      throw err;
    }
  }

  /** Kept for backwards compatibility, but the id is now authorization-checked. */
  @Get('user/:userId')
  getActive(@CurrentUser() user: JwtUser, @Param('userId') userId: string) {
    if (user) assertSelfOrAdmin(user, userId);
    return this.roadmapService.getActiveRoadmap(userId);
  }

  @Get('me')
  getMine(@CurrentUser() user: JwtUser) {
    const userId = user?.sub || '507f191e810c19729de860ea';
    return this.roadmapService.getActiveRoadmap(userId);
  }

  @Get(':id')
  getById(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.roadmapService.getRoadmapById(id, user);
  }

  @Get(':id/progress')
  getProgress(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.roadmapService.getRoadmapProgress(id, user);
  }

  @Patch(':id/modules/:mid')
  updateModule(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('mid') mid: string,
    @Body() dto: UpdateModuleStatusDto,
  ) {
    return this.roadmapService.updateModuleStatus(id, mid, dto.status, user);
  }

  @Post(':id/extend')
  extend(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: ExtendRoadmapDto,
  ) {
    return this.roadmapService.extendRoadmap(id, dto.skills, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.roadmapService.deleteRoadmap(id, user);
  }

  @Patch(':id/viewport')
  async updateViewport(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body()
    body: {
      viewport: { x: number; y: number; zoom: number };
      edgeStyle?: 'straight' | 'curved';
    },
  ) {
    const updated = await this.roadmapService.updateViewport(
      id,
      body.viewport,
      body.edgeStyle,
      user,
    );
    return {
      success: true,
      data: updated,
    };
  }
}
