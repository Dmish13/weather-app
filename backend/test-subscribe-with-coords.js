require('dotenv').config();
const { subscribeUser } = require('./services/brevoService');

async function testSubscribeWithCoords() {
    console.log('🧪 Testing subscription with coordinates...\n');
    
    // New Port Richey, FL coordinates
    const email = 'test-coords@example.com';
    const city = 'New Port Richey';
    const lat = 28.2442;
    const lon = -82.7193;
    
    console.log(`Subscribing ${email} to ${city}`);
    console.log(`Coordinates: ${lat}, ${lon}\n`);
    
    const result = await subscribeUser(email, city, lat, lon);
    
    console.log('\n📊 Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
        console.log('\n✅ Subscription successful with coordinates!');
    } else {
        console.log('\n❌ Subscription failed:', result.error);
    }
    
    process.exit(0);
}

testSubscribeWithCoords().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
