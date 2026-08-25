import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationStatus = 'RESERVED' | 'FINALIZED' | 'RELEASED' | 'FAILED';

@Schema({ timestamps: true })
export class AiReservation extends Document {
  @Prop({ type: String, required: true, unique: true, index: true })
  reservationId!: string;

  @Prop({ type: String, required: true, index: true })
  requestId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  featureKey!: string;

  @Prop({ type: Number, required: true, default: 0 })
  reservedCredits!: number;

  @Prop({ type: Date, default: Date.now })
  reservedAt!: Date;

  @Prop({
    type: String,
    enum: ['RESERVED', 'FINALIZED', 'RELEASED', 'FAILED'],
    default: 'RESERVED',
    index: true,
  })
  status!: ReservationStatus;
}

export const AiReservationSchema = SchemaFactory.createForClass(AiReservation);
