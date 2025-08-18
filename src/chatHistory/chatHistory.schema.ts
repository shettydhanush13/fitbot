import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({ required: true })
  phone: string; // links to user by phone

  @Prop({ required: true })
  userMessage: string; // user query

  @Prop()
  botResponse: string; // AI response

  @Prop({ type: [String], default: [] })
  userKeywords: string[]; // top keywords from user message

  @Prop({ type: [String], default: [] })
  botKeywords: string[]; // top keywords from bot response

  @Prop({ default: () => new Date() })
  createdAt: Date; // explicit creation date
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
