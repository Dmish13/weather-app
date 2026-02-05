const SibApiV3Sdk = require('sib-api-v3-sdk');
const fs = require('fs');
const path = require('path');

// Path to store subscriber locations locally
const SUBSCRIBER_LOCATIONS_FILE = path.join(__dirname, '../data/subscriber-locations.json');

function normalizeCoord(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
}

// Helper to read subscriber locations
function readSubscriberLocations() {
    try {
        if (fs.existsSync(SUBSCRIBER_LOCATIONS_FILE)) {
            const data = fs.readFileSync(SUBSCRIBER_LOCATIONS_FILE, 'utf8');
            return JSON.parse(data).subscribers || [];
        }
    } catch (error) {
        console.error('Error reading subscriber locations:', error.message);
    }
    return [];
}

// Helper to write subscriber locations
function writeSubscriberLocations(subscribers) {
    try {
        fs.writeFileSync(SUBSCRIBER_LOCATIONS_FILE, JSON.stringify({ subscribers }, null, 2));
    } catch (error) {
        console.error('Error writing subscriber locations:', error.message);
    }
}

// Helper to save subscriber location
function saveSubscriberLocation(email, city, lat, lon) {
    const subscribers = readSubscriberLocations();
    const normalizedLat = normalizeCoord(lat);
    const normalizedLon = normalizeCoord(lon);
    
    // Remove old entry if exists
    const filtered = subscribers.filter(s => s.email !== email);
    
    // Add new entry if coordinates are provided
    if (normalizedLat !== null && normalizedLon !== null) {
        filtered.push({ email, city, lat: normalizedLat, lon: normalizedLon, savedAt: new Date().toISOString() });
    }
    
    writeSubscriberLocations(filtered);
}

// Helper to get subscriber location
function getSubscriberLocation(email) {
    const subscribers = readSubscriberLocations();
    return subscribers.find(s => s.email === email);
}

// Subscribe a user to the newsletter
async function subscribeUser(email, city, lat = null, lon = null) {
    const apiInstance = new SibApiV3Sdk.ContactsApi();
    
    // Configure API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    const attributes = {
        CITY: city,
        SUBSCRIBED_DATE: new Date().toISOString()
    };
    
    // Save coordinates locally (since Brevo doesn't support custom attributes)
    const normalizedLat = normalizeCoord(lat);
    const normalizedLon = normalizeCoord(lon);

    if (normalizedLat !== null && normalizedLon !== null) {
        saveSubscriberLocation(email, city, normalizedLat, normalizedLon);
        console.log(`✅ Saved coordinates locally for ${email}: LAT=${normalizedLat}, LON=${normalizedLon}`);
    } else {
        console.log(`⚠️ No coordinates provided for ${email} subscribing to ${city}`);
    }
    
    const createContact = {
        email: email,
        listIds: [parseInt(process.env.BREVO_LIST_ID)],
        attributes: attributes,
        updateEnabled: true // Update if already exists
    };

    try {
        const data = await apiInstance.createContact(createContact);
        console.log('User subscribed:', email);
        return { success: true, data };
    } catch (error) {
        // If contact already exists, Brevo returns 400
        if (error.response && error.response.statusCode === 400) {
            console.log('Contact already exists:', email);
            return { success: true, message: 'Already subscribed' };
        }
        console.error('Subscription error:', error);
        return { success: false, error: error.message };
    }
}

// Unsubscribe a user
async function unsubscribeUser(email) {
    const apiInstance = new SibApiV3Sdk.ContactsApi();
    
    try {
        await apiInstance.deleteContact(email);
        console.log('User unsubscribed:', email);
        return { success: true };
    } catch (error) {
        console.error('Unsubscribe error:', error);
        return { success: false, error: error.message };
    }
}

// Send a weather update email
async function sendWeatherEmail(email, city, weatherData, lat = null, lon = null) {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    const tempF = ((weatherData.temp - 273.15) * 9/5 + 32).toFixed(0);
    const feelsLikeF = ((weatherData.feels_like - 273.15) * 9/5 + 32).toFixed(0);
    
    // Build the forecast URL - use coordinates if available for accuracy
    let forecastUrl;
    const normalizedLat = normalizeCoord(lat);
    const normalizedLon = normalizeCoord(lon);
    if (normalizedLat !== null && normalizedLon !== null) {
        forecastUrl = `https://dmish13.github.io/weather-app/frontend/weather.html?lat=${normalizedLat}&lon=${normalizedLon}&city=${encodeURIComponent(city)}`;
    } else {
        forecastUrl = `https://dmish13.github.io/weather-app/frontend/weather.html?city=${encodeURIComponent(city)}`;
    }

    console.log(`🔗 Forecast URL for ${email}: ${forecastUrl}`);
    
    const sendSmtpEmail = {
        to: [{ email: email }],
        sender: { 
            name: "Weather App", 
            email: "danielbotros15@gmail.com"
        },
        subject: `☀️ Daily Weather for ${city}`,
        htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
                    .content { background: #f5f5f5; padding: 30px; border-radius: 10px; margin-top: 20px; }
                    .weather-info { background: white; padding: 20px; border-radius: 8px; margin: 10px 0; }
                    .temp { font-size: 48px; font-weight: bold; color: #667eea; }
                    .detail { margin: 10px 0; font-size: 16px; }
                    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>☀️ Weather Update for ${city}</h1>
                </div>
                <div class="content">
                    <div class="weather-info">
                        <div class="temp">${tempF}°F</div>
                        <div class="detail"><strong>Conditions:</strong> ${weatherData.description}</div>
                        <div class="detail"><strong>Feels like:</strong> ${feelsLikeF}°F</div>
                        <div class="detail"><strong>Humidity:</strong> ${weatherData.humidity}%</div>
                    </div>
                    <p>Have a great day! 🌤️</p>
                    <p style="text-align: center;">
                        <a href="${forecastUrl}" class="btn" style="color: #ffffff; text-decoration: none;">View Full Forecast</a>
                    </p>
                </div>
                <div class="footer">
                    <p>You're receiving this because you subscribed to weather updates for ${city}</p>
                    <p><a href="{{unsubscribe}}">Unsubscribe</a></p>
                </div>
            </body>
            </html>
        `,
        textContent: `Weather Update for ${city}\n\nTemperature: ${tempF}°F\nConditions: ${weatherData.description}\nFeels like: ${feelsLikeF}°F\nHumidity: ${weatherData.humidity}%`
    };

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent to:', email);
        return { success: true, data };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    subscribeUser,
    unsubscribeUser,
    sendWeatherEmail,
    getSubscriberLocation,
    saveSubscriberLocation
};
