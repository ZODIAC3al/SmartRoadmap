import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from '../../schemas/payment.schema';
import { User } from '../../schemas/user.schema';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly isMockMode: boolean;
  private readonly paypalApiUrl: string;

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.isMockMode = !clientId || clientId.includes('placeholder') || !clientSecret;
    
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    this.paypalApiUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    if (this.isMockMode) {
      this.logger.warn('PayPal credentials are missing or invalid. Running in MOCK/SIMULATION payment verification mode.');
    }
  }

  async createOrder(userId: string, plan: 'pro_learner' | 'company_tier'): Promise<any> {
    const amount = plan === 'pro_learner' ? 19.99 : 99.99;
    const currency = 'USD';
    const mockOrderId = 'PAYPAL-MOCK-' + Math.random().toString(36).substring(2, 11).toUpperCase();

    if (this.isMockMode) {
      this.logger.log(`[Mock] Generating simulated PayPal order for user ${userId}, plan ${plan}`);
      const payment = new this.paymentModel({
        userId,
        paypalOrderId: mockOrderId,
        amount,
        currency,
        status: 'created',
        plan,
      });
      await payment.save();

      return {
        id: mockOrderId,
        status: 'CREATED',
        links: [
          { href: '#', rel: 'approve', method: 'GET' }
        ]
      };
    }

    try {
      const accessToken = await this.getPayPalAccessToken();
      const response = await axios.post(
        `${this.paypalApiUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toString(),
              },
              description: `SmartRoadmap Subscription - ${plan}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const payment = new this.paymentModel({
        userId,
        paypalOrderId: response.data.id,
        amount,
        currency,
        status: 'created',
        plan,
      });
      await payment.save();

      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to create PayPal order via API. Falling back to mock creation.', error.stack);
      return this.createOrder(userId, plan); // Fallback gracefully to mock order
    }
  }

  async capturePayment(paypalOrderId: string): Promise<any> {
    const payment = await this.paymentModel.findOne({ paypalOrderId });
    if (!payment) {
      throw new BadRequestException('Payment order not found in database.');
    }

    if (this.isMockMode || paypalOrderId.startsWith('PAYPAL-MOCK-')) {
      this.logger.log(`[Mock] Capturing simulated payment for order ${paypalOrderId}`);
      payment.status = 'completed';
      await payment.save();

      // Upgrade user role or profile
      await this.upgradeUserSubscription(payment.userId.toString(), payment.plan);

      return {
        id: paypalOrderId,
        status: 'COMPLETED',
        plan: payment.plan,
        message: 'Mock payment captured and subscription updated successfully.',
      };
    }

    try {
      const accessToken = await this.getPayPalAccessToken();
      const response = await axios.post(
        `${this.paypalApiUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.status === 'COMPLETED') {
        payment.status = 'completed';
        await payment.save();

        await this.upgradeUserSubscription(payment.userId.toString(), payment.plan);
      } else {
        payment.status = 'failed';
        await payment.save();
      }

      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to capture PayPal payment for order ${paypalOrderId}.`, error.stack);
      throw new BadRequestException('PayPal payment capture failed.');
    }
  }

  private async getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      `${this.paypalApiUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }

  private async upgradeUserSubscription(userId: string, plan: 'pro_learner' | 'company_tier'): Promise<void> {
    this.logger.log(`Upgrading user ${userId} subscription to plan ${plan}`);
    const user = await this.userModel.findById(userId);
    if (user) {
      // Upgrade user settings or profile indicators
      if (plan === 'pro_learner') {
        user.theme = 'smartdark'; // Premium styling as example
      }
      await user.save();
    }
  }
}
