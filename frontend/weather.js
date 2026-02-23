const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const stateSelect = document.querySelector(".stateSelect");
const countrySelect = document.querySelector(".countrySelect");
const suggestions = document.getElementById("suggestions");
const card = document.querySelector(".card");

// Toast Notification System
let toastContainer = null;

function showToast(message, type = 'info') {
    // Create container if it doesn't exist
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
        // Remove container if empty
        if (toastContainer.children.length === 0) {
            toastContainer.remove();
            toastContainer = null;
        }
    }, 3000);
}



const cityHeading = document.querySelector(".City");
const headingSection = document.querySelector(".Heading");
const loadingContainer = document.querySelector(".loading-container");

const favButton = document.getElementById("favButton");

const actionButtons = document.querySelector('.action-buttons');
const shareButton = document.getElementById('shareButton');
const savedLocationsContainer = document.querySelector('.saved-locations-container');
const savedLocationsList = document.getElementById('savedLocationsList');
const addLocationBtn = document.getElementById('addLocationBtn');

let currentCity = null;
let currentState = '';
let currentCountry = 'US';
let currentCoords = null;
let currentTimezone = 0; // timezone offset in seconds from UTC
let riseTime = null;
let setTime = null;
let savedLocations = JSON.parse(localStorage.getItem('savedWeatherLocations') || '[]');

const locationBtn = document.getElementById('locationBtn');

let cities = [];
let countryCodes = {};
let stateCodes = {};

// Load all data
Promise.all([
    fetch("cities.json").then(response => response.json()),
    fetch("countrycodes.json").then(response => response.json()),
    fetch("statecodes.json").then(response => response.json())
]).then(([citiesData, countryData, stateData]) => {
    cities = citiesData;
    countryCodes = countryData;
    stateCodes = stateData;
    
    // Populate country dropdown
    populateCountryDropdown();
    
    // Set US as default
    countrySelect.value = 'US';
    // Hide country and state selects from the UI (we still populate state data for backend use)
    countrySelect.style.display = 'none';
    stateSelect.style.display = 'none';
    populateStateDropdown();
});

// Cookie helper functions
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function deleteCookie(name) {
    setCookie(name, "", -1);
}

// Populate country dropdown
function populateCountryDropdown() {
    const sortedCountries = Object.entries(countryCodes).sort((a, b) => a[1].localeCompare(b[1]));
    sortedCountries.forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        countrySelect.appendChild(option);
    });
}

// Populate state dropdown (US only)
function populateStateDropdown() {
    stateSelect.innerHTML = '<option value="">State (Optional)</option>';
    Object.entries(stateCodes).forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        stateSelect.appendChild(option);
    });
}

// Handle country selection change
countrySelect.addEventListener('change', () => {
    if (countrySelect.value === 'US') {
        // keep state dropdown data updated for backend/state resolution, but do not show the select in the UI
        populateStateDropdown();
    } else {
        stateSelect.style.display = 'none';
        stateSelect.value = '';
    }
});

// Autocomplete with in-memory search
cityInput.addEventListener("input", () => {
    const query = cityInput.value.trim().toLowerCase();

    suggestions.innerHTML = '';
    suggestions.classList.remove('show');

    if (query.length < 2) return;

    const matches = cities.filter(city => city.name.toLowerCase().startsWith(query))
        .slice(0, 10);

    if (matches.length > 0) {
        suggestions.classList.add('show');
    }

    matches.forEach(city => {
        const li = document.createElement('li');
        // Find the match position
        const cityName = city.name;
        const queryIndex = cityName.toLowerCase().indexOf(query);

        // Format location string based on original format
        let locationStr;
        if (city.subcountry) {
            locationStr = `${city.subcountry}, ${city.country}`;
        } else if (city.state) {
            // Map state code to name for US cities
            const stateName = city.country === 'US' && stateCodes[city.state] 
                ? stateCodes[city.state] 
                : city.state;
            locationStr = stateName ? `${stateName}, ${countryCodes[city.country] || city.country}` : (countryCodes[city.country] || city.country);
        } else {
            locationStr = countryCodes[city.country] || city.country;
        }

        if (queryIndex !== -1) {
            // Split and wrap the matched part in <strong>
            const before = cityName.slice(0, queryIndex);
            const match = cityName.slice(queryIndex, queryIndex + query.length);
            const after = cityName.slice(queryIndex + query.length);

            li.innerHTML = `${before}<strong>${match}</strong>${after}, ${locationStr}`;
        } else {
            li.textContent = `${city.name}, ${locationStr}`;
        }

        li.addEventListener('click', async () => {
            // Set city name
            cityInput.value = city.name;
            
            // Handle both old format (subcountry) and new format (state code)
            const countryCode = city.country.length === 2 ? city.country : Object.keys(countryCodes).find(
                code => countryCodes[code] === city.country
            );
            
            if (countryCode) {
                countrySelect.value = countryCode;
                // Keep selects hidden; set state value for backend if available
                if (countryCode === 'US') {
                    if (city.state) {
                        stateSelect.value = city.state;
                    } else if (city.subcountry) {
                        // Try to find state code from subcountry name
                        const stateCode = Object.keys(stateCodes).find(
                            code => stateCodes[code] === city.subcountry
                        );
                        if (stateCode) {
                            stateSelect.value = stateCode;
                        } else {
                            stateSelect.value = '';
                        }
                    } else {
                        stateSelect.value = '';
                    }
                } else {
                    stateSelect.value = '';
                }
            }

            suggestions.innerHTML = '';
            suggestions.classList.remove('show');
            
            // Trigger form submission
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            weatherForm.dispatchEvent(submitEvent);
        });

        suggestions.appendChild(li);
    });
});

