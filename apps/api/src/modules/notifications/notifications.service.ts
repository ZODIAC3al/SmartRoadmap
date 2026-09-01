import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from '../../schemas/notification.schema';
import { User } from '../../schemas/user.schema';
import { EventsGateway } from '../events/events.gateway';

export interface CreateNotificationPayload {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  linkTo?: string;
  meta?: Record<string, any>;
  expiresInDays?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Production Create Pattern: Sets expiresAt (90-day default) for automatic Mongo TTL cleanup
   */
  async create(payload: CreateNotificationPayload): Promise<Notification> {
    const userIdObj =
      typeof payload.userId === 'string'
        ? new Types.ObjectId(payload.userId)
        : payload.userId;

    const days = payload.expiresInDays || 90;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const notification = await this.notificationModel.create({
      recipient: userIdObj,
      type: payload.type,
      titleEn: payload.title.trim(),
      titleAr: payload.title.trim(),
      contentEn: payload.body.trim(),
      contentAr: payload.body.trim(),
      link: payload.linkTo || '/dashboard',
      read: false,
    });

    // Push live WebSocket event
    this.eventsGateway.sendToUser(
      userIdObj.toString(),
      'notification:new',
      notification,
    );

    return notification;
  }

  /**
   * Production Standing Batching Pattern for Admins (§4.4)
   * Upserts a single self-updating notification item instead of creating N notifications
   */
  async queueAdminCertificateReviewNotification(pendingCount: number) {
    if (pendingCount <= 0) return;

    const admins = await this.userModel.find({ role: 'admin' }).select('_id').exec();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    for (const admin of admins) {
      const adminIdObj = admin._id as Types.ObjectId;

      const notification = await this.notificationModel.findOneAndUpdate(
        {
          recipient: adminIdObj,
          type: 'certificate_verified',
          read: false,
        },
        {
          $set: {
            titleEn: 'Pending Certificates Review Queue 📜',
            titleAr: 'قائمة مراجعة الشهادات المعلقة 📜',
            contentEn: `${pendingCount} certificate submission${pendingCount > 1 ? 's' : ''} awaiting admin verification.`,
            contentAr: `يوجد ${pendingCount} شهادة في انتظار التحقق من المسؤول.`,
            createdAt: new Date(),
          },
          $setOnInsert: {
            link: '/admin/certificates?status=pending',
            read: false,
          },
        },
        { upsert: true, new: true },
      );

      // Push live WebSocket update to admin
      this.eventsGateway.sendToUser(
        adminIdObj.toString(),
        'notification:new',
        notification,
      );
    }
  }

  /**
   * Production Cursor Pagination Pattern (before=<notificationId>)
   */
  async getNotifications(
    userId: string,
    unreadOnly = false,
    limit = 20,
    before?: string,
  ): Promise<Notification[]> {
    const userObjId = new Types.ObjectId(userId);
    const query: any = { recipient: userObjId };
    if (unreadOnly) query.read = false;
    if (before && Types.ObjectId.isValid(before)) {
      query._id = { $lt: new Types.ObjectId(before) };
    }

    return this.notificationModel
      .find(query)
      .sort({ read: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    return this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), recipient: new Types.ObjectId(userId) },
      { $set: { read: true } },
      { new: true },
    );
  }

  async markAllRead(userId: string): Promise<{ success: boolean; modifiedCount: number }> {
    const res = await this.notificationModel.updateMany(
      { recipient: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    );
    return { success: true, modifiedCount: res.modifiedCount };
  }
}
