import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Job extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  company!: string;

  @Prop({ required: true })
  location!: string;

  @Prop({ required: true })
  country!: string;

  @Prop({ type: [String], default: [] })
  requiredSkills!: string[];

  @Prop()
  salaryMin?: number;

  @Prop()
  salaryMax?: number;

  @Prop({ default: true })
  remote!: boolean;

  @Prop()
  description?: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
