import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../../schemas/message.schema';
import { User } from '../../schemas/user.schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async send(senderId: string, recipientId: string, content: string): Promise<Message> {
    const [sender, recipient] = await Promise.all([
      this.userModel.findById(senderId).exec(),
      this.userModel.findById(recipientId).exec(),
    ]);

    if (!sender || !recipient) {
      throw new NotFoundException('Sender or Recipient user not found');
    }

    const msg = new this.messageModel({
      sender: new Types.ObjectId(senderId),
      recipient: new Types.ObjectId(recipientId),
      content,
    });
    const saved = await msg.save();

    // Trigger Notification for the recipient
    await this.notificationService.create(
      recipientId,
      `New message from ${sender.name}`,
      `رسالة جديدة من ${sender.name}`,
      content.length > 65 ? `${content.substring(0, 62)}...` : content,
      content.length > 65 ? `${content.substring(0, 62)}...` : content,
      'message',
      '/messages',
    );

    return saved;
  }

  async getConversations(userId: string): Promise<any[]> {
    const id = new Types.ObjectId(userId);
    return this.messageModel.aggregate([
      {
        $match: {
          $or: [{ sender: id }, { recipient: id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', id] },
              '$recipient',
              '$sender',
            ],
          },
          lastMessage: { $first: '$content' },
          lastMessageSender: { $first: '$sender' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', id] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          partnerId: '$_id',
          partnerName: '$user.name',
          partnerEmail: '$user.email',
          partnerAvatar: '$user.avatarUrl',
          partnerRole: '$user.role',
          lastMessage: 1,
          lastMessageSender: 1,
          lastMessageTime: 1,
          unreadCount: 1,
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);
  }

  async getThread(userId: string, partnerId: string): Promise<Message[]> {
    const uId = new Types.ObjectId(userId);
    const pId = new Types.ObjectId(partnerId);

    // Mark incoming messages as read
    await this.messageModel.updateMany(
      { sender: pId, recipient: uId, read: false },
      { $set: { read: true } },
    );

    return this.messageModel
      .find({
        $or: [
          { sender: uId, recipient: pId },
          { sender: pId, recipient: uId },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();
  }
}
