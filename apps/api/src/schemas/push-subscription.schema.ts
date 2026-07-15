import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class PushSubscriptionKeys {
  @Prop({ required: true })
  p256dh!: string;

  @Prop({ required: true })
  auth!: string;
}

@Schema({ timestamps: true })
export class PushSubscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  endpoint!: string;

  @Prop({ type: PushSubscriptionKeys, required: true })
  keys!: PushSubscriptionKeys;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);
