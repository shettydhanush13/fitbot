import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpenAIService } from '../openAI/openAI.service';
import { ChatHistory, ChatHistorySchema } from './chatHistory.schema';
import { ChatHistoryService } from './chatHistory.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
  ],
  providers: [ChatHistoryService, OpenAIService],
  exports: [ChatHistoryService],
})
export class ChatHistoryModule {}
