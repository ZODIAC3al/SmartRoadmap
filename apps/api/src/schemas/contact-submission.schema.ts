import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ContactSubmission extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  email!: string;

  @Prop()
  phone?: string;

  @Prop()
  interest?: string;

  @Prop({ required: true })
  message!: string;
}

export const ContactSubmissionSchema = SchemaFactory.createForClass(ContactSubmission);
