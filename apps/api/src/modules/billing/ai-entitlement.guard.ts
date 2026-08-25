import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AiFeatureKey } from '../../schemas/ai-usage-ledger.schema';
import { AiUsageService } from './ai-usage.service';
import { AI_FEATURE_POLICIES, PLAN_CONFIG, PLAN_RANK } from './plan.config';

export const REQUIRE_AI_FEATURE_KEY = 'require_ai_feature';

export const RequireAiFeature = (featureKey: AiFeatureKey) =>
  SetMetadata(REQUIRE_AI_FEATURE_KEY, featureKey);

@Injectable()
export class AIEntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly aiUsageService: AiUsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.getAllAndOverride<AiFeatureKey>(
      REQUIRE_AI_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!featureKey) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) {
      return false;
    }

    // Admins bypass subscription feature locks for administrative tasks
    if (user.role === 'admin' && featureKey === 'AI_EXECUTIVE_BI') {
      return true;
    }

    const sub = await this.aiUsageService.resolveSubscription(user);
    const planDef = PLAN_CONFIG[sub.plan] || PLAN_CONFIG.learner_free;
    const policy = AI_FEATURE_POLICIES[featureKey];

    // 1. Verify Feature Entitlement in Active Plan
    const isAllowedFeature = planDef.allowedAiFeatures.includes(featureKey);

    if (!isAllowedFeature) {
      const recommendedPlan = policy?.recommendedPlan || 'learner_pro';
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'AI_FEATURE_LOCKED',
          message: `Feature ${featureKey} requires the ${recommendedPlan.toUpperCase()} plan. Please upgrade to access.`,
          feature: featureKey,
          currentPlan: sub.plan,
          recommendedPlan,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // 2. Check Static Quota Balance Availability
    const status = await this.aiUsageService.getQuotaStatus(user);
    const requiredCost = policy?.creditCost || 0;

    if (requiredCost > 0 && status.remainingCredits < requiredCost) {
      const recommendedPlan = policy?.recommendedPlan || 'learner_pro';
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'AI_QUOTA_EXCEEDED',
          message: `Insufficient AI credits for ${featureKey}. (${status.remainingCredits} credits remaining, ${requiredCost} required).`,
          feature: featureKey,
          currentPlan: sub.plan,
          creditsUsed: status.consumedCredits,
          creditsLimit: status.allocatedCredits,
          remaining: status.remainingCredits,
          recommendedPlan,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
