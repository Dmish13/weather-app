const weatherForm = document.querySelector(".weatherForm");

const cityInput =document.querySelector(".cityInput");

const card =document.querySelector(".card");

const apiKey = "9f5bffb9e6298d4e898323325f7dfd2f";

const cityHeading = document.querySelector(".City");


weatherForm.addEventListener("submit", async event => {

    event.preventDefault();

    const city = cityInput.value;

    if(city){

        try{
            const weatherData = await getWeatherData(city);

            console.log(weatherData);

            displayWeatherInfo(weatherData);
        }

        catch(error){
            console.error(error);

            displayError(error);
        }
    }
    else{
        displayError("Please enter a city");
    }
});

async function getWeatherData(city){

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

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
            weather:[{description, id}],
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

    const weatherEmoji = document.createElement("p");

    const riseSetdisplay = document.createElement("p");

    cityHeading.textContent = city;
    
    

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

    weatherEmoji.textContent = getWeatherEmoji(id);

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
    
    


}

function getWeatherEmoji(weatherId){
    switch(true){
        case(weatherId>=200 && weatherId <300):
            return "⛈️";
        case(weatherId>=300 && weatherId <400):
            return "🌧️";
        case(weatherId>=500 && weatherId <600):
            return "🌦️";
        case(weatherId>=600 && weatherId <700):
            return "❄️";
        case(weatherId>=700 && weatherId <800):
            return "🌫️";
        case(weatherId===800):
            return "☀️";
        case(weatherId>=801 && weatherId<810):
            return "☁️";
        default:
            return "❓";
    }
}

function displayError(message){
    
    const errorDisplay = document.createElement("p");
    
    errorDisplay.textContent = message;
    
    errorDisplay.classList.add("errorDisplay");

    card.textContent = "";

    cityHeading.textContent = "";
    
    card.style.display = "flex";
    
    card.appendChild(errorDisplay);
}
    
