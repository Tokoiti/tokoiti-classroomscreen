import axios from 'axios';

export default async function handler(req, res) {
  const apiKey = 'YOUR-NEW-API-KEY'; // <- your latest new one
  const lat = '-46.1213';
  const lon = '169.9609';

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

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
