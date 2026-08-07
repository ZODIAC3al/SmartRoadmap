import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Topic extends Document {
  @Prop({ required: true, index: true })
  trackId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Topic' }],
    default: [],
  })
  prerequisites!: Types.ObjectId[];

  @Prop({ enum: ['core', 'ai_generated'], default: 'core' })
  type!: 'core' | 'ai_generated';

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' })
  difficulty!: 'beginner' | 'intermediate' | 'advanced';

  @Prop({ type: Types.ObjectId, ref: 'Topic' })
  generatedFromTopic?: Types.ObjectId;

  @Prop()
  generatedReason?: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