// Geolocation Feature
if (locationBtn) {
    locationBtn.addEventListener('click', async () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        // Show loading state
        locationBtn.disabled = true;
        locationBtn.style.opacity = '0.6';
        showToast('Getting your location...', 'info');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Show loading spinner
                    if(loadingContainer) loadingContainer.style.display = 'flex';
                    if(card) card.style.display = 'none';
                    if(headingSection) headingSection.style.display = 'none';
                    if(actionButtons) actionButtons.style.display = 'none';

                    // Fetch weather using coordinates
                    const weatherData = await getWeatherDataByCoords(latitude, longitude);
                    console.log(weatherData);
                    
                    // Track state and country from coords (will be available in weatherData)
                    currentState = '';
                    currentCountry = weatherData.sys?.country || 'US';
                    // Store ORIGINAL geolocation coordinates, not the API response coordinates
                    // This ensures we save the exact location the user was at
                    currentCoords = { lat: latitude, lon: longitude };
                    
                    // Update the city input with the location name
                    if (weatherData.name) {
                        cityInput.value = weatherData.name;
                    }
                    
                    // Fetch forecast data
                    const forecastData = await getForecastByCoords(latitude, longitude);
                    console.log(forecastData);
                    
                    const dailyData = await getDailyForecastByCoords(latitude, longitude);
                    console.log(dailyData);
                    
                    displayWeatherInfo(weatherData, dailyData);
                    displayHourlyForecast(forecastData, dailyData);
                    displayDailyForecast(dailyData);
                    
                    showToast('Weather loaded for your location!', 'success');
                    
                    // Hide loading spinner
                    if(loadingContainer) loadingContainer.style.display = 'none';
                } catch(error) {
                    console.error(error);
                    if(loadingContainer) loadingContainer.style.display = 'none';
                    showToast('Unable to fetch weather for your location', 'error');
                    displayError("Sorry, we were unable to fetch weather for your location. Please try again.");
                } finally {
                    // Re-enable button
                    locationBtn.disabled = false;
                    locationBtn.style.opacity = '1';
                }
            },
            (error) => {
                // Handle geolocation error
                let errorMessage = 'Unable to get your location';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                
                showToast(errorMessage, 'error');
                console.error('Geolocation error:', error);
                
                // Re-enable button
                locationBtn.disabled = false;
                locationBtn.style.opacity = '1';
            }
        );
    });
}


weatherForm.addEventListener("submit", async event => {
    event.preventDefault();

    const city = cityInput.value.trim();
    // Keep using the country/state values for backend, but default to US/empty if not present
    const country = countrySelect.value || 'US';
    const state = stateSelect.value || '';

    suggestions.innerHTML = '';
    suggestions.classList.remove('show');
    
    if(!city) {
        displayError("Please enter a city");
        return;
    }
    // No frontend country selection required; backend will receive `country` (defaults to 'US')

    // Show loading spinner
    if(loadingContainer) loadingContainer.style.display = 'flex';
    if(card) card.style.display = 'none';
    if(headingSection) headingSection.style.display = 'none';
    if(actionButtons) actionButtons.style.display = 'none';

    try {
        const weatherData = await getWeatherData(city, state, country);
        console.log(weatherData);
        
        // Track current state and country
        currentState = state;
        currentCountry = country;
        
        // Fetch hourly forecast data (24 hours from Pro API)
        const forecastData = await getForecast(city, state, country);
        console.log(forecastData);
        
        // Fetch daily forecast data (7 days from Pro API)
        const dailyData = await getDailyForecast(city, state, country);
        console.log(dailyData);
        
        displayWeatherInfo(weatherData, dailyData);
        displayHourlyForecast(forecastData, dailyData);
        displayDailyForecast(dailyData);
        
        // Hide loading spinner
        if(loadingContainer) loadingContainer.style.display = 'none';
    } catch(error) {
        console.error(error);
        // Hide loading spinner on error
        if(loadingContainer) loadingContainer.style.display = 'none';
        displayError("Sorry, you either entered an invalid city name, or we were unable to process your request. Please try again.");
    }
});

