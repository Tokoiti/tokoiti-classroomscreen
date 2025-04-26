import axios from 'axios';

export default async function handler(req, res) {
  const apiKey = '27654027f6761d87e2a5143e7733d7c9'; // (keep using your working one)
  const lat = '-46.1213';
  const lon = '169.9609';
  
    try {
      // 1. Fetch current weather
      const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
      const weatherData = weatherResponse.data;
  
      // 2. Fetch UV Index
      const uvResponse = await axios.get(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`);
      const uvData = uvResponse.data;
  
      // 3. Fetch Rain Forecast
      const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
      const forecastData = forecastResponse.data;
  
      // Look at the first forecast period
      const firstForecast = forecastData.list[0];
      const rainAmount = firstForecast.rain ? firstForecast.rain["3h"] : 0;
      const rainForecast = rainAmount > 0 ? "Yes" : "No";
  
      const result = {
        temp: Math.round(weatherData.main.temp),
        description: weatherData.weather[0].main,
        uvIndex: uvData.value,
        rainForecast: rainForecast,
        icon: weatherData.weather[0].icon
      };
  
      res.status(200).json(result);
  
    } catch (error) {
      console.error('Server error occurred:', error.message);
      console.error('Full Error Details:', error.response ? error.response.data : error);
      res.status(500).json({ error: 'Unable to fetch weather data' });
    }
  }
  