import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  upvotes!: string[];

  @Prop({ type: [String], default: [] })
  downvotes!: string[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
