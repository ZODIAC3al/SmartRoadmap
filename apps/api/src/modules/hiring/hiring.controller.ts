import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { HiringService } from './hiring.service';

@Controller('hiring')
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  @Post('jobs')
  async createJob(@Body() jobData: any) {
    return this.hiringService.createJob(jobData);
  }

  @Get('jobs')
  async getJobs() {
    return this.hiringService.getJobs();
  }

  @Get('jobs/matches/:userId')
  async matchJobsForLearner(@Param('userId') userId: string) {
    return this.hiringService.matchJobsForLearner(userId);
  }

  @Get('candidates')
  async getCandidates() {
    return this.hiringService.getCandidates();
  }
}
