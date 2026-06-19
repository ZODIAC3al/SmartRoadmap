import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Delete } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';

@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateRoadmap(
    @Body('userId') userId: string,
    @Body('targetRole') targetRole: string,
    @Body('skills') skills?: string[],
  ) {
    return this.roadmapService.generateRoadmap(userId, targetRole, skills || []);
  }

  @Get('user/:userId')
  async getActiveRoadmap(@Param('userId') userId: string) {
    return this.roadmapService.getActiveRoadmap(userId);
  }

  @Get(':id')
  async getRoadmapById(@Param('id') id: string) {
    return this.roadmapService.getRoadmapById(id);
  }

  @Get(':id/progress')
  async getRoadmapProgress(@Param('id') id: string) {
    return this.roadmapService.getRoadmapProgress(id);
  }

  @Post(':id/modules/:mid')
  async updateModuleStatus(
    @Param('id') id: string,
    @Param('mid') mid: string,
    @Body('status') status: 'locked' | 'in_progress' | 'completed' | 'failed',
  ) {
    return this.roadmapService.updateModuleStatus(id, mid, status);
  }

  @Post(':id/extend')
  async extendRoadmap(
    @Param('id') id: string,
    @Body('skills') skills: string[],
  ) {
    return this.roadmapService.extendRoadmap(id, skills);
  }

  @Delete(':id')
  async deleteRoadmap(@Param('id') id: string) {
    return this.roadmapService.deleteRoadmap(id);
  }
}
