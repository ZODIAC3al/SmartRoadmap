import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessageThread, ThreadContext } from '../../schemas/message-thread.schema';
import { Message } from '../../schemas/message.schema';
import { User } from '../../schemas/user.schema';
import { Subscription, PlanTier } from '../../schemas/subscription.schema';
import { PLAN_CONFIG } from '../billing/plan.config';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateThreadDto, SendMessageDto } from './messaging.dto';

export { CreateThreadDto, SendMessageDto };

@Injectable()
export class MessagingService implements OnModuleInit {
  constructor(
    @InjectModel(MessageThread.name)
    private readonly threadModel: Model<MessageThread>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    // Automatically drop outdated MongoDB indexes and rebuild with partialFilterExpression
    await this.messageModel.syncIndexes().catch(() => {});
  }

  private sortParticipants(id1: string | Types.ObjectId, id2: string | Types.ObjectId): Types.ObjectId[] {
    if (!id1 || !id2) {
      throw new BadRequestException('Both participant IDs are required');
    }
    const obj1 = typeof id1 === 'string' ? new Types.ObjectId(id1) : id1;
    const obj2 = typeof id2 === 'string' ? new Types.ObjectId(id2) : id2;
    return [obj1, obj2].sort((a, b) => a.toString().localeCompare(b.toString()));
  }

