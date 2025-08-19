const weatherForm = document.querySelector(".weatherForm");

const cityInput =document.querySelector(".cityInput");

const suggestions = document.getElementById("suggestions")

const card =document.querySelector(".card");



const cityHeading = document.querySelector(".City");

let cities = [];

fetch("cities.json")
.then(response=>response.json())
.then(values => values.forEach(value => cities.push(value)));


cityInput.addEventListener("input", () =>{
    const query = cityInput.value.trim().toLowerCase();

    suggestions.innerHTML = '';

    if(query.length<1) return;

    const matches = cities.filter(city => city.name.toLowerCase().includes(query))
    .slice(0,10);

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

    suggestions.innerHTML = '';
    

    if(city){

        try{
            const weatherData = await getWeatherData(city);


            console.log(weatherData);

            displayWeatherInfo(weatherData);
        }

        catch(error){
            console.error(error);

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
}
    
