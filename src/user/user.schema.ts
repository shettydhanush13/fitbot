import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop()
  name?: string;

  @Prop()
  age?: number;

  @Prop()
  dob?: string; // ISO date string

  @Prop()
  height?: number;

  @Prop()
  weight?: number;

  @Prop()
  bmi?: number;

  @Prop()
  sex?: string;

  @Prop({ default: 0 })
  onboardingStep?: number;

  @Prop({ default: false })
  onboardingComplete?: boolean;

  @Prop({ type: Object, default: {} })
  extraInfo?: Record<string, any>;

  @Prop({ type: [String], default: [] })
  goals?: string[]; // from onboarding step 6 (split by commas)

  @Prop()
  dietPreference?: string; // from onboarding step 7

  @Prop()
  allergies?: string; // from onboarding step 8, can be string or you can use array if preferred

  @Prop()
  mealFrequency?: string; // from onboarding step 9

  @Prop()
  goalTimeline?: string;

  @Prop({ default: 0 })
  points?: number;

  @Prop({ type: Date })
  lastGoalCheckDate?: Date;

  @Prop({ default: 0 })
  weeklyGoalCompletionCount?: number;

  @Prop({ type: [Date] })
  activityLogDates?: Date[];

  @Prop({ default: 0 })
  currentStreak?: number;

  @Prop({ default: null })
  lastInteraction?: Date;

  @Prop({ default: 0 })
  goalProgress?: number;

  // To track if today's morning and evening tips were sent/read
  @Prop({ type: Date })
  lastMorningTipDate?: Date;

  @Prop({ type: Date })
  lastEveningTipDate?: Date;

  // To store the actual tip content (optional, for history/logging)
  @Prop({ type: Object, default: {} })
  tipHistory?: Record<string, { morning?: string; evening?: string }>;

  // Daily goal questions tracking
  @Prop({ type: Date })
  lastGoalQuestionsDate?: Date;

  @Prop({ default: false })
  goalQuestionsAnswered?: boolean;

  @Prop({ default: 0 })
  bonusPointsEarnedToday?: number; // e.g., +50 for answering goal Qs
}

export const UserSchema = SchemaFactory.createForClass(User);
