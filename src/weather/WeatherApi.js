import axios from 'axios';

const API_KEY = '6b4da5cd82fa02cd65f3c640c0b99380';
export default class WeatherAPI {
  static getTimeStr = (timeZone, timestamp) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('en-AU', {
      timeStyle: 'short',
      timeZone,
    }).format(date);
  }
  static makeDateStr = (timeZone, weatherData) => {
    weatherData.forEach((data, idx) => {
      const date = new Date(data.timestamp * 1000);
      const dateStr = new Intl.DateTimeFormat('en-AU', {
        dateStyle: 'full',
        timeZone,
      }).format(date);
      [data.day, data.date] = dateStr.split(',');
      if (idx === 0) {
        // only current data shows time
        data.date = `${data.date} ${new Intl.DateTimeFormat('en-AU', {
          timeStyle: 'short',
        }).format(date)}`;
      }
    })
  }
  static getWeather = async(lat, lon) => {
    try {
      // https://api.openweathermap.org/data/2.5/onecall?lat=-33.69&lon=150.88&exclude=minutely,hourly&appid=6b4da5cd82fa02cd65f3c640c0b99380
      const weatherData = await axios.get(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly&appid=${API_KEY}`
      );
      if (weatherData.status !== 200) {
        console.warn('Failed to get weahter data!');
        return [];
      }
      let index = 0;
      let weatherCardData = [{
        index,
        key: weatherData.data.current.dt.toString(),
        timestamp: weatherData.data.current.dt,
        temp: {
          curr: Math.round(weatherData.data.current.temp)
        },
        weather: weatherData.data.current.weather[0],
        others : {
          sunrise: this.getTimeStr(weatherData.data.timezone, weatherData.data.current.sunrise),
          sunset: this.getTimeStr(weatherData.data.timezone, weatherData.data.current.sunset),
          humidity: weatherData.data.current.humidity,
          windspeed: weatherData.data.current.wind_speed
        }
      }];
      // daily data includes today's forecast
      const daily = weatherData.data.daily.slice(1);
      const forecast = daily.map((data) => {
        index++;
        return {
          index,
          key: data.dt.toString(),
          timestamp: data.dt,
          temp: {
            day: data.temp.day,
            max: Math.round(data.temp.max),
            min: Math.round(data.temp.min)
          },
          weather: data.weather[0],
          others : {
            sunrise: this.getTimeStr(weatherData.data.timezone, data.sunrise),
            sunset: this.getTimeStr(weatherData.data.timezone, data.sunset),
            humidity: data.humidity,
            windspeed: data.wind_speed
          }
        };
      });
      weatherCardData = weatherCardData.concat(forecast);
      this.makeDateStr(weatherData.data.timezone, weatherCardData);
      return weatherCardData;
    } catch (e) {
      console.warn(e.message);
    }
  }
}
