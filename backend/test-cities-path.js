// Quick test script for cities-vercel.js
const path = require('path');
const fs = require('fs');

console.log('Testing cities-vercel.js path resolution...\n');

const possiblePaths = [
  path.join(__dirname, '..', 'frontend', 'cities.json'),
  path.join(process.cwd(), 'frontend', 'cities.json'),
  path.join(__dirname, 'frontend', 'cities.json'),
  path.join(process.cwd(), 'backend', 'frontend', 'cities.json')
];

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('\nTrying paths:');

for (const p of possiblePaths) {
  const exists = fs.existsSync(p);
  console.log(`${exists ? '✅' : '❌'} ${p}`);
  if (exists) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(`   Found ${data.length} cities`);
    
    // Test search
    const matches = data.filter(city => city.name.toLowerCase().startsWith('paris')).slice(0, 3);
    console.log(`   Test search for "paris": found ${matches.length} results`);
    matches.forEach(city => console.log(`     - ${city.name}, ${city.country}`));
    break;
  }
}
