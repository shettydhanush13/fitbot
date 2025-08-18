import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { ChatHistory, ChatHistoryDocument } from '../chatHistory/chatHistory.schema';
import { UserBehaviour, UserBehaviourDocument } from './userBehaviour.schema';
import { UserActivityLog, UserActivityLogDocument } from './userActivityLog.schema';
import { ChatHistoryService } from 'src/chatHistory/chatHistory.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
    @InjectModel(UserBehaviour.name) private userBehaviourModel: Model<UserBehaviourDocument>,
    @InjectModel(UserActivityLog.name) private userActivityLogModel: Model<UserActivityLogDocument>,
    private chatHistoryService: ChatHistoryService
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async createOrUpdate(phone: string, data: Partial<User>): Promise<User> {
    return this.userModel
      .findOneAndUpdate({ phone }, data, { upsert: true, new: true })
      .exec();
  }

  async getUserBehaviour(phone: string): Promise<UserBehaviour> {
    return this.userBehaviourModel.findOne({ phone }).exec();
  }

  async getUserLogs(phone: string): Promise<UserActivityLog> {
    return this.userActivityLogModel.findOne({ phone }).exec();
  }

  async createOrUpdateDailyLog(
    phone: string,
    time: 'morning' | 'evening',
    logData: Record<string, any>
  ): Promise<UserActivityLog> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to start of day
  
    const update: Partial<UserActivityLog> =
      time === 'morning' ? { morningLog: logData } : { eveningLog: logData };
  
    return this.userActivityLogModel
      .findOneAndUpdate(
        { phone, date: today },
        update,
        { upsert: true, new: true } // create if doesn't exist, return updated doc
      )
      .exec();
  }  

  async aggregateUserBehaviour() {
    const phones = await this.chatHistoryModel.distinct('phone');
  
    for (const phone of phones) {
      const topAgg  = await this.chatHistoryService.getTopKeywordsPerUser(phone, 20);
      const coAgg   = await this.chatHistoryService.getTopKeywordsCooccurrence(phone, 20);
  
      const topKeywords = topAgg.map(k => k._id);
      const coMap: Record<string, Record<string,number>> = {};
  
      // flatten cooccurrence for storage
      coAgg.forEach(item => {
        coMap[item._id] = {};
        item.co_occurrence_counts.forEach(c => {
          coMap[item._id][c.keyword] = c.count
        });
      });
  
      await this.userBehaviourModel.findOneAndUpdate(
        { phone },
        {
          topKeywords,
          cooccurrence: coMap,
        },
        { upsert: true }
      );
    }
  }
}
