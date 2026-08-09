import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class AvailabilitySlot {
  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek!: number; // 0 = Sunday, 1 = Monday, etc.

  @Prop({ required: true })
  startTime!: string; // "HH:MM" e.g., "14:00"

  @Prop({ required: true })
  endTime!: string; // "HH:MM" e.g., "16:00"
}

const AvailabilitySlotSchema = SchemaFactory.createForClass(AvailabilitySlot);

@Schema({ timestamps: true })
export class MentorProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  expertise!: string[];

  @Prop({ required: true, default: 0 })
  experienceYears!: number;

  @Prop({ required: true })
  industry!: string;

  @Prop({ required: true })
  bio!: string;

  @Prop({ type: [String], default: [] })
  certifications!: string[];

  @Prop({ type: [AvailabilitySlotSchema], default: [] })
  availability!: AvailabilitySlot[];

  @Prop({ default: 5.0 })
  rating!: number;

  @Prop({ default: 0 })
  ratingCount!: number;
}

export const MentorProfileSchema = SchemaFactory.createForClass(MentorProfile);
