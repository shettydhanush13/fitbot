import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatHistory, ChatHistoryDocument } from './chatHistory.schema';

@Injectable()
export class ChatHistoryService {
  constructor(@InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>) {}

  /**
   * Create a new chat entry per request
   */
  async create(data: Partial<ChatHistory>): Promise<ChatHistory> {
    const entry = new this.chatHistoryModel({
      ...data,
      createdAt: new Date(),
    });
    return entry.save();
  }

  /**
   * Retrieve all chat entries for a given phone number
   */
    async findByPhone(phone: string): Promise<ChatHistory[]> {
        return this.chatHistoryModel.find({ phone }).sort({ createdAt: 1 }).exec();
    }

  /**
   * Top N keywords per user
   */
  async getTopKeywordsPerUser(phone: string, topN = 20) {
    const result = await this.chatHistoryModel.aggregate([
      { $match: { phone } },
      { $unwind: '$userKeywords' },
      { $group: { _id: '$userKeywords', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: topN }
    ]);
    return result; // [{ _id: 'keyword', count: 5 }, ...]
  }

  /**
   * Co-occurrence for top keywords of a user
   */
  async getTopKeywordsCooccurrence(phone: string, topN = 20) {
    const topKeywordsAgg = await this.getTopKeywordsPerUser(phone, topN);
    const topKeywords = topKeywordsAgg.map(k => k._id);

    const cooccurrence = await this.chatHistoryModel.aggregate([
        { $match: { phone } },
        { $project: { keywords: '$userKeywords', userKeywords: '$userKeywords' } },
        { $unwind: '$keywords' },
        { $match: { keywords: { $in: topKeywords } } },
        { $project: { keyword: '$keywords', otherKeywords: '$userKeywords' } },
        { $unwind: '$otherKeywords' },
        { $match: { $expr: { $ne: ['$keyword', '$otherKeywords'] }, otherKeywords: { $in: topKeywords } } },
        { $group: {
            _id: '$keyword',
            co_occurrences: { $push: '$otherKeywords' }
          }
        },
        { $project: {
            co_occurrence_counts: {
              $map: {
                input: { $setUnion: ['$co_occurrences', []] },
                as: 'kw',
                in: {
                  keyword: '$$kw',
                  count: {
                    $size: {
                      $filter: { input: '$co_occurrences', cond: { $eq: ['$$this', '$$kw'] } }
                    }
                  }
                }
              }
            }
          }
        }
      ]);
    return cooccurrence;
  }
}