// Fetch weather data by coordinates
async function getWeatherDataByCoords(lat, lon) {
    const apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather?lat=${lat}&lon=${lon}`;
    const response = await fetch(apiUrl);
    
    if(!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Fetch forecast data by coordinates
async function getForecastByCoords(lat, lon) {
    const apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather/forecast?lat=${lat}&lon=${lon}`;
    const response = await fetch(apiUrl);
    
    if(!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Fetch daily forecast data by coordinates
async function getDailyForecastByCoords(lat, lon) {
    const apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather/forecast/daily?lat=${lat}&lon=${lon}`;
    const response = await fetch(apiUrl);
    
    if(!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

async function getWeatherData(city, state = '', country = 'US') {
    // Prefer coordinates when appropriate:
    // - If no city provided but currentCoords exists, use coords.
    // - If the requested city matches the currently displayed city and currentCoords exists, use coords (ensures exact location for geolocated subscribers).
    try {
        if ((!city || city === '') && currentCoords && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lon)) {
            return await getWeatherDataByCoords(currentCoords.lat, currentCoords.lon);
        }

        if (currentCoords && currentCity && city && city === currentCity && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lon)) {
            return await getWeatherDataByCoords(currentCoords.lat, currentCoords.lon);
        }

        // Fallback to city-based lookup
        let apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
        if (state && country === 'US') {
            apiUrl += `&state=${encodeURIComponent(state)}`;
        }

        const response = await fetch(apiUrl);
        if(!response.ok) {
            throw new Error("Could not fetch weather data");
        }

        return await response.json();
    } catch (err) {
        throw err;
    }
}

async function getForecast(city, state = '', country = 'US') {
    try {
        // Use coords when appropriate (same rules as getWeatherData)
        if ((!city || city === '') && currentCoords && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lon)) {
            return await getForecastByCoords(currentCoords.lat, currentCoords.lon);
        }

        if (currentCoords && currentCity && city && city === currentCity && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lon)) {
            return await getForecastByCoords(currentCoords.lat, currentCoords.lon);
        }

        let apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather/forecast?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
        if (state && country === 'US') {
            apiUrl += `&state=${encodeURIComponent(state)}`;
        }

        const response = await fetch(apiUrl);
        if(!response.ok) {
            throw new Error("Could not fetch forecast data");
        }

        return await response.json();
    } catch (err) {
        throw err;
    }
}

async function getDailyForecast(city, state = '', country = 'US') {
    try {
        if ((!city || city === '') && currentCoords && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lon)) {
            return await getDailyForecastByCoords(currentCoords.lat, currentCoords.lon);
        }

        if (currentCoords && currentCity && city && city === currentCity && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lon)) {
            return await getDailyForecastByCoords(currentCoords.lat, currentCoords.lon);
        }

        let apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather/forecast/daily?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
        if (state && country === 'US') {
            apiUrl += `&state=${encodeURIComponent(state)}`;
        }

        const response = await fetch(apiUrl);
        if(!response.ok) {
            throw new Error("Could not fetch daily forecast data");
        }

        return await response.json();
    } catch (err) {
        throw err;
    }
}

function parseDailyForecast(forecastData) {
    console.log(forecastData);
    if (!forecastData || !forecastData.list) return null;
    
    const dailyMap = new Map();
    
    // Group forecast data by day
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        // Use sys.pod to determine day or night ("d" = day, "n" = night)
        const isDaytime = item.sys && item.sys.pod === 'd';
        
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, {
                dt: Math.floor(new Date(date).setHours(12, 0, 0, 0) / 1000),
                temp: { min: item.main.temp, max: item.main.temp },
                dayWeather: isDaytime ? item.weather[0] : null,
                nightWeather: !isDaytime ? item.weather[0] : null,
                dayIcon: isDaytime ? item.weather[0].icon : null,
                nightIcon: !isDaytime ? item.weather[0].icon : null,
                temps: [item.main.temp]
            });
        } else {
            const day = dailyMap.get(dateKey);
            day.temp.min = Math.min(day.temp.min, item.main.temp);
            day.temp.max = Math.max(day.temp.max, item.main.temp);
            day.temps.push(item.main.temp);
            
            // Update day/night weather
            if (isDaytime && !day.dayWeather) {
                day.dayWeather = item.weather[0];
            }
            if (!isDaytime && !day.nightWeather) {
                day.nightWeather = item.weather[0];
            }
            
            // Store both day and night icons
            if (isDaytime && !day.dayIcon) {
                day.dayIcon = item.weather[0].icon;
            }
            if (!isDaytime && !day.nightIcon) {
                day.nightIcon = item.weather[0].icon;
            }
        }
    });
    
    // Convert to array and fill missing day/night icons
    const dailyList = Array.from(dailyMap.values()).map(day => {
        // If missing day icon but have night icon, convert night to day
        if (!day.dayIcon && day.nightIcon) {
            day.dayIcon = day.nightIcon.replace('n', 'd');
            if (!day.dayWeather && day.nightWeather) {
                day.dayWeather = day.nightWeather;
            }
        }
        // If missing night icon but have day icon, convert day to night
        if (!day.nightIcon && day.dayIcon) {
            day.nightIcon = day.dayIcon.replace('d', 'n');
            if (!day.nightWeather && day.dayWeather) {
                day.nightWeather = day.dayWeather;
            }
        }
        return day;
    }).slice(0, 6);
    
    return { list: dailyList };
}

function displayWeatherInfo(data, dailyData){

    const { name: city, 
            main: {temp,humidity,temp_max,temp_min, feels_like}, 
            weather:[{description, icon}],
            sys: {sunrise, sunset},
            coord,
            timezone} = data;

    
    cityHeading.textContent="";

    card.textContent = "";

    card.style.display="flex";

    const tempDisplay = document.createElement("h2");

    const lowHighDisplay = document.createElement("p");

    const likeDisplay = document.createElement("p");

    const humidityDisplay = document.createElement("p");

    const descDisplay = document.createElement("p");

    const weatherEmoji = document.createElement("img");

    const riseSetdisplay = document.createElement("p");

    cityHeading.textContent = city;
    currentCity = city;
    currentCoords = coord;
    currentTimezone = timezone;
    
    // show heading section
    if(headingSection){
        headingSection.style.display = 'flex';
    }
    
    // show action buttons
    if(actionButtons){
        actionButtons.style.display = 'flex';
    }
    
    // show favorite button when a city is displayed
    if(favButton){
        favButton.style.display = 'inline-block';
        const favCity = getCookie('favoriteCity');
        if(favCity && decodeURIComponent(favCity) === city){
            favButton.textContent = 'Remove favorite';
        }
        else{
            favButton.textContent = 'Add to favorites';
        }
        favButton.onclick = () => {
            const currentFav = getCookie('favoriteCity');
            if(currentFav && decodeURIComponent(currentFav) === city){
                deleteCookie('favoriteCity');
                favButton.textContent = 'Add to favorites';
            } else {
                setCookie('favoriteCity', encodeURIComponent(city), 365);
                favButton.textContent = 'Remove favorite';
            }
        };
    }
    
    

    tempDisplay.textContent = `${((temp-273.15)*9/5 +32).toFixed(0)}°F`;

    tempDisplay.classList.add("tempDisplay");

    // Use today's high/low from daily forecast if available
    let todayHigh = temp_max;
    let todayLow = temp_min;
    
    if(dailyData && dailyData.list && dailyData.list[0]) {
        todayHigh = dailyData.list[0].temp.max;
        todayLow = dailyData.list[0].temp.min;
    }

    const highF = ((todayHigh-273.15)*9/5 +32).toFixed(0);
    const lowF = ((todayLow-273.15)*9/5 +32).toFixed(0);

    lowHighDisplay.innerHTML = `<span class="daily-high">↑${highF}°</span> <span class="daily-low">↓${lowF}°</span>`;
    lowHighDisplay.classList.add("lowDisplay");
    

    likeDisplay.textContent = `Feels like: ${((feels_like-273.15)*9/5 +32).toFixed(0)}°`;

    likeDisplay.classList.add("likeDisplay");
    

    humidityDisplay.textContent = `Humidity: ${humidity}%`;

    humidityDisplay.classList.add("humidityDisplay");

    descDisplay.textContent = description;

    descDisplay.classList.add("descDisplay");

    

    weatherEmoji.src = 'https://openweathermap.org/img/wn/' + icon + '@2x.png';
    weatherEmoji.width = 100;
    weatherEmoji.alt = description;

    weatherEmoji.classList.add("weatherEmoji");

    // Convert sunrise/sunset from UTC to location's local time
    // sunrise and sunset are Unix timestamps in UTC
    // timezone is the shift in seconds from UTC
    riseTime = new Date((sunrise + timezone) * 1000);
    setTime = new Date((sunset + timezone) * 1000);
    
    

    // Times are already in location's timezone, use UTC methods to extract
    let riseTimeHours = riseTime.getUTCHours();

    let riseMeridiem = riseTimeHours>=12 ? "PM":"AM";

    riseTimeHours = riseTimeHours%12;

    if(riseTimeHours===0){
        riseTimeHours=12;
    }
    riseTimeHours = riseTimeHours.toString().padStart(2,0);

    let riseTimeMinutes = riseTime.getUTCMinutes().toString().padStart(2,0);

    let setTimeHours = setTime.getUTCHours();

    let setMeridiem = setTimeHours>=12 ? "PM":"AM";

    setTimeHours = setTimeHours%12;

    if(setTimeHours===0){
        setTimeHours=12;
    }

    setTimeHours = setTimeHours.toString().padStart(2,0);

    let setTimeMinutes = setTime.getUTCMinutes().toString().padStart(2,0);

    riseSetdisplay.innerHTML = `
        <div class="rise-set-item">
            <img src="images/sunrise.png" alt="Sunrise" class="rise-set-icon">
            <span>${riseTimeHours}:${riseTimeMinutes} ${riseMeridiem}</span>
        </div>
        <div class="rise-set-item">
            <img src="images/sunset.png" alt="Sunset" class="rise-set-icon">
            <span>${setTimeHours}:${setTimeMinutes} ${setMeridiem}</span>
        </div>
    `;

    riseSetdisplay.classList.add("riseSetDisplay");

    card.appendChild(tempDisplay);

    card.appendChild(weatherEmoji);

    card.appendChild(descDisplay);

    card.appendChild(lowHighDisplay);

    card.appendChild(likeDisplay);

    card.appendChild(humidityDisplay);

    card.appendChild(riseSetdisplay);
    
    
    document.body.style.background = getBackground(icon);
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center";
    document.body.style.transition = "background 2s ease-in-out";


}
function getBackground(icon){
    switch(icon){
        case "01d":
            return "url('images/clearsky.jpg')";
        case "01n":
            return "url('images/clearskynight.jpeg')";
        case "02d":
            return "url('images/fewclouds.jpg')";
        case "02n":
            return "url('images/fewcloudsnight.png')";
        case "03d":
            return "url('images/scatteredclouds.png')";
        case "03n":
            return "url('images/scatteredcloudsnight.png')";
        case "04d":
            return "url('images/brokenclouds.png')"; 
        case "04n":
            return "url('images/brokencloudsnight.png')";
        case "09d":
            return "url('images/lightrain.png')";
        case "09n":
            return "url('images/nightrain.png')";
        case "10d":
            return "url('images/rain.png')";
        case  "10n":
            return "url('images/nightrain.png')";
        case  "11d":
            return "url('images/thunderstorm.png')";
        case "11n":
            return "url('images/thunderstormnight.png')";
        case "13d": 
            return "url('images/snow.png')";
        case "13n":
            return "url('images/nightsnow.png')";
        case "50d":
            return "url('images/mist.png')";
        case "50n":
            return "url('images/mist.png')";
        default:
            return "";
    }
}

function displayHourlyForecast(data, dailyData = null) {
    const hourlyContainer = document.querySelector('.hourly-forecast-container');
    const hourlyForecast = document.getElementById('hourlyForecast');
    
    if(!data || !data.list) {
        hourlyContainer.style.display = 'none';
        return;
    }
    
    hourlyForecast.innerHTML = '';
    hourlyContainer.style.display = 'block';
    
    // Get current time in the location's timezone
    // Current UTC time + location's timezone offset
    const nowUTC = Math.floor(Date.now() / 1000); // current time in Unix timestamp (UTC)
    const nowLocal = new Date((nowUTC + currentTimezone) * 1000);
    
    // Get sunrise and sunset times from current data (already in location's timezone)
    let sunriseTime = currentCoords ? new Date(riseTime) : null;
    let sunsetTime = currentCoords ? new Date(setTime) : null;
    
    // If sunrise/sunset has already passed today, use tomorrow's actual times from daily forecast
    if (dailyData && dailyData.list && dailyData.list.length > 1) {
        const tomorrow = dailyData.list[1]; // Second day is tomorrow
        
        if (sunriseTime && sunriseTime < nowLocal && tomorrow.sunrise) {
            // Use tomorrow's actual sunrise time from the daily forecast (in location's timezone)
            sunriseTime = new Date((tomorrow.sunrise + currentTimezone) * 1000);
        }
        
        if (sunsetTime && sunsetTime < nowLocal && tomorrow.sunset) {
            // Use tomorrow's actual sunset time from the daily forecast (in location's timezone)
            sunsetTime = new Date((tomorrow.sunset + currentTimezone) * 1000);
        }
    }
    
    let sunriseAdded = false;
    let sunsetAdded = false;
    
    // Display next 25 intervals (covering 24 hours)
    data.list.slice(0, 25).forEach((hour, index) => {
        // Convert hour timestamp to location's local time
        const date = new Date((hour.dt + currentTimezone) * 1000);
        const hours = date.getUTCHours(); // Use UTC methods since we already adjusted for timezone
        
        // Check if we need to add sunrise card before this hour
        if (sunriseTime && !sunriseAdded && sunriseTime < date) {
            const sunriseCard = createSunriseCard(sunriseTime);
            hourlyForecast.appendChild(sunriseCard);
            sunriseAdded = true;
        }
        
        // Check if we need to add sunset card before this hour
        if (sunsetTime && !sunsetAdded && sunsetTime < date) {
            const sunsetCard = createSunsetCard(sunsetTime);
            hourlyForecast.appendChild(sunsetCard);
            sunsetAdded = true;
        }
        
        const hourItem = document.createElement('div');
        hourItem.classList.add('hourly-item');
        
        // Format time (hours already in location's timezone)
        const meridiem = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const timeStr = `${displayHours} ${meridiem}`;
        
        // Temperature in Fahrenheit
        const temp = ((hour.main.temp - 273.15) * 9/5 + 32).toFixed(0);
        
        hourItem.innerHTML = `
            <div class="hourly-time">${timeStr}</div>
            <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png" 
                 alt="${hour.weather[0].description}" 
                 class="hourly-icon">
            <div class="hourly-temp">${temp}°F</div>
        `;
        
        hourlyForecast.appendChild(hourItem);
    });
}

function createSunriseCard(sunriseTime) {
    const sunriseCard = document.createElement('div');
    sunriseCard.classList.add('hourly-item', 'sunrise-card');
    
    // sunriseTime is already adjusted to location's timezone, use UTC methods
    const hours = sunriseTime.getUTCHours();
    const minutes = sunriseTime.getUTCMinutes();
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
    
    sunriseCard.innerHTML = `
        <div class="hourly-time">${timeStr}</div>
        <img src="images/sunrise.png" alt="Sunrise" class="hourly-icon sunrise-sunset-icon">
        <div class="hourly-label">Sunrise</div>
    `;
    
    return sunriseCard;
}

function createSunsetCard(sunsetTime) {
    const sunsetCard = document.createElement('div');
    sunsetCard.classList.add('hourly-item', 'sunset-card');
    
    // sunsetTime is already adjusted to location's timezone, use UTC methods
    const hours = sunsetTime.getUTCHours();
    const minutes = sunsetTime.getUTCMinutes();
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
    
    sunsetCard.innerHTML = `
        <div class="hourly-time">${timeStr}</div>
        <img src="images/sunset.png" alt="Sunset" class="hourly-icon sunrise-sunset-icon">
        <div class="hourly-label">Sunset</div>
    `;
    
    return sunsetCard;
}

function displayDailyForecast(data) {
    const dailyContainer = document.querySelector('.daily-forecast-container');
    const dailyForecast = document.getElementById('dailyForecast');
    
    if(!data || !data.list) {
        dailyContainer.style.display = 'none';
        return;
    }
    
    dailyForecast.innerHTML = '';
    dailyContainer.style.display = 'block';
    
    // Get today's date in the location's timezone
    const nowUTC = Math.floor(Date.now() / 1000);
    const todayInLocation = new Date((nowUTC + currentTimezone) * 1000);
    const todayYear = todayInLocation.getUTCFullYear();
    const todayMonth = todayInLocation.getUTCMonth();
    const todayDate = todayInLocation.getUTCDate();
    
    // Display 7 days from Pro API
    data.list.forEach((day, index) => {
        const dayRow = document.createElement('div');
        dayRow.classList.add('daily-row');
        
        // Convert day.dt to location's timezone
        const date = new Date((day.dt + currentTimezone) * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        
        // Check if it's today in the location's timezone
        const dayYear = date.getUTCFullYear();
        const dayMonth = date.getUTCMonth();
        const dayDate = date.getUTCDate();
        const isToday = (dayYear === todayYear && dayMonth === todayMonth && dayDate === todayDate);
        const displayDay = isToday ? 'Today' : dayName;
        
        // Temperatures in Fahrenheit - Pro API daily forecast provides temp object with day, min, max, night, etc.
        const high = ((day.temp.max - 273.15) * 9/5 + 32).toFixed(0);
        const low = ((day.temp.min - 273.15) * 9/5 + 32).toFixed(0);
        
        // Weather description - Pro API provides weather array
        const description = day.weather && day.weather[0] ? day.weather[0].description : '';
        const mainIcon = day.weather && day.weather[0] ? day.weather[0].icon : '01d';
        
        // Create day and night versions of the icon
        
        // Build icons HTML - show both day and night
        const iconsHtml = `
            <div class="daily-icons">
                <img src="https://openweathermap.org/img/wn/${mainIcon}@2x.png" alt="Day weather" class="daily-icon">
            </div>
        `;
        
        dayRow.innerHTML = `
            <div>
                <div class="daily-day">${displayDay}</div>
                <div class="daily-date">${dateStr}</div>
            </div>
            ${iconsHtml}
            <div class="daily-description">${description}</div>
            <div class="daily-temps">
                <span class="daily-high">${high}°</span>
                <span class="daily-low">${low}°</span>
            </div>
        `;
        
        dailyForecast.appendChild(dayRow);
    });
}

function displayError(message){
    const errorDisplay = document.createElement("p");
    errorDisplay.textContent = message;
    errorDisplay.style.color = "red";
    errorDisplay.style.textAlign = "center";

    errorDisplay.classList.add("errorDisplay");

    card.textContent = "";
    cityHeading.textContent = "";
    card.style.display = "flex";
    card.appendChild(errorDisplay);
    if(favButton) favButton.style.display = 'none';
    if(actionButtons) actionButtons.style.display = 'none';
    if(headingSection) headingSection.style.display = 'none';
    
    // Hide forecast sections on error
    const hourlyContainer = document.querySelector('.hourly-forecast-container');
    const dailyContainer = document.querySelector('.daily-forecast-container');
    if(hourlyContainer) hourlyContainer.style.display = 'none';
    if(dailyContainer) dailyContainer.style.display = 'none';
}

// Share button functionality
if(shareButton){
    shareButton.addEventListener('click', () => {
        if(currentCity){
            const url = new URL(window.location.href);
            // Prefer coordinates when available to guarantee exact location
            if (currentCoords && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lon)) {
                url.searchParams.set('lat', currentCoords.lat);
                url.searchParams.set('lon', currentCoords.lon);
                // include city as a friendly fallback
                url.searchParams.set('city', currentCity);
            } else {
                // Fall back to city name only
                url.searchParams.set('city', currentCity);
            }

            // Try to use Clipboard API
            if(navigator.clipboard){
                navigator.clipboard.writeText(url.toString()).then(() => {
                    showToast('Weather link copied to clipboard!', 'success');
                }).catch(() => {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = url.toString();
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand('copy');
                        showToast('Weather link copied to clipboard!', 'success');
                    } catch (err) {
                        showToast('Failed to copy link. Please copy manually: ' + url.toString(), 'error');
                    }
                    document.body.removeChild(textarea);
                });
            } else {
                // Fallback for browsers without clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = url.toString();
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showToast('Weather link copied to clipboard!', 'success');
                } catch (err) {
                    showToast('Failed to copy link. Please copy manually: ' + url.toString(), 'error');
                }
                document.body.removeChild(textarea);
            }
        }
    });
}

// Saved Locations Functionality
function saveSavedLocations() {
    localStorage.setItem('savedWeatherLocations', JSON.stringify(savedLocations));
}

function addLocationToSaved(city, weatherData, state = '', country = 'US', coords = null, dailyData = null) {
    // Check if location already exists
    const exists = savedLocations.some(loc => loc.city.toLowerCase() === city.toLowerCase());
    if (exists) {
        showToast('This location is already saved!', 'warning');
        return;
    }

    // Use provided coords if available, otherwise fall back to weatherData.coord
    const locationCoords = coords || weatherData.coord;

    // Determine daily high/low if provided
    let tempMax = null;
    let tempMin = null;
    if (dailyData && dailyData.list && dailyData.list[0] && dailyData.list[0].temp) {
        tempMax = dailyData.list[0].temp.max;
        tempMin = dailyData.list[0].temp.min;
    }

    const locationData = {
        city: city,
        state: state,
        country: country,
        lat: locationCoords.lat,
        lon: locationCoords.lon,
        temp: weatherData.main.temp,
        tempMax: tempMax,
        tempMin: tempMin,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        humidity: weatherData.main.humidity,
        feelsLike: weatherData.main.feels_like,
        timestamp: Date.now()
    };

    savedLocations.push(locationData);
    saveSavedLocations();
    renderSavedLocations();
}

function removeLocationFromSaved(city) {
    savedLocations = savedLocations.filter(loc => loc.city.toLowerCase() !== city.toLowerCase());
    saveSavedLocations();
    renderSavedLocations();
}

function renderSavedLocations() {
    if (savedLocations.length === 0) {
        savedLocationsContainer.style.display = 'none';
        return;
    }

    savedLocationsContainer.style.display = 'block';
    savedLocationsList.innerHTML = '';

    savedLocations.forEach(location => {
        const tempF = location.temp ? ((location.temp - 273.15) * 9/5 + 32).toFixed(0) : '—';
        const feelsLikeF = location.feelsLike ? ((location.feelsLike - 273.15) * 9/5 + 32).toFixed(0) : '—';

        const locationCard = document.createElement('div');
        locationCard.className = 'location-card';
        locationCard.innerHTML = `
            <div class="location-card-header">
                <h3>${location.city}</h3>
                <button class="remove-location-btn" data-city="${location.city}">×</button>
            </div>
            <div class="location-card-row">
                <div class="location-card-icon">
                    <img src="https://openweathermap.org/img/wn/${location.icon}@2x.png" alt="${location.description}" class="location-icon" />
                </div>
                <div class="location-card-main">
                    <div class="location-card-temp">${tempF}°F</div>
                    <div class="location-card-temps">
                        ${location.tempMax ? `<span class="daily-high">H: ${((location.tempMax-273.15)*9/5+32).toFixed(0)}°</span>` : ''}
                        ${location.tempMin ? `<span class="daily-low">L: ${((location.tempMin-273.15)*9/5+32).toFixed(0)}°</span>` : ''}
                    </div>
                    <div class="location-card-desc">${location.description || ''}</div>
                </div>
                <div class="location-card-sun-info">
                    <div class="sunrise-info">
                        <img src="images/sunrise.png" alt="Sunrise" class="sunrise-icon" />
                        <span class="sunrise-time">—</span>
                    </div>
                    <div class="sunset-info">
                        <img src="images/sunset.png" alt="Sunset" class="sunset-icon" />
                        <span class="sunset-time">—</span>
                    </div>
                </div>
            </div>
            <div class="location-card-details">
                <span class="location-card-humidity">Humidity: ${location.humidity ?? '—'}%</span>
                <span class="location-card-feels">Feels ${feelsLikeF}°</span>
            </div>
        `;

        // Asynchronously refresh the displayed weather for this saved location
        (async () => {
            try {
                let fresh;
                if (location.lat && location.lon) {
                    fresh = await getWeatherDataByCoords(location.lat, location.lon);
                } else {
                    fresh = await getWeatherData(location.city, location.state || '', location.country || 'US');
                }

                if (fresh && fresh.main) {
                    const newTempF = ((fresh.main.temp - 273.15) * 9/5 + 32).toFixed(0);
                    const newFeels = ((fresh.main.feels_like - 273.15) * 9/5 + 32).toFixed(0);
                    const newIcon = fresh.weather && fresh.weather[0] ? fresh.weather[0].icon : null;
                    const newDesc = fresh.weather && fresh.weather[0] ? fresh.weather[0].description : '';
                    const newHumidity = fresh.main.humidity;

                    const tempEl = locationCard.querySelector('.location-card-temp');
                    const descEl = locationCard.querySelector('.location-card-desc');
                    const iconEl = locationCard.querySelector('.location-icon');
                    const humidityEl = locationCard.querySelector('.location-card-humidity');
                    const feelsEl = locationCard.querySelector('.location-card-feels');
                    const sunriseTimeEl = locationCard.querySelector('.sunrise-time');
                    const sunsetTimeEl = locationCard.querySelector('.sunset-time');

                    if (tempEl) tempEl.textContent = `${newTempF}°F`;
                    if (feelsEl) feelsEl.textContent = `Feels ${newFeels}°`;
                    if (descEl) descEl.textContent = newDesc;
                    if (iconEl && newIcon) iconEl.src = `https://openweathermap.org/img/wn/${newIcon}@2x.png`;
                    if (humidityEl) humidityEl.textContent = `Humidity: ${newHumidity}%`;

                    // Update sunrise/sunset times
                    if (sunriseTimeEl || sunsetTimeEl) {
                        const tz = typeof fresh.timezone === 'number' ? fresh.timezone : 0;
                        const sr = fresh.sys && fresh.sys.sunrise ? new Date((fresh.sys.sunrise + tz) * 1000) : null;
                        const ss = fresh.sys && fresh.sys.sunset ? new Date((fresh.sys.sunset + tz) * 1000) : null;
                        const formatLocal = (d) => {
                            if (!d) return '—';
                            let h = d.getUTCHours();
                            const m = d.getUTCMinutes().toString().padStart(2, '0');
                            const mer = h >= 12 ? 'PM' : 'AM';
                            h = h % 12;
                            if (h === 0) h = 12;
                            return `${h}:${m} ${mer}`;
                        };
                        if (sunriseTimeEl) sunriseTimeEl.textContent = formatLocal(sr);
                        if (sunsetTimeEl) sunsetTimeEl.textContent = formatLocal(ss);
                    }
                }
            } catch (err) {
                console.error('Failed to refresh saved location weather:', err);
            }
        })();

        // Click on card to load full weather
        locationCard.addEventListener('click', async (e) => {
            if (!e.target.classList.contains('remove-location-btn')) {
                try {
                    if(loadingContainer) loadingContainer.style.display = 'flex';
                    if(card) card.style.display = 'none';
                    if(headingSection) headingSection.style.display = 'none';
                    if(actionButtons) actionButtons.style.display = 'none';
                    
                    // Use coordinates if available (for locations saved after this fix)
                    // Otherwise fall back to city/state/country (for legacy saved locations)
                    let weatherData, forecastData, dailyData;
                    
                    if (location.lat && location.lon) {
                        weatherData = await getWeatherDataByCoords(location.lat, location.lon);
                        forecastData = await getForecastByCoords(location.lat, location.lon);
                        dailyData = await getDailyForecastByCoords(location.lat, location.lon);
                        // Track the loaded location's data
                        currentState = location.state || '';
                        currentCountry = location.country || weatherData.sys?.country || 'US';
                    } else {
                        const state = location.state || '';
                        const country = location.country || 'US';
                        weatherData = await getWeatherData(location.city, state, country);
                        forecastData = await getForecast(location.city, state, country);
                        dailyData = await getDailyForecast(location.city, state, country);
                        // Track the loaded location's data
                        currentState = state;
                        currentCountry = country;
                    }
                    
                    displayWeatherInfo(weatherData, dailyData);
                    displayHourlyForecast(forecastData, dailyData);
                    displayDailyForecast(dailyData);
                    
                    // IMPORTANT: Override the city name and coords with the saved location's values
                    // This ensures we show the location the user originally saved, not what the API returns
                    currentCity = location.city;
                    currentCoords = { lat: location.lat, lon: location.lon };
                    cityHeading.textContent = location.city;
                    cityInput.value = location.city;
                    
                    if(loadingContainer) loadingContainer.style.display = 'none';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch(error) {
                    console.error(error);
                    if(loadingContainer) loadingContainer.style.display = 'none';
                    displayError("Failed to load weather for this location.");
                }
            }
        });

        // Remove button
        const removeBtn = locationCard.querySelector('.remove-location-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeLocationFromSaved(location.city);
            showToast(`${location.city} removed from saved locations`, 'success');
        });

        savedLocationsList.appendChild(locationCard);
    });
}

