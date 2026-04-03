const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    await client.connect();
    console.log("DB 연결됨, 더미 데이터 삭제 및 스키마 업데이트 진행...");

    // 더미 데이터 전체 삭제
    await client.query(`DELETE FROM jobs;`);
    console.log("✅ 모든 더미 공고 삭제 완료");

    // weekly_work_hours 숫자형 컬럼 추가 (이미 있을 경우를 대비해 에러 무시 혹은 IF NOT EXISTS 처리)
    // Postgres는 컬럼 추가 구문에 IF NOT EXISTS 지원 (버전 10+)
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS weekly_work_hours INTEGER;
    `);
    console.log("✅ 'weekly_work_hours' 컬럼 추가 완료");

  } catch (err) {
    console.error("❌ 에러 발생:", err);
  } finally {
    await client.end();
  }
}

runMigration();
