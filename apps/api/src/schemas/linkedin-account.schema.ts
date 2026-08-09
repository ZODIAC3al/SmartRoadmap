import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** A single experience entry imported from a LinkedIn profile. */
@Schema({ _id: false })
export class LinkedInExperience {
  @Prop() title?: string;
  @Prop() company?: string;
  @Prop() startDate?: string;
  @Prop() endDate?: string;
  @Prop() description?: string;
}

/** A single education entry imported from a LinkedIn profile. */
@Schema({ _id: false })
export class LinkedInEducation {
  @Prop() school?: string;
  @Prop() degree?: string;
  @Prop() fieldOfStudy?: string;
  @Prop() startDate?: string;
  @Prop() endDate?: string;
}

/** A single certification entry imported from a LinkedIn profile. */
@Schema({ _id: false })
export class LinkedInCertification {
  @Prop() name?: string;
  @Prop() authority?: string;
  @Prop() issueDate?: string;
  @Prop() expirationDate?: string;
  @Prop() credentialId?: string;
  @Prop() credentialUrl?: string;
}

/**
 * Full LinkedIn profile data. Because LinkedIn's OpenID API only exposes
 * name/email/picture, this is normally populated through the *alternative*
 * import flow (manual entry or an uploaded LinkedIn PDF).
 */
@Schema({ _id: false })
export class LinkedInProfile {
  @Prop() fullName?: string;
  @Prop() headline?: string;
  @Prop() about?: string;
  @Prop({ type: [LinkedInExperience], default: [] })
  experience?: LinkedInExperience[];
  @Prop({ type: [LinkedInEducation], default: [] })
  education?: LinkedInEducation[];
  @Prop({ type: [String], default: [] })
  skills?: string[];
  @Prop({ type: [LinkedInCertification], default: [] })
  certifications?: LinkedInCertification[];
  @Prop({ type: [String], default: [] })
  languages?: string[];
  /** How the profile data was obtained: oauth (basic only), manual, or pdf. */
  @Prop({ enum: ['oauth', 'manual', 'pdf'] })
  importMethod?: 'oauth' | 'manual' | 'pdf';
}

/**
 * Persisted LinkedIn connection for a user.
 * `accessToken` is encrypted at rest and `select: false`.
 */
@Schema({ timestamps: true })
export class LinkedInAccount extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  linkedinId!: string;

  /** Encrypted OAuth access token (never returned to clients). Absent for manual/PDF imports. */
  @Prop({ select: false })
  accessToken?: string;

  @Prop({ type: Date })
  tokenExpiresAt?: Date;

  @Prop({ type: Date })
  connectedAt?: Date;

  // Basic OpenID profile — the only data LinkedIn's API reliably exposes.
  @Prop()
  fullName?: string;

  @Prop()
  email?: string;

  @Prop()
  picture?: string;

  /** Full profile imported through the alternative (manual / PDF) flow. */
  @Prop({ type: LinkedInProfile })
  profile?: LinkedInProfile;

  @Prop({ enum: ['oauth', 'manual', 'pdf'] })
  importMethod?: 'oauth' | 'manual' | 'pdf';

  /** Raw text extracted from an uploaded LinkedIn PDF (for manual review). */
  @Prop()
  rawPdfText?: string;
}

export const LinkedInAccountSchema =
  SchemaFactory.createForClass(LinkedInAccount);
