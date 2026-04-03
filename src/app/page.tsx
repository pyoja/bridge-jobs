import { TagFilter } from "@/components/TagFilter";
import { JobCard } from "@/components/JobCard";
import { db } from "@/lib/db";
import { Briefcase, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: SearchParamsProps) {
  const resolvedParams = await searchParams;

  let query = db
    .selectFrom('jobs')
    .selectAll()
    .where('is_safe', '=', true)
    .orderBy('created_at', 'desc');

  // 1. 지역 필터
  const area = typeof resolvedParams.area === 'string' ? resolvedParams.area : null;
  if (area && area !== '전체') {
    query = query.where('location', 'like', `%${area}%`);
  }

  // 2. 근무기간 필터
  const period = typeof resolvedParams.period === 'string' ? resolvedParams.period : null;
  if (period === 'short') {
    query = query.where('work_duration', 'like', '%1주%');
  } else if (period === 'medium') {
    query = query.where('work_duration', 'like', '%1개월%');
  }

  // 3. 포함 키워드
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

  // 4. 제외 키워드
  const excludeStr = typeof resolvedParams.exclude === 'string' ? resolvedParams.exclude : null;
  if (excludeStr) {
    const keywords = excludeStr.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      query = query.where('title', 'not like', `%${kw}%`);
      query = query.where('company_name', 'not like', `%${kw}%`);
    }
  }

  // 5. 주 40시간 이상
  if (resolvedParams.min_hours === '40') {
    query = query.where('weekly_work_hours', '>=', 40);
  }

  const jobs = await query.execute();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
      {/* 헤더 */}
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
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
            <Link href="/saved" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-blue-600 dark:text-zinc-300 transition-colors">
              <span className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full"><svg className="w-3.5 h-3.5 text-red-500 fill-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></span>
              <span className="hidden sm:inline">내 보관함</span>
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">이 사이트 소개</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* 필터 */}
        <TagFilter />

        {/* 공고 목록 */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            선별된 공고
            <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full text-sm font-bold">
              {jobs.length}건
            </span>
          </h2>
          <span className="text-xs text-zinc-400">3.3% 및 위험 공고 제외됨</span>
        </div>

        {jobs.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
            <ShieldCheck className="w-10 h-10 text-zinc-300 mb-3" />
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              아직 수집된 공고가 없습니다.
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
              매일 새벽 3시에 자동으로 공고를 업데이트합니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
