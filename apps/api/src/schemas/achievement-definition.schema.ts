import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AchievementDefinition extends Document {
  @Prop({ required: true, unique: true, index: true })
  key!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  icon!: string;

  @Prop({ required: true, enum: ['bronze', 'silver', 'gold'], default: 'bronze' })
  tier!: 'bronze' | 'silver' | 'gold';
}

export const AchievementDefinitionSchema = SchemaFactory.createForClass(AchievementDefinition);
