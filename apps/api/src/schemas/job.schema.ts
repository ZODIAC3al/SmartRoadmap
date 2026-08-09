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

  // ── Richer fields added for filtering & display ──────────────────────────────

  /** full-time | part-time | contract | freelance | internship */
  @Prop({ default: 'full-time' })
  jobType?: string;

  /** remote | hybrid | onsite */
  @Prop({ default: 'remote' })
  workType?: string;

  /** entry | mid | senior | lead */
  @Prop({ default: 'mid' })
  experienceLevel?: string;

  /** Additional technology tags beyond requiredSkills */
  @Prop({ type: [String], default: [] })
  technologies?: string[];

  /** External application URL — if set, Apply redirects to this URL */
  @Prop()
  externalUrl?: string;

  /** Date the job was posted (for "Newest" sort) */
  @Prop({ default: () => new Date() })
  postedAt?: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

