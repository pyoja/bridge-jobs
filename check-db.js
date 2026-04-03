const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function check() {
  await client.connect();
  const r = await client.query('SELECT COUNT(*) as cnt, MAX(created_at) as last FROM jobs');
  console.log("총 공고 수:", r.rows[0].cnt, "/ 마지막 수집:", r.rows[0].last);
  await client.end();
}
check();
