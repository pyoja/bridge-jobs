import { TagFilter } from "@/components/TagFilter";
import { JobCard } from "@/components/JobCard";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db";

import { sql } from 'kysely';

// Next.js ISR 캐싱: 데이터베이스 쿼리를 60초간 캐시
export const revalidate = 60;

// Next 15 App Router searchParams 처리 방식
type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: SearchParamsProps) {
  const resolvedParams = await searchParams;
  const tagParam = typeof resolvedParams.tag === "string" ? resolvedParams.tag : undefined;

  // Kysely Query Builder
  let query = db.selectFrom('jobs').selectAll().where('is_safe', '=', true).orderBy('created_at', 'desc');

  // 태그가 존재할 경우, Postgres ANY() 로 처리
  if (tagParam) {
    const literalTag = `#${tagParam}`;
    query = query.where(sql<boolean>`${literalTag} = ANY(tags)`);
  }

  // 데이터베이스에서 데이터 가져오기 (비동기)
  const jobs = await query.limit(50).execute();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              브릿지잡스
            </h1>
          </div>
          <p className="text-sm font-medium text-zinc-500 hidden sm:block">
            자진 퇴사자를 위한 징검다리 일자리 큐레이션
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <section className="mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
            실업급여 수급을 위한<br className="sm:hidden" /> 안전한 단기 일자리
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            고용보험이 적용되며 1~3개월 후 계약 만료가 가능한 공고만 엄선했습니다. 
            위험한 프리랜서(3.3%) 공고는 사전에 1차 필터링됩니다.
          </p>
        </section>

        <section>
          <TagFilter />
        </section>

        <section className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              추천 공고 <span className="text-blue-600">{jobs.length}</span>건
            </h3>
          </div>
          
          {jobs.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
              <p className="text-zinc-500 dark:text-zinc-400">해당 조건에 맞는 공고가 없습니다.</p>
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
