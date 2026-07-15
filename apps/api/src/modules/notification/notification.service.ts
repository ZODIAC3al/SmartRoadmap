import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../../schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async create(
    recipientId: string,
    titleEn: string,
    titleAr: string,
    contentEn: string,
    contentAr: string,
    type: 'general' | 'roadmap_update' | 'job_match' | 'message' = 'general',
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
    return created.save();
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
