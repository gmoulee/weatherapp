import { BadRequestException, Controller, Delete, Get, InternalServerErrorException, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Weather } from './schemas/weather.schema';
import { WeatherService } from './weather.service';

@ApiTags('cities')
@Controller('cities')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}
  private readonly logger = new Logger(WeatherController.name)

  @ApiConflictResponse({description: "Data already available for the city"})
  @ApiInternalServerErrorResponse({description: "Unable to fetch data for the city name"})
  @Post()
  async create(@Query('name') name: string): Promise<Weather>{
    if(name == ' ' || name == '' || name == null){
      throw new BadRequestException('Parameter name cannot be empty')
    }
    try {
      this.logger.log(`POST request to create a new city: ${name}`)
      return await this.weatherService.checkAndCreate(name);
    } catch (error) {
      if(error.response.status == 404){
        throw new BadRequestException(`City : ${name} not found`)
      }
      throw error
    }
  }

  @ApiOkResponse({description: "Weather data retrieved for all cities successfully"})
  @Get()
  async findAll(): Promise<Weather[]> {
    this.logger.log("GET request to fetch all cities and its current weather data")
    return this.weatherService.findAll();
  }

  @ApiOkResponse({description: "Weather data retrieved by NAME successfully"})
  @Get('/:name/weather')
  async findCity(@Param('name') name: string): Promise<Weather> {
    if(name == ' ' || name == null){
      throw new BadRequestException('Parameter in the path cannot be empty')  
    }
    try{
      this.logger.log(`GET request to fetch weather data for city: ${name}`)
      return this.weatherService.findCity(name);
    }
    catch(error){
      if(error.response.code == 404){
        throw new BadRequestException(`City: ${name} not foound`)
      }
      throw error
    }
  }

  @ApiOkResponse({description: "Weather data for city deleted by ID successfully"})
  @ApiNotFoundResponse({description: "ID not found"})
  @Delete()
  async delete(@Query('id') id: string): Promise<String> {
    this.logger.log(`DELETE request to delete id: ${id}`)
    return await this.weatherService.delete(id);
  }
}
