import { Injectable } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import axios from 'axios';
import qs from 'qs';

@Injectable()
export class WhatsappService {
  constructor(private healthService: HealthService) {}

  async handleIncoming(body: any) {
    const from = body.From; // e.g. "whatsapp:+918971780778"
    const text = body.Body?.trim();

    console.log({ from, text });

    if (!text || !from) return;

    if (text.toLowerCase().includes('hi')) {
      await this.sendMessage(from, 'Welcome to HealthBot');
    } else if (text.toLowerCase().includes('tip')) {
      const tip = await this.healthService.getHealthTip();
      await this.sendMessage(from, `💡 Health Tip:\n${tip}`);
    } else if (text.toLowerCase().includes('log walk')) {
      await this.sendMessage(from, `✅ Walk logged. Keep it up!`);
    } else {
      await this.sendMessage(from, `🤖 Sorry, I didn't understand. Type "tip" or "log walk"`);
    }
  }

  async sendMessage(to: string, message: string) {
    const params = new URLSearchParams();
    params.append('Body', message);
    params.append('From', 'whatsapp:+15557412250');
    params.append('To', to);

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      params.toString(),
      {
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID!,
          password: process.env.TWILIO_AUTH_TOKEN!,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    console.log(response);

    // const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  
    // const data = qs.stringify({
    //   Body: message,
    //   From: 'whatsapp:+15557412250', // Twilio sandbox number
    //   To: `whatsapp:${to}`,
    // });
  
    // await axios.post(url, data, {
    //   auth: {
    //     username: process.env.TWILIO_ACCOUNT_SID!,
    //     password: process.env.TWILIO_AUTH_TOKEN!,
    //   },
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    // });
  }
}
