const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const {parser} = require('stream-json');
const {streamArray} = require('stream-json/streamers/StreamArray');

const jsonPath = path.join(__dirname, '..', 'frontend', 'cities.json');
const dbPath = path.join(__dirname, 'data', 'cities.db');
const countryCodesPath = path.join(__dirname, '..', 'frontend', 'countrycodes.json');
const stateCodesPath = path.join(__dirname, '..', 'frontend', 'statecodes.json');

console.log('Starting city import...');
console.log('Source:', jsonPath);
console.log('Destination:', dbPath);

// Load country and state code mappings
console.log('Loading country and state code mappings...');
const countryCodes = JSON.parse(fs.readFileSync(countryCodesPath, 'utf8'));
const stateCodes = JSON.parse(fs.readFileSync(stateCodesPath, 'utf8'));
console.log(`✅ Loaded ${Object.keys(countryCodes).length} country codes`);
console.log(`✅ Loaded ${Object.keys(stateCodes).length} state codes`);

// Ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Create database and FTS5 table
const db = new Database(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  DROP TABLE IF EXISTS cities;
  CREATE VIRTUAL TABLE cities USING fts5(
    name, 
    country, 
    subcountry, 
    id UNINDEXED
  );
`);

const insert = db.prepare('INSERT INTO cities (name, country, subcountry, id) VALUES (?, ?, ?, ?)');

// Helper function to map country code to name
function getCountryName(code) {
  return countryCodes[code] || code || '';
}

// Helper function to map state code to name (US only)
function getStateName(stateCode, countryCode) {
  if (countryCode === 'US' && stateCode) {
    return stateCodes[stateCode] || stateCode;
  }
  return stateCode || '';
}

// Stream and insert cities
const stream = fs.createReadStream(jsonPath)
  .pipe(parser())
  .pipe(streamArray());

let count = 0;
const insertMany = db.transaction((cities) => {
  for (const city of cities) {
    // Map country code to full name
    const countryName = getCountryName(city.country);
    
    // Map state code to full name (only for US)
    const stateName = getStateName(city.state, city.country);
    
    insert.run(
      city.name || '',
      countryName,
      stateName,
      city.id || 0
    );
  }
});

let batch = [];
stream.on('data', ({value}) => {
  batch.push(value);
  count++;
  
  // Insert in batches of 1000 for better performance
  if (batch.length >= 1000) {
    insertMany(batch);
    batch = [];
    if (count % 10000 === 0) {
      console.log(`Inserted ${count} cities...`);
    }
  }
});

stream.on('end', () => {
  // Insert remaining batch
  if (batch.length > 0) {
    insertMany(batch);
  }
  
  console.log(`\n✅ Import complete! Total cities: ${count}`);
  
  // Test queries
  const stmt = db.prepare("SELECT name, country, subcountry, id FROM cities WHERE name MATCH ? LIMIT 5");
  
  console.log('\nTest query for "paris":');
  console.log(stmt.all('paris*'));
  
  console.log('\nTest query for "antofagasta":');
  console.log(stmt.all('antofagasta*'));
  
  console.log('\nTest query for US city with state:');
  console.log(stmt.all('new york*'));
  
  db.close();
});

stream.on('error', (error) => {
  console.error('Error during import:', error);
  db.close();
  process.exit(1);
});
