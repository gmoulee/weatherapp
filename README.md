To run : docker-compose up
To stop : docker-compose down

Schema : {
  name : "city name",
  history : "last 7 days weather data",
  current : "last known current weather data",
  future : "next 7 days weather data"
}

ENDPOINTS :

1. POST /cities
  Parameter required : name
  First it will check if the city already exists in the collection, if so it will throw a conflict exception.
  If its not in the collection, it will fetch the weather data for the city, store in db and returns it.

2. GET /cities
  Returns all the city and last known weather data for the city. Empty array is returned if no city exists.

3. GET /cities/:name/weather
  Checks if the city exists in db and retrives the data. If it doesn't exist, it fetches the weather data, stores in db and returns it.

4. DELETE /cities/:id
  Checks if the city exists and delete the data. If it doesn't exist, throws a NOTFOUNDEXCEPTION.

  NOTE : @GET /cities and @GET /cities/weather does the same job so I didn't define @GET /cities/weather

SCHEDULED JOBS : 

1. Current weather report - updates every 30 minutes.

  Interval is fetched from the environment variable "UPDATECURRENTWEATHER".

2. Future weather report - updates every day at midnight

  Interval is fetched from the environment variable "UPDATEFUTUREWEATHER".

3. Historical weather report - updates every dat at midnight

  Interval is fetched from the environment variable "UPDATEHISTORYWEATHER".

  Note: Openweathermap api provides historical data for previous 5 days only. 
        At the start of the application, it will fetch data for 5 days, then everyday at midnight it fetches the
        previous day data and adds to the historical data. If the historical data has already 7 days of data, it removes the earliest data (n-8) and adds the newly fetched.

OPENWEATHERMAP API :

APIKEY : a80276406d7b499697372336904f4a87

APIKEY is fetched from the environment variable.


