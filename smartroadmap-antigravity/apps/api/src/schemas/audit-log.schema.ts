import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  action!: string; // e.g. "auth.login", "admin.role_change"

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  @Prop({ required: true, enum: ['info', 'warning', 'critical'], default: 'info' })
  severity!: 'info' | 'warning' | 'critical';

  @Prop()
  details?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
