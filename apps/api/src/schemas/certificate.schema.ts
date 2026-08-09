import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Certificate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  organization?: string;

  /** ISO date string (YYYY-MM-DD). */
  @Prop()
  issueDate?: string;

  @Prop()
  expirationDate?: string;

  @Prop()
  credentialId?: string;

  @Prop()
  credentialUrl?: string;

  /** Public URL of the uploaded file (Cloudinary or base64 data URL). */
  @Prop({ required: true })
  fileUrl!: string;

  @Prop()
  fileName?: string;

  /** MIME type of the uploaded file. */
  @Prop()
  fileType?: string;

  /** Cloudinary public id — used to delete the asset on removal. */
  @Prop()
  publicId?: string;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
