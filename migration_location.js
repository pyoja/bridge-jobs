const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  try {
    console.log('Connecting to DIRECT_URL for Location Migration...');
    await pool.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(12, 8) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(12, 8) DEFAULT NULL;
    `);
    console.log('Migration successful: latitude, longitude columns added.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
