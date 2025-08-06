import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { HealthService } from './health/health.service';
import { OpenAIService } from './openAI/openAI.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [WhatsappController, AppController],
  providers: [AppService, WhatsappService, HealthService, OpenAIService],
})
export class AppModule {}
