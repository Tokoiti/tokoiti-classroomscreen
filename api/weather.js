import fetch from 'node-fetch'; // 👈 ADD THIS LINE at the very top

export default async function handler(req, res) {
  const apiKey = '27654027f6761d87e2a5143e7733d7c9';
  const lat = '-46.1213';
  const lon = '169.9609';

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error('API Request Failed:', response.status, response.statusText);
      res.status(500).json({ error: 'API request failed' });
      return;
    }

    const data = await response.json();

    const result = {
      temp: Math.round(data.current.temp),
      description: data.current.weather[0].main,
      uvIndex: data.current.uvi,
      pop: Math.round((data.hourly[0].pop || 0) * 100),
      icon: data.current.weather[0].icon
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Unable to fetch weather data' });
  }
}
