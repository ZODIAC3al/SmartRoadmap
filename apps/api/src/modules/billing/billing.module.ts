import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PlanGuard } from './plan-guard.guard';
import { AiUsageService } from './ai-usage.service';
import { AIEntitlementGuard } from './ai-entitlement.guard';
import { Company, CompanySchema } from '../../schemas/company.schema';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';
import { JobBoost, JobBoostSchema } from '../../schemas/job-boost.schema';
import { Job, JobSchema } from '../../schemas/job.schema';
import { AiUsageLedger, AiUsageLedgerSchema } from '../../schemas/ai-usage-ledger.schema';
import { AiReservation, AiReservationSchema } from '../../schemas/ai-reservation.schema';

import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: JobBoost.name, schema: JobBoostSchema },
      { name: Job.name, schema: JobSchema },
      { name: AiUsageLedger.name, schema: AiUsageLedgerSchema },
      { name: AiReservation.name, schema: AiReservationSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService, PlanGuard, AiUsageService, AIEntitlementGuard],
  exports: [BillingService, PlanGuard, AiUsageService, AIEntitlementGuard, MongooseModule],
})
export class BillingModule {}

