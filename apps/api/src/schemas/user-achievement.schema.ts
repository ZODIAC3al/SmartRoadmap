import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class UserAchievement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  achievementKey!: string;

  @Prop({ required: true, default: Date.now })
  unlockedAt!: Date;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);
UserAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });
