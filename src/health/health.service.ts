import { Injectable } from '@nestjs/common';
import { formatRecipe, getLogQuestion } from '../utils';
import { OpenAIService, UserContext } from '../openAI/openAI.service';
import { getChatWithContextPrompt, getRecipePrompt, getDailyLogAndTipPrompt } from '../prompts';
import { ChatHistoryService } from '../chatHistory/chatHistory.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.schema';

@Injectable()
export class HealthService {
  constructor(
    private readonly openai: OpenAIService,
    private readonly userService: UserService,
    private readonly chatHistoryService: ChatHistoryService,
  ) {}

  /**
   * Log a daily activity and return a short personalized tip.
   */
  async logDailyActivity(user: User, userLog: string): Promise<string> {
    const extraUserContext = await this.getExtraUserContext(user.phone);
    const time: 'morning' | 'evening' = 'evening';

    const question = getLogQuestion(time);
    const prompt = getDailyLogAndTipPrompt(time, user, question, userLog, extraUserContext);

    const { tip, log } = await this.openai.generate(prompt);

    // persist only if log is valid
    if (log) {
      await this.userService.createOrUpdateDailyLog(user.phone, time, log);
    }

    return [
      `🌅 Good ${time}, ${user.name || 'there'}!`,
      ``,
      `💡 Tip of the day:\n${tip?.message || 'Stay healthy and active!'}`,
      ``,
      `📝 Why this tip matters:\n${tip?.reason || 'Your daily habits shape your long-term wellness.'}`,
    ].join('\n');
  }

  /**
   * Generate a contextualized activity log question.
   */
  async getActivityLogQuestion(user: User, time: 'morning' | 'evening'): Promise<string> {
    const userName = user.name || 'there';
    const baseMsg =
      `You'll earn bonus points for logging your activity and receive a personalized tip based on your profile!`;

    return time === 'morning'
      ? `Good morning, ${userName}! 🌅 Let's log your morning and get your tip for the day. ${baseMsg}\n${getLogQuestion(time)}`
      : `Evening check-in, ${userName}! 🌙 Let's log your day and get your tip for tonight. ${baseMsg}\n${getLogQuestion(time)}`;
  }

  /**
   * General-purpose AI chat with semantic + keyword memory.
   */
  async chatWithAI(userMessage: string, userDetails?: UserContext): Promise<string> {
    if (!userDetails?.phone) {
      return `⚠️ Missing user details. Please try again.`;
    }

    // Collect extra context & semantic recall in parallel for performance
    const [extraUserContext, recalls] = await Promise.all([
      this.getExtraUserContext(userDetails.phone),
      this.chatHistoryService.semanticRecall(userDetails.phone, userMessage, 4, 120),
    ]);

    // Attach compact memory excerpt
    extraUserContext['memory'] = this.buildMemoryExcerpt(recalls);

    console.log(extraUserContext);

    const prompt = getChatWithContextPrompt(userDetails, userMessage, extraUserContext);
    const { response, input_keywords = [], output_keywords = [] } =
      await this.openai.generate(prompt);

    if (!response) {
      return `I might not know everything about that 😅\nBut I can give personalised wellness tips and recipes!\n\nType /help to explore. 🌿`;
    }

    // persist conversation (non-blocking, no need to await in request cycle)
    this.chatHistoryService.create({
      phone: userDetails.phone,
      userMessage,
      botResponse: response,
      userKeywords: input_keywords,
      botKeywords: output_keywords,
    }).catch(err => this.debugLog('ChatHistoryPersistError', { err }));

    this.debugLog('ChatWithAI', { userMessage, response, input_keywords, output_keywords });
    return response;
  }

  /**
   * Suggest a recipe tailored to the user.
   */
  async suggestRecipe(userMessage: string, userDetails?: UserContext): Promise<{ message: string }> {
    if (!userDetails?.phone) {
      return { message: "⚠️ Missing user details. Can't suggest recipes." };
    }

    const extraUserContext = await this.getExtraUserContext(userDetails.phone);
    const prompt = getRecipePrompt(userMessage, userDetails, extraUserContext);

    const { recipe, input_keywords = [], output_keywords = [] } = await this.openai.generate(prompt);

    this.debugLog('SuggestRecipe', { userMessage, recipe, input_keywords, output_keywords });

    return recipe
      ? { message: formatRecipe(recipe) }
      : { message: "Sorry, I couldn't find a recipe right now." };
  }

  /**
   * Pull additional user behavior context.
   */
  private async getExtraUserContext(phone: string) {
    const behaviour = await this.userService.getUserBehaviour(phone);
    return {
      topKeywords: behaviour?.topKeywords || [],
      cooccurrence: behaviour?.cooccurrence || {},
    };
  }

  /**
   * Format recalled history into a compact string.
   */
  private buildMemoryExcerpt(recalls: any[]): string {
    if (!recalls?.length) return 'none';
    return recalls
      .map(r =>
        `• (${new Date(r.createdAt).toISOString().slice(0, 10)}) ` +
        `U: ${r.userMessage}${r.botResponse ? ` | A: ${r.botResponse}` : ''}`
      )
      .join('\n');
  }

  /**
   * Lightweight debug logger (replaceable with a proper logging service).
   */
  private debugLog(action: string, data: Record<string, any>) {
    if (process.env.DEBUG_AI === 'true') {
      console.log(`[${action}]`, JSON.stringify(data, null, 2));
    }
  }
}
