import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class CodeDraft extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, default: null, index: true })
  challengeId!: string | null;

  @Prop({ required: true })
  language!: string; // 'javascript', 'typescript', 'python'

  @Prop({ required: true, default: '' })
  code!: string;

  @Prop({ type: String, default: null })
  title!: string | null; // Null for challenges, populated for custom scratchpads
}

export const CodeDraftSchema = SchemaFactory.createForClass(CodeDraft);
// Compound unique index for user-challenge pair (only applies when challengeId is not null)
CodeDraftSchema.index(
  { userId: 1, challengeId: 1 },
  { unique: true, partialFilterExpression: { challengeId: { $type: 'string' } } },
);
