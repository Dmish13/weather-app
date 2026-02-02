const express = require('express');
const router = express.Router();
const { subscribeUser, unsubscribeUser } = require('../services/brevoService');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email, city, lat, lon } = req.body;
        
        console.log('📋 Subscription request received:', { email, city, lat, lon });
        
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
