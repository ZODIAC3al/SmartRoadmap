import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HiringService } from './hiring.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';
import {
  CreateApplicationDto,
  CreateJobDto,
  UpdateApplicationStatusDto,
} from './dto/hiring.dto';

@ApiTags('hiring')
@ApiBearerAuth()
@Controller('hiring')
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  /** Only companies/admins may post jobs. */
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
    return this.hiringService.matchJobsSemantic(user.sub);
  }

  @Get('jobs/matches/:userId')
  matchForUser(@CurrentUser() user: JwtUser, @Param('userId') userId: string) {
    assertSelfOrAdmin(user, userId);
    return this.hiringService.matchJobsSemantic(userId);
  }

  @Post('jobs/reindex')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async reindexJobs() {
    const jobs = await this.hiringService.getJobs();
    for (const job of jobs) {
      await this.hiringService.indexJob(job);
    }
    return { success: true, count: jobs.length };
  }

  @Post('profiles/index')
  async indexProfile(@CurrentUser() user: JwtUser) {
    return {
      success: true,
      userId: user.sub,
      message: 'User profile prepared for semantic matches.',
    };
  }

  /** Turns missing skills into roadmap modules. */
  @Post('jobs/:jobId/close-gap')
  closeGap(@CurrentUser() user: JwtUser, @Param('jobId') jobId: string) {
    return this.hiringService.closeSkillGap(user.sub, jobId);
  }

  // ── Application Pipeline ───────────────────────────────────────────────────

  /** List all applications for the current user */
  @Get('applications')
  getMyApplications(@CurrentUser() user: JwtUser) {
    return this.hiringService.getApplicationsForUser(user.sub);
  }

  /** Get application status for a specific job */
  @Get('applications/job/:jobId')
  getApplicationByJob(
    @CurrentUser() user: JwtUser,
    @Param('jobId') jobId: string,
  ) {
    return this.hiringService.getApplicationByJobId(user.sub, jobId);
  }

  /** Create or update application (express interest / apply) */
  @Post('applications')
  upsertApplication(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.hiringService.upsertApplication(user.sub, dto);
  }

  /** Update pipeline status (under_review / interview / offer / hired / rejected) */
  @Patch('applications/:id')
  updateApplicationStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.hiringService.updateApplicationStatus(user.sub, id, dto);
  }

  // ── Company / Admin ────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Get('candidates')
  getCandidates() {
    return this.hiringService.getCandidates();
  }
}
