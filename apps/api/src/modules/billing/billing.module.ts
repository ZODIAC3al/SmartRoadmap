import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PlanGuard } from './plan-guard.guard';
import { Company, CompanySchema } from '../../schemas/company.schema';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';
import { JobBoost, JobBoostSchema } from '../../schemas/job-boost.schema';
import { Job, JobSchema } from '../../schemas/job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: JobBoost.name, schema: JobBoostSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService, PlanGuard],
  exports: [BillingService, PlanGuard, MongooseModule],
})
export class BillingModule {}