// Add current location to saved
if(addLocationBtn) {
    addLocationBtn.addEventListener('click', async () => {
        if (currentCity && currentCoords) {
            try {
                // Fetch fresh weather and daily forecast data to ensure we have highs/lows
                const freshWeatherData = await getWeatherDataByCoords(currentCoords.lat, currentCoords.lon);
                const freshDailyData = await getDailyForecastByCoords(currentCoords.lat, currentCoords.lon);
                
                // Pass currentCoords (original coordinates) and daily data to ensure we save the exact location and highs/lows
                addLocationToSaved(currentCity, freshWeatherData, currentState, currentCountry, currentCoords, freshDailyData);
                showToast(`${currentCity} added to saved locations!`, 'success');
            } catch(error) {
                console.error(error);
                showToast('Failed to save location', 'error');
            }
        } else {
            showToast('Please search for a city first!', 'info');
        }
    });
}

// Render saved locations on load
renderSavedLocations();

// Newsletter Modal Elements
const newsletterModal = document.getElementById('newsletterModal');
const subscribeNewsletterBtn = document.getElementById('subscribeNewsletterBtn');
const closeNewsletterModal = document.querySelector('.close-newsletter');
const newsletterForm = document.getElementById('newsletterForm');
const subCityName = document.getElementById('subCityName');

