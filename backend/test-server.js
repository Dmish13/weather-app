const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Cities route
const dbPath = path.join(__dirname, 'data', 'cities.db');
let db;

try {
  db = new Database(dbPath, { readonly: true, fileMustExist: true });
  console.log('✅ Database loaded');
} catch (error) {
  console.error('❌ Database error:', error.message);
}

app.get('/api/cities', (req, res) => {
  console.log('Received request for cities with query:', req.query);
  
  if (!db) {
    return res.status(503).json({ error: 'Database not available' });
  }

  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  
  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const searchQuery = q.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ') + '*';
    console.log('Search query:', searchQuery);
    
    const stmt = db.prepare(`
      SELECT name, country, subcountry, id 
      FROM cities 
      WHERE cities MATCH ? 
      ORDER BY rank 
      LIMIT ?
    `);
    
    const results = stmt.all(searchQuery, limit);
    console.log(`Found ${results.length} results`);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.json([]);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/test`);
  console.log(`Cities: http://localhost:${PORT}/api/cities?q=paris&limit=3`);
});
