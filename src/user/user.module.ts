import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { ChatHistoryService } from '../chatHistory/chatHistory.service';
import { User, UserSchema } from './user.schema';
import { UserBehaviour, UserBehaviourSchema } from './userBehaviour.schema';
import { ChatHistory, ChatHistorySchema } from '../chatHistory/chatHistory.schema';
import { UserActivityLog, UserActivityLogSchema } from './userActivityLog.schema';
import { UserController } from './user.controller';
import { OpenAIService } from 'src/openAI/openAI.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserBehaviour.name, schema: UserBehaviourSchema },
      { name: ChatHistory.name, schema: ChatHistorySchema },
      { name: UserActivityLog.name, schema: UserActivityLogSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, ChatHistoryService, OpenAIService],
  exports: [UserService],
})
export class UserModule {}
