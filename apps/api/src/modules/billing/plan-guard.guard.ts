import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company } from '../../schemas/company.schema';
import { Subscription, PlanTier } from '../../schemas/subscription.schema';
import { PLAN_CONFIG, PLAN_RANK } from './plan.config';

export const REQUIRE_PLAN_KEY = 'require_plan';

export interface RequirePlanOptions {
  plan: PlanTier;
  quotaKey?: 'jobPostsActive' | 'messagesSentThisPeriod' | 'boostsUsedThisPeriod';
}

export const RequirePlan = (
  plan: PlanTier,
  quotaKey?: RequirePlanOptions['quotaKey'],
) => SetMetadata(REQUIRE_PLAN_KEY, { plan, quotaKey });

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<RequirePlanOptions>(
      REQUIRE_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) {
      return false;
    }

    // Resolve companyId for the user
    let companyId: Types.ObjectId | undefined;
    if (user.companyId && Types.ObjectId.isValid(user.companyId)) {
      companyId = new Types.ObjectId(user.companyId);
    } else {
      const company = await this.companyModel
        .findOne({
          $or: [
            { ownerId: new Types.ObjectId(user.sub) },
            { memberIds: new Types.ObjectId(user.sub) },
          ],
        })
        .select('_id')
        .lean();
      if (company) {
        companyId = company._id as Types.ObjectId;
        req.user.companyId = companyId.toString();
      }
    }

    if (!companyId) {
      throw new HttpException(
        'Company profile required to access paid feature.',
        HttpStatus.FORBIDDEN,
      );
    }

    let sub = await this.subscriptionModel.findOne({ companyId });
    if (!sub) {
      // Auto-initialize Scale Pro subscription if missing
      sub = await this.subscriptionModel.create({
        companyId,
        plan: 'scale',
        status: 'active',
        seatsIncluded: PLAN_CONFIG.scale.seatsIncluded,
        jobPostLimit: PLAN_CONFIG.scale.jobPostLimit,
        messagesIncluded: PLAN_CONFIG.scale.messagesIncluded,
        boostsIncluded: PLAN_CONFIG.scale.boostsIncluded,
      });
    }

    // Check Plan Rank
    const currentRank = PLAN_RANK[sub.plan] || 1;
    const requiredRank = PLAN_RANK[requirement.plan] || 1;

    if (currentRank < requiredRank) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Payment Required',
          message: `This feature requires the ${requirement.plan.toUpperCase()} plan. Please upgrade to access.`,
          requiredPlan: requirement.plan,
          currentPlan: sub.plan,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Check Quota Limits if specified
    if (requirement.quotaKey) {
      const planDef = PLAN_CONFIG[sub.plan];
      let limit = -1;
      let currentUsage = sub.usage?.[requirement.quotaKey] || 0;

      if (requirement.quotaKey === 'jobPostsActive') limit = sub.jobPostLimit;
      if (requirement.quotaKey === 'messagesSentThisPeriod')
        limit = sub.messagesIncluded;
      if (requirement.quotaKey === 'boostsUsedThisPeriod')
        limit = sub.boostsIncluded;

      if (limit !== -1 && currentUsage >= limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            error: 'Quota Exceeded',
            message: `Monthly limit reached for ${requirement.quotaKey} on your ${sub.plan} plan (${currentUsage}/${limit}). Please upgrade or purchase additions.`,
            quotaKey: requirement.quotaKey,
            currentUsage,
            limit,
            currentPlan: sub.plan,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    return true;
  }
}
