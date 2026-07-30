import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class LearningResource extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  url!: string;

  @Prop({
    required: true,
    enum: ['course', 'article', 'documentation', 'video', 'book', 'tutorial'],
  })
  type!: 'course' | 'article' | 'documentation' | 'video' | 'book' | 'tutorial';

  @Prop({ required: true })
  category!: string; // Programming language, Technical domain, etc.

  @Prop({ required: true, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' })
  difficulty!: 'beginner' | 'intermediate' | 'advanced';

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  upvotes!: string[];

  @Prop({ type: [String], default: [] })
  downvotes!: string[];

  @Prop({ default: 0, index: true })
  score!: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const LearningResourceSchema = SchemaFactory.createForClass(LearningResource);
