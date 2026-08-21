import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SavedSearch extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: {
      skills: { type: [String], default: [] },
      minMatchScore: { type: Number, default: 0 },
      verifiedOnly: { type: Boolean, default: false },
      track: { type: String },
    },
    default: { skills: [], minMatchScore: 0, verifiedOnly: false },
  })
  filters!: {
    skills: string[];
    minMatchScore: number;
    verifiedOnly: boolean;
    track?: string;
  };

  @Prop({ default: false })
  alertsEnabled!: boolean;

  @Prop()
  lastRunAt?: Date;

  @Prop({ default: 0 })
  lastResultCount!: number;
}

export const SavedSearchSchema = SchemaFactory.createForClass(SavedSearch);
SavedSearchSchema.index({ companyId: 1, createdBy: 1 });
