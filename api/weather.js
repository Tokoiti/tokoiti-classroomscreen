import axios from 'axios';

export default async function handler(req, res) {
  const apiKey = '27654027f6761d87e2a5143e7733d7c9'; // Your OpenWeather API Key
  const lat = '-46.1213'; // Tokoiti School latitude
  const lon = '169.9609'; // Tokoiti School longitude

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&units=metric&appid=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    const result = {
      temp: Math.round(data.current.temp),
      description: data.current.weather[0].main,
      uvIndex: data.current.uvi,
      pop: Math.round((data.hourly[0].pop || 0) * 100),
      icon: data.current.weather[0].icon
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Server error occurred:', error.message);
    console.error('Full Error Details:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Unable to fetch weather data' });
  }
}
