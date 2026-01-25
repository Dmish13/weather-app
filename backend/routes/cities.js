const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const router = express.Router();

// Open database in readonly mode
const dbPath = path.join(__dirname, '..', 'data', 'cities.db');
let db;

try {
  db = new Database(dbPath, { readonly: true, fileMustExist: true });
  console.log('✅ Cities database loaded');
} catch (error) {
  console.error('❌ Cities database not found. Run "node import-cities.js" first.');
}

// Autocomplete endpoint
router.get('/', (req, res) => {
  if (!db) {
    return res.status(503).json({ 
      error: 'Cities database not available. Please run import-cities.js first.' 
    });
  }

  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 results
  
  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    // Escape special FTS5 characters and add prefix wildcard
    const searchQuery = q.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ') + '*';
    
    const stmt = db.prepare(`
      SELECT name, country, subcountry, id 
      FROM cities 
      WHERE cities MATCH ? 
      ORDER BY rank 
      LIMIT ?
    `);
    
    const results = stmt.all(searchQuery, limit);
    res.json(results);
  } catch (error) {
    console.error('City search error:', error);
    // If FTS query fails, return empty array instead of error
    res.json([]);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

module.exports = router;
