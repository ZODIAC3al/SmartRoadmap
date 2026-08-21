import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';

@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug!: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  coverImageUrl?: string;

  @Prop()
  website?: string;

  @Prop()
  industry?: string;

  @Prop({
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
    default: '1-10',
  })
  size?: CompanySize;

  @Prop()
  about?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  memberIds?: Types.ObjectId[];

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: false })
  isFeaturedInDirectory!: boolean;

  @Prop()
  stripeCustomerId?: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
