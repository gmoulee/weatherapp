import { ApiProperty } from "@nestjs/swagger";

export class UpdateHistoryWeatherDto {
    @ApiProperty()
    history: string;
 }