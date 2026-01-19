const cron = require('node-cron');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const fetch = require('node-fetch');
const { sendWeatherEmail } = require('../services/brevoService');

// Get all subscribers from Brevo
async function getAllSubscribers() {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    const apiInstance = new SibApiV3Sdk.ContactsApi();
    const listId = parseInt(process.env.BREVO_LIST_ID);
    
    try {
        const data = await apiInstance.getContactsFromList(listId, { limit: 500 });
        return data.contacts || [];
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return [];
    }
}

// Fetch weather data
async function fetchWeatherData(city) {
    const apiKey = process.env.API_KEY;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Weather fetch failed');
    
    return await response.json();
}

// Send daily weather emails
async function sendDailyWeatherEmails() {
    console.log('Starting daily weather email job...');
    
    try {
        const subscribers = await getAllSubscribers();
        console.log(`Found ${subscribers.length} subscribers`);
        
        for (const subscriber of subscribers) {
            try {
                const city = subscriber.attributes?.CITY;
                if (!city) {
                    console.log(`Skipping ${subscriber.email} - no city set`);
                    continue;
                }
                
                // Fetch weather for subscriber's city
                const weatherData = await fetchWeatherData(city);
                
                // Send email
                await sendWeatherEmail(subscriber.email, city, {
                    temp: weatherData.main.temp,
                    feels_like: weatherData.main.feels_like,
                    description: weatherData.weather[0].description,
                    humidity: weatherData.main.humidity
                });
                
                console.log(`Sent weather to ${subscriber.email} for ${city}`);
                
                // Wait 1 second between emails to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Failed to send to ${subscriber.email}:`, error.message);
            }
        }
        
        console.log('Daily weather email job completed');
    } catch (error) {
        console.error('Error in daily weather job:', error);
    }
}

// Schedule to run daily at 8 AM
cron.schedule('0 8 * * *', sendDailyWeatherEmails, {
    timezone: "America/New_York"
});

// For testing: Run every 5 minutes (UNCOMMENT TO TEST)
//cron.schedule('*/5 * * * *', sendDailyWeatherEmails);

console.log('✅ Daily weather email cron job scheduled for 8 AM daily (America/New_York timezone)');

// Export for manual testing
module.exports = { sendDailyWeatherEmails };
