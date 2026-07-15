import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HiringService } from './hiring.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';
import { CreateJobDto } from './dto/hiring.dto';

@ApiTags('hiring')
@ApiBearerAuth()
@Controller('hiring')
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  /** Only companies/admins may post jobs (previously: anyone, unauthenticated). */
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Post('jobs')
  createJob(@Body() dto: CreateJobDto) {
    return this.hiringService.createJob(dto);
  }

  @Get('jobs')
  getJobs() {
    return this.hiringService.getJobs();
  }

  @Get('jobs/matches')
  matchForMe(@CurrentUser() user: JwtUser) {
    return this.hiringService.matchJobsForLearner(user.sub);
  }

  @Get('jobs/matches/:userId')
  matchForUser(@CurrentUser() user: JwtUser, @Param('userId') userId: string) {
    assertSelfOrAdmin(user, userId);
    return this.hiringService.matchJobsForLearner(userId);
  }

  /** Turns "you're missing Docker + CI" into actual roadmap modules. */
  @Post('jobs/:jobId/close-gap')
  closeGap(@CurrentUser() user: JwtUser, @Param('jobId') jobId: string) {
    return this.hiringService.closeSkillGap(user.sub, jobId);
  }

  /** Candidate pool contains personal data — recruiters and admins only. */
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Get('candidates')
  getCandidates() {
    return this.hiringService.getCandidates();
  }
}
