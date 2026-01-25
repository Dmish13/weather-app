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
let savedLocations = JSON.parse(localStorage.getItem('savedWeatherLocations') || '[]');

let countryCodes = {};
let stateCodes = {};

// Load country and state codes
Promise.all([
    fetch("countrycodes.json").then(response => response.json()),
    fetch("statecodes.json").then(response => response.json())
]).then(([countryData, stateData]) => {
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

// Debounced autocomplete with API
let autocompleteTimeout;
cityInput.addEventListener("input", async () => {
    const query = cityInput.value.trim();

    // Clear suggestions immediately
    suggestions.innerHTML = '';
    suggestions.classList.remove('show');

    if (query.length < 2) return;

    // Clear previous timeout
    clearTimeout(autocompleteTimeout);

    // Debounce API call
    autocompleteTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`https://weather-app-seven-liard-75.vercel.app/api/cities?q=${encodeURIComponent(query)}&limit=10`);
            if (!response.ok) throw new Error('Autocomplete failed');
            
            const matches = await response.json();

            // Only show if user hasn't typed something else
            if (cityInput.value.trim() === query && matches.length > 0) {
                suggestions.classList.add('show');
                
                matches.forEach(city => {
                    const li = document.createElement('li');
                    // Find the match position
                    const cityName = city.name;
                    const queryLower = query.toLowerCase();
                    const queryIndex = cityName.toLowerCase().indexOf(queryLower);

                    // Format location string - only show state/subcountry if it exists
                    const locationParts = [city.country];
                    if (city.subcountry) {
                        locationParts.unshift(city.subcountry);
                    }
                    const locationStr = locationParts.join(', ');

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
                        
                        // Find and set country code
                        const countryCode = Object.keys(countryCodes).find(
                            code => countryCodes[code] === city.country
                        );
                        if (countryCode) {
                            countrySelect.value = countryCode;
                            // Keep selects hidden; set state value for backend if available
                            if (countryCode === 'US' && city.subcountry) {
                                // Try to find state code
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
                        }

                        suggestions.innerHTML = '';
                        suggestions.classList.remove('show');
                        
                        // Trigger form submission
                        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                        weatherForm.dispatchEvent(submitEvent);
                    });

                    suggestions.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            // Fail silently - autocomplete is a nice-to-have feature
        }
    }, 300); // 300ms debounce
});


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
        
        // Fetch hourly forecast data (24 hours from Pro API)
        const forecastData = await getForecast(city, state, country);
        console.log(forecastData);
        
        // Fetch daily forecast data (7 days from Pro API)
        const dailyData = await getDailyForecast(city, state, country);
        console.log(dailyData);
        
        displayWeatherInfo(weatherData, dailyData);
        displayHourlyForecast(forecastData);
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

async function getWeatherData(city, state = '', country = 'US') {
    // Build query parameters
    let apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
    
    if (state && country === 'US') {
        apiUrl += `&state=${encodeURIComponent(state)}`;
    }

    const response = await fetch(apiUrl);
    console.log(response);

    if(!response.ok) {
        throw new Error("Could not fetch weather data");
    }

    return await response.json();
}

async function getForecast(city, state = '', country = 'US') {
    let apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather/forecast?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
    
    if (state && country === 'US') {
        apiUrl += `&state=${encodeURIComponent(state)}`;
    }

    const response = await fetch(apiUrl);
    if(!response.ok) {
        throw new Error("Could not fetch forecast data");
    }

    return await response.json();
}