  /**
   * Production Concurrency Pattern: Atomic findOneAndUpdate with upsert
   * Prevents race conditions when two users initiate thread creation simultaneously.
   */
  async getOrCreateThread(currentUserId: string, dto: CreateThreadDto): Promise<MessageThread> {
    if (!dto?.otherUserId || typeof dto.otherUserId !== 'string' || !dto.otherUserId.trim()) {
      throw new BadRequestException('otherUserId is required');
    }
    if (!Types.ObjectId.isValid(dto.otherUserId)) {
      throw new BadRequestException('otherUserId must be a valid ObjectId');
    }
    if (currentUserId === dto.otherUserId) {
      throw new BadRequestException('Cannot create a thread with yourself');
    }

    const participants = this.sortParticipants(currentUserId, dto.otherUserId);
    const context = dto.context || 'hiring';

    const initialUnread: Record<string, number> = {};
    initialUnread[participants[0].toString()] = 0;
    initialUnread[participants[1].toString()] = 0;

    const participantsKey = `${participants[0].toString()}_${participants[1].toString()}`;

    let thread: MessageThread | null = null;

    try {
      thread = await this.threadModel.findOneAndUpdate(
        { participantsKey, context },
        {
          $setOnInsert: {
            participantIds: participants,
            participantsKey,
            context,
            relatedJobId: dto.relatedJobId ? new Types.ObjectId(dto.relatedJobId) : undefined,
            lastMessageAt: new Date(),
            lastMessagePreview: dto.initialMessage ? dto.initialMessage.substring(0, 80) : '',
            unreadCount: initialUnread,
            createdAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    } catch (err: any) {
      if (err.code === 11000) {
        // Fallback re-fetch if duplicate key race occurred under heavy concurrency
        thread = await this.threadModel.findOne({ participantsKey, context });
      } else {
        throw err;
      }
    }

    if (!thread) {
      throw new BadRequestException('Failed to create or find message thread');
    }

    if (dto.initialMessage) {
      await this.sendMessage(currentUserId, {
        threadId: (thread._id as Types.ObjectId).toString(),
        body: dto.initialMessage,
      });
    }

    return thread;
  }

  async getUserThreads(userId: string): Promise<any[]> {
    const userObjId = new Types.ObjectId(userId);
    const threads = await this.threadModel
      .find({
        participantIds: userObjId,
        archivedBy: { $ne: userObjId },
      })
      .sort({ lastMessageAt: -1 })
      .populate('participantIds', 'name email role companyId')
      .exec();

    return threads.map((t) => {
      const otherParticipant = t.participantIds.find(
        (p: any) => p._id.toString() !== userId,
      );
      const unread = t.unreadCount?.[userId] || 0;
      return {
        id: t._id,
        context: t.context,
        lastMessageAt: t.lastMessageAt,
        lastMessagePreview: t.lastMessagePreview,
        unreadCount: unread,
        otherParticipant,
      };
    });
  }

  /**
   * Production Cursor Pagination Pattern (before=<messageId>)
   */
  async getThreadMessages(
    threadId: string,
    userId: string,
    limit = 30,
    before?: string,
  ): Promise<Message[]> {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    const isParticipant = thread.participantIds.some((p) => p.toString() === userId);
    if (!isParticipant) throw new ForbiddenException('Not a participant in this thread');

    const query: any = { threadId: new Types.ObjectId(threadId) };
    if (before && Types.ObjectId.isValid(before)) {
      query._id = { $lt: new Types.ObjectId(before) };
    }

    return this.messageModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .exec()
      .then((msgs) => msgs.reverse());
  }

  /**
   * Production Patterns: Idempotency clientNonce + Atomic Quota Increment
   */
  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const thread = await this.threadModel.findById(dto.threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    const senderObjId = new Types.ObjectId(senderId);
    const isParticipant = thread.participantIds.some((p) => p.equals(senderObjId));
    if (!isParticipant) throw new ForbiddenException('Not a participant in this thread');

    const senderUser = await this.userModel.findById(senderId);
    if (!senderUser) throw new NotFoundException('Sender user not found');

    // Production Atomic Quota Enforcement for Company Senders
    if (senderUser.role === 'company' && senderUser.companyId) {
      const subscription = await this.subscriptionModel.findOne({
        companyId: senderUser.companyId,
      });
      const tier: PlanTier = (subscription?.plan as PlanTier) || 'scale';
      const maxAllowed = PLAN_CONFIG[tier].messagesIncluded;

      if (maxAllowed !== -1) {
        // Single atomic operation: checking condition and incrementing in the same step
        const quotaResult = await this.subscriptionModel.updateOne(
          {
            companyId: senderUser.companyId,
            'usage.messagesSentThisPeriod': { $lt: maxAllowed },
          },
          { $inc: { 'usage.messagesSentThisPeriod': 1 } },
        );

        if (quotaResult.modifiedCount === 0) {
          throw new ForbiddenException(
            `Monthly message quota (${maxAllowed}) exhausted for ${tier.toUpperCase()} plan. Please upgrade to access.`,
          );
        }
      }
    }

    let message: Message;

    try {
      // Create Message Document with optional clientNonce idempotency key
      const createPayload: any = {
        threadId: thread._id,
        senderId: senderObjId,
        body: dto.body,
        attachmentUrl: dto.attachmentUrl,
        attachmentName: dto.attachmentName,
        attachmentType: dto.attachmentType,
        attachmentSize: dto.attachmentSize,
        deliveredVia: 'socket',
      };
      if (dto.clientNonce) {
        createPayload.clientNonce = dto.clientNonce;
      }
      message = await this.messageModel.create(createPayload);
    } catch (err: any) {
      if (err.code === 11000 && dto.clientNonce) {
        // Idempotency match: Return existing message instead of duplicating or erroring
        const existing = await this.messageModel.findOne({
          threadId: thread._id,
          clientNonce: dto.clientNonce,
        });
        if (existing) return existing;
      }
      throw err;
    }

    const recipientObjId = thread.participantIds.find((p) => !p.equals(senderObjId));
    const recipientId = recipientObjId?.toString();

    // Production Atomic Unread Increment & Last Message Preview Update
    if (recipientId) {
      const unreadKey = `unreadCount.${recipientId}`;
      await this.threadModel.updateOne(
        { _id: thread._id },
        {
          $set: {
            lastMessageAt: new Date(),
            lastMessagePreview: dto.body.substring(0, 80),
          },
          $inc: { [unreadKey]: 1 },
        },
      );

      // Push live WebSocket event
      this.eventsGateway.sendToUser(recipientId, 'message:new', {
        threadId: thread._id,
        message,
      });

      // Dispatch Notification to Recipient
      await this.notificationsService.create({
        userId: recipientId,
        type: 'message',
        title: `New message from ${senderUser.name || 'User'}`,
        body: dto.body.substring(0, 80),
        linkTo:
          recipientId === senderId
            ? '/dashboard/messages'
            : senderUser.role === 'learner'
            ? '/company/messages'
            : '/dashboard/messages',
        meta: { threadId: thread._id, senderId },
      });
    }

    return message;
  }

  /**
   * Production Pattern: Hard reset unread counter to 0 on mark read
   */
  async markThreadRead(threadId: string, userId: string): Promise<{ success: boolean }> {
    const unreadKey = `unreadCount.${userId}`;
    await this.threadModel.updateOne(
      { _id: new Types.ObjectId(threadId) },
      { $set: { [unreadKey]: 0 } },
    );

    await this.messageModel.updateMany(
      {
        threadId: new Types.ObjectId(threadId),
        senderId: { $ne: new Types.ObjectId(userId) },
        readAt: { $exists: false },
      },
      { $set: { readAt: new Date(), read: true } },
    );

    return { success: true };
  }
  /**
   * Search platform users to start or open a conversation with.
   * Excludes the caller. Supports fuzzy name/email search and role filter.
   * Learners are NOT permitted to discover other users — returns [] immediately.
   */
  async searchMessagingUsers(
    currentUserId: string,
    q: string,
    role?: string,
  ): Promise<any[]> {
    // Enforce learner discovery restriction
    const caller = await this.userModel.findById(currentUserId).select('role').lean();
    if (!caller || caller.role === 'learner') {
      return [];
    }

    const filter: any = {
      _id: { $ne: new Types.ObjectId(currentUserId) },
    };

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
      ];
    }

    if (role && ['learner', 'company', 'admin'].includes(role)) {
      filter.role = role;
    }

    const users = await this.userModel
      .find(filter)
      .select('_id name email role avatarUrl')
      .limit(20)
      .lean();

    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: (u as any).avatarUrl,
    }));
  }
}
