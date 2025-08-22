// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

import { WhatsappController } from './whatsapp/whatsapp.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { HealthService } from './health/health.service';
import { OpenAIService } from './openAI/openAI.service';
import { UserModule } from './user/user.module';
import { ChatHistoryModule } from './chatHistory/chatHistory.module';

@Module({
  imports: [
    // Load environment variables from .env
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available everywhere
    }),

    // Mongoose connection using env vars
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        dbName: configService.get<string>('MONGO_DB_NAME'),
      }),
    }),

    HttpModule,
    UserModule,
    ChatHistoryModule,
  ],
  controllers: [WhatsappController, AppController],
  providers: [AppService, WhatsappService, HealthService, OpenAIService],
})
export class AppModule {}
