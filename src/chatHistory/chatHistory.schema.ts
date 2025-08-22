import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ collection: 'ChatHistory', timestamps: true })
export class ChatHistory {
  @Prop({ index: true, required: true })
  phone: string; // links to user by phone

  @Prop({ required: true })
  userMessage: string; // user query

  @Prop()
  botResponse: string; // AI response

  @Prop({ type: [String], default: [] })
  userKeywords: string[]; // top keywords from user message

  @Prop({ type: [String], default: [] })
  botKeywords: string[]; // top keywords from bot response

  @Prop({ index: true, default: () => new Date() })
  createdAt: Date; // explicit creation date

  // embedding for semantic search (float32[] in Atlas)
  @Prop({ type: [Number], default: [] })
  embedding: number[];
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
