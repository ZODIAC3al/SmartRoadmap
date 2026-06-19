import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class LearnerProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop()
  targetRole?: string;

  @Prop()
  currentRole?: string;

  @Prop()
  educationLevel?: string;

  @Prop({ default: 0 })
  experienceYears!: number;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ default: false })
  availableForHire!: boolean;
}

export const LearnerProfileSchema = SchemaFactory.createForClass(LearnerProfile);
