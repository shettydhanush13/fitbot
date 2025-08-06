import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../openAI/openAI.service';

@Injectable()
export class HealthService {
  constructor(private openai: OpenAIService) {}

  async getHealthTip(): Promise<string> {
    const prompt = `Give one short health tip for general wellness in under 30 words.`;
    return await this.openai.generate(prompt);
  }
}
