import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as webpush from 'web-push';
import { Notification } from '../../schemas/notification.schema';
import { PushSubscription } from '../../schemas/push-subscription.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private vapidConfigured = false;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(PushSubscription.name)
    private readonly pushSubscriptionModel: Model<PushSubscription>,
    private readonly config: ConfigService,
  ) {
    const pubKey = this.config.get<string>('PUSH_VAPID_PUBLIC_KEY');
    const privKey = this.config.get<string>('PUSH_VAPID_PRIVATE_KEY');

    if (pubKey && privKey && !pubKey.includes('placeholder')) {
      try {
        webpush.setVapidDetails(
          'mailto:support@smartroadmap.io',
          pubKey,
          privKey,
        );
        this.vapidConfigured = true;
        this.logger.log('Web Push VAPID keys configured successfully.');
      } catch (err: any) {
        this.logger.error(`Failed to set VAPID details: ${err.message}`);
      }
    } else {
      this.logger.warn('Web Push VAPID keys are missing. Push notifications will be mocked.');
    }
  }

  async create(
    recipientId: string,
    titleEn: string,
    titleAr: string,
    contentEn: string,
    contentAr: string,
    type:
      | 'general'
      | 'roadmap_update'
      | 'job_match'
      | 'message'
      | 'streak_reminder'
      | 'calendar_reminder'
      | 'achievement'
      | 'quiz_result'
      | 'system' = 'general',
    link?: string,
  ): Promise<Notification> {
    const created = new this.notificationModel({
      recipient: new Types.ObjectId(recipientId),
      titleEn,
      titleAr,
      contentEn,
      contentAr,
      type,
      link,
    });
    const saved = await created.save();

    // Trigger Web Push async background task
    this.sendWebPush(recipientId, saved);

    return saved;
  }

  private async sendWebPush(recipientId: string, notification: Notification) {
    const subscriptions = await this.pushSubscriptionModel.find({
      userId: new Types.ObjectId(recipientId),
    }).exec();

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title: notification.titleEn,
      body: notification.contentEn,
      titleAr: notification.titleAr,
      contentAr: notification.contentAr,
      data: {
        url: notification.link || '/dashboard',
        type: notification.type,
      },
    });

    for (const sub of subscriptions) {
      if (!this.vapidConfigured) {
        this.logger.log(`Mocking push send to endpoint: ${sub.endpoint.substring(0, 40)}...`);
        continue;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload,
        );
      } catch (err: any) {
        this.logger.warn(`Web push send failed for endpoint ${sub.endpoint.substring(0, 40)}: ${err.message}`);
        // If expired or unsubscribed, delete subscription
        if (err.statusCode === 410 || err.statusCode === 404) {
          await this.pushSubscriptionModel.deleteOne({ endpoint: sub.endpoint });
          this.logger.log(`Deleted expired push subscription: ${sub.endpoint}`);
        }
      }
    }
  }

  async saveSubscription(userId: string, subscription: any): Promise<PushSubscription> {
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      throw new Error('Invalid push subscription structure');
    }

    const saved = await this.pushSubscriptionModel.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          userId: new Types.ObjectId(userId),
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
        },
      },
      { upsert: true, new: true },
    );
    this.logger.log(`Saved push subscription for User ${userId}`);
    return saved;
  }

  async getForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ recipient: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const updated = await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), recipient: new Types.ObjectId(userId) },
      { $set: { read: true } },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Notification not found or unauthorized');
    }
    return updated;
  }

  async markAllRead(
    userId: string,
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const res = await this.notificationModel.updateMany(
      { recipient: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    );
    return { success: true, modifiedCount: res.modifiedCount };
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const res = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(id),
      recipient: new Types.ObjectId(userId),
    });
    if (res.deletedCount === 0) {
      throw new NotFoundException('Notification not found or unauthorized');
    }
    return { success: true };
  }
}
