import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class QuizAnswerItem {
  @Prop({ required: true })
  question!: string;

  @Prop()
  userAnswer?: string;

  @Prop({ default: false })
  correct!: boolean;

  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty!: 'easy' | 'medium' | 'hard';

  @Prop()
  timeTaken?: number; // in seconds
}

const QuizAnswerItemSchema = SchemaFactory.createForClass(QuizAnswerItem);

@Schema({ timestamps: true })
export class QuizSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  moduleId!: string;

  @Prop({ enum: ['in_progress', 'completed'], default: 'in_progress' })
  status!: 'in_progress' | 'completed';

  @Prop()
  score?: number;

  @Prop()
  passed?: boolean;

  @Prop({ type: [QuizAnswerItemSchema], default: [] })
  answers!: QuizAnswerItem[];

  @Prop()
  completedAt?: Date;
}

export const QuizSessionSchema = SchemaFactory.createForClass(QuizSession);
