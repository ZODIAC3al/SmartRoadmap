import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HiringService } from './hiring.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyApprovalGuard } from '../../common/guards/company-approval.guard';
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
import { PlanGuard, RequirePlan } from '../billing/plan-guard.guard';

@ApiTags('hiring')
@ApiBearerAuth()
@Controller('hiring')
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  /** Only companies/admins may post jobs. */
  @UseGuards(RolesGuard, CompanyApprovalGuard)
  @Roles('company', 'admin')
  @Post('jobs')
  createJob(@CurrentUser() user: JwtUser, @Body() dto: CreateJobDto) {
    return this.hiringService.createJob(user, dto);
  }

  @Get('jobs')
  getJobs(@Query() query: any) {
    return this.hiringService.getJobs(query);
  }

  @UseGuards(RolesGuard, CompanyApprovalGuard)
  @Roles('company', 'admin')
  @Get('jobs/my')
  getMyJobs(@CurrentUser() user: JwtUser) {
    return this.hiringService.getMyJobs(user.sub);
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

  @Get('jobs/:id')
  getJobById(@Param('id') id: string) {
    return this.hiringService.getJobById(id);
  }

  @UseGuards(RolesGuard, CompanyApprovalGuard)
  @Roles('company', 'admin')
  @Delete('jobs/:id')
  deleteJob(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.hiringService.deleteJob(user, id);
  }

  @Post('jobs/reindex')
  @UseGuards(RolesGuard, CompanyApprovalGuard)
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

  /** Skill gap breakdown without mutating roadmap. */
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

  /** List all applications received for company or admin */
  @UseGuards(RolesGuard, CompanyApprovalGuard)
  @Roles('company', 'admin')
  @Get('applications/company')
  getCompanyApplications(
    @CurrentUser() user: JwtUser,
    @Query('jobId') jobId?: string,
  ) {
    return this.hiringService.getApplicationsForCompany(user, jobId);
  }

  /** Get application status for a specific job */
  @Get('applications/job/:jobId')
  getApplicationByJob(
    @CurrentUser() user: JwtUser,
    @Param('jobId') jobId: string,
  ) {
    return this.hiringService.getApplicationByJobId(user.sub, jobId);
  }

  /** Get specific application by ID with complete CV and Passport snapshots */
  @Get('applications/:id')
  getApplicationById(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.hiringService.getApplicationById(user, id);
  }

  /** Create application with CV & Skill Passport snapshot (status: Applied) */
  @Post('applications')
  upsertApplication(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.hiringService.upsertApplication(user.sub, dto);
  }

  /** Update pipeline status (Applied / Interviewing / Accepted / Rejected) with strict role/ownership checks */
  @Patch('applications/:id')
  updateApplicationStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.hiringService.updateApplicationStatus(user, id, dto);
  }

  @Patch('applications/:id/status')
  updateApplicationStatusDirect(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.hiringService.updateApplicationStatus(user, id, dto);
  }

  // ── Company / Admin ────────────────────────────────────────────────────────

  @UseGuards(RolesGuard, CompanyApprovalGuard)
  @Roles('company', 'admin')
  @Get('candidates')
  getCandidates() {
    return this.hiringService.getCandidates();
  }

  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Post('candidates/evaluate-ai')
  evaluateCandidateAi(
    @Body() body: { candidateSkills: string[]; requiredSkills?: string[] },
  ) {
    return this.hiringService.evaluateCandidateWithAi(
      body.candidateSkills || [],
      body.requiredSkills,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Post('saved-searches')
  createSavedSearch(@CurrentUser() user: JwtUser, @Body() dto: any) {
    return this.hiringService.createSavedSearch(user, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Get('saved-searches')
  getSavedSearches(@CurrentUser() user: JwtUser) {
    return this.hiringService.getSavedSearches(user);
  }

  @UseGuards(RolesGuard, PlanGuard)
  @RequirePlan('scale')
  @Roles('company', 'admin')
  @Get('analytics/skill-gaps')
  getSkillGapAnalytics(@Query('jobId') jobId: string) {
    return this.hiringService.getSkillGapAnalytics(jobId);
  }
}

