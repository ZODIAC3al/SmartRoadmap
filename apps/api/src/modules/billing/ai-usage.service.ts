import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { User } from '../../schemas/user.schema';
import { Subscription } from '../../schemas/subscription.schema';
import { Company } from '../../schemas/company.schema';
import { AiUsageLedger, AiFeatureKey } from '../../schemas/ai-usage-ledger.schema';
import { AiReservation } from '../../schemas/ai-reservation.schema';
import { AI_FEATURE_POLICIES, PLAN_CONFIG } from './plan.config';
import { JwtUser } from '../../common/decorators/current-user.decorator';

export interface QuotaStatus {
  allocatedCredits: number;
  consumedCredits: number;
  reservedCredits: number;
  remainingCredits: number;
  usagePercentage: number;
  periodStart?: Date;
  periodEnd?: Date;
  thresholdState: 'normal' | 'warning_75' | 'critical_90' | 'exhausted_100';
}

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(AiUsageLedger.name)
    private readonly usageLedgerModel: Model<AiUsageLedger>,
    @InjectModel(AiReservation.name)
    private readonly reservationModel: Model<AiReservation>,
  ) {}

  /**
   * Resolves active subscription for learner or company.
   * If no subscription exists, initializes free subscription atomically.
   */
  async resolveSubscription(user: JwtUser): Promise<Subscription> {
    const userObjId = Types.ObjectId.isValid(user.sub)
      ? new Types.ObjectId(user.sub)
      : user.sub;

    const userDoc = await this.userModel.findById(userObjId);

    if (user.role === 'company') {
      const company = await this.companyModel.findOne({
        $or: [{ ownerId: userObjId }, { memberIds: userObjId }],
      });
      if (company) {
        let sub = await this.subscriptionModel.findOne({ companyId: company._id });

        const userPlan = (userDoc?.plan as string) || '';
        const targetPlan =
          userPlan === 'company_tier' || userPlan === 'growth'
            ? 'growth'
            : userPlan === 'scale'
            ? 'scale'
            : null;

        if (!sub) {
          const initialPlan = targetPlan || 'starter';
          const planDef = PLAN_CONFIG[initialPlan] || PLAN_CONFIG.starter;
          sub = await this.subscriptionModel.create({
            companyId: company._id,
            plan: initialPlan,
            status: 'active',
            seatsIncluded: planDef.seatsIncluded,
            jobPostLimit: planDef.jobPostLimit,
            messagesIncluded: planDef.messagesIncluded,
            boostsIncluded: planDef.boostsIncluded,
            aiCreditsIncluded: planDef.aiCreditsIncluded,
          });
        } else if (targetPlan && sub.plan !== targetPlan) {
          const planDef = PLAN_CONFIG[targetPlan] || PLAN_CONFIG.growth;
          sub.plan = targetPlan;
          sub.seatsIncluded = planDef.seatsIncluded;
          sub.jobPostLimit = planDef.jobPostLimit;
          sub.messagesIncluded = planDef.messagesIncluded;
          sub.boostsIncluded = planDef.boostsIncluded;
          sub.aiCreditsIncluded = planDef.aiCreditsIncluded;
          await sub.save();
        }
        return sub;
      }
    }

    // Learner or individual user subscription
    let sub = await this.subscriptionModel.findOne({ userId: userObjId });
    const userPlan = (userDoc?.plan as string) || '';
    const targetLearnerPlan =
      userPlan === 'pro_learner' || userPlan === 'learner_pro'
        ? 'learner_pro'
        : null;

    if (!sub) {
      const initialPlan = targetLearnerPlan || 'learner_free';
      sub = await this.subscriptionModel.create({
        userId: userObjId,
        plan: initialPlan,
        status: 'active',
        aiCreditsIncluded: PLAN_CONFIG[initialPlan].aiCreditsIncluded,
      });
    } else if (targetLearnerPlan && sub.plan !== targetLearnerPlan) {
      sub.plan = 'learner_pro';
      sub.aiCreditsIncluded = PLAN_CONFIG.learner_pro.aiCreditsIncluded;
      await sub.save();
    }
    return sub;
  }

  /**
   * Evaluates four-metric quota status: allocated, consumed, reserved, remaining.
   */
  async getQuotaStatus(user: JwtUser): Promise<QuotaStatus> {
    const sub = await this.resolveSubscription(user);
    const allocated = sub.aiCreditsIncluded || 50;
    const consumed = sub.usage?.aiCreditsConsumedThisPeriod || 0;
    const reserved = sub.usage?.aiCreditsReservedThisPeriod || 0;
    const remaining = Math.max(0, allocated - (consumed + reserved));
    const usagePercentage = allocated > 0 ? Math.round(((consumed + reserved) / allocated) * 100) : 0;

    let thresholdState: QuotaStatus['thresholdState'] = 'normal';
    if (usagePercentage >= 100 || remaining === 0) thresholdState = 'exhausted_100';
    else if (usagePercentage >= 90) thresholdState = 'critical_90';
    else if (usagePercentage >= 75) thresholdState = 'warning_75';

    return {
      allocatedCredits: allocated,
      consumedCredits: consumed,
      reservedCredits: reserved,
      remainingCredits: remaining,
      usagePercentage,
      periodStart: (sub as any).createdAt,
      periodEnd: sub.currentPeriodEnd,
      thresholdState,
    };
  }

  /**
   * STEP 1: Reserve credits atomically before executing AI operation.
   * Prevents concurrency double-spending.
   */
  async reserve(
    user: JwtUser,
    featureKey: AiFeatureKey,
  ): Promise<{ reservationId: string; requestId: string; reservedCredits: number }> {
    const policy = AI_FEATURE_POLICIES[featureKey];
    if (!policy) {
      throw new BadRequestException(`Unknown AI feature key: ${featureKey}`);
    }

    const sub = await this.resolveSubscription(user);
    const requiredCredits = policy.creditCost;

    if (requiredCredits > 0) {
      // Atomic reservation query ensuring available balance >= requiredCredits
      const allocated = sub.aiCreditsIncluded || 50;
      const updatedSub = await this.subscriptionModel.findOneAndUpdate(
        {
          _id: sub._id,
          $expr: {
            $gte: [
              {
                $subtract: [
                  allocated,
                  {
                    $add: [
                      { $ifNull: ['$usage.aiCreditsConsumedThisPeriod', 0] },
                      { $ifNull: ['$usage.aiCreditsReservedThisPeriod', 0] },
                    ],
                  },
                ],
              },
              requiredCredits,
            ],
          },
        },
        { $inc: { 'usage.aiCreditsReservedThisPeriod': requiredCredits } },
        { new: true },
      );

      if (!updatedSub) {
        const status = await this.getQuotaStatus(user);
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            error: 'AI_QUOTA_EXCEEDED',
            message: `Your monthly AI allowance has been reached for ${featureKey}. (${status.consumedCredits}/${status.allocatedCredits} credits used).`,
            feature: featureKey,
            currentPlan: sub.plan,
            usage: status.consumedCredits,
            limit: status.allocatedCredits,
            remaining: status.remainingCredits,
            recommendedPlan: policy.recommendedPlan || 'learner_pro',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    const reservationId = `res_${randomUUID()}`;
    const requestId = `req_${randomUUID()}`;

    await this.reservationModel.create({
      reservationId,
      requestId,
      userId: new Types.ObjectId(user.sub),
      companyId: sub.companyId,
      featureKey,
      reservedCredits: requiredCredits,
      status: 'RESERVED',
    });

    this.logger.log(
      `Reserved ${requiredCredits} credits for feature ${featureKey} (User: ${user.sub}, Reservation: ${reservationId})`,
    );

    return { reservationId, requestId, reservedCredits: requiredCredits };
  }

  /**
   * STEP 2: Finalize credit reservation on successful AI response.
   * Converts reserved credits to consumed credits and logs immutable historical ledger.
   */
  async finalize(
    reservationId: string,
    details: {
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      status?: 'success' | 'fallback' | 'failed';
    },
  ): Promise<AiUsageLedger> {
    const reservation = await this.reservationModel.findOne({ reservationId });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found.`);
    }

    if (reservation.status !== 'RESERVED') {
      this.logger.warn(`Reservation ${reservationId} already ${reservation.status}. Skipping duplicate finalization.`);
      const existingLedger = await this.usageLedgerModel.findOne({ reservationId });
      if (existingLedger) return existingLedger;
    }

    const credits = reservation.reservedCredits;

    // Atomically decrement reserved and increment consumed in Subscription
    const filter = reservation.companyId
      ? { companyId: reservation.companyId }
      : { userId: reservation.userId };

    await this.subscriptionModel.updateOne(filter, {
      $inc: {
        'usage.aiCreditsReservedThisPeriod': -credits,
        'usage.aiCreditsConsumedThisPeriod': credits,
      },
    });

    reservation.status = 'FINALIZED';
    await reservation.save();

    const userSub = await this.subscriptionModel.findOne(filter);

    const ledger = await this.usageLedgerModel.create({
      requestId: reservation.requestId,
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      companyId: reservation.companyId,
      role: reservation.companyId ? 'company' : 'learner',
      plan: userSub?.plan || 'learner_free',
      featureKey: reservation.featureKey,
      provider: details.provider,
      aiModel: details.model,
      inputTokens: details.inputTokens,
      outputTokens: details.outputTokens,
      totalTokens: details.totalTokens,
      creditsConsumed: credits,
      status: details.status || 'success',
      timestamp: new Date(),
    });

    this.logger.log(`Finalized reservation ${reservationId}: ${credits} credits charged (${details.totalTokens} tokens).`);
    return ledger;
  }

  /**
   * STEP 3: Release reservation on failed AI execution / non-billable error.
   */
  async release(reservationId: string, reason?: string): Promise<void> {
    const reservation = await this.reservationModel.findOne({ reservationId });
    if (!reservation || reservation.status !== 'RESERVED') return;

    const credits = reservation.reservedCredits;
    const filter = reservation.companyId
      ? { companyId: reservation.companyId }
      : { userId: reservation.userId };

    if (credits > 0) {
      await this.subscriptionModel.updateOne(filter, {
        $inc: { 'usage.aiCreditsReservedThisPeriod': -credits },
      });
    }

    reservation.status = 'RELEASED';
    await reservation.save();

    this.logger.warn(`Released reservation ${reservationId} (${credits} credits restored). Reason: ${reason || 'AI Execution Failed'}`);
  }

  /**
   * Fetches historical AI usage ledger logs for authorized user or company.
   */
  async getUsageHistory(
    user: JwtUser,
    options?: { startDate?: Date; endDate?: Date; limit?: number },
  ): Promise<AiUsageLedger[]> {
    const query: any = {};
    if (user.role === 'company' && user.companyId) {
      query.companyId = new Types.ObjectId(user.companyId);
    } else {
      query.userId = new Types.ObjectId(user.sub);
    }

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    return this.usageLedgerModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 100)
      .exec();
  }
}
