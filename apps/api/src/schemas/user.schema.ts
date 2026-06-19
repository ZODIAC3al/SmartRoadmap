import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 'learner', enum: ['learner', 'company', 'admin'] })
  role!: 'learner' | 'company' | 'admin';

  @Prop()
  avatarUrl?: string;

  @Prop()
  username?: string;

  @Prop()
  phone?: string;

  @Prop()
  bio?: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: 'en' })
  locale!: string;

  @Prop({ default: 'smartdark' })
  theme!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
