import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherController } from './weather/weather.controller';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}),
    MongooseModule.forRoot('mongodb://mongodb/weather'), 
    WeatherModule,
    ScheduleModule.forRoot(),
  ]
})
export class AppModule {}
