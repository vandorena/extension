function getWeather(lat, lon) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,precipitation,cloudcover,windspeed_10m,winddirection_10m,windgusts_10m`;
  console.log('Fetching weather data from:', weatherUrl);

  fetch(weatherUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Weather data:', data);
      if (data.hourly && data.hourly.temperature_2m && data.hourly.temperature_2m.length > 0 && data.hourly.weathercode && data.hourly.weathercode.length > 0) {
        let temperature = data.hourly.temperature_2m[0].toString(); // Get the first hour's temperature and convert to string
        const weatherCode = data.hourly.weathercode[0]; // Get the first hour's weather code
        const precipitation = data.hourly.precipitation[0]; // Get the first hour's precipitation
        const cloudCover = data.hourly.cloudcover[0]; // Get the first hour's cloud cover
        const windSpeed = (data.hourly.windspeed_10m[0] * 0.539957).toFixed(2); // Convert wind speed to knots
        const windDirection = data.hourly.winddirection_10m[0]; // Get the first hour's wind direction
        const windGust = (data.hourly.windgusts_10m[0] * 0.539957).toFixed(2); // Convert wind gust to knots
        getLocationName(lat, lon, temperature, weatherCode, precipitation, cloudCover, windSpeed, windDirection, windGust);
      } else {
        console.error('Unexpected weather data structure:', data);
      }//
    })
    .catch(error => console.error('Error fetching weather data:', error));
}

function getLocationName(lat, lon, temperature, weatherCode, precipitation, cloudCover, windSpeed, windDirection, windGust) {
  const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=c9ddb4d4bbbf40d3a76f6ea5e95cedd8`;
  console.log('Fetching location data from:', geocodeUrl);

  fetch(geocodeUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Location data:', data);
      if (data.results && data.results.length > 0) {
        const components = data.results[0].components;
        const firstLine = data.results[0].formatted.split(',')[0];
        const city = components.city || components.town || components.village || 'Unknown city';
        const country = components.country || 'Unknown country';
        const location = `${firstLine}, ${city}, ${country}`;
        const isWater = components._type === 'water';
        const weatherDiv = document.getElementById('weather');
        const weatherImage = getWeatherImage(weatherCode);
        let message = '';
        let boatGif = '';

        if (isWater) {
          message = 'Yay, you are out at sea!';
        } else if (windSpeed > 5) {
          message = 'Go sailing!';
          boatGif = `<img src="sailing-surfing.gif" alt="Boat animation" style="width: 100px; height: 100px;">`;
        } else {
          message = 'God, I wish there was more wind.';
        }

        getDistanceToSea(lat, lon, (nearestWaterbody) => {
          weatherDiv.innerHTML = `
            <div style="
              background: linear-gradient(45deg, orange, yellow);
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              color: black;
              font-family: Arial, sans-serif;
            ">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <h2 style="width: 100%; text-align: center;">
                <img src="${weatherImage}" alt="Weather condition" style="vertical-align: middle; width: 32px; height: 32px;">
                Weather at ${location}
              </h2>
              <div style="display: flex; width: 100%;">
                <div style="flex: 1; padding: 10px;">
                  <p>Temperature: ${temperature}&deg;C</p>
                  <p>Precipitation: ${precipitation} mm</p>
                  <p>Cloud Cover: ${cloudCover}%</p>
                  <p>Wind Speed: ${windSpeed} kts</p>
                  <p>Wind Direction: ${windDirection}&deg;</p>
                  <p>Wind Gust: ${windGust} kts</p>
                  <p>${message}</p>
                  <p>Nearest Waterbody: ${nearestWaterbody.name}</p>
                  <p>Location: ${nearestWaterbody.latitude}, ${nearestWaterbody.longitude}</p>
                </div>
                <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
                  ${boatGif}
                </div>
              </div>
            </div>
          `;
        });
      } else {
        console.error('Unexpected location data structure:', data);
      }
    })
    .catch(error => console.error('Error fetching location data:', error));
}

function getDistanceToSea(lat, lon, callback) {
  const distanceToSeaUrl = `https://api.wateratlas.usf.edu/waterbodies/closest?lat=${lat}&lon=${lon}&accuracy=1&len=1&s=1`;
  console.log('Fetching distance to sea from:', distanceToSeaUrl);

  fetch(distanceToSeaUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Distance to sea data:', data);
      if (data && data.waterbodies && data.waterbodies.length > 0) {
        const nearestWaterbody = data.waterbodies[0].Waterbody;
        callback({
          name: nearestWaterbody.Name,
          latitude: nearestWaterbody.Location.latitude,
          longitude: nearestWaterbody.Location.longitude
        });
      } else {
        callback({ name: 'No data available', latitude: 'N/A', longitude: 'N/A' });
      }
    })
    .catch(error => {
      console.error('Error fetching distance to sea:', error);
      callback({ name: 'Error fetching data', latitude: 'N/A', longitude: 'N/A' });
    });
}

function getWeatherImage(weatherCode) {
  switch (weatherCode) {
    case 0: // Clear sky
      return 'sunny.png';
    case 1: // Mainly clear
    case 2: // Partly cloudy
    case 3: // Overcast
      return 'cloudy.png';
    case 45: // Fog
    case 48: // Depositing rime fog
      return 'fog.png';
    case 51: // Light drizzle
    case 53: // Moderate drizzle
    case 55: // Dense drizzle
    case 56: // Light freezing drizzle
    case 57: // Dense freezing drizzle
      return 'light_precipitation.png';
    case 61: // Slight rain
    case 63: // Moderate rain
    case 65: // Heavy rain
    case 66: // Light freezing rain
    case 67: // Heavy freezing rain
      return 'rain.png';
    case 71: // Slight snow fall
    case 73: // Moderate snow fall
    case 75: // Heavy snow fall
    case 77: // Snow grains
      return 'snow.png';
    case 80: // Slight rain showers
    case 81: // Moderate rain showers
    case 82: // Violent rain showers
      return 'rain.png';
    case 85: // Slight snow showers
    case 86: // Heavy snow showers
      return 'snow.png';
    case 95: // Thunderstorm
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      return 'storm.png';
    default:
      return 'unknown.png'; // Default image for unknown weather conditions
  }
}

function initMap() {
  if (navigator.geolocation) {
    console.log('Geolocation supported. Getting current position...');
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      console.log('Current position:', { lat, lon });
      getWeather(lat, lon);
    }, error => {
      console.error('Error getting location:', error);
    });
  } else {
    console.error('Geolocation not supported by this browser.');
  }
}

document.addEventListener('DOMContentLoaded', initMap);

//MOV R0, #25
//MVN R1, #10
//LSR R2, R0, R1
//LSL R3,R2,R1
//AND R4,R3,R2
//HALT

//MOV R6, #25
//MVN R1, R0
//AND R2,R1,#15
//LSL R3,R1,#3
//LSR R4,R1,#3
//HALT

//MOV R0,#0x100
//MOV R1, #2
//MOV R2, #1
//LOOP:
//LSL R0,R0,R2
//CMP R0,R1
//BLT LOOP
//CMP R0,R2
//BEQ END
//END:
//HALT

//MOV R0, #00000000
//MOV R0, #10101010

//MVN R1,R0

