-- 스코어링 관련 컬럼 추가 마이그레이션
-- score: 키워드 스코어링 총점 (S급 +50, A급 +20, 블랙리스트 -100)
-- matched_keywords: 발견된 키워드 목록 (grade|keyword 형식, 예: "S|이직확인서", "BL|3.3%")

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matched_keywords TEXT[] NOT NULL DEFAULT '{}';

-- weekly_work_hours 컬럼도 추가 (기존 스키마에 누락된 경우)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS weekly_work_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- score 인덱스 추가 (정렬 성능)
CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score DESC);
