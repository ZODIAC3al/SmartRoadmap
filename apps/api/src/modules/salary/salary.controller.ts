import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalaryService } from './salary.service';
import { PredictSalaryDto, UpdateCareerProfileDto } from './dto/salary.dto';

/**
 * All routes are protected by JwtAuthGuard.
 *
 * The global APP_GUARD in AppModule already enforces JWT on every route, but
 * the explicit @UseGuards here makes the security contract clear and ensures
 * it holds even if the global guard is ever re-scoped.
 *
 * API keys (Adzuna, Gemini) are consumed server-side only and are never
 * returned to the client in any response.
 */
@UseGuards(JwtAuthGuard)
@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  // ── Career profile ─────────────────────────────────────────────────────────

  @Get('profile')
  async getProfile(@Request() req: any) {
    const userId = this.extractUserId(req);
    return this.salaryService.getCareerProfile(userId);
  }

  /**
   * Update the user's career profile.
   * The cache is automatically invalidated so the next GET /salary/insights
   * fetches fresh Adzuna data based on the updated profile.
   */
  @Patch('profile')
  async updateProfile(@Body() dto: UpdateCareerProfileDto, @Request() req: any) {
    const userId = this.extractUserId(req);
    return this.salaryService.updateCareerProfile(userId, dto);
  }

  // ── Salary insights ────────────────────────────────────────────────────────

  /**
   * Returns live salary insights sourced from Adzuna when available.
   * Falls back to Gemini AI (labelled "AI Estimate") or a deterministic
   * formula ("Fallback") when Adzuna returns insufficient data.
   *
   * Query params:
   *   ?country=eg   ISO-3166-1 alpha-2 code from the UI country selector.
   *                 When provided, overrides the profile location for
   *                 country/currency resolution.  All other profile fields
   *                 (role, skills, experience, etc.) are still loaded
   *                 automatically from the authenticated user's stored profile.
   */
  @Get('insights')
  async getInsights(
    @Request() req: any,
    @Query('country') country?: string,
  ) {
    const userId = this.extractUserId(req);
    return this.salaryService.getSalaryInsights(userId, country);
  }

  /**
   * On-demand salary prediction — accepts an explicit profile payload.
   * Useful for "what if" comparisons (e.g. simulating a different role or city).
   * Results are NOT cached because they may differ from the user's stored profile.
   */
  @Post('predict')
  @HttpCode(HttpStatus.OK)
  async predict(@Body() dto: PredictSalaryDto) {
    return this.salaryService.predictSalaryRange(dto);
  }

  // ── Historical trends ──────────────────────────────────────────────────────

  /**
   * Returns 5-year salary growth trends sourced from Adzuna history endpoint
   * when available, falling back to AI-generated trends.
   */
  @Get('history')
  async getHistory(@Request() req: any) {
    const userId = this.extractUserId(req);
    return this.salaryService.getHistoricalSalary(userId);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private extractUserId(req: any): string {
    return req.user?.sub?.toString() ?? req.user?.id?.toString() ?? '';
  }
}
