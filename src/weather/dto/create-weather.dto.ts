import { ApiProperty } from "@nestjs/swagger";

export class CreateWeatherDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    history: string;

    @ApiProperty()
    current: string;
    
    @ApiProperty()
    future:  string;
 }