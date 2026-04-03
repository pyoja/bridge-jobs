const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function check() {
  await client.connect();
  const r = await client.query(`
    SELECT platform, location, COUNT(*) as cnt 
    FROM jobs 
    WHERE platform = '잡코리아'
    GROUP BY platform, location 
    ORDER BY cnt DESC
    LIMIT 30
  `);
  r.rows.forEach(row => {
    console.log(`[${row.platform}] "${row.location}" - ${row.cnt}건`);
  });
  await client.end();
}
check();
