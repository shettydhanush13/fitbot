import { Injectable } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  constructor(
    private healthService: HealthService,
    private http: HttpService,
  ) {}

  GUPSHUP_API_URL = 'https://api.gupshup.io/sm/api/v1/msg';
  GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
  BOT_PHONE_NUMBER = '15557712559';

  async handleIncoming(body: any) {
    const incoming = body.payload?.payload || {};
    const text = incoming.text;
    const phone = incoming.sender?.phone;

    if (!text || !phone) return;

    if (text.toLowerCase().includes('hi')) {
      await this.sendMessage(phone, `👋 Welcome to HealthBot! Type "tip" for a wellness tip or "log walk" to track your walk.`);
    } else if (text.toLowerCase().includes('tip')) {
      const tip = await this.healthService.getHealthTip();
      await this.sendMessage(phone, `💡 Health Tip:\n${tip}`);
    } else if (text.toLowerCase().includes('log walk')) {
      await this.sendMessage(phone, `✅ Walk logged. Keep it up!`);
    } else {
      await this.sendMessage(phone, `🤖 Sorry, I didn't understand. Type "tip" or "log walk"`);
    }
  }

  async sendMessage(phone: string, message: string) {
    const payload = {
      channel: 'whatsapp',
      source: this.BOT_PHONE_NUMBER,
      destination: phone,
      message: {
        type: 'text',
        text: message,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      apikey: this.GUPSHUP_API_KEY,
    };

    await firstValueFrom(
      this.http.post(this.GUPSHUP_API_URL, payload, { headers })
    );
  }
}
