import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class ModuleItem {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' })
  difficulty!: 'beginner' | 'intermediate' | 'advanced';

  @Prop()
  estimatedHours?: number;

  @Prop({ type: [String], default: [] })
  topics!: string[];

  @Prop({ type: [String], default: [] })
  prerequisites!: string[];

  @Prop({
    enum: ['locked', 'in_progress', 'completed', 'failed'],
    default: 'locked',
  })
  status!: 'locked' | 'in_progress' | 'completed' | 'failed';

  @Prop({ default: 0 })
  requiredChallenges!: number;

  @Prop()
  positionX?: number;

  @Prop()
  positionY?: number;
}

const ModuleItemSchema = SchemaFactory.createForClass(ModuleItem);

@Schema({ _id: false })
export class Viewport {
  @Prop({ default: 0 })
  x!: number;

  @Prop({ default: 0 })
  y!: number;

  @Prop({ default: 1 })
  zoom!: number;
}

@Schema({ timestamps: true })
export class Roadmap extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  targetRole?: string;

  @Prop()
  totalEstimatedHours?: number;

  @Prop({ enum: ['active', 'archived'], default: 'active' })
  status!: 'active' | 'archived';

  @Prop({ type: [ModuleItemSchema], default: [] })
  modules!: ModuleItem[];

  @Prop({ type: Viewport, default: () => ({ x: 0, y: 0, zoom: 1 }) })
  viewport!: Viewport;

  @Prop({ enum: ['straight', 'curved'], default: 'curved' })
  edgeStyle!: 'straight' | 'curved';
}

export const RoadmapSchema = SchemaFactory.createForClass(Roadmap);
