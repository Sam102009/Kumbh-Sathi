async function loadWeather() {

  const URL = "https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec?weather=1";

  try {

    const response = await fetch(URL);
    const data = await response.json();

    const current = data.list[0];

    const currentTemp = Math.round(current.main.temp);
    const currentCondition = current.weather[0].main;

    let forecastHtml = '';

    const daily = {};

    data.list.forEach(item => {

      const date = item.dt_txt.split(' ')[0];

      if (!daily[date]) {
        daily[date] = item;
      }

    });

    Object.values(daily).slice(0,5).forEach(day => {

      forecastHtml += `
      <div class="forecast-item">
        <div class="forecast-day">
          ${new Date(day.dt_txt).toLocaleDateString('en-US',{weekday:'short'})}
        </div>
        <div class="forecast-temp">
          ${Math.round(day.main.temp)}°
        </div>
      </div>
      `;

    });

    document.getElementById('weather-card').innerHTML = `
      <div class="weather-top">
        <div>
          <div class="weather-city">Nashik</div>
          <div>${currentCondition}</div>
        </div>

        <div class="weather-temp">
          ${currentTemp}°
        </div>
      </div>

      <div class="forecast-row">
        ${forecastHtml}
      </div>
    `;

  } catch(err) {

    document.getElementById('weather-card').innerHTML =
      "Weather unavailable";

    console.error(err);
  }

}

loadWeather();
