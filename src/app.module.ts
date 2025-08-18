import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { HealthService } from './health/health.service';
import { OpenAIService } from './openAI/openAI.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ChatHistoryModule } from './chatHistory/chatHistory.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/hithaAI',
    ),
    HttpModule,
    UserModule,
    ChatHistoryModule
  ],
  controllers: [WhatsappController, AppController],
  providers: [AppService, WhatsappService, HealthService, OpenAIService],
})
export class AppModule {}
