import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class RatingAspects {
  @Prop({ required: true, min: 1, max: 5 })
  quality!: number;

  @Prop({ required: true, min: 1, max: 5 })
  helpfulness!: number;

  @Prop({
    // Technical expertise
    required: true,
    min: 1,
    max: 5,
  })
  expertise!: number;

  @Prop({ required: true, min: 1, max: 5 })
  communication!: number;
}

const RatingAspectsSchema = SchemaFactory.createForClass(RatingAspects);

@Schema({ timestamps: true })
export class MentorRating extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  mentorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  learnerId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'MentorshipSession',
    required: true,
    unique: true,
  })
  sessionId!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number; // overall average rating

  @Prop()
  review?: string;

  @Prop({ type: RatingAspectsSchema, required: true })
  aspects!: RatingAspects;
}

export const MentorRatingSchema = SchemaFactory.createForClass(MentorRating);
