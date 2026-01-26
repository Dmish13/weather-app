# Weather App

<img width="679" height="823" alt="image" src="https://github.com/user-attachments/assets/aa6b124d-82cd-4a04-a5d0-49186433ba56" />





## Features

### Current Weather
- Real-time weather data with temperature, conditions, and weather icons
- Displays "feels like" temperature and humidity
- Shows daily high and low temperatures (from 6-day forecast)
- Sunrise and sunset times
- Dynamic background images based on weather conditions
- Stylized weather icon with gradient box

### Location Search
- City name input with autocomplete suggestions
- Country selection dropdown (all countries supported)
- US state selection (for US locations)
- Uses OpenWeather Geocoding API for accurate location resolution
- Option to find weather for current location

### Weather Forecasts
- **24-Hour Forecast**: Shows weather conditions every hour with temperature and weather icons
- **7-Day Forecast**: Displays daily weather with separate day and night icons, high/low temperatures, and detailed descriptions

### Additional Features
- Save favorite locations
- Share weather via link
- Subscribe to daily weather email updates
- Responsive design for mobile and desktop
- Modern glassmorphism UI design

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Custom CSS with gradient backgrounds and glassmorphism effects
- Fetch API for backend communication

### Backend
- Node.js with Express.js
- OpenWeather API integration:
  - Geocoding API (city/state/country → coordinates)
  - Current Weather API
  - 16-day Forecast API
  - Hourly Forecast API for 4 days
- Brevo API for newsletter functionality
- Node-cron for scheduled tasks

## API Endpoints

### Weather Endpoints
- `GET /weather` - Get current weather (requires city, country, optional state)
- `GET /weather/forecast` - Get 24-hour forecast data
- `GET /weather/forecast/daily` - Get 7-day forecast data

### Newsletter Endpoints
- `POST /api/newsletter/subscribe` - Subscribe to weather updates
- `POST /api/newsletter/unsubscribe` - Unsubscribe from updates
- `POST /api/cron/daily-weather` - Trigger daily email job (cron service)

## Setup

1. Clone the repository
2. Install backend dependencies: `cd backend && npm install`
3. Create `.env` file in backend folder:
   ```
   API_KEY=your_openweather_api_key
   BREVO_API_KEY=your_brevo_api_key
   BREVO_LIST_ID=your_brevo_list_id
   CRON_SECRET=your_cron_secret
   PORT=9000
   ```
4. Start backend: `npm start`
5. Open `frontend/weather.html` in browser

## Deployment

- Backend: Deployed on Vercel
- Frontend: GitHub Pages

## Credits

Base Code from Bro Code: https://youtu.be/lfmg-EJ8gm4?si=h0hM-UHa1lWqDmji&t=40881

Modified with extensive enhancements including:
- Geocoding API integration with country/state selection
- 24-hour and 7-day weather forecasts
- Newsletter subscription system
- Saved locations feature
- Enhanced UI with modern design
- Day/night weather icons
- And much more!

## Website Link

https://dmish13.github.io/weather-app/frontend/weather.html

Simply select a country, optionally a state (for US), enter a city name, and get comprehensive weather data with hourly and daily forecasts!
