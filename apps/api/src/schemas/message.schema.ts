import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeliveryMethod = 'socket' | 'poll';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'MessageThread', required: true, index: true })
  threadId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true, maxLength: 4000 })
  body!: string;

  @Prop()
  attachmentUrl?: string;

  @Prop()
  attachmentName?: string;

  @Prop()
  attachmentType?: string;

  @Prop()
  attachmentSize?: number;

  @Prop()
  readAt?: Date;

  @Prop({
    type: String,
    enum: ['socket', 'poll'],
    default: 'socket',
  })
  deliveredVia?: DeliveryMethod;

  @Prop({ sparse: true })
  clientNonce?: string;

  /** Legacy alias compatibility */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId;

  /** Legacy alias compatibility */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  recipient?: Types.ObjectId;

  /** Legacy alias compatibility */
  @Prop()
  content?: string;

  @Prop({ default: false })
  read!: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ threadId: 1, clientNonce: 1 }, { unique: true, sparse: true });
