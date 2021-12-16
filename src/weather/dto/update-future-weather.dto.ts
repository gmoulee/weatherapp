import { ApiProperty } from "@nestjs/swagger";

export class UpdateFutureWeatherDto {
    @ApiProperty()
    future: string;
 }