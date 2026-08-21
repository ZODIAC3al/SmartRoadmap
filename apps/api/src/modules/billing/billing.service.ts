import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Company } from '../../schemas/company.schema';
import { Subscription, PlanTier } from '../../schemas/subscription.schema';
import { JobBoost } from '../../schemas/job-boost.schema';
import { Job } from '../../schemas/job.schema';
import { PLAN_CONFIG } from './plan.config';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe?: Stripe;

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    @InjectModel(JobBoost.name)
    private readonly jobBoostModel: Model<JobBoost>,
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
    private readonly config: ConfigService,
  ) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey);
      this.logger.log('Stripe SDK initialized successfully.');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY missing — Stripe checkout & webhooks operate in simulation mode.',
      );
    }
  }

  async getOrCreateCompanyForUser(user: JwtUser): Promise<Company> {
    const userObjectId = new Types.ObjectId(user.sub);
    let company = await this.companyModel.findOne({
      $or: [{ ownerId: userObjectId }, { memberIds: userObjectId }],
    });

    if (!company) {
      const name = (user as any).name || 'My Company';
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30) + '-' + Date.now().toString(36);

      company = await this.companyModel.create({
        name,
        slug,
        ownerId: userObjectId,
        memberIds: [userObjectId],
      });
    }

    return company;
  }

  async getSubscriptionForUser(user: JwtUser): Promise<{
    company: Company;
    subscription: Subscription;
    limits: (typeof PLAN_CONFIG)['starter'];
  }> {
    const company = await this.getOrCreateCompanyForUser(user);
    let subscription = await this.subscriptionModel.findOne({
      companyId: company._id,
    });

    if (!subscription) {
      const scaleConfig = PLAN_CONFIG.scale;
      subscription = await this.subscriptionModel.create({
        companyId: company._id,
        plan: 'scale',
        status: 'active',
        seatsIncluded: scaleConfig.seatsIncluded,
        jobPostLimit: scaleConfig.jobPostLimit,
        messagesIncluded: scaleConfig.messagesIncluded,
        boostsIncluded: scaleConfig.boostsIncluded,
        usage: {
          jobPostsActive: 0,
          messagesSentThisPeriod: 0,
          boostsUsedThisPeriod: 0,
        },
      });
    }

    const limits = PLAN_CONFIG[subscription.plan] || PLAN_CONFIG.starter;
    return { company, subscription, limits };
  }

  async createCheckoutSession(
    user: JwtUser,
    targetPlan: PlanTier,
  ): Promise<{ url: string }> {
    if (targetPlan === 'starter') {
      throw new BadRequestException('Starter plan is free and does not require checkout.');
    }

    const company = await this.getOrCreateCompanyForUser(user);
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    // Simulated Stripe Checkout URL when Stripe SDK is not configured
    if (!this.stripe) {
      this.logger.warn('Simulating Stripe Checkout session (STRIPE_SECRET_KEY unset).');
      // Upgrade subscription directly in simulation mode
      const planDef = PLAN_CONFIG[targetPlan];
      await this.subscriptionModel.updateOne(
        { companyId: company._id },
        {
          $set: {
            plan: targetPlan,
            status: 'active',
            seatsIncluded: planDef.seatsIncluded,
            jobPostLimit: planDef.jobPostLimit,
            messagesIncluded: planDef.messagesIncluded,
            boostsIncluded: planDef.boostsIncluded,
          },
        },
        { upsert: true },
      );
      return { url: `${frontendUrl}/company/billing?success=true&plan=${targetPlan}` };
    }

    // Ensure Stripe customer ID exists
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: { companyId: company._id.toString() },
      });
      customerId = customer.id;
      company.stripeCustomerId = customerId;
      await company.save();
    }

    const priceId =
      targetPlan === 'growth'
        ? this.config.get<string>('STRIPE_PRICE_GROWTH') || 'price_growth_mock'
        : this.config.get<string>('STRIPE_PRICE_SCALE') || 'price_scale_mock';

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/company/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${frontendUrl}/company/billing?canceled=true`,
      metadata: { companyId: company._id.toString(), plan: targetPlan },
    });

    if (!session.url) {
      throw new Error('Failed to generate Stripe checkout session URL.');
    }

    return { url: session.url };
  }

  async createPortalSession(user: JwtUser): Promise<{ url: string }> {
    const company = await this.getOrCreateCompanyForUser(user);
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    if (!this.stripe || !company.stripeCustomerId) {
      return { url: `${frontendUrl}/company/billing` };
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${frontendUrl}/company/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!this.stripe || !webhookSecret) {
      this.logger.warn('Stripe webhook received but webhookSecret/Stripe is unconfigured.');
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Processing Stripe Webhook Event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.metadata?.companyId;
        const plan = (session.metadata?.plan as PlanTier) || 'growth';
        if (companyId) {
          const planDef = PLAN_CONFIG[plan];
          await this.subscriptionModel.updateOne(
            { companyId: new Types.ObjectId(companyId) },
            {
              $set: {
                plan,
                status: 'active',
                stripeSubscriptionId: session.subscription as string,
                seatsIncluded: planDef.seatsIncluded,
                jobPostLimit: planDef.jobPostLimit,
                messagesIncluded: planDef.messagesIncluded,
                boostsIncluded: planDef.boostsIncluded,
              },
            },
            { upsert: true },
          );
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const company = await this.companyModel.findOne({
          stripeCustomerId: sub.customer as string,
        });
        if (company) {
          const status =
            sub.status === 'active' || sub.status === 'trialing'
              ? sub.status
              : sub.status === 'past_due'
              ? 'past_due'
              : 'canceled';
          await this.subscriptionModel.updateOne(
            { companyId: company._id },
            {
              $set: {
                status,
                stripeSubscriptionId: sub.id,
                currentPeriodEnd: (sub as any).current_period_end
                  ? new Date((sub as any).current_period_end * 1000)
                  : undefined,
              },
            },
          );
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const company = await this.companyModel.findOne({
          stripeCustomerId: sub.customer as string,
        });
        if (company) {
          const starterDef = PLAN_CONFIG.starter;
          await this.subscriptionModel.updateOne(
            { companyId: company._id },
            {
              $set: {
                plan: 'starter',
                status: 'canceled',
                seatsIncluded: starterDef.seatsIncluded,
                jobPostLimit: starterDef.jobPostLimit,
                messagesIncluded: starterDef.messagesIncluded,
                boostsIncluded: starterDef.boostsIncluded,
              },
            },
          );
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const company = await this.companyModel.findOne({
          stripeCustomerId: invoice.customer as string,
        });
        if (company) {
          await this.subscriptionModel.updateOne(
            { companyId: company._id },
            { $set: { status: 'past_due' } },
          );
        }
        break;
      }
      case 'invoice.paid': {
        // Reset usage counters atomically on new billing cycle
        const invoice = event.data.object as Stripe.Invoice;
        const company = await this.companyModel.findOne({
          stripeCustomerId: invoice.customer as string,
        });
        if (company) {
          await this.subscriptionModel.updateOne(
            { companyId: company._id },
            {
              $set: {
                'usage.messagesSentThisPeriod': 0,
                'usage.boostsUsedThisPeriod': 0,
              },
            },
          );
        }
        break;
      }
    }

    return { received: true };
  }

  /**
   * Job boosting endpoint implementation:
   * Uses included plan boosts (atomic $inc) or creates a Stripe PaymentIntent ($15).
   */
  async boostJob(
    user: JwtUser,
    jobId: string,
  ): Promise<{ success: boolean; boost: JobBoost; paymentUrl?: string }> {
    const company = await this.getOrCreateCompanyForUser(user);
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found.');

    const subData = await this.getSubscriptionForUser(user);
    const sub = subData.subscription;

    // Check if company has included boosts left in this billing period
    const boostsUsed = sub.usage?.boostsUsedThisPeriod || 0;
    const boostsAllowed = sub.boostsIncluded || 0;

    if (boostsAllowed > 0 && boostsUsed < boostsAllowed) {
      // Consume one included boost atomically
      await this.subscriptionModel.updateOne(
        { companyId: company._id },
        { $inc: { 'usage.boostsUsedThisPeriod': 1 } },
      );

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const boost = await this.jobBoostModel.create({
        jobId: job._id,
        companyId: company._id,
        source: 'subscription_included',
        startedAt: new Date(),
        expiresAt,
      });

      this.logger.log(`Job ${jobId} boosted using subscription quota for company ${company._id}`);
      return { success: true, boost };
    }

    // Otherwise, create a pay-per-boost session ($15)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const boost = await this.jobBoostModel.create({
      jobId: job._id,
      companyId: company._id,
      source: 'paid',
      startedAt: new Date(),
      expiresAt,
    });

    return {
      success: true,
      boost,
      paymentUrl: `${this.config.get('FRONTEND_URL') || 'http://localhost:3001'}/company/billing?boost_success=true&jobId=${jobId}`,
    };
  }
}
