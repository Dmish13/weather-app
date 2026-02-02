const cron = require('node-cron');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const fetch = require('node-fetch');
const { sendWeatherEmail, getSubscriberLocation } = require('../services/brevoService');

// Get all subscribers from Brevo
async function getAllSubscribers() {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    const apiInstance = new SibApiV3Sdk.ContactsApi();
    const listId = parseInt(process.env.BREVO_LIST_ID);
    
    try {
        const data = await apiInstance.getContactsFromList(listId, { limit: 500 });
        const contacts = data.contacts || [];
        
        // Log first subscriber's data to debug attributes
        if (contacts.length > 0) {
            console.log('\n📋 Sample subscriber data:');
            console.log(JSON.stringify(contacts[0], null, 2));
        }
        
        return contacts;
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return [];
    }
}

// Fetch weather data - use coordinates if available for accurate location
async function fetchWeatherData(city, lat = null, lon = null) {
    const apiKey = process.env.API_KEY;
    
    // Use coordinates if available (more accurate for the exact subscribed location)
    // Fall back to city name if coordinates are not stored
    let apiUrl;
    if (lat && lon) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    } else {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;
    }
    
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
                
                // Try to get coordinates from local storage
                let lat = null;
                let lon = null;
                
                const location = getSubscriberLocation(subscriber.email);
                if (location && location.lat && location.lon) {
                    lat = location.lat;
                    lon = location.lon;
                }
                
                // Fetch weather using coordinates if available, otherwise fall back to city name
                const weatherData = await fetchWeatherData(city, lat, lon);
                
                // Send email with coordinates if available
                await sendWeatherEmail(subscriber.email, city, {
                    temp: weatherData.main.temp,
                    feels_like: weatherData.main.feels_like,
                    description: weatherData.weather[0].description,
                    humidity: weatherData.main.humidity
                }, lat, lon);
                
                console.log(`Sent weather to ${subscriber.email} for ${city}${lat ? ` (using coords: ${lat},${lon})` : ' (using city name only)'}`)
                
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
