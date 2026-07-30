import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class CheatSheet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  moduleId!: string;

  @Prop({ required: true })
  content!: string; // Markdown content (current version)

  @Prop({ required: true, enum: ['gemini', 'groq', 'openai', 'mock'], default: 'mock' })
  generatedByProvider!: 'gemini' | 'groq' | 'openai' | 'mock';

  @Prop({ default: 0 })
  regeneratedCount!: number;

  /** History of all previous versions — most recent first */
  @Prop({
    type: [
      {
        content: String,
        generatedByProvider: String,
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  versions!: Array<{ content: string; generatedByProvider: string; generatedAt: Date }>;
}

export const CheatSheetSchema = SchemaFactory.createForClass(CheatSheet);
CheatSheetSchema.index({ userId: 1, moduleId: 1 }, { unique: true });
