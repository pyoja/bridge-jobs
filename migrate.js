const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log("DB 접속. location 컬럼 추가 중...");
  try {
    await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(255);`);
    console.log("✅ location 컬럼 추가 성공");
  } catch (err) {
    console.error("❌ 실패:", err);
  } finally {
    await client.end();
  }
}

run();
