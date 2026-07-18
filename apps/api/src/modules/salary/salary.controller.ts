// apps/api/src/modules/salary/salary.controller.ts
import { Controller, Get, Post, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalaryService } from './salary.service';
import { PredictSalaryDto, UpdateCareerProfileDto } from './dto/salary.dto';

@UseGuards(JwtAuthGuard)
@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    const userId = req.user?.sub?.toString() || req.user?.id?.toString() || '';
    return this.salaryService.getCareerProfile(userId);
  }

  @Patch('profile')
  async updateProfile(@Body() dto: UpdateCareerProfileDto, @Request() req: any) {
    const userId = req.user?.sub?.toString() || req.user?.id?.toString() || '';
    return this.salaryService.updateCareerProfile(userId, dto);
  }

  @Get('insights')
  async getInsights(@Request() req: any) {
    const userId = req.user?.sub?.toString() || req.user?.id?.toString() || '';
    return this.salaryService.getSalaryInsights(userId);
  }

  @Post('predict')
  async predict(@Body() dto: PredictSalaryDto) {
    return this.salaryService.predictSalaryRange(dto);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    const userId = req.user?.sub?.toString() || req.user?.id?.toString() || '';
    return this.salaryService.getHistoricalSalary(userId);
  }
}
