import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type WeatherDocument = Weather & Document;

@Schema()
export class Weather {
  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  history: string;

  @ApiProperty()
  @Prop()
  current: string;

  @ApiProperty()
  @Prop()
  future: string;

}

export const weatherSchema = SchemaFactory.createForClass(Weather);