async function getDailyForecast(city, state = '', country = 'US') {
    let apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather/forecast/daily?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
    
    if (state && country === 'US') {
        apiUrl += `&state=${encodeURIComponent(state)}`;
    }

    const response = await fetch(apiUrl);
    if(!response.ok) {
        throw new Error("Could not fetch daily forecast data");
    }

    return await response.json();
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

    lowHighDisplay.textContent = `↑${((todayHigh-273.15)*9/5 +32).toFixed(0)}°    /   ↓${((todayLow-273.15)*9/5 +32).toFixed(0)}°`;

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

    const date = new Date();
    
    let riseTime;

    let setTime;

   
    riseTime = new Date((sunrise+(timezone+(date.getTimezoneOffset()*60)))*1000);

    setTime = new Date((sunset+timezone+(date.getTimezoneOffset()*60))*1000);
    
    

    let riseTimeHours = riseTime.getHours();

    let riseMeridiem = riseTimeHours>=12 ? "PM":"AM";

    riseTimeHours = riseTimeHours%12;

    if(riseTimeHours===0){
        riseTimeHours=12;
    }
    riseTimeHours = riseTimeHours.toString().padStart(2,0);

    let riseTimeMinutes = riseTime.getMinutes().toString().padStart(2,0);

    let setTimeHours = setTime.getHours();

    let setMeridiem = setTimeHours>=12 ? "PM":"AM";

    setTimeHours = setTimeHours%12;

    if(setTimeHours===0){
        setTimeHours=12;
    }

    setTimeHours = setTimeHours.toString().padStart(2,0);

    let setTimeMinutes = setTime.getMinutes().toString().padStart(2,0);

    riseSetdisplay.textContent = `🌅 ${riseTimeHours}:${riseTimeMinutes} ${riseMeridiem}       🌇 ${setTimeHours}:${setTimeMinutes} ${setMeridiem}`;

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

function displayHourlyForecast(data) {
    const hourlyContainer = document.querySelector('.hourly-forecast-container');
    const hourlyForecast = document.getElementById('hourlyForecast');
    
    if(!data || !data.list) {
        hourlyContainer.style.display = 'none';
        return;
    }
    
    hourlyForecast.innerHTML = '';
    hourlyContainer.style.display = 'block';
    
    // Display next 8 intervals (24 hours with 3-hour intervals)
    data.list.slice(0, 25).forEach(hour => {
        const hourItem = document.createElement('div');
        hourItem.classList.add('hourly-item');
        
        // Format time
        const date = new Date(hour.dt * 1000);
        const hours = date.getHours();
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

function displayDailyForecast(data) {
    const dailyContainer = document.querySelector('.daily-forecast-container');
    const dailyForecast = document.getElementById('dailyForecast');
    
    if(!data || !data.list) {
        dailyContainer.style.display = 'none';
        return;
    }
    
    dailyForecast.innerHTML = '';
    dailyContainer.style.display = 'block';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Display 7 days from Pro API
    data.list.forEach((day, index) => {
        const dayRow = document.createElement('div');
        dayRow.classList.add('daily-row');
        
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Check if it's today
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        const isToday = checkDate.getTime() === today.getTime();
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
            url.searchParams.set('city', encodeURIComponent(currentCity));
            
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

function addLocationToSaved(city, weatherData) {
    // Check if location already exists
    const exists = savedLocations.some(loc => loc.city.toLowerCase() === city.toLowerCase());
    if (exists) {
        showToast('This location is already saved!', 'warning');
        return;
    }

    const locationData = {
        city: city,
        temp: weatherData.main.temp,
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
        const tempF = ((location.temp - 273.15) * 9/5 + 32).toFixed(0);
        const feelsLikeF = ((location.feelsLike - 273.15) * 9/5 + 32).toFixed(0);

        const card = document.createElement('div');
        card.className = 'location-card';
        card.innerHTML = `
            <div class="location-card-header">
                <h3>${location.city}</h3>
                <button class="remove-location-btn" data-city="${location.city}">×</button>
            </div>
            <div class="location-card-temp">${tempF}°F</div>
            <div class="location-card-desc">${location.description}</div>
            <div class="location-card-details">
                <span>💧 ${location.humidity}%</span>
                <span>Feels ${feelsLikeF}°</span>
            </div>
        `;

        // Click on card to load full weather
        card.addEventListener('click', async (e) => {
            if (!e.target.classList.contains('remove-location-btn')) {
                try {
                    if(loadingContainer) loadingContainer.style.display = 'flex';
                    const weatherData = await getWeatherData(location.city);
                    displayWeatherInfo(weatherData);
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
        const removeBtn = card.querySelector('.remove-location-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeLocationFromSaved(location.city);
            showToast(`${location.city} removed from saved locations`, 'success');
        });

        savedLocationsList.appendChild(card);
    });
}

// Add current location to saved
if(addLocationBtn) {
    addLocationBtn.addEventListener('click', async () => {
        if (currentCity) {
            try {
                const weatherData = await getWeatherData(currentCity);
                addLocationToSaved(currentCity, weatherData);
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
            const response = await fetch('https://weather-app-seven-liard-75.vercel.app/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    city: currentCity
                })
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
            displayHourlyForecast(forecastData);
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
            displayHourlyForecast(forecastData);
            displayDailyForecast(dailyData);
            
            if(loadingContainer) loadingContainer.style.display = 'none';
        } catch(e){
            console.error('Failed to load favorite city weather', e);
            if(loadingContainer) loadingContainer.style.display = 'none';
        }
    }
});
    
