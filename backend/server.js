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
  const city = req.query.city;
  const apiKey = process.env.API_KEY;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  res.json(data);
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