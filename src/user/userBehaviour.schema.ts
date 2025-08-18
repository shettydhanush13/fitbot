import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserBehaviourDocument = UserBehaviour & Document;

@Schema({ timestamps: true })
export class UserBehaviour {
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ type: [String], default: [] })
  topKeywords: string[];

  @Prop({ type: Object, default: {} })
  cooccurrence: Record<string, Record<string, number>>;

  // optional extras
  @Prop({ type: Number, default: 0 })
  totalMessages?: number;

  @Prop({ type: Date })
  lastInteraction?: Date;
}

export const UserBehaviourSchema = SchemaFactory.createForClass(UserBehaviour);
