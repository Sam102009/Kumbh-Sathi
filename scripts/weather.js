const WEATHER_URL = "https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec?weather=1";

async function loadWeather() {
  const card = document.getElementById('weather-card');
  if (!card) return;

  try {
    const response = await fetch(WEATHER_URL);
    const data = await response.json();
    const current = data.list[0];
    const temp = Math.round(current.main.temp);
    const feels = Math.round(current.main.feels_like);
    const humidity = current.main.humidity;
    const condition = current.weather[0].main;
    const desc = current.weather[0].description;
    const icon = getWeatherIcon(condition);

    const daily = {};
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!daily[date]) daily[date] = item;
    });

    const forecastHtml = Object.values(daily).slice(0, 5).map(day => `
      <div class="forecast-item">
        <div class="forecast-day">${new Date(day.dt_txt).toLocaleDateString('en-IN', {weekday:'short'})}</div>
        <div class="forecast-icon">${getWeatherIcon(day.weather[0].main)}</div>
        <div class="forecast-temp">${Math.round(day.main.temp)}°</div>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="weather-inner">
        <div class="weather-top">
          <div class="weather-left">
            <div class="weather-city">📍 नाशिक</div>
            <div class="weather-temp-main">${temp}°C</div>
            <div class="weather-desc">${desc}</div>
            <div class="weather-meta">
              💧 ${humidity}% &nbsp;|&nbsp; Feels ${feels}°C
            </div>
          </div>
          <div class="weather-icon-main">${icon}</div>
        </div>
        <div class="weather-forecast">${forecastHtml}</div>
      </div>
    `;
  } catch(err) {
    document.getElementById('weather-card').innerHTML = '<div style="padding:12px;color:var(--light-brown);font-size:12px;">⚠️ Weather unavailable</div>';
  }
}

function getWeatherIcon(condition) {
  const icons = {
    'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️',
    'Drizzle': '🌦️', 'Thunderstorm': '⛈️', 'Snow': '❄️',
    'Mist': '🌫️', 'Haze': '🌫️', 'Fog': '🌫️'
  };
  return icons[condition] || '🌤️';
}

document.addEventListener('DOMContentLoaded', function() {
  loadWeather();
});
