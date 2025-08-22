import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAIService } from 'src/openAI/openAI.service';
import { ChatHistory, ChatHistoryDocument } from './chatHistory.schema';

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectModel(ChatHistory.name) private readonly chatHistoryModel: Model<ChatHistoryDocument>,
    private readonly openai: OpenAIService,
  ) {}

  /**
   * Create a new chat entry per request
   */
  async create(data: Partial<ChatHistory>): Promise<ChatHistory> {
    let embedding: number[] = [];

    if (data.userMessage) {
      try {
        embedding = await this.openai.createEmbedding(data.userMessage);
      } catch (err) {
        console.error('❌ Failed to generate embedding:', err.message);
      }
    }

    const entry = new this.chatHistoryModel({
      ...data,
      embedding,
    });

    return entry.save();
  }

  /**
   * Retrieve all chat entries for a given phone number
   */
  async findByPhone(phone: string): Promise<ChatHistory[]> {
    return this.chatHistoryModel
      .find({ phone })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  /**
   * Semantic recall: top-K similar past messages for a user.
   * Requires Atlas Vector Search index on `embedding`.
   */
  async semanticRecall(
    phone: string,
    query: string,
    topK = 4,
    numCandidates = 100,
  ): Promise<Array<{ userMessage: string; botResponse?: string; createdAt: Date; _id: any; score: number }>> {
    const queryVector = await this.openai.createEmbedding(query);
    if (!queryVector.length) return [];
  
    return this.chatHistoryModel.aggregate([
      {
        $vectorSearch: {
          index: 'chatHistory_embedding_index',
          queryVector,
          path: 'embedding',
          numCandidates,
          limit: topK,
          filter: { phone }
        }        
      },
      {
        $project: {
          userMessage: 1,
          botResponse: 1,
          createdAt: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);
  }  

  /**
   * Top N keywords per user
   */
  async getTopKeywordsPerUser(phone: string, topN = 20) {
    return this.chatHistoryModel.aggregate([
      { $match: { phone } },
      { $unwind: '$userKeywords' },
      { $group: { _id: '$userKeywords', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: topN },
    ]);
  }

  /**
   * Co-occurrence for top keywords of a user
   */
  async getTopKeywordsCooccurrence(phone: string, topN = 20) {
    const topKeywordsAgg = await this.getTopKeywordsPerUser(phone, topN);
    if (!topKeywordsAgg.length) return [];

    const topKeywords = topKeywordsAgg.map((k) => k._id);

    return this.chatHistoryModel.aggregate([
      { $match: { phone } },
      { $unwind: '$userKeywords' },
      { $match: { userKeywords: { $in: topKeywords } } },
      {
        $group: {
          _id: '$userKeywords',
          co_occurrences: { $push: '$userKeywords' },
        },
      },
      {
        $project: {
          co_occurrence_counts: {
            $map: {
              input: { $setUnion: ['$co_occurrences', []] },
              as: 'kw',
              in: {
                keyword: '$$kw',
                count: {
                  $size: {
                    $filter: {
                      input: '$co_occurrences',
                      cond: { $eq: ['$$this', '$$kw'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);
  }
}
