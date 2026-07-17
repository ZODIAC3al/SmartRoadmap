import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: JwtUser) {
    const data = await this.dashboardService.getSummary(user.sub);
    return { success: true, data };
  }

  /**
   * GET /dashboard/activity?period=7d|30d|90d
   * Returns per-day activity buckets for charts.
   */
  @Get('activity')
  async getActivity(
    @CurrentUser() user: JwtUser,
    @Query('period') period: '7d' | '30d' | '90d' = '30d',
  ) {
    const data = await this.dashboardService.getActivity(user.sub, period);
    return { success: true, data };
  }
}
