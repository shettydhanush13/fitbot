import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserActivityLogDocument = UserActivityLog & Document;

@Schema({ collection: 'UserActivityLog', timestamps: true })
export class UserActivityLog {
  @Prop({ required: true }) phone: string; // user identifier
  @Prop({ required: true }) date: Date;    // date of log

  @Prop({ type: Object }) morningLog?: {
    sleep_hours?: number;
    sleep_quality?: string;
    mood?: string;
    goal_readiness?: number;
  };

  @Prop({ type: Object }) eveningLog?: {
    water_glasses?: number;
    exercised?: boolean;
    exercise_type?: string;
    duration_minutes?: number;
    meals?: number;
    diet_followed?: boolean;
    mood?: string;
    goal_achieved?: boolean;
  };
}

export const UserActivityLogSchema = SchemaFactory.createForClass(UserActivityLog);
