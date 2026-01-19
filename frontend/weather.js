const weatherForm = document.querySelector(".weatherForm");

const cityInput =document.querySelector(".cityInput");

const suggestions = document.getElementById("suggestions")

const card =document.querySelector(".card");



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

let cities = [];

fetch("cities.json")
.then(response=>response.json())
.then(values => values.forEach(value => cities.push(value)));

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


cityInput.addEventListener("input", () =>{
    const query = cityInput.value.trim().toLowerCase();

    suggestions.innerHTML = '';
    suggestions.classList.remove('show');

    if(query.length<1) return;

    const matches = cities.filter(city => city.name.toLowerCase().includes(query))
    .slice(0,10);

    if(matches.length > 0){
        suggestions.classList.add('show');
    }

    matches.forEach(city=> {
        const li = document.createElement('li');
        // Find the match position
        const cityName = city.name;
        const queryIndex = cityName.toLowerCase().indexOf(query);

        if (queryIndex !== -1) {
            // Split and wrap the matched part in <strong>
            const before = cityName.slice(0, queryIndex);
            const match = cityName.slice(queryIndex, queryIndex + query.length);
            const after = cityName.slice(queryIndex + query.length);

            li.innerHTML = `${before}<strong>${match}</strong>${after}, ${city.subcountry}, ${city.country}`;
        } 
        else {
            li.textContent = `${city.name}, ${city.subcountry}, ${city.country}`;
        }

        li.addEventListener('click', async () => {

            cityInput.value = `${city.name}, ${city.country}`;

            cityy = cityInput.value;

            suggestions.innerHTML = '';
            suggestions.classList.remove('show');
            

            if(cityy){
                // Show loading spinner
                if(loadingContainer) loadingContainer.style.display = 'flex';
                if(card) card.style.display = 'none';
                if(headingSection) headingSection.style.display = 'none';
                if(actionButtons) actionButtons.style.display = 'none';

                try{
                    const weatherData = await getWeatherData(cityy);


                    console.log(weatherData);

                    displayWeatherInfo(weatherData);
                    // Hide loading spinner
                    if(loadingContainer) loadingContainer.style.display = 'none';
                }

                catch(error){
                    console.error(error);
                    // Hide loading spinner on error
                    if(loadingContainer) loadingContainer.style.display = 'none';

                    displayError("Sorry, you either entered an invalid city name, or we were unable to process your request. Please try again. ");
                }
            }
            else{
                displayError("Please enter a city");
            }
            cityInput.value = '';

        });

        suggestions.appendChild(li);
    });
});


weatherForm.addEventListener("submit", async event => {

    event.preventDefault();

    const city = cityInput.value;

    suggestions.innerHTML = '';
    suggestions.classList.remove('show');
    

    if(city){
        // Show loading spinner
        if(loadingContainer) loadingContainer.style.display = 'flex';
        if(card) card.style.display = 'none';
        if(headingSection) headingSection.style.display = 'none';
        if(actionButtons) actionButtons.style.display = 'none';

        try{
            const weatherData = await getWeatherData(city);


            console.log(weatherData);

            displayWeatherInfo(weatherData);
            // Hide loading spinner
            if(loadingContainer) loadingContainer.style.display = 'none';
        }

        catch(error){
            console.error(error);
            // Hide loading spinner on error
            if(loadingContainer) loadingContainer.style.display = 'none';

            displayError("Sorry, you either entered an invalid city name, or we were unable to process your request. Please try again. ");
        }
    }
    else{
        displayError("Please enter a city");
    }
    cityInput.value = '';
});

async function getWeatherData(city){

     // Fetch from your backend, not OpenWeatherMap directly
    const apiUrl = `https://weather-app-seven-liard-75.vercel.app/weather?city=${encodeURIComponent(city)}`;

    const response = await fetch(apiUrl);

    console.log(response);

    if(!response.ok){
        throw new Error("Could not fetch weather data");
    }

    return await response.json();

}

function displayWeatherInfo(data){

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

    lowHighDisplay.textContent = `↑${((temp_max-273.15)*9/5 +32).toFixed(0)}°    /   ↓${((temp_min-273.15)*9/5 +32).toFixed(0)}°`;

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
                    alert('Weather link copied to clipboard!');
                }).catch(() => {
                    prompt('Copy this link:', url.toString());
                });
            } else {
                prompt('Copy this link:', url.toString());
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
        alert('This location is already saved!');
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
            if (confirm(`Remove ${location.city} from saved locations?`)) {
                removeLocationFromSaved(location.city);
            }
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
            } catch(error) {
                console.error(error);
                alert('Failed to save location');
            }
        } else {
            alert('Please search for a city first!');
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
            alert('Please search for a city first!');
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
            alert('Please provide an email address');
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
                alert(`✅ Successfully subscribed to daily weather updates for ${currentCity}!`);
                newsletterModal.style.display = 'none';
                newsletterForm.reset();
            } else {
                alert('❌ ' + (data.error || 'Subscription failed. Please try again.'));
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('❌ Failed to subscribe. Please check your connection and try again.');
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
            displayWeatherInfo(weatherData);
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
            displayWeatherInfo(weatherData);
            if(loadingContainer) loadingContainer.style.display = 'none';
        } catch(e){
            console.error('Failed to load favorite city weather', e);
            if(loadingContainer) loadingContainer.style.display = 'none';
        }
    }
});
    
