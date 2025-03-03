// Shared geolocation function
async function getGeolocation() {
    let lat, lon;
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        console.log("Geolocation obtained:", { lat, lon });
      } catch (geoError) {
        console.warn("Geolocation denied or unavailable. Falling back to defaults.");
      }
    }
    return { lat, lon };
  }
  
  // Weather fetching function
async function fetchWeather() {
    try {
        const { lat, lon } = await getGeolocation();
        const weatherApiKey = "987aae377eb04262b64105333252502";
        const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat || ""},${lon || ""}&days=3&aqi=no&alerts=no`;
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) {
            throw new Error(`Weather API request failed: ${weatherRes.status}`);
        }

        const weatherData = await weatherRes.json();
        console.log("Weather API response:", weatherData);

        if (!weatherData.location) {
            throw new Error("Failed to retrieve location from weather data.");
        }

        // Update location info
        const city = weatherData.location.name;
        const region = weatherData.location.region || weatherData.location.country;
        document.querySelector(".locationTitle h2").textContent = city;
        document.querySelector(".locationTitle h4").textContent = region;

        if (!weatherData.forecast || !weatherData.forecast.forecastday) {
            throw new Error("Failed to retrieve weather forecast data.");
        }

        // Update sunrise and sunset times
        const todayForecast = weatherData.forecast.forecastday[0];
        const sunriseTime = todayForecast.astro.sunrise;
        const sunsetTime = todayForecast.astro.sunset;
        document.querySelector(".sunrise").innerHTML = `<span class="material-symbols-outlined">wb_twilight</span> ${sunriseTime}`;
        document.querySelector(".sunset").innerHTML = `<span class="material-symbols-outlined">routine</span> ${sunsetTime}`;

        // Update current weather details
        const currentWeather = weatherData.current;
        const currentTemp = Math.round(currentWeather.temp_c);
        const windSpeed = Math.round(currentWeather.wind_mph);
        const feelsLike = Math.round(currentWeather.feelslike_c);
        const cloudCoverage = currentWeather.cloud;
        const currentDesc = currentWeather.condition.text;

        // Populate info panels with new weather details
        const infoPanels = document.querySelectorAll(".currentData .infoPanel");

        if (infoPanels.length >= 4) {
            infoPanels[0].innerHTML = `<p>Current</p> ${currentTemp}°C`;
            infoPanels[2].innerHTML = `<p>Feels Like</p> ${feelsLike}°C`;
            infoPanels[3].innerHTML = `<p>Cloud Cover</p> ${cloudCoverage}%`;
            infoPanels[1].innerHTML = `<p>Wind Speed</p> ${windSpeed} mph`;
        }

        // Update current day container
        const currentDayContainer = document.querySelector(".currentDay .dayContainer");
        const todayDate = new Date(todayForecast.date);
        const todayDayName = todayDate.toLocaleDateString("en-US", { weekday: "short" });
        const todayMinTemp = Math.round(todayForecast.day.mintemp_c);
        const todayMaxTemp = Math.round(todayForecast.day.maxtemp_c);
        const todayIcon = todayForecast.day.condition.icon;
        const todayDesc = todayForecast.day.condition.text;
        currentDayContainer.innerHTML = `
            <div class="day">${todayDayName}</div>
            <div class="temp">${todayMinTemp}°C / ${todayMaxTemp}°C</div>
            <div class="weatherDesc">${currentDesc}</div>
        `;

        // Update forecast containers for the next two days
        const forecastContainers = document.querySelectorAll(".forecast .dayContainer");
        weatherData.forecast.forecastday.slice(1, 3).forEach((forecastDay, index) => {
            const forecastDate = new Date(forecastDay.date);
            const forecastDayName = forecastDate.toLocaleDateString("en-US", { weekday: "short" });
            const forecastMinTemp = Math.round(forecastDay.day.mintemp_c);
            const forecastMaxTemp = Math.round(forecastDay.day.maxtemp_c);
            const forecastIcon = forecastDay.day.condition.icon;
            const forecastDesc = forecastDay.day.condition.text;

            if (forecastContainers[index]) {
                forecastContainers[index].innerHTML = `
                    <div class="day">${forecastDayName}</div>
                    <img src="https:${forecastIcon}" alt="${forecastDesc}" title="${forecastDesc}">
                    <div class="temp">${forecastMinTemp}°C / ${forecastMaxTemp}°C</div>
                `;
            }
        });

    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.querySelector(".weekContainer").innerHTML = `<p>Failed to load weather data.</p>`;
    }
}

function updateSeasonCountdown() {
    const today = new Date();
    const year = today.getFullYear();

    // Define season start dates
    const seasons = [
        { name: "Spring", start: new Date(year, 2, 1) },  // March 1st
        { name: "Summer", start: new Date(year, 5, 1) },  // June 1st
        { name: "Autumn", start: new Date(year, 8, 1) },  // September 1st
        { name: "Winter", start: new Date(year, 11, 1) }, // December 1st
    ];

    let currentSeason, nextSeason, currentSeasonStart, nextSeasonStart;

    // Determine the current and next season
    for (let i = 0; i < seasons.length; i++) {
        if (today >= seasons[i].start) {
            currentSeason = seasons[i].name;
            nextSeason = seasons[(i + 1) % seasons.length].name;
            currentSeasonStart = seasons[i].start;
            nextSeasonStart = seasons[(i + 1) % seasons.length].start;
        }
    }

    // If today is past December 1st, set next season to Spring of the next year
    if (today >= seasons[3].start) {
        nextSeasonStart = new Date(year + 1, 2, 1); // March 1st of next year
    }

    // Calculate days into the current season and days until the next
    const daysIntoSeason = Math.floor((today - currentSeasonStart) / (1000 * 60 * 60 * 24));
    const daysUntilNext = Math.ceil((nextSeasonStart - today) / (1000 * 60 * 60 * 24));

    // Determine season phase based on how long it's been
    let seasonHeader;
    if (daysIntoSeason < 21) { 
        seasonHeader = `We're just starting ${currentSeason}`;
    } else if (daysIntoSeason < 56) { 
        seasonHeader = `We're well into ${currentSeason}`;
    } else { 
        seasonHeader = `We're nearing the end of ${currentSeason}`;
    }

    const countdownMessage = `${daysUntilNext} days to ${nextSeason}`;

    // Update the .tillSeason container
    const tillSeasonContainer = document.querySelector(".tillSeason");
    if (tillSeasonContainer) {
        tillSeasonContainer.innerHTML = `
            <h3>${seasonHeader}</h3>
            <h4>${countdownMessage}</h4>
        `;
    }
}

