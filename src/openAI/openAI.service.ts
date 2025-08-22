import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface UserContext {
  phone?: string
  name?: string;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  sex?: string;
  [key: string]: any; // allow future extension
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  // Model pricing (USD per 1,000 tokens) — keep this updated
  private readonly modelPricing: Record<string, number> = {
    'o4-mini': 0.001,
    'o4-nano': 0.0005,
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Sends a prompt to OpenAI and returns parsed JSON output.
   * If model output is not valid JSON, returns null with error log.
   */
  async generate<T = any>(prompt: string): Promise<T | null> {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'o4-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
      });

      this.logUsage(response.usage, response.model);

      const rawContent = response.choices[0].message.content?.trim() || '{}';

      // Try to extract JSON even if AI returns extra text
      const jsonMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.error('No JSON found in AI output:', rawContent);
        return null;
      }

      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      this.logger.error('OpenAI API Error:', error);
      return null;
    }
  }

  // make embeddings (text-embedding-3-small => 1536 dims)
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const res = await this.openai.embeddings.create({
        model: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
        input: text,
      });
      return res.data[0].embedding as number[];
    } catch (err) {
      this.logger.error('Embedding error', err);
      return [];
    }
  }

  /**
   * Logs usage and cost estimation based on token count.
   */
  private logUsage(
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    },
    model: string,
  ) {
    if (!usage) {
      this.logger.warn('Token usage info not available');
      return;
    }

    const { prompt_tokens, completion_tokens, total_tokens } = usage;
    const pricePerThousandTokens =
      this.modelPricing[model] ?? this.modelPricing['o4-mini'];
    const cost = (total_tokens / 1000) * pricePerThousandTokens;

    this.logger.log(
      `[OpenAI Usage] Model: ${model}, Prompt: ${prompt_tokens}, Completion: ${completion_tokens}, Total: ${total_tokens}, Cost: $${cost.toFixed(
        6,
      )}`,
    );
  }
}
