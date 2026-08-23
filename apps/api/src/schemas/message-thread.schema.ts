import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ThreadContext = 'hiring' | 'support';

@Schema({ timestamps: true })
export class MessageThread extends Document {
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    required: true,
    validate: [(val: Types.ObjectId[]) => val.length === 2, 'Threads require exactly 2 participants'],
  })
  participantIds!: Types.ObjectId[];

  @Prop({ required: true, index: true })
  participantsKey!: string;

  @Prop({
    type: String,
    enum: ['hiring', 'support'],
    default: 'hiring',
    index: true,
  })
  context!: ThreadContext;

  @Prop({ type: Types.ObjectId, ref: 'Job' })
  relatedJobId?: Types.ObjectId;

  @Prop({ default: () => new Date(), index: true })
  lastMessageAt!: Date;

  @Prop({ default: '' })
  lastMessagePreview!: string;

  @Prop({ type: Object, default: {} })
  unreadCount!: Record<string, number>;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  archivedBy?: Types.ObjectId[];
}

export const MessageThreadSchema = SchemaFactory.createForClass(MessageThread);

// Production Unique Compound Index to prevent concurrent thread creation race conditions
// participantIds is a multikey index so we can't make it unique directly.
// Instead, we make participantsKey (which is the sorted and joined IDs) unique per context.
MessageThreadSchema.index({ participantIds: 1, context: 1 });
MessageThreadSchema.index({ participantsKey: 1, context: 1 }, { unique: true });
MessageThreadSchema.index({ participantIds: 1, lastMessageAt: -1 });
