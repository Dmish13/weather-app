require('dotenv').config();
const express = require('express');
const cors = require('cors');
const newsletterRoutes = require('./routes/newsletter');

// Start cron jobs for daily weather emails
require('./jobs/dailyWeather');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/weather', async (req, res) => {
  try {
    const { city, state, country } = req.query;
    const apiKey = process.env.API_KEY;
    
    if (!city || !country) {
      return res.status(400).json({ error: 'City and country are required' });
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
    
    const { lat, lon } = geoData[0];
    
    // Step 2: Get weather data using coordinates
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
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

// Forecast endpoint (5-day / 3-hour intervals - we'll use this for both hourly and daily)
app.get('/weather/forecast', async (req, res) => {
  try {
    const { city, state, country } = req.query;
    const apiKey = process.env.API_KEY;
    
    if (!city || !country) {
      return res.status(400).json({ error: 'City and country are required' });
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
    
    const { lat, lon } = geoData[0];
    
    // Get 5-day / 3-hour forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
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