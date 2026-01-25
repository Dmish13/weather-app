const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Fallback to in-memory search if database doesn't work
let citiesData = null;
let countryCodes = null;
let stateCodes = null;

// Load JSON data on startup
try {
  const citiesPath = path.join(__dirname, '..', '..', 'frontend', 'cities.json');
  const countryCodesPath = path.join(__dirname, '..', '..', 'frontend', 'countrycodes.json');
  const stateCodesPath = path.join(__dirname, '..', '..', 'frontend', 'statecodes.json');
  
  if (fs.existsSync(citiesPath)) {
    citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
    countryCodes = JSON.parse(fs.readFileSync(countryCodesPath, 'utf8'));
    stateCodes = JSON.parse(fs.readFileSync(stateCodesPath, 'utf8'));
    console.log(`✅ Loaded ${citiesData.length} cities for autocomplete`);
  }
} catch (error) {
  console.error('❌ Failed to load cities data:', error.message);
}

// Helper functions
function getCountryName(code) {
  return countryCodes?.[code] || code || '';
}

function getStateName(stateCode, countryCode) {
  if (countryCode === 'US' && stateCode) {
    return stateCodes?.[stateCode] || stateCode;
  }
  return stateCode || '';
}

// Autocomplete endpoint using in-memory search
router.get('/', (req, res) => {
  if (!citiesData) {
    return res.status(503).json({ 
      error: 'Cities data not available' 
    });
  }

  const q = (req.query.q || '').trim().toLowerCase();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  
  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    // Filter cities that match the query
    const matches = citiesData
      .filter(city => city.name.toLowerCase().startsWith(q))
      .slice(0, limit)
      .map(city => ({
        name: city.name,
        country: getCountryName(city.country),
        subcountry: getStateName(city.state, city.country),
        id: city.id
      }));

    res.json(matches);
  } catch (error) {
    console.error('City search error:', error);
    res.json([]);
  }
});

module.exports = router;
