import { TagFilter } from "@/components/TagFilter";
import { db } from "@/lib/db";
import { Briefcase, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";
import { getJobs } from "@/actions/getJobs";
import { JobInfiniteList } from "@/components/JobInfiniteList";
import { LocationSearch } from "@/components/LocationSearch";

export const revalidate = 60;

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: SearchParamsProps) {
  const resolvedParams = await searchParams;

  const duration = typeof resolvedParams.period === 'string' ? resolvedParams.period : undefined;
  const include = typeof resolvedParams.include === 'string' ? resolvedParams.include : undefined;
  const exclude = typeof resolvedParams.exclude === 'string' ? resolvedParams.exclude : undefined;
  const min_hours = typeof resolvedParams.min_hours === 'string' ? resolvedParams.min_hours : undefined;
  const platform = typeof resolvedParams.platform === 'string' ? resolvedParams.platform : undefined;
  const areas = typeof resolvedParams.areas === 'string' ? resolvedParams.areas : undefined;
  const lat = typeof resolvedParams.lat === 'string' ? parseFloat(resolvedParams.lat) : undefined;
  const lng = typeof resolvedParams.lng === 'string' ? parseFloat(resolvedParams.lng) : undefined;

  const actionParams = { platform, duration, include, exclude, min_hours, areas, lat, lng };

  const initialJobs = await getJobs({ ...actionParams, page: 1, limit: 15 });

  // 전체 개수 카운트
  let countQuery = db.selectFrom('jobs').select((eb) => eb.fn.count('id').as('count')).where('is_safe', '=', true);

  if (platform && platform !== 'all') countQuery = countQuery.where('platform', '=', platform);

  if (areas) {
    const guList = areas.split(',').map(x => x.trim()).filter(Boolean);
    if (guList.length > 0) {
      countQuery = countQuery.where((eb) =>
        eb.or(guList.map(gu => eb('location', 'like', `%${gu}%`)))
      );
    }
  }

  if (duration === 'short') countQuery = countQuery.where('work_duration', 'like', '%1주%');
  else if (duration === 'medium') countQuery = countQuery.where('work_duration', 'like', '%1개월%');

  if (include) {
    const keywords = include.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      countQuery = countQuery.where((eb) => eb.or([ eb('title', 'like', `%${kw}%`), eb('company_name', 'like', `%${kw}%`) ]));
    }
  }

  if (exclude) {
    const keywords = exclude.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      countQuery = countQuery.where('title', 'not like', `%${kw}%`);
      countQuery = countQuery.where('company_name', 'not like', `%${kw}%`);
    }
  }

  if (min_hours === '40') countQuery = countQuery.where('weekly_work_hours', '>=', 40);

  const countResult = await countQuery.executeTakeFirst();
  const totalCount = countResult?.count ? Number(countResult.count) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
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
            <Link href="/about" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">이 사이트 소개</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <LocationSearch />
        <TagFilter />

        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            선별된 공고
            <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full text-sm font-bold">
              {totalCount.toLocaleString()}건
            </span>
          </h2>
          <span className="text-xs text-zinc-400">3.3% 및 위험 공고 제외됨</span>
        </div>

        {initialJobs.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
            <ShieldCheck className="w-10 h-10 text-zinc-300 mb-3" />
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              조건에 맞는 수집된 공고가 없습니다.
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
              필터 조건을 변경해보세요.
            </p>
          </div>
        ) : (
          <JobInfiniteList initialJobs={initialJobs} searchParams={actionParams} />
        )}
      </main>
    </div>
  );
}
