import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { ChatHistory, ChatHistoryDocument } from '../chatHistory/chatHistory.schema';
import { UserBehaviour, UserBehaviourDocument } from './userBehaviour.schema';
import { UserActivityLog, UserActivityLogDocument } from './userActivityLog.schema';
import { ChatHistoryService } from 'src/chatHistory/chatHistory.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ChatHistory.name) private readonly chatHistoryModel: Model<ChatHistoryDocument>,
    @InjectModel(UserBehaviour.name) private readonly userBehaviourModel: Model<UserBehaviourDocument>,
    @InjectModel(UserActivityLog.name) private readonly userActivityLogModel: Model<UserActivityLogDocument>,
    private readonly chatHistoryService: ChatHistoryService,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.userModel.findOne({ phone }).lean().exec(); // use lean() for read-only perf
  }

  async createOrUpdate(phone: string, data: Partial<User>): Promise<User> {
    return this.userModel
      .findOneAndUpdate({ phone }, { $set: data } as UpdateQuery<User>, { upsert: true, new: true })
      .exec();
  }

  async getUserBehaviour(phone: string): Promise<UserBehaviour | null> {
    return this.userBehaviourModel.findOne({ phone }).lean().exec();
  }

  async getUserLogs(phone: string): Promise<UserActivityLog | null> {
    return this.userActivityLogModel.findOne({ phone }).lean().exec();
  }

  async createOrUpdateDailyLog(
    phone: string,
    time: 'morning' | 'evening',
    logData: Record<string, any>,
  ): Promise<UserActivityLog> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const update: UpdateQuery<UserActivityLog> =
      time === 'morning' ? { $set: { morningLog: logData } } : { $set: { eveningLog: logData } };

    return this.userActivityLogModel
      .findOneAndUpdate({ phone, date: today }, update, { upsert: true, new: true })
      .exec();
  }

  /**
   * Aggregate chat history -> update UserBehaviour collection.
   * Optimized to run in batch (parallel) instead of sequential loop.
   */
  async aggregateUserBehaviour(limit = 20): Promise<void> {
    const phones = await this.chatHistoryModel.distinct('phone');

    await Promise.all(
      phones.map(async (phone) => {
        try {
          const [topAgg, coAgg] = await Promise.all([
            this.chatHistoryService.getTopKeywordsPerUser(phone, limit),
            this.chatHistoryService.getTopKeywordsCooccurrence(phone, limit),
          ]);

          const topKeywords = topAgg.map((k) => k._id);
          const coMap: Record<string, Record<string, number>> = {};

          coAgg.forEach((item) => {
            coMap[item._id] = {};
            item.co_occurrence_counts.forEach((c) => {
              coMap[item._id][c.keyword] = c.count;
            });
          });

          await this.userBehaviourModel.updateOne(
            { phone },
            { $set: { topKeywords, cooccurrence: coMap } },
            { upsert: true },
          );
        } catch (err) {
          this.logger.error(`Failed to aggregate behaviour for phone: ${phone}`, err.stack);
        }
      }),
    );
  }
}
