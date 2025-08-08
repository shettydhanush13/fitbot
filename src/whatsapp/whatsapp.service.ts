import { Injectable } from '@nestjs/common';
// import { HealthService } from '../health/health.service';
// import { OpenAIService } from '../openai/openai.service';
import { Twilio } from 'twilio';

@Injectable()
export class WhatsappService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  TWILIO_WHATSAPP_NUMBER = 'whatsapp:+15557412250'; // replace with your Twilio WhatsApp sender

  async handleIncoming(body: any) {
    const from = body.From; // "whatsapp:+918971780778"
    const text = body.Body?.trim();

    console.log({ from, text });

    if (!text || !from) return;

    if (text.toLowerCase() === 'hi') {
      await this.sendMessage(from, '👋 Welcome to HealthBot');
    } 
    else if (text.toLowerCase().includes('tip')) {
      // const tip = await this.healthService.getHealthTip();
      const tip = 'tip';
      await this.sendMessage(from, `💡 Health Tip:\n${tip}`);
    } 
    else if (text.toLowerCase().includes('log walk')) {
      await this.sendMessage(from, `✅ Walk logged. Keep it up!`);
    } 
    else {
      // Send request to LLM
      // const reply = await this.openAIService.generate(text);
      await this.sendMessage(from, "🤖 Sorry, I didn't understand.");
    }
  }

  async sendMessage(to: string, message: string) {
    return this.client.messages.create({
      from: this.TWILIO_WHATSAPP_NUMBER,
      to,
      body: message,
    });
  }
}
