"use server";

import { db } from "@/lib/db";
import { JobType } from "@/components/JobCard";
import { sql } from "kysely";

export type GetJobsParams = {
  platform?: string;
  duration?: string; // short | medium
  include?: string;
  exclude?: string;
  min_hours?: string;
  areas?: string;   // 쉼표 구분 구 이름 (예: "마포구,영등포구")
  page?: number;
  limit?: number;
};

export async function getJobs(params: GetJobsParams = {}): Promise<JobType[]> {
  const {
    platform,
    duration,
    include,
    exclude,
    min_hours,
    areas,
    page = 1,
    limit = 15,
  } = params;

  let query = db.selectFrom('jobs').selectAll().where('is_safe', '=', true);

  // 1. 플랫폼 필터
  if (platform && platform !== 'all') {
    query = query.where('platform', '=', platform);
  }

  // 2. 지역 다중선택 필터 (마포구, 영등포구 등 구 이름 LIKE 검색)
  if (areas) {
    const guList = areas.split(',').map(x => x.trim()).filter(Boolean);
    if (guList.length > 0) {
      query = query.where((eb) =>
        eb.or(guList.map(gu => eb('location', 'like', `%${gu}%`)))
      );
    }
  }

  // 3. 계약기간 필터
  if (duration === 'short') {
    query = query.where('work_duration', 'like', '%1주%');
  } else if (duration === 'medium') {
    query = query.where('work_duration', 'like', '%1개월%');
  }

  // 4. 포함 키워드
  if (include) {
    const keywords = include.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      query = query.where((eb) => eb.or([
        eb('title', 'like', `%${kw}%`),
        eb('company_name', 'like', `%${kw}%`)
      ]));
    }
  }

  // 5. 제외 키워드
  if (exclude) {
    const keywords = exclude.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      query = query.where('title', 'not like', `%${kw}%`);
      query = query.where('company_name', 'not like', `%${kw}%`);
    }
  }

  // 6. 주 40시간 이상
  if (min_hours === '40') {
    query = query.where('weekly_work_hours', '>=', 40);
  }

  // 정렬 우선순위:
  // 1순위: score DESC — 가중치 높은 공고 최상단 (플랫폼 무관)
  // 2순위: 플랫폼 순서 (알바몬=1 → 알바천국=2 → 잡코리아=3) — score=0인 일반 공고용
  // 3순위: created_at DESC
  const platformOrder = sql<number>`
    CASE platform
      WHEN '알바몬' THEN 1
      WHEN '알바천국' THEN 2
      WHEN '잡코리아' THEN 3
      ELSE 4
    END
  `;

  query = query
    .orderBy('score', 'desc')
    .orderBy(platformOrder, 'asc')
    .orderBy('created_at', 'desc');

  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset);

  const jobs = await query.execute();
  return jobs as JobType[];
}
