import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sender!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipient!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: false })
  read!: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
