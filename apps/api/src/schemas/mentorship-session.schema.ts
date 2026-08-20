import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MentorshipSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  mentorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  learnerId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  })
  status!: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

  @Prop({ required: true })
  scheduledAt!: Date;

  @Prop()
  notes?: string;

  @Prop()
  feedback?: string; // Feedback & recommendations from the mentor
}

export const MentorshipSessionSchema =
  SchemaFactory.createForClass(MentorshipSession);
