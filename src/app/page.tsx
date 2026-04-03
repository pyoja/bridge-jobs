import { TagFilter } from "@/components/TagFilter";
import { JobCard } from "@/components/JobCard";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db";

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

  // 체크박스 파라미터 적용 로직
  if (resolvedParams.min_hours === '40') {
    query = query.where('weekly_work_hours', '>=', 40);
  }
  if (resolvedParams.insured === '1') {
    query = query.where('has_employment_insurance', '=', true);
  }
  if (resolvedParams.contract === '1') {
    query = query.where('is_contract_worker', '=', true);
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
          <p className="text-sm font-medium text-zinc-500 hidden sm:block">
            자진 퇴사자를 위한 징검다리 일자리 큐레이션
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
            실업급여 수급을 위한<br className="sm:hidden" /> 가장 정확한 조건
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            자발적 퇴사 후 실업급여를 받기 위해서는 '주 15시간 이상', '고용보험 가입', '기간제 계약만료' 요건을 채워야 합니다.
            위험한 3.3% 프리랜서 공고를 걸러내고 안전한 데이터만 찾아보세요.
          </p>
        </section>

        {/* 상세 조건 필터 */}
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
