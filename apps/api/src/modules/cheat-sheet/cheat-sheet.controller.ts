import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheatSheetService } from './cheat-sheet.service';
import { AiUsageService } from '../billing/ai-usage.service';
import { AIEntitlementGuard, RequireAiFeature } from '../billing/ai-entitlement.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('cheat-sheets')
@ApiBearerAuth()
@Controller('cheat-sheets')
@UseGuards(JwtAuthGuard)
export class CheatSheetController {
  constructor(
    private readonly cheatSheetService: CheatSheetService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  /** GET /cheat-sheets/:moduleId — fetch current speech notes */
  @Get(':moduleId')
  async getCheatSheet(
    @CurrentUser() user: JwtUser,
    @Param('moduleId') moduleId: string,
  ) {
    const sheet = await this.cheatSheetService.get(user.sub, moduleId);
    return { success: true, data: sheet || null };
  }

  /** GET /cheat-sheets/:moduleId/history — fetch version history */
  @Get(':moduleId/history')
  async getHistory(
    @CurrentUser() user: JwtUser,
    @Param('moduleId') moduleId: string,
  ) {
    const history = await this.cheatSheetService.getHistory(user.sub, moduleId);
    return { success: true, data: history };
  }

  /** POST /cheat-sheets/:moduleId/generate — first-time AI generation */
  @UseGuards(AIEntitlementGuard)
  @RequireAiFeature('AI_CHEATSHEET')
  @Post(':moduleId/generate')
  async generateCheatSheet(
    @CurrentUser() user: JwtUser,
    @Param('moduleId') moduleId: string,
    @Body() body?: { title?: string; description?: string; topics?: string[] },
  ) {
    const { reservationId } = await this.aiUsageService.reserve(user, 'AI_CHEATSHEET');
    try {
      const sheet = await this.cheatSheetService.generate(
        user.sub,
        moduleId,
        body,
      );
      await this.aiUsageService.finalize(reservationId, {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        inputTokens: 800,
        outputTokens: 400,
        totalTokens: 1200,
        status: 'success',
      });
      return { success: true, data: sheet };
    } catch (err: any) {
      await this.aiUsageService.release(reservationId, err?.message);
      throw err;
    }
  }

  /** POST /cheat-sheets/:moduleId/regenerate — generate a NEW version, archive the old one */
  @UseGuards(AIEntitlementGuard)
  @RequireAiFeature('AI_CHEATSHEET')
  @Post(':moduleId/regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerateCheatSheet(
    @CurrentUser() user: JwtUser,
    @Param('moduleId') moduleId: string,
    @Body() body?: { title?: string; description?: string; topics?: string[] },
  ) {
    const { reservationId } = await this.aiUsageService.reserve(user, 'AI_CHEATSHEET');
    try {
      const sheet = await this.cheatSheetService.regenerate(
        user.sub,
        moduleId,
        body,
      );
      await this.aiUsageService.finalize(reservationId, {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        inputTokens: 900,
        outputTokens: 450,
        totalTokens: 1350,
        status: 'success',
      });
      return { success: true, data: sheet };
    } catch (err: any) {
      await this.aiUsageService.release(reservationId, err?.message);
      throw err;
    }
  }
}