// Open newsletter modal
if(subscribeNewsletterBtn){
    subscribeNewsletterBtn.addEventListener('click', () => {
        if(currentCity){
            subCityName.textContent = currentCity;
            newsletterModal.style.display = 'block';
        } else {
            showToast('Please search for a city first!', 'info');
        }
    });
}

// Close newsletter modal
if(closeNewsletterModal){
    closeNewsletterModal.addEventListener('click', () => {
        newsletterModal.style.display = 'none';
    });
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if(event.target === newsletterModal){
        newsletterModal.style.display = 'none';
    }
});

// Handle newsletter subscription
if(newsletterForm){
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('subEmail').value.trim();
        
        if(!email){
            showToast('Please provide an email address', 'warning');
            return;
        }
        
        try {
            // Build subscription data - include coordinates if available for accurate location
            const subscriptionData = {
                email: email,
                city: currentCity
            };
            
            // Include coordinates if we have them (from geolocation) - validate as numbers
            if (currentCoords && Number.isFinite(Number(currentCoords.lat)) && Number.isFinite(Number(currentCoords.lon))) {
                subscriptionData.lat = Number(currentCoords.lat);
                subscriptionData.lon = Number(currentCoords.lon);
            }
            
            // Determine newsletter endpoint: use local backend during development when served from localhost
            const NEWSLETTER_ENDPOINT = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:9000/api/newsletter/subscribe'
                : 'https://weather-app-seven-liard-75.vercel.app/api/newsletter/subscribe';

            const response = await fetch(NEWSLETTER_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData)
            });
            
            const data = await response.json();
            
            if(data.success){
                showToast(`Successfully subscribed to daily weather updates for ${currentCity}!`, 'success');
                newsletterModal.style.display = 'none';
                newsletterForm.reset();
            } else {
                showToast(data.error || 'Subscription failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            showToast('Failed to subscribe. Please check your connection and try again.', 'error');
        }
    });
}

