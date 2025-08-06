import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('webhook')
  async receiveMessage(@Body() body: any) {
    return this.whatsappService.handleIncoming(body);
  }
}
