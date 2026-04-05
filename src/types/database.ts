import { Generated } from 'kysely';

export interface JobsTable {
  id: Generated<string>;
  original_url: string;
  platform: string;
  title: string;
  company_name: string;
  
  work_duration: string;
  work_days: string | null;
  work_hours: string | null;
  weekly_work_hours: number | null;
  location: string | null;
  wage_type: string | null;
  wage_amount: number | null;
  
  has_employment_insurance: Generated<boolean>;
  is_contract_worker: Generated<boolean>;
  
  is_safe: Generated<boolean>;
  warning_tags: Generated<string[]>;
  tags: Generated<string[]>;
  
  deadline_date: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;

  // 스코어링 시스템
  score: Generated<number>;           // S/A/B급 점수 - 블랙리스트 감점 효과
  matched_keywords: Generated<string[]>; // 'S|이직확인서', 'A|고용보험', 'BL|3.3%' 형식
}

export interface Database {
  jobs: JobsTable;
}