// On load, check for city parameter in URL or load favorite
document.addEventListener('DOMContentLoaded', async () => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const cityFromUrl = urlParams.get('city');
    const latFromUrl = urlParams.get('lat');
    const lonFromUrl = urlParams.get('lon');
    const parsedLat = latFromUrl !== null ? Number(latFromUrl) : null;
    const parsedLon = lonFromUrl !== null ? Number(lonFromUrl) : null;
    const hasValidCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLon);
    
    // Handle coordinate-based URL (from email links)
    if(hasValidCoords){
        // Show loading spinner for URL param
        if(loadingContainer) loadingContainer.style.display = 'flex';
        try{
            const lat = parsedLat;
            const lon = parsedLon;
            
            const weatherData = await getWeatherDataByCoords(lat, lon);
            
            // Store coordinates for potential re-subscription
            currentCoords = { lat, lon };
            currentCity = weatherData.name;
            currentCountry = weatherData.sys?.country || 'US';
            
            // Update the city input
            if (weatherData.name) {
                cityInput.value = weatherData.name;
            }
            
            // Fetch hourly forecast data
            const forecastData = await getForecastByCoords(lat, lon);
            
            // Fetch daily forecast data
            const dailyData = await getDailyForecastByCoords(lat, lon);
            
            displayWeatherInfo(weatherData, dailyData);
            displayHourlyForecast(forecastData, dailyData);
            displayDailyForecast(dailyData);
            
            if(loadingContainer) loadingContainer.style.display = 'none';
            return;
        } catch(e){
            console.error('Failed to load location from URL coordinates', e);
            if(loadingContainer) loadingContainer.style.display = 'none';
        }
    }
    
    if(cityFromUrl){
        // Show loading spinner for URL param
        if(loadingContainer) loadingContainer.style.display = 'flex';
        try{
            const weatherData = await getWeatherData(decodeURIComponent(cityFromUrl));
            
            // Fetch hourly forecast data (24 hours from Pro API)
            const forecastData = await getForecast(decodeURIComponent(cityFromUrl));
            
            // Fetch daily forecast data (7 days from API)
            const dailyData = await getDailyForecast(decodeURIComponent(cityFromUrl));
            
            displayWeatherInfo(weatherData, dailyData);
            displayHourlyForecast(forecastData, dailyData);
            displayDailyForecast(dailyData);
            
            if(loadingContainer) loadingContainer.style.display = 'none';
            return;
        } catch(e){
            console.error('Failed to load city from URL', e);
            if(loadingContainer) loadingContainer.style.display = 'none';
        }
    }
    
    // If no URL param, try favorite city
    const favCity = getCookie('favoriteCity');
    if(favCity){
        // Show loading spinner for favorite city
        if(loadingContainer) loadingContainer.style.display = 'flex';
        try{
            const weatherData = await getWeatherData(decodeURIComponent(favCity));
            
            // Fetch hourly forecast data (24 hours from Pro API)
            const forecastData = await getForecast(decodeURIComponent(favCity));
            
            // Fetch daily forecast data (7 days from API)
            const dailyData = await getDailyForecast(decodeURIComponent(favCity));
            
            displayWeatherInfo(weatherData, dailyData);
            displayHourlyForecast(forecastData, dailyData);
            displayDailyForecast(dailyData);
            
            if(loadingContainer) loadingContainer.style.display = 'none';
        } catch(e){
            console.error('Failed to load favorite city weather', e);
            if(loadingContainer) loadingContainer.style.display = 'none';
        }
    }
});
    
