import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: 'DiscussionSpace', required: true, index: true })
  spaceId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  upvotes!: string[];

  @Prop({ type: [String], default: [] })
  downvotes!: string[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: false })
  isArticle!: boolean;

  @Prop({ default: 0 })
  qualityScore!: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
