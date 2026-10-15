/* =========================================
   NEON WEATHER
   Weather Dashboard - Fixed JavaScript
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    // HTML Elements
    const searchForm = document.getElementById("searchForm");
    const cityInput = document.getElementById("cityInput");
    const searchButton = document.getElementById("searchButton");

    const message = document.getElementById("message");
    const weatherDashboard = document.getElementById("weatherDashboard");
    const welcomePanel = document.getElementById("welcomePanel");

    const locationName = document.getElementById("locationName");
    const localTime = document.getElementById("localTime");

    const weatherVisual = document.getElementById("weatherVisual");
    const weatherDescription = document.getElementById("weatherDescription");
    const temperature = document.getElementById("temperature");
    const feelsLike = document.getElementById("feelsLike");

    const humidity = document.getElementById("humidity");
    const humidityBar = document.getElementById("humidityBar");

    const windSpeed = document.getElementById("windSpeed");
    const windBar = document.getElementById("windBar");

    const sunrise = document.getElementById("sunrise");
    const sunset = document.getElementById("sunset");

    // Check required elements
    const requiredElements = [
        searchForm,
        cityInput,
        searchButton,
        message,
        weatherDashboard,
        welcomePanel,
        locationName,
        localTime,
        weatherVisual,
        weatherDescription,
        temperature,
        feelsLike,
        humidity,
        humidityBar,
        windSpeed,
        windBar,
        sunrise,
        sunset
    ];

    if (requiredElements.some(element => !element)) {
        console.error("Some required HTML elements are missing.");
        return;
    }

    // Display messages
    function showMessage(text, type = "") {
        message.textContent = text;
        message.className = "message";

        if (type) {
            message.classList.add(type);
        }
    }

    // Weather conditions
    function getWeatherDetails(code, isDay) {

        if (code === 0) {
            return {
                description: "Clear Sky",
                icon: isDay ? "☀️" : "🌙"
            };
        }

        if (code === 1) {
            return {
                description: "Mainly Clear",
                icon: isDay ? "🌤️" : "🌙"
            };
        }

        if (code === 2) {
            return {
                description: "Partly Cloudy",
                icon: "⛅"
            };
        }

        if (code === 3) {
            return {
                description: "Overcast",
                icon: "☁️"
            };
        }

        if ([45, 48].includes(code)) {
            return {
                description: "Foggy Atmosphere",
                icon: "🌫️"
            };
        }

        if ([51, 53, 55, 56, 57].includes(code)) {
            return {
                description: "Drizzle",
                icon: "🌦️"
            };
        }

        if ([61, 63, 65, 66, 67].includes(code)) {
            return {
                description: "Rainy Weather",
                icon: "🌧️"
            };
        }

        if ([71, 73, 75, 77].includes(code)) {
            return {
                description: "Snowfall",
                icon: "❄️"
            };
        }

        if ([80, 81, 82].includes(code)) {
            return {
                description: "Rain Showers",
                icon: "🌧️"
            };
        }

        if ([85, 86].includes(code)) {
            return {
                description: "Snow Showers",
                icon: "🌨️"
            };
        }

        if ([95, 96, 99].includes(code)) {
            return {
                description: "Thunderstorm",
                icon: "⛈️"
            };
        }

        return {
            description: "Weather Unavailable",
            icon: "🌍"
        };
    }

    // Format sunrise and sunset
    function formatTime(timeString) {

        if (!timeString || !timeString.includes("T")) {
            return "--:--";
        }

        const timePart = timeString.split("T")[1];
        const parts = timePart.split(":");

        let hours = Number(parts[0]);
        const minutes = parts[1];

        const period = hours >= 12 ? "PM" : "AM";

        hours = hours % 12 || 12;

        return `${hours}:${minutes} ${period}`;
    }

    // Fetch API data
    async function fetchJSON(url) {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Weather service error: ${response.status}`
            );
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(
                data.reason || "API request failed."
            );
        }

        return data;
    }

    // Main weather function
    async function getWeather(city) {

        city = String(city || "").trim();

        if (!city) {
            showMessage(
                "Please enter a city name.",
                "error"
            );
            cityInput.focus();
            return;
        }

        // Prevent repeated requests
        if (searchButton.disabled) {
            return;
        }

        searchButton.disabled = true;
        searchButton.textContent = "LOADING...";

        showMessage("Searching for weather information...");

        try {

            // STEP 1: Find city coordinates
            const geoURL = new URL(
                "https://geocoding-api.open-meteo.com/v1/search"
            );

            geoURL.searchParams.set("name", city);
            geoURL.searchParams.set("count", "10");
            geoURL.searchParams.set("language", "en");
            geoURL.searchParams.set("format", "json");

            const geoData = await fetchJSON(
                geoURL.toString()
            );

            if (
                !geoData.results ||
                geoData.results.length === 0
            ) {
                throw new Error(
                    "City not found. Please check the spelling."
                );
            }

            // Prefer exact city match
            const cityData = geoData.results.find(
                item =>
                    item.name.toLowerCase() === city.toLowerCase()
            ) || geoData.results[0];

            const latitude = cityData.latitude;
            const longitude = cityData.longitude;

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {
                throw new Error(
                    "Invalid location coordinates."
                );
            }

            // STEP 2: Get weather information
            const weatherURL = new URL(
                "https://api.open-meteo.com/v1/forecast"
            );

            weatherURL.searchParams.set(
                "latitude",
                latitude
            );

            weatherURL.searchParams.set(
                "longitude",
                longitude
            );

            weatherURL.searchParams.set(
                "current",
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "is_day",
                    "weather_code",
                    "wind_speed_10m"
                ].join(",")
            );

            weatherURL.searchParams.set(
                "daily",
                "sunrise,sunset"
            );

            weatherURL.searchParams.set(
                "timezone",
                "auto"
            );

            weatherURL.searchParams.set(
                "forecast_days",
                "1"
            );

            const weatherData = await fetchJSON(
                weatherURL.toString()
            );

            if (
                !weatherData.current ||
                !weatherData.daily
            ) {
                throw new Error(
                    "Incomplete weather data received."
                );
            }

            // STEP 3: Display results
            displayWeather(cityData, weatherData);

            showMessage(
                "Weather data updated successfully!",
                "success"
            );

        } catch (error) {

            console.error(
                "Weather API Error:",
                error
            );

            let errorMessage =
                error.message || "Unable to load weather.";

            if (error instanceof TypeError) {
                errorMessage =
                    "Network error. Check your internet connection.";
            }

            showMessage(errorMessage, "error");

        } finally {

            // Restore button
            searchButton.disabled = false;

            searchButton.innerHTML =
                'EXPLORE <span aria-hidden="true">↗</span>';
        }
    }

    // Display weather data
    function displayWeather(cityData, data) {

        const current = data.current;
        const daily = data.daily;

        // Location
        const locationParts = [
            cityData.name,
            cityData.admin1,
            cityData.country
        ].filter(Boolean);

        locationName.textContent =
            [...new Set(locationParts)].join(", ");

        // Local time
        if (current.time) {
            localTime.textContent =
                "LOCAL TIME: " +
                current.time.replace("T", " ");
        } else {
            localTime.textContent =
                "LOCAL TIME: Unavailable";
        }

        // Weather condition
        const weather = getWeatherDetails(
            current.weather_code,
            current.is_day === 1
        );

        weatherDescription.textContent =
            weather.description;

        weatherVisual.textContent =
            weather.icon;

        // Temperature
        temperature.textContent =
            Math.round(current.temperature_2m);

        // Feels like
        feelsLike.textContent =
            `Feels like ${Math.round(
                current.apparent_temperature
            )}°C`;

        // Humidity
        const humidityValue =
            Number(current.relative_humidity_2m);

        humidity.textContent =
            humidityValue;

        humidityBar.style.width =
            `${Math.min(
                100,
                Math.max(0, humidityValue)
            )}%`;

        // Wind speed
        const windValue =
            Number(current.wind_speed_10m);

        windSpeed.textContent =
            windValue.toFixed(1);

        windBar.style.width =
            `${Math.min(
                100,
                Math.max(0, windValue * 2)
            )}%`;

        // Sunrise
        sunrise.textContent =
            formatTime(daily.sunrise?.[0]);

        // Sunset
        sunset.textContent =
            formatTime(daily.sunset?.[0]);

        // Show dashboard
        weatherDashboard.hidden = false;

        // Hide welcome panel
        welcomePanel.hidden = true;

        // Scroll to weather results
        weatherDashboard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // Search form event
    searchForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const city = cityInput.value.trim();

            getWeather(city);
        }
    );

    // Suggested city buttons
    document.querySelectorAll(".city-chip")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const city = this.dataset.city;

                    if (!city) {
                        return;
                    }

                    cityInput.value = city;

                    getWeather(city);
                }
            );
        });

    console.log(
        "Neon Weather JavaScript loaded successfully."
    );

});