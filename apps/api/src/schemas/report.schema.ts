import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true, enum: ['post', 'comment', 'resource', 'mentor_profile'] })
  contentType!: 'post' | 'comment' | 'resource' | 'mentor_profile';

  @Prop({ required: true, index: true })
  contentId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy!: Types.ObjectId;

  @Prop({ required: true })
  reason!: string;

  @Prop({ default: 'pending', enum: ['pending', 'resolved', 'dismissed'] })
  status!: 'pending' | 'resolved' | 'dismissed';

  @Prop()
  resolution?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
