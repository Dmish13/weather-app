require('dotenv').config();
const express = require('express');
const cors = require('cors');
const newsletterRoutes = require('./routes/newsletter');

// Start cron jobs for daily weather emails
require('./jobs/dailyWeather');

const app = express();

// Configure CORS to allow the frontend origin in production via FRONTEND_URL
const FRONTEND_URL = process.env.FRONTEND_URL || '';
if (FRONTEND_URL) {
  app.use(cors({ origin: FRONTEND_URL }));
  console.log(`CORS restricted to: ${FRONTEND_URL}`);
} else {
  // Default to allow all during local development
  app.use(cors());
  console.log('CORS: allowing all origins (no FRONTEND_URL set)');
}
app.use(express.json());

// Minimal request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/weather', async (req, res) => {
  try {
    const { city, state, country, lat, lon } = req.query;
    const apiKey = process.env.API_KEY;
    
    let latitude, longitude;
    
    // Check if coordinates are provided directly
    if (lat && lon) {
      latitude = lat;
      longitude = lon;
    } else {
      // Otherwise, use city/state/country to get coordinates
      if (!city || !country) {
        return res.status(400).json({ error: 'City and country are required, or provide lat and lon' });
      }
      
      // Step 1: Get coordinates from geocoding API
      // Format: city,state,country for US or city,country for others
      const locationQuery = state && country === 'US' 
        ? `${city},${state},${country}` 
        : `${city},${country}`;
      
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();
      
      if (!geoResponse.ok || !geoData || geoData.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }
      
      latitude = geoData[0].lat;
      longitude = geoData[0].lon;
    }
    
    // Step 2: Get weather data using coordinates
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    if (!weatherResponse.ok) {
      return res.status(weatherResponse.status).json({ error: 'Weather data not available' });
    }
    
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Hourly Forecast endpoint (24 hours using Pro API)
app.get('/weather/forecast', async (req, res) => {
  try {
    const { city, state, country, lat, lon } = req.query;
    const apiKey = process.env.API_KEY;
    
    let latitude, longitude;
    
    // Check if coordinates are provided directly
    if (lat && lon) {
      latitude = lat;
      longitude = lon;
    } else {
      // Otherwise, use city/state/country to get coordinates
      if (!city || !country) {
        return res.status(400).json({ error: 'City and country are required, or provide lat and lon' });
      }
      
      // Get coordinates from geocoding API
      const locationQuery = state && country === 'US' 
        ? `${city},${state},${country}` 
        : `${city},${country}`;
      
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();
      
      if (!geoResponse.ok || !geoData || geoData.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }
      
      latitude = geoData[0].lat;
      longitude = geoData[0].lon;
    }
    
    // Get hourly forecast using Pro API (24 hours)
    const forecastUrl = `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    
    if (!forecastResponse.ok) {
      return res.status(forecastResponse.status).json({ error: 'Forecast data not available' });
    }
    
    res.json(forecastData);
  } catch (error) {
    console.error('Forecast API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Daily Forecast endpoint (7 days using Pro API)
app.get('/weather/forecast/daily', async (req, res) => {
  try {
    const { city, state, country, lat, lon } = req.query;
    const apiKey = process.env.API_KEY;
    
    let latitude, longitude;
    
    // Check if coordinates are provided directly
    if (lat && lon) {
      latitude = lat;
      longitude = lon;
    } else {
      // Otherwise, use city/state/country to get coordinates
      if (!city || !country) {
        return res.status(400).json({ error: 'City and country are required, or provide lat and lon' });
      }
      
      // Get coordinates from geocoding API
      const locationQuery = state && country === 'US' 
        ? `${city},${state},${country}` 
        : `${city},${country}`;
      
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();
      
      if (!geoResponse.ok || !geoData || geoData.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }
      
      latitude = geoData[0].lat;
      longitude = geoData[0].lon;
    }
    
    // Get 16-day daily forecast using standard API (Developer plan includes this)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${latitude}&lon=${longitude}&cnt=7&appid=${apiKey}`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    
    if (!forecastResponse.ok) {
      return res.status(forecastResponse.status).json({ error: 'Daily forecast data not available' });
    }
    
    res.json(forecastData);
  } catch (error) {
    console.error('Daily Forecast API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Newsletter API routes
app.use('/api/newsletter', newsletterRoutes);

// Cron endpoint for daily weather emails (triggered by cron-job.org)
const { sendDailyWeatherEmails } = require('./jobs/dailyWeather');

app.post('/api/cron/daily-weather', async (req, res) => {
    // Verify it's from authorized cron service
    const authToken = req.headers['authorization'];
    if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
        console.log('❌ Unauthorized cron attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('✅ Authorized cron job triggered');
    try {
        await sendDailyWeatherEmails();
        res.json({ success: true, message: 'Daily emails sent' });
    } catch (error) {
        console.error('Cron job error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));