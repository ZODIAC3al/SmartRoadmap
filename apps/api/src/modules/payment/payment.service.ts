import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { Payment } from '../../schemas/payment.schema';
import { User } from '../../schemas/user.schema';
import { PLAN_PRICES } from './dto/payment.dto';

type Plan = 'pro_learner' | 'company_tier';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly isMockMode: boolean;
  private readonly apiUrl: string;

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly config: ConfigService,
  ) {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET');
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    this.isMockMode =
      !clientId ||
      !clientSecret ||
      this.config.get<boolean>('MOCK_MODE') === true;

    // Hard stop: a production build must never be able to hand out free upgrades.
    if (isProd && this.isMockMode) {
      throw new Error(
        'PayPal credentials are required in production (mock payments are disabled).',
      );
    }

    this.apiUrl =
      this.config.get<string>('PAYPAL_MODE') === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    if (this.isMockMode) {
      this.logger.warn(
        'PayPal not configured — payments are SIMULATED (development only).',
      );
    }
  }

  private async accessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.config.get('PAYPAL_CLIENT_ID')}:${this.config.get('PAYPAL_CLIENT_SECRET')}`,
    ).toString('base64');

    const { data } = await axios.post(
      `${this.apiUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10_000,
      },
    );
    return data.access_token;
  }

  async createOrder(userId: string, plan: Plan) {
    const amount = PLAN_PRICES[plan];

    if (this.isMockMode) {
      const orderId = `PAYPAL-MOCK-${Date.now().toString(36).toUpperCase()}`;
      await this.paymentModel.create({
        userId: new Types.ObjectId(userId),
        paypalOrderId: orderId,
        amount,
        currency: 'USD',
        status: 'created',
        plan,
      });
      return { id: orderId, status: 'CREATED', mock: true };
    }

    try {
      const token = await this.accessToken();
      const { data } = await axios.post(
        `${this.apiUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: { currency_code: 'USD', value: amount.toFixed(2) },
              description: `SmartRoadmap Subscription — ${plan}`,
              custom_id: userId,
            },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 },
      );

      await this.paymentModel.create({
        userId: new Types.ObjectId(userId),
        paypalOrderId: data.id,
        amount,
        currency: 'USD',
        status: 'created',
        plan,
      });

      return data;
    } catch (error: any) {
      // Previously this recursed into createOrder() forever AND silently
      // downgraded to a free mock order. Now it fails loudly.
      this.logger.error(`PayPal order creation failed: ${error.message}`);
      throw new ServiceUnavailableException(
        'Could not reach the payment provider. Try again.',
      );
    }
  }

  async capturePayment(orderId: string, userId: string) {
    const payment = await this.paymentModel.findOne({ paypalOrderId: orderId });
    if (!payment) throw new NotFoundException('Payment order not found.');

    // An order can only be captured by the user who created it.
    if (payment.userId.toString() !== userId) {
      throw new ForbiddenException('This order does not belong to you.');
    }
    if (payment.status === 'completed') {
      return {
        id: orderId,
        status: 'COMPLETED',
        plan: payment.plan,
        alreadyCaptured: true,
      };
    }

    if (this.isMockMode) {
      await this.markCompleted(payment);
      return {
        id: orderId,
        status: 'COMPLETED',
        plan: payment.plan,
        mock: true,
      };
    }

    try {
      const token = await this.accessToken();
      const { data } = await axios.post(
        `${this.apiUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 },
      );

      if (data.status !== 'COMPLETED') {
        payment.status = 'failed';
        await payment.save();
        throw new BadRequestException(
          `Payment not completed (status: ${data.status}).`,
        );
      }

      // Verify the captured amount actually matches the plan price.
      const captured = Number(
        data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? 0,
      );
      if (Math.abs(captured - payment.amount) > 0.01) {
        payment.status = 'failed';
        await payment.save();
        this.logger.error(
          `Amount mismatch for order ${orderId}: captured ${captured}, expected ${payment.amount}`,
        );
        throw new BadRequestException(
          'Captured amount does not match the order.',
        );
      }

      await this.markCompleted(payment);
      return data;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `PayPal capture failed for ${orderId}: ${error.message}`,
      );
      throw new BadRequestException('PayPal payment capture failed.');
    }
  }

  /**
   * Source of truth for entitlements. PayPal signs the webhook; we verify the
   * signature with PayPal before trusting anything in the body.
   */
  async handleWebhook(headers: Record<string, string>, body: any) {
    if (this.isMockMode)
      throw new ForbiddenException('Webhooks are disabled in mock mode.');

    const token = await this.accessToken();
    const { data } = await axios.post(
      `${this.apiUrl}/v1/notifications/verify-webhook-signature`,
      {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: this.config.getOrThrow<string>('PAYPAL_WEBHOOK_ID'),
        webhook_event: body,
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 },
    );

    if (data.verification_status !== 'SUCCESS') {
      this.logger.warn('Rejected a PayPal webhook with an invalid signature.');
      throw new ForbiddenException('Invalid webhook signature.');
    }

    const orderId =
      body?.resource?.supplementary_data?.related_ids?.order_id ??
      body?.resource?.id;
    const payment = orderId
      ? await this.paymentModel.findOne({ paypalOrderId: orderId })
      : null;
    if (!payment) return { received: true, matched: false };

    switch (body.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.markCompleted(payment);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        payment.status = 'failed';
        await payment.save();
        await this.userModel.updateOne(
          { _id: payment.userId },
          { plan: 'free', subscriptionStatus: 'inactive' },
        );
        break;
    }

    return { received: true, matched: true };
  }

  private async markCompleted(payment: Payment): Promise<void> {
    if (payment.status !== 'completed') {
      payment.status = 'completed';
      await payment.save();
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.userModel.updateOne(
      { _id: payment.userId },
      {
        plan: payment.plan,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt,
      },
    );
    this.logger.log(
      `Activated plan "${payment.plan}" for user ${payment.userId.toString()}`,
    );
  }
}
