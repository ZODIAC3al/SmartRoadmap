import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false })
export class ChatMessageItem {
  @Prop({ required: true, enum: ['user', 'model', 'system'] })
  role!: 'user' | 'model' | 'system';

  @Prop({ required: true })
  content!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const ChatMessageItemSchema = SchemaFactory.createForClass(ChatMessageItem);

@Schema({ timestamps: true })
export class ChatSession extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [ChatMessageItemSchema], default: [] })
  messages!: ChatMessageItem[];
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
