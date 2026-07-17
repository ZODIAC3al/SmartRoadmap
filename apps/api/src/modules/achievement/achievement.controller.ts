import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AchievementService } from './achievement.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('achievements')
@ApiBearerAuth()
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  /**
   * GET /achievements
   * Returns all achievement definitions merged with the user's unlocked status.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyAchievements(@CurrentUser() user: JwtUser) {
    const achievements = await this.achievementService.getAchievementsForUser(user.sub);
    return { success: true, data: achievements };
  }

  /**
   * GET /achievements/recent
   * Returns last 10 achievements unlocked across ALL users (anonymized).
   * Used on the home page social proof feed.
   */
  @Public()
  @Get('recent')
  @HttpCode(HttpStatus.OK)
  async getRecent() {
    const recent = await this.achievementService.getRecentUnlocks(10);
    return { success: true, data: recent };
  }

  /**
   * GET /achievements/progress
   * Returns counts + percentage for the logged-in user.
   */
  @Get('progress')
  @HttpCode(HttpStatus.OK)
  async getProgress(@CurrentUser() user: JwtUser) {
    const progress = await this.achievementService.getUserProgress(user.sub);
    return { success: true, data: progress };
  }
}
