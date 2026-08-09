import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class PortfolioProject {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  technologies?: string[];

  @Prop()
  githubUrl?: string;

  @Prop()
  demoLink?: string;

  @Prop({ default: 0 })
  stars?: number;

  @Prop()
  language?: string;

  @Prop({ default: false })
  featured?: boolean;
}

@Schema({ _id: false })
export class PortfolioSocialLinks {
  @Prop() github?: string;
  @Prop() linkedin?: string;
  @Prop() twitter?: string;
  @Prop() website?: string;
  @Prop() email?: string;
  @Prop() phone?: string;
}

@Schema({ timestamps: true })
export class Portfolio extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  username!: string;

  @Prop({ default: 'Full Stack Developer Portfolio' })
  title!: string;

  @Prop({ default: 'developer' })
  template!: 'developer' | 'modern' | 'minimal';

  @Prop({ default: '' })
  bio!: string;

  @Prop({ default: '' })
  about!: string;

  @Prop({ default: false })
  isPublished!: boolean;

  @Prop({ type: PortfolioSocialLinks, default: {} })
  socialLinks!: PortfolioSocialLinks;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [PortfolioProject], default: [] })
  projects!: PortfolioProject[];

  @Prop({ type: [Object], default: [] })
  experience!: Array<{ company: string; role: string; startDate: string; endDate: string; description: string }>;

  @Prop({ type: [Object], default: [] })
  education!: Array<{ school: string; degree: string; fieldOfStudy: string; graduateDate: string }>;

  @Prop({ type: [Object], default: [] })
  customSections!: Array<{ id: string; title: string; items: string[] }>;
}

export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);
