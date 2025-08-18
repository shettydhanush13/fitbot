import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { ChatHistoryService } from '../chatHistory/chatHistory.service';
import { User, UserSchema } from './user.schema';
import { UserBehaviour, UserBehaviourSchema } from './userBehaviour.schema';
import { ChatHistory, ChatHistorySchema } from '../chatHistory/chatHistory.schema';
import { UserActivityLog, UserActivityLogSchema } from './userActivityLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: UserBehaviour.name, schema: UserBehaviourSchema }]),
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
    MongooseModule.forFeature([{ name: UserActivityLog.name, schema: UserActivityLogSchema }]),
  ],
  providers: [UserService, ChatHistoryService],
  exports: [UserService],
})
export class UserModule {}
