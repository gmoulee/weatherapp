import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Model } from 'mongoose';
import { firstValueFrom, map, tap } from 'rxjs';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { UpdateCurrentWeatherDto } from './dto/update-current-weather.dto';
import { UpdateFutureWeatherDto } from './dto/update-future-weather.dto';
import { UpdateHistoryWeatherDto } from './dto/update-history-weather.dto';
import { Weather, WeatherDocument } from './schemas/weather.schema';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(Weather.name)
    private readonly weatherModel: Model<WeatherDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}
  
  private readonly logger = new Logger(WeatherService.name);

  onModuleInit() {
    const currentWeatherUpdateJob = new CronJob(this.configService.get<Date>('UPDATECURRENTWEATHER'), () => {
      this.updateCurrentWeather();
    });
    this.schedulerRegistry.addCronJob('Current Weather update every 30 minutes', currentWeatherUpdateJob);
    currentWeatherUpdateJob.start();
    
    const futureWeatherUpdateJob = new CronJob(this.configService.get<Date>('UPDATEFUTUREWEATHER'), () => {
      this.updateFutureWeather();
    });
    this.schedulerRegistry.addCronJob('Future Weather Update every day', futureWeatherUpdateJob);
    futureWeatherUpdateJob.start();
    
    const historyWeatherUpdateJob = new CronJob(this.configService.get<Date>('UPDATEHISTORYWEATHER'), () => {
      this.updateHistoryWeather();
    });
    this.schedulerRegistry.addCronJob('Historical Weather Update every day', historyWeatherUpdateJob);
    historyWeatherUpdateJob.start();
  }

  async updateHistoryWeather(){
    const cities  = await this.weatherModel.find().select('name current history')
    for(const element of cities){
      let city = element["name"];
      let id = element["_id"];
      let current = JSON.parse(element["current"])
      let history = JSON.parse(element["history"])
      let date = new Date()
      date.setDate(date.getDate()-1)
      let dt = Math.floor(new Date(date).getTime() / 1000);
      let data = await this.callreq(
        `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${current.coord.lat}&lon=${current.coord.lon}&dt=${dt}&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      if(Object.keys(history).length < 7){
        history[dt] = data
      }
      else{
        // date.setDate(date.getDate()-7)
        // let olddt = Math.floor(new Date(date).getTime() / 1000);
        // delete history[olddt]
        // history[dt] = data
        const dates = Object.keys(history)
        let remove = dates[0]
        dates.forEach(element => {
          if(element < remove) remove = element
        });
        delete history[remove]
        history[dt] = data
      }
      await this.updateHistory(id,{history : JSON.stringify(history)});
      this.logger.log(`${city} history weather data updated`)
    }
  }

  async updateFutureWeather() {
    const cities  = await this.weatherModel.find().select('name current')
    for(const element of cities){
      let city = element["name"];
      let id = element["_id"];
      let current = JSON.parse(element["current"])
      let future = await this.callreq(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${current.coord.lat}&lon=${current.coord.lon}&exclude=current,minutely,hourly,alerts&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      await this.updateFuture(id,{future : JSON.stringify(future)});
      this.logger.log(`${city} future weather data updated`)
    }
  }

  async updateCurrentWeather() {
    const cities  = await this.weatherModel.find().select('name')
    for(const element of cities){
      let city = element["name"];
      let id = element["_id"];
      let current = await this.callreq(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      await this.updateCurrent(id,{current : JSON.stringify(current)});
      this.logger.log(`${city} current weather data updated`)
    }
  }

  async getHistoricalReport(lat: string, lon: string) {
    let result = [];
    for (let i = 1; i < 6; i++) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d);
    }
    let report = {};
    for (const key in result) {
      let date = Math.floor(new Date(result[key]).getTime() / 1000);
      let data = await this.callreq(
        `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${date}&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      report[date] = data;
    }
    return report;
  }

  async checkAndCreate(name: string): Promise<Weather> {
    if ((await this.weatherModel.findOne({ name: name }).exec()) == null) {
      const current = await this.callreq(
        `https://api.openweathermap.org/data/2.5/weather?q=${name}&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      const future = await this.callreq(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${current.coord.lat}&lon=${current.coord.lon}&exclude=current,minutely,hourly,alerts&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      const history = await this.getHistoricalReport(
        current.coord.lat,
        current.coord.lon,
      );
      const createdWeather = await this.create({
        name: name,
        history: JSON.stringify(history),
        current: JSON.stringify(current),
        future: JSON.stringify(future),
      });
      return createdWeather;
    } else {
      this.logger.error('City already exists');
      throw new ConflictException('City already exists in db');
    }
  }

  async updateHistory(id: string, updateHistoryDto: UpdateHistoryWeatherDto){
    this.weatherModel.findById(id).update(updateHistoryDto);
  }

  async updateCurrent(id: string, updateCurrentDto: UpdateCurrentWeatherDto){
    this.weatherModel.findById(id).update(updateCurrentDto);
  }

  async updateFuture(id: string, updateFutureDto: UpdateFutureWeatherDto){
    this.weatherModel.findById(id).update(updateFutureDto);
  }

  async create(createWeatherDto: CreateWeatherDto): Promise<Weather> {
    const createdWeather = await this.weatherModel.create(createWeatherDto);
    return createdWeather;
  }

  async findCity(city: string): Promise<Weather> {
    const weather = await this.weatherModel.findOne({ name: city }).select('name current history future').exec();
    if (weather == null) {
      const current = await this.callreq(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      const future = await this.callreq(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${current.coord.lat}&lon=${current.coord.lon}&exclude=current,minutely,hourly,alerts&appid=${process.env.OPENWEATHERMAPAPI}`,
      );
      const history = await this.getHistoricalReport(
        current.coord.lat,
        current.coord.lon,
      );
      const createdWeather = await this.create({
        name: city,
        history: JSON.stringify(history),
        current: JSON.stringify(current),
        future: JSON.stringify(future),
      });
      return createdWeather;
    }
    return weather;
  }

  async findAll(): Promise<Weather[]> {
    return this.weatherModel.find().select('name current');
  }

  async delete(id: string): Promise<String> {
    if ((await this.weatherModel.findById(id)) != null) {
      await (await this.weatherModel.findById(id)).delete();
      this.logger.log(`ID: ${id} successfully deleted`)
      return "Id successfully deleted"
    } else {
      this.logger.error("Id not found")
      throw new NotFoundException('Id not found');
    }
  }

  async callreq(url: string) {
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }
}
