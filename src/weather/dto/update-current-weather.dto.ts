import { ApiProperty } from "@nestjs/swagger";

export class UpdateCurrentWeatherDto {
    @ApiProperty()
    current: string;
 }