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
    private openai: OpenAIService,
    private userService: UserService,
    private chatHistoryService: ChatHistoryService
  ) {}

  /**
   * Get a short health tip in under 30 words.
   */
  async logDailyActivity(user: User, userLog: string): Promise<string> {
    const extraUserContext = await this.getExtraUserContext(user.phone);
    const time = 'evening';
    const question = getLogQuestion(time)
    const prompt = getDailyLogAndTipPrompt(time, user, question, userLog, extraUserContext);
    const { tip, log } = await this.openai.generate(prompt);
    await this.userService.createOrUpdateDailyLog(user.phone, time, log)

    // Format tip for WhatsApp
    return `🌅 Good ${time}, ${user.name || 'there'}!\n\n` +
      `💡 Tip of the day:\n${tip.message}\n\n` +
      `📝 Why this tip matters:\n${tip.reason}`;
  }

  /**
   * Get a question for activity log.
   */
  async getActivityLogQuestion(user: User, time: 'morning' | 'evening'): Promise<string> {
    const userName = user.name || 'there';
    const pointsMsg = `You'll earn bonus points for logging your activity and receive a personalized tip based on your profile!`;
    if (time === 'morning') {
      return `Good morning, ${userName}! 🌅 Let's log your morning and get your tip for the day. ${pointsMsg}
      ${getLogQuestion(time)}`;
    } else {
      return `Evening check-in, ${userName}! 🌙 Let's log your day and get your tip for tonight. ${pointsMsg}
      ${getLogQuestion(time)}`;
    }
  }

  /**
   * General chat with AI using user context and tone logic.
   */
  async chatWithAI(userMessage: string, userDetails?: UserContext): Promise<string> {
    const extraUserContext = await this.getExtraUserContext(userDetails.phone)
    const prompt = getChatWithContextPrompt(userMessage, userDetails, extraUserContext);
    const { response = '', input_keywords = [], output_keywords = [] } =
      await this.openai.generate(prompt);

    const chatHistory = await this.chatHistoryService.create({
      phone: userDetails.phone,
      userMessage,
      botResponse: response,
      userKeywords: input_keywords,
      botKeywords: output_keywords,
    });

    console.log(chatHistory);

    this.debugLog('ChatWithAI', { userMessage, response, input_keywords, output_keywords });
    return response;
  }

  /**
   * Suggest a recipe tailored to the user, with keywords.
   */
  async suggestRecipe(userMessage: string, userDetails?: UserContext) {
    const extraUserContext = await this.getExtraUserContext(userDetails.phone)
    const prompt = getRecipePrompt(userMessage, userDetails, extraUserContext);
    const { recipe, input_keywords = [], output_keywords = [] } =
      await this.openai.generate(prompt);

    this.debugLog('SuggestRecipe', { userMessage, recipe, input_keywords, output_keywords });

    if (!recipe) {
      return { message: "Sorry, I couldn't find a recipe right now." };
    }

    return { message: formatRecipe(recipe) };
  }

  async getExtraUserContext(phone: string) {
    const behaviour = await this.userService.getUserBehaviour(phone)
    return {
      topKeywords: behaviour?.topKeywords || [],
      cooccurrence: behaviour?.cooccurrence || {}
    };
  };

  /**
   * Optional debug logger - can be replaced with a proper logging service
   */
  private debugLog(action: string, data: Record<string, any>) {
    // if (process.env.DEBUG_AI === 'true') {
      console.log(`[${action}]`, JSON.stringify(data, null, 2));
    // }
  }
}
