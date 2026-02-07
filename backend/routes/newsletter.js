const express = require('express');
const router = express.Router();
const { subscribeUser, unsubscribeUser } = require('../services/brevoService');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
    try { fs.mkdirSync(LOG_DIR); } catch (e) { /* ignore */ }
}
const SUBSCRIBE_LOG = path.join(LOG_DIR, 'subscribe.log');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        let { email, city, lat, lon } = req.body;

        // Coerce incoming lat/lon to numbers when present
        const parsedLat = (typeof lat !== 'undefined' && lat !== null && lat !== '') ? Number(lat) : null;
        const parsedLon = (typeof lon !== 'undefined' && lon !== null && lon !== '') ? Number(lon) : null;

        // Log the raw and parsed payload for debugging
        console.log('📋 Subscription request received:', { raw: req.body, parsed: { email, city, lat: parsedLat, lon: parsedLon } });

        // Also append to a persistent log so you can inspect subscriptions even if console isn't visible
        try {
            const entry = {
                time: new Date().toISOString(),
                raw: req.body,
                parsed: { email, city, lat: parsedLat, lon: parsedLon }
            };
            fs.appendFileSync(SUBSCRIBE_LOG, JSON.stringify(entry) + '\n');
        } catch (e) {
            // non-fatal
        }

        lat = parsedLat;
        lon = parsedLon;
        
        if (!email || !city) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and city are required' 
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid email address' 
            });
        }

        const result = await subscribeUser(email, city, lat, lon);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Successfully subscribed to weather updates!' 
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: 'Failed to subscribe. Please try again.' 
            });
        }
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                error: 'Email is required' 
            });
        }

        const result = await unsubscribeUser(email);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Successfully unsubscribed' 
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: 'Failed to unsubscribe' 
            });
        }
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

module.exports = router;
