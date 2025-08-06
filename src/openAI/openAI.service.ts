import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generate(prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'o4-mini', // configurable
        messages: [{ role: 'user', content: prompt }],
        // max_tokens: 1000, // optional if needed
    });
    return response.choices[0].message.content?.trim();
  }
}
