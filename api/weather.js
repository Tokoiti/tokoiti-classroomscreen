async function updateWeather() {
  try {
    const response = await fetch('/api/weather');
    const data = await response.json();

    const temp = data.temp;
    const description = data.description;
    const uvIndex = data.uvIndex;
    const pop = data.pop;
    const icon = data.icon;

    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`; // 🌦️ Here's the icon URL

    const weatherElement = document.getElementById('weather');
    weatherElement.innerHTML = `
      <img src="${iconUrl}" alt="${description}" style="vertical-align: middle; width: 30px; height: 30px; margin-right: 8px;">
      ${temp}°C ${description} - UV ${uvIndex} - Rain ${pop}%
    `;
  } catch (error) {
    console.error('Weather fetch error:', error);
    const weatherElement = document.getElementById('weather');
    weatherElement.textContent = `Weather unavailable`;
  }
}
