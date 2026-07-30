import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DiscussionSpace extends Document {
  @Prop({ required: true, unique: true, index: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ default: 'General' })
  category!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
}

export const DiscussionSpaceSchema = SchemaFactory.createForClass(DiscussionSpace);
