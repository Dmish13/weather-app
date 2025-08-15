const weatherForm = document.querySelector(".weatherForm");

const cityInput =document.querySelector(".cityInput");

const suggestions = document.getElementById("suggestions")

const card =document.querySelector(".card");

const apiKey = "9f5bffb9e6298d4e898323325f7dfd2f";

const cityHeading = document.querySelector(".City");

let cities = [];

fetch("cities.json")
.then(response=>response.json())
.then(values => values.forEach(value => cities.push(value)));


cityInput.addEventListener("input", () =>{
    const query = cityInput.value.trim().toLowerCase();

    suggestions.innerHTML = '';

    if(query.length<1) return;

    const matches = cities.filter(city => city.name.toLowerCase().startsWith(query))
    .slice(0,5);

    matches.forEach(city=> {
        const li = document.createElement('li');

        li.textContent = `${city.name}, ${city.subcountry}, ${city.country}`;

        li.addEventListener('click', () => {
            cityInput.value = `${city.name}, ${city.country}`;

            suggestions.innerHTML = '';
        });

        suggestions.appendChild(li);
    });
});


weatherForm.addEventListener("submit", async event => {

    event.preventDefault();

    const city = cityInput.value;

    if(city){

        try{
            const weatherData = await getWeatherData(city);

            suggestions.innerHTML = '';

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
            return "url('clearsky.jpg')";
        case "01n":
            return "url('clearskynight.jpeg')";
        case "02d":
            return "url('fewclouds.jpg')";
        case "02n":
            return "url('fewcloudsnight.png')";
        case "03d":
            return "url('scatteredclouds.jpeg')";
        case "03n":
            return "url('scatteredcloudsnight.jpeg')";
        case "04d":
            return "url('brokenclouds.jpg')"; 
        case "04n":
            return "url('brokencloudsnight.jpg')";
        case "09d":
            return "url('lightrain.png')";
        case "09n":
            return "url('nightrain.png')";
        case "10d":
            return "url('rain.png')";
        case  "10n":
            return "url('nightrain.png')";
        case  "11d":
            return "url('thunderstorm.png')";
        case "11n":
            return "url('nightrain.png')";
        case "13d": 
            return "url('snow.png')";
        case "13n":
            return "url(nightsnow.png)";
        case "50d":
            return "url('mist.png')";
        case "50n":
            return "url('mist.png')";
        default:
            return "";
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
    
