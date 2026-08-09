import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class CompanyProfile extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  companyName!: string;

  @Prop()
  industry?: string;

  @Prop()
  size?: string;

  @Prop()
  website?: string;

  @Prop()
  logoUrl?: string;
}

export const CompanyProfileSchema =
  SchemaFactory.createForClass(CompanyProfile);
