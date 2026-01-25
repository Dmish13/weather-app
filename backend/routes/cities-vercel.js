const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Fallback to in-memory search if database doesn't work
let citiesData = null;
let countryCodes = null;
let stateCodes = null;

// Load JSON data on startup
function loadCitiesData() {
  if (citiesData) return true;
  
  try {
    // Try multiple possible paths for Vercel deployment
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'frontend', 'cities.json'),
      path.join(process.cwd(), 'frontend', 'cities.json'),
      path.join(__dirname, '..', 'frontend', 'cities.json'),
      path.join(process.cwd(), 'backend', 'frontend', 'cities.json')
    ];
    
    let citiesPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        citiesPath = p;
        break;
      }
    }
    
    if (!citiesPath) {
      console.error('❌ Could not find cities.json in any of the expected locations');
      console.error('Tried paths:', possiblePaths);
      console.error('Current working directory:', process.cwd());
      console.error('__dirname:', __dirname);
      return false;
    }
    
    const countryCodesPath = citiesPath.replace('cities.json', 'countrycodes.json');
    const stateCodesPath = citiesPath.replace('cities.json', 'statecodes.json');
    
    citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
    countryCodes = JSON.parse(fs.readFileSync(countryCodesPath, 'utf8'));
    stateCodes = JSON.parse(fs.readFileSync(stateCodesPath, 'utf8'));
    console.log(`✅ Loaded ${citiesData.length} cities for autocomplete from ${citiesPath}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to load cities data:', error.message);
    return false;
  }
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
  // Try to load data if not already loaded
  if (!citiesData) {
    loadCitiesData();
  }
  
  if (!citiesData) {
    return res.status(503).json({ 
      error: 'Cities data not available. Check server logs for details.' 
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

// Initialize on module load
loadCitiesData();

module.exports = router;
