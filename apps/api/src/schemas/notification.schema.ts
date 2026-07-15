import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipient!: Types.ObjectId;

  @Prop({ required: true })
  titleEn!: string;

  @Prop({ required: true })
  titleAr!: string;

  @Prop({ required: true })
  contentEn!: string;

  @Prop({ required: true })
  contentAr!: string;

  @Prop({
    default: 'general',
    enum: ['general', 'roadmap_update', 'job_match', 'message'],
  })
  type!: 'general' | 'roadmap_update' | 'job_match' | 'message';

  @Prop({ default: false })
  read!: boolean;

  @Prop()
  link?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
