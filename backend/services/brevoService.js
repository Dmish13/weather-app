const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Subscribe a user to the newsletter
async function subscribeUser(email, city, lat = null, lon = null) {
    const apiInstance = new SibApiV3Sdk.ContactsApi();
    
    const attributes = {
        CITY: city,
        SUBSCRIBED_DATE: new Date().toISOString()
    };
    
    // Store coordinates if provided (for geolocation-based subscriptions)
    if (lat !== null && lon !== null) {
        attributes.LAT = lat.toString();
        attributes.LON = lon.toString();
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
    if (lat && lon) {
        forecastUrl = `https://dmish13.github.io/weather-app/frontend/weather.html?lat=${lat}&lon=${lon}`;
    } else {
        forecastUrl = `https://dmish13.github.io/weather-app/frontend/weather.html?city=${encodeURIComponent(city)}`;
    }
    
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
                        <a href="${forecastUrl}" class="btn">View Full Forecast</a>
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
    sendWeatherEmail
};
