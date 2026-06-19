import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class CVPersonal {
  @Prop()
  name?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  summary?: string;
}

@Schema({ _id: false })
export class CVExperience {
  @Prop()
  company?: string;

  @Prop()
  role?: string;

  @Prop()
  startDate?: string;

  @Prop()
  endDate?: string;

  @Prop()
  description?: string;
}

@Schema({ _id: false })
export class CVEducation {
  @Prop()
  school?: string;

  @Prop()
  degree?: string;

  @Prop()
  fieldOfStudy?: string;

  @Prop()
  graduateDate?: string;
}

@Schema({ _id: false })
export class CVProject {
  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop()
  url?: string;
}

@Schema({ timestamps: true })
export class Cv extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: CVPersonal })
  personal?: CVPersonal;

  @Prop({ type: [CVExperience], default: [] })
  experience!: CVExperience[];

  @Prop({ type: [CVEducation], default: [] })
  education!: CVEducation[];

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [CVProject], default: [] })
  projects!: CVProject[];

  @Prop()
  fileUrl?: string;
}

export const CvSchema = SchemaFactory.createForClass(Cv);
