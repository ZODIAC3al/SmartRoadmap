import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  paypalOrderId!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ enum: ['created', 'completed', 'failed'], default: 'created' })
  status!: 'created' | 'completed' | 'failed';

  @Prop({ required: true, enum: ['pro_learner', 'company_tier'] })
  plan!: 'pro_learner' | 'company_tier';
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
