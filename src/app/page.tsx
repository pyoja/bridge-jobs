import { TagFilter } from "@/components/TagFilter";
import { JobCard } from "@/components/JobCard";
import { CrawlTriggerButton } from "@/components/CrawlTriggerButton";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db";
import { sql } from 'kysely';

export const revalidate = 60;

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: SearchParamsProps) {
  const resolvedParams = await searchParams;

  // 기본 모델 구축 (위험 공고 배제)
  let query = db
    .selectFrom('jobs')
    .selectAll()
    .where('is_safe', '=', true)
    .orderBy('created_at', 'desc');

  // 1. 지역 조건 필터
  const area = typeof resolvedParams.area === 'string' ? resolvedParams.area : null;
  if (area && area !== '전체') {
    query = query.where('location', 'like', `%${area}%`);
  }

  // 2. 포함 키워드 필터
  const includeStr = typeof resolvedParams.include === 'string' ? resolvedParams.include : null;
  if (includeStr) {
    const keywords = includeStr.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      query = query.where((eb) => eb.or([
        eb('title', 'like', `%${kw}%`),
        eb('company_name', 'like', `%${kw}%`)
      ]));
    }
  }

  // 3. 제외 키워드 필터
  const excludeStr = typeof resolvedParams.exclude === 'string' ? resolvedParams.exclude : null;
  if (excludeStr) {
    const keywords = excludeStr.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      query = query.where('title', 'not like', `%${kw}%`);
      query = query.where('company_name', 'not like', `%${kw}%`);
    }
  }

  // 4. 체크박스 필터
  if (resolvedParams.min_hours === '40') {
    query = query.where('weekly_work_hours', '>=', 40);
  }
  if (resolvedParams.insured === '1') {
    query = query.where('has_employment_insurance', '=', true);
  }

  const jobs = await query.limit(50).execute();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 w-full mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              브릿지잡스
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-zinc-500 hidden md:block">
              관리자 모드:
            </p>
            <CrawlTriggerButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
            실업급여 수급을 위한<br className="sm:hidden" /> 가장 정확한 조건
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            알바몬의 전체 계약직/단기 공고를 1차로 로드한 후, 원하시는 지역과 키워드(포함/제외)로 정밀하게 직접 필터링 해보세요. 위험한 3.3% 프리랜서 공고는 시스템이 미리 차단합니다.
          </p>
        </section>

        {/* 렌더링된 상세 다중 검색 패널 */}
        <section>
          <TagFilter />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              검색 결과 <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full text-sm">{jobs.length}</span>
            </h3>
          </div>
          
          {jobs.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
              <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">조건에 맞는 공고가 없습니다.</p>
              <p className="text-zinc-500 dark:text-zinc-400">필터를 조금 더 완화하거나 크롤링 업데이트를 기다려주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
