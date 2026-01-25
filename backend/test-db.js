const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'cities.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  console.log('✅ Database opened successfully');

  // Test query 1: Simple prefix match
  const stmt1 = db.prepare("SELECT name, country, subcountry, id FROM cities WHERE cities MATCH ? LIMIT 5");
  console.log('\nTest 1: Searching for "paris*"');
  console.log(stmt1.all('paris*'));

  // Test query 2: With spaces
  const stmt2 = db.prepare("SELECT name, country, subcountry, id FROM cities WHERE cities MATCH ? LIMIT 5");
  console.log('\nTest 2: Searching for "new york*"');
  console.log(stmt2.all('new york*'));

  // Test query 3: Different query
  const stmt3 = db.prepare("SELECT name, country, subcountry, id FROM cities WHERE cities MATCH ? LIMIT 5");
  console.log('\nTest 3: Searching for "london*"');
  console.log(stmt3.all('london*'));
  
  // Test query 4: Chilean city
  const stmt4 = db.prepare("SELECT name, country, subcountry, id FROM cities WHERE cities MATCH ? LIMIT 5");
  console.log('\nTest 4: Searching for "antofagasta*"');
  console.log(stmt4.all('antofagasta*'));

  db.close();
  console.log('\n✅ All tests passed');
} catch (error) {
  console.error('❌ Error:', error);
}
