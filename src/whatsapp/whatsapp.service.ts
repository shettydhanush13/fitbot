import { Injectable } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as Twilio from 'twilio';

@Injectable()
export class WhatsappService {
  private client: any;

  constructor(
    private healthService: HealthService,
    private http: HttpService,
  ) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    this.client = Twilio(accountSid, authToken);
  }

  GUPSHUP_API_URL = 'https://api.gupshup.io/wa/api/v1/msg';
  GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
  BOT_PHONE_NUMBER = '15557712559';

  async sendTemplateMessage(phone: string) {
    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: this.BOT_PHONE_NUMBER,
      destination: phone,
      'src.name': 'Fitospace',
      template: JSON.stringify({
        id: 'your_template_id', // Replace with your approved template ID
        params: {}
      })
    });
  
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      apikey: this.GUPSHUP_API_KEY,
    };
  
    try {
      const response = await firstValueFrom(this.http.post(this.GUPSHUP_API_URL, body, { headers }));
      console.log('Template message sent:', response.data);
    } catch (error) {
      console.error('Template message failed:', error.response?.data || error.message);
    }
  }

  async handleIncoming(body: any) {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const phone = message?.from;
    const text = message?.text?.body;

    console.log({ phone, text });

    if (!text || !phone) return;

    if (text.toLowerCase().includes('hi')) {
      await this.sendMessage(phone, 'Welcome to HealthBot');
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
    console.log(this.client);
    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: this.BOT_PHONE_NUMBER,
      destination: phone,
      'src.name': 'Fitospace',
      message: JSON.stringify({
        type: 'text',
        text: message,
      }),
    });
  
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      apikey: this.GUPSHUP_API_KEY,
    };
  
    const response = await firstValueFrom(this.http.post(this.GUPSHUP_API_URL, body, { headers }));
    console.log({ response: response.data });
  }
}
