-- jobs 테이블 생성
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT UNIQUE NOT NULL,       
  platform TEXT NOT NULL,                  
  title TEXT NOT NULL,                     
  company_name TEXT NOT NULL,              
  
  -- 근무 조건
  work_duration TEXT NOT NULL,             
  work_days TEXT,                          
  work_hours TEXT,                         
  wage_type TEXT,                          
  wage_amount INTEGER,                     
  
  -- 실업급여 핵심 검증 요소
  has_employment_insurance BOOLEAN NOT NULL DEFAULT FALSE, 
  is_contract_worker BOOLEAN NOT NULL DEFAULT FALSE,       
  
  -- 필터링 및 태그
  is_safe BOOLEAN NOT NULL DEFAULT TRUE,   
  warning_tags TEXT[] DEFAULT '{}',        
  tags TEXT[] DEFAULT '{}',                
  
  -- 날짜 정보
  deadline_date TIMESTAMP WITH TIME ZONE,  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

-- 인덱스 생성
CREATE INDEX idx_jobs_is_safe ON jobs(is_safe);
CREATE INDEX idx_jobs_duration ON jobs(work_duration);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