// Call the function when the page loads
updateSeasonCountdown();


// Call the function to fetch weather
fetchWeather();

async function updateWeatherDisplay() {
    try {
        const { lat, lon } = await getGeolocation();
        const weatherApiKey = "987aae377eb04262b64105333252502";
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${lat || ""},${lon || ""}&aqi=no`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error("Weather API request failed");
        const weatherData = await weatherRes.json();
        
        const hour = new Date().getHours();
        setTimeOfDay(hour);
        setCloudCover(weatherData.current.cloud > 75 ? 'heavy' : weatherData.current.cloud > 20 ? 'light' : 'none');
        if (weatherData.current.condition.text.toLowerCase().includes("rain")) {
            startRainEffect();
        } else {
            stopRainEffect();
        }
    } catch (error) {
        console.error("Error updating weather display:", error);
    }
}

// In the future have the sunset images go off location, not set times.
function setTimeOfDay(hour) {
    document.querySelectorAll('.sky').forEach(img => img.style.display = 'none');
    if (hour >= 18 || hour < 6) {
        document.getElementById(hour >= 0 && hour < 4 ? 'midnight' : 'low').style.display = 'block';
    } else if (hour >= 10 && hour < 18) {
        document.getElementById('afternoon').style.display = 'block';
    } else {
        document.getElementById('sundown').style.display = 'block';
    }
}

function setCloudCover(type) {
    document.querySelectorAll('.cloud').forEach(img => img.style.display = 'none');
    if (type !== 'none') {
        document.getElementById(type + 'Clouds').style.display = 'block';
    }
}

function startRainEffect() {
    const rainContainer = document.getElementById('rainEffect');
    rainContainer.innerHTML = '';
    for (let i = 0; i < 100; i++) {
        let drop = document.createElement('div');
        drop.classList.add('rain-drop');
        drop.style.left = Math.random() * 100 + 'vw';
        drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
        rainContainer.appendChild(drop);
    }
    rainContainer.style.display = 'block';
}

function stopRainEffect() {
    document.getElementById('rainEffect').style.display = 'none';
}

updateWeatherDisplay();

async function fetchWeatherForRovaniemi() {
    try {
        const lat = 66.5;  // Latitude for Rovaniemi, Finland
        const lon = 25.7;  // Longitude for Rovaniemi, Finland
        const weatherApiKey = "987aae377eb04262b64105333252502";
        const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=3&aqi=no&alerts=no`;
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) {
            throw new Error(`Weather API request failed: ${weatherRes.status}`);
        }

        const weatherData = await weatherRes.json();
        console.log("Weather API response:", weatherData);

        if (!weatherData.location) {
            throw new Error("Failed to retrieve location from weather data.");
        }

        // Update location info
        document.querySelector(".rovaniemi .customTitle h2").textContent = "Rovaniemi";
        document.querySelector(".rovaniemi .customTitle h4").textContent = "Finland";

        if (!weatherData.forecast || !weatherData.forecast.forecastday) {
            throw new Error("Failed to retrieve weather forecast data.");
        }

        // Update sunrise and sunset times
        const todayForecast = weatherData.forecast.forecastday[0];
        const sunriseTime = todayForecast.astro.sunrise;
        const sunsetTime = todayForecast.astro.sunset;
        document.querySelector(".rovaniemi .sunrise").innerHTML = `<span class="material-symbols-outlined">wb_twilight</span> ${sunriseTime}`;
        document.querySelector(".rovaniemi .sunset").innerHTML = `<span class="material-symbols-outlined">routine</span> ${sunsetTime}`;

        // Update current weather details
        const currentWeather = weatherData.current;
        const currentTemp = Math.round(currentWeather.temp_c);
        const windSpeed = Math.round(currentWeather.wind_kph); // Using kph since Finland uses metric
        const feelsLike = Math.round(currentWeather.feelslike_c);
        const cloudCoverage = currentWeather.cloud;
        const currentDesc = currentWeather.condition.text;

        // Ensure the info panels exist before updating
        const infoPanels = document.querySelectorAll(".rovaniemi .currentData .infoPanel");

        if (infoPanels && infoPanels.length >= 4) {
            infoPanels[0].innerHTML = `<p>Current Temp</p><span>${currentTemp}°C</span>`;
            infoPanels[1].innerHTML = `<p>Wind Speed</p><span>${windSpeed} kph</span>`;
            infoPanels[2].innerHTML = `<p>Feels Like</p><span>${feelsLike}°C</span>`;
            infoPanels[3].innerHTML = `<p>Cloud Cover</p><span>${cloudCoverage}%</span>`;
        } else {
            console.warn("Info panels not found or insufficient panels available.");
        }

        // Update forecast containers for the next three days
        const forecastContainers = document.querySelectorAll(".rovaniemi .customPlaceForecast .dayCustomContainer");
        weatherData.forecast.forecastday.forEach((forecastDay, index) => {
            if (forecastContainers[index]) {
                const forecastDate = new Date(forecastDay.date);
                const forecastDayName = forecastDate.toLocaleDateString("en-US", { weekday: "short" });
                const forecastMinTemp = Math.round(forecastDay.day.mintemp_c);
                const forecastMaxTemp = Math.round(forecastDay.day.maxtemp_c);
                const forecastIcon = forecastDay.day.condition.icon;
                const forecastDesc = forecastDay.day.condition.text;

                forecastContainers[index].innerHTML = `
                    <div class="day">${forecastDayName}</div>
                    <img src="https:${forecastIcon}" alt="${forecastDesc}" title="${forecastDesc}">
                    <div class="temp">${forecastMinTemp}°C / ${forecastMaxTemp}°C</div>
                `;
            }
        });
    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.querySelector(".rovaniemi .customPlaceForecast").innerHTML = `<p>Failed to load weather data.</p>`;
    }
}

