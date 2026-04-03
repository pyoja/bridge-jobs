// DATABASE_URL에서 pgbouncer 파라미터 제거 후 테스트
const raw = process.env.DATABASE_URL;
console.log("원본 DATABASE_URL:", raw?.slice(0, 60) + "...");

const clean = raw?.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "");
console.log("정제된 URL:", clean?.slice(0, 60) + "...");

const { Client } = require('pg');
const client = new Client({ connectionString: clean, ssl: { rejectUnauthorized: false } });

client.connect()
  .then(() => {
    console.log("✅ DB 연결 성공!");
    return client.query("SELECT COUNT(*) as cnt FROM jobs");
  })
  .then(r => {
    console.log("공고 수:", r.rows[0].cnt);
    return client.end();
  })
  .catch(e => console.error("❌ 연결 실패:", e.message));
