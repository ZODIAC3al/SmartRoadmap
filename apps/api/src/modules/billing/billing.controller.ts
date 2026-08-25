import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { AiUsageService } from './ai-usage.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { CreateCheckoutSessionDto } from './dto/billing.dto';

@ApiTags('billing')
@Controller()
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('learner', 'company', 'admin', 'mentor')
  @Get('billing/subscription')
  getSubscription(@CurrentUser() user: JwtUser) {
    return this.billingService.getSubscriptionForUser(user);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('learner', 'company', 'admin', 'mentor')
  @Get('billing/ai-quota')
  getAiQuota(@CurrentUser() user: JwtUser) {
    return this.aiUsageService.getQuotaStatus(user);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('learner', 'company', 'admin', 'mentor')
  @Get('billing/ai-history')
  getAiHistory(@CurrentUser() user: JwtUser) {
    return this.aiUsageService.getUsageHistory(user);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('learner', 'company', 'admin')
  @Post('billing/checkout-session')
  @HttpCode(HttpStatus.OK)
  createCheckoutSession(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(user, dto.plan);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Post('billing/portal-session')
  @HttpCode(HttpStatus.OK)
  createPortalSession(@CurrentUser() user: JwtUser) {
    return this.billingService.createPortalSession(user);
  }

  /**
   * Job boosting endpoint (assigned to billing controller)
   * POST /company/jobs/:id/boost
   */
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Post('company/jobs/:id/boost')
  @HttpCode(HttpStatus.OK)
  boostJob(@CurrentUser() user: JwtUser, @Param('id') jobId: string) {
    return this.billingService.boostJob(user, jobId);
  }

  @Public()
  @Post('billing/webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody || req.body;
    return this.billingService.handleWebhook(rawBody, signature);
  }
}