// Call the function to fetch Rovaniemi weather
document.addEventListener("DOMContentLoaded", fetchWeatherForRovaniemi);


async function fetchWeatherForGlasgow() {
    try {
        const lat = 55.8;  // Latitude for Rovaniemi, Finland
        const lon = -4.25;  // Longitude for Rovaniemi, Finland
        const weatherApiKey = "987aae377eb04262b64105333252502";
        const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=3&aqi=no&alerts=no`;
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) {
            throw new Error(`Weather API request failed: ${weatherRes.status}`);
        }

        const weatherData = await weatherRes.json();
        console.log("Weather API response:", weatherData);

        if (!weatherData.location) {
            throw new Error("Failed to retrieve location from weather data.");
        }

        // Update location info
        document.querySelector(".Glasgow .customTitle h2").textContent = "Glasgow";
        document.querySelector(".Glasgow .customTitle h4").textContent = "Scotland";

        if (!weatherData.forecast || !weatherData.forecast.forecastday) {
            throw new Error("Failed to retrieve weather forecast data.");
        }

        // Update sunrise and sunset times
        const todayForecast = weatherData.forecast.forecastday[0];
        const sunriseTime = todayForecast.astro.sunrise;
        const sunsetTime = todayForecast.astro.sunset;
        document.querySelector(".Glasgow .sunrise").innerHTML = `<span class="material-symbols-outlined">wb_twilight</span> ${sunriseTime}`;
        document.querySelector(".Glasgow .sunset").innerHTML = `<span class="material-symbols-outlined">routine</span> ${sunsetTime}`;

        // Update current weather details
        const currentWeather = weatherData.current;
        const currentTemp = Math.round(currentWeather.temp_c);
        const windSpeed = Math.round(currentWeather.wind_kph); // Using kph since Finland uses metric
        const feelsLike = Math.round(currentWeather.feelslike_c);
        const cloudCoverage = currentWeather.cloud;
        const currentDesc = currentWeather.condition.text;

        // Ensure the info panels exist before updating
        const infoPanels = document.querySelectorAll(".Glasgow .currentData .infoPanel");

        if (infoPanels && infoPanels.length >= 4) {
            infoPanels[0].innerHTML = `<p>Current Temp</p><span>${currentTemp}°C</span>`;
            infoPanels[1].innerHTML = `<p>Wind Speed</p><span>${windSpeed} kph</span>`;
            infoPanels[2].innerHTML = `<p>Feels Like</p><span>${feelsLike}°C</span>`;
            infoPanels[3].innerHTML = `<p>Cloud Cover</p><span>${cloudCoverage}%</span>`;
        } else {
            console.warn("Info panels not found or insufficient panels available.");
        }

        // Update forecast containers for the next three days
        const forecastContainers = document.querySelectorAll(".Glasgow .customPlaceForecast .dayCustomContainer");
        weatherData.forecast.forecastday.forEach((forecastDay, index) => {
            if (forecastContainers[index]) {
                const forecastDate = new Date(forecastDay.date);
                const forecastDayName = forecastDate.toLocaleDateString("en-US", { weekday: "short" });
                const forecastMinTemp = Math.round(forecastDay.day.mintemp_c);
                const forecastMaxTemp = Math.round(forecastDay.day.maxtemp_c);
                const forecastIcon = forecastDay.day.condition.icon;
                const forecastDesc = forecastDay.day.condition.text;

                forecastContainers[index].innerHTML = `
                    <div class="day">${forecastDayName}</div>
                    <img src="https:${forecastIcon}" alt="${forecastDesc}" title="${forecastDesc}">
                    <div class="temp">${forecastMinTemp}°C / ${forecastMaxTemp}°C</div>
                `;
            }
        });
    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.querySelector(".Glasgow .customPlaceForecast").innerHTML = `<p>Failed to load weather data.</p>`;
    }
}

// Call the function to fetch Rovaniemi weather
document.addEventListener("DOMContentLoaded", fetchWeatherForGlasgow);

async function fetchWeatherForLondon() {
    try {
        const lat = 51.5;  // Latitude for Rovaniemi, Finland
        const lon = -0.1;  // Longitude for Rovaniemi, Finland
        const weatherApiKey = "987aae377eb04262b64105333252502";
        const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=3&aqi=no&alerts=no`;
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) {
            throw new Error(`Weather API request failed: ${weatherRes.status}`);
        }

        const weatherData = await weatherRes.json();
        console.log("Weather API response:", weatherData);

        if (!weatherData.location) {
            throw new Error("Failed to retrieve location from weather data.");
        }

        // Update location info
        document.querySelector(".London .customTitle h2").textContent = "London";
        document.querySelector(".London .customTitle h4").textContent = "England";

        if (!weatherData.forecast || !weatherData.forecast.forecastday) {
            throw new Error("Failed to retrieve weather forecast data.");
        }

        // Update sunrise and sunset times
        const todayForecast = weatherData.forecast.forecastday[0];
        const sunriseTime = todayForecast.astro.sunrise;
        const sunsetTime = todayForecast.astro.sunset;
        document.querySelector(".London .sunrise").innerHTML = `<span class="material-symbols-outlined">wb_twilight</span> ${sunriseTime}`;
        document.querySelector(".London .sunset").innerHTML = `<span class="material-symbols-outlined">routine</span> ${sunsetTime}`;

        // Update current weather details
        const currentWeather = weatherData.current;
        const currentTemp = Math.round(currentWeather.temp_c);
        const windSpeed = Math.round(currentWeather.wind_kph); // Using kph since Finland uses metric
        const feelsLike = Math.round(currentWeather.feelslike_c);
        const cloudCoverage = currentWeather.cloud;
        const currentDesc = currentWeather.condition.text;

        // Ensure the info panels exist before updating
        const infoPanels = document.querySelectorAll(".London .currentData .infoPanel");

        if (infoPanels && infoPanels.length >= 4) {
            infoPanels[0].innerHTML = `<p>Current Temp</p><span>${currentTemp}°C</span>`;
            infoPanels[1].innerHTML = `<p>Wind Speed</p><span>${windSpeed} kph</span>`;
            infoPanels[2].innerHTML = `<p>Feels Like</p><span>${feelsLike}°C</span>`;
            infoPanels[3].innerHTML = `<p>Cloud Cover</p><span>${cloudCoverage}%</span>`;
        } else {
            console.warn("Info panels not found or insufficient panels available.");
        }

        // Update forecast containers for the next three days
        const forecastContainers = document.querySelectorAll(".London .customPlaceForecast .dayCustomContainer");
        weatherData.forecast.forecastday.forEach((forecastDay, index) => {
            if (forecastContainers[index]) {
                const forecastDate = new Date(forecastDay.date);
                const forecastDayName = forecastDate.toLocaleDateString("en-US", { weekday: "short" });
                const forecastMinTemp = Math.round(forecastDay.day.mintemp_c);
                const forecastMaxTemp = Math.round(forecastDay.day.maxtemp_c);
                const forecastIcon = forecastDay.day.condition.icon;
                const forecastDesc = forecastDay.day.condition.text;

                forecastContainers[index].innerHTML = `
                    <div class="day">${forecastDayName}</div>
                    <img src="https:${forecastIcon}" alt="${forecastDesc}" title="${forecastDesc}">
                    <div class="temp">${forecastMinTemp}°C / ${forecastMaxTemp}°C</div>
                `;
            }
        });
    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.querySelector(".London .customPlaceForecast").innerHTML = `<p>Failed to load weather data.</p>`;
    }
}

// Call the function to fetch Rovaniemi weather
document.addEventListener("DOMContentLoaded", fetchWeatherForLondon);

