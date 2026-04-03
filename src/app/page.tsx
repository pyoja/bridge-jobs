import { TagFilter } from "@/components/TagFilter";
import { JobCard } from "@/components/JobCard";
import { CrawlTriggerButton } from "@/components/CrawlTriggerButton";
import { db } from "@/lib/db";
import {
  Briefcase, ShieldCheck, XCircle, Clock, MapPin,
  CheckCircle2, AlertTriangle, Filter, Zap
} from "lucide-react";

export const revalidate = 60;

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ======== 서브 컴포넌트: 왜 브릿지잡스인가 섹션 ========
function WhyBridgeJobs() {
  return (
    <section className="mb-10">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-7 sm:p-10 mb-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px"}}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            자진퇴사자 전용 실업급여 루트
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
            알바몬에서 직접 찾는 것보다<br />
            <span className="text-yellow-300">3배 더 안전한</span> 공고만 보여드립니다
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl leading-relaxed">
            알바몬의 같은 조건으로 검색해도, 고용보험이 안 되거나 3.3% 프리랜서인 공고가 섞여 나옵니다.
            브릿지잡스는 <strong className="text-white">실업급여를 실제로 받을 수 있는 공고만</strong> 사전에 필터링해서 보여드립니다.
          </p>
        </div>
      </div>

      {/* 알바몬 vs 브릿지잡스 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 알바몬 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <h3 className="font-bold text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-red-400" />
            알바몬에서 직접 검색할 때
          </h3>
          <ul className="space-y-3">
            {[
              "3.3% 프리랜서 공고가 섞여 나옴 (고용보험 불가)",
              "고용보험 가입 여부 표시 없음",
              "주 15시간 미만 공고 혼재 (실업급여 불가)",
              "공고마다 직접 본문 읽어서 조건 확인 필요",
              "배달·뷰티·건강기능식품 공고가 계속 노출",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* 브릿지잡스 */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-5">
          <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            브릿지잡스에서 볼 때
          </h3>
          <ul className="space-y-3">
            {[
              "3.3% 프리랜서 공고 사전 완전 차단",
              "고용보험 가입 가능 공고만 노출",
              "주당 근무시간 자동 계산 후 표시",
              "계약직·기간제 공고만 선별 (계약만료 퇴사 가능)",
              "지역·키워드 포함/제외 정밀 필터 제공",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 수급 루트 안내 */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          자진퇴사 후 실업급여 수급 루트 (이 서비스의 목적)
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { icon: "1", label: "자진퇴사" },
            { icon: "→", label: "" },
            { icon: "2", label: "단기 계약직 취업 (1~3개월)" },
            { icon: "→", label: "" },
            { icon: "3", label: "계약만료 퇴사" },
            { icon: "→", label: "" },
            { icon: "4", label: "실업급여 수급 신청" },
          ].map((step, i) => step.label ? (
            <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{step.icon}</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{step.label}</span>
            </div>
          ) : (
            <span key={i} className="text-zinc-400 font-bold text-lg">→</span>
          ))}
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">
          💡 핵심: 2단계에서 반드시 <strong>고용보험 가입 + 계약직(기간제)</strong>으로 일해야 합니다. 계약이 만료되면 비자발적 퇴사로 인정되어 실업급여 수급이 가능해집니다.
        </p>
      </div>

      {/* 수집 조건 명시 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-blue-500" />
          현재 수집 중인 공고 조건 (알바몬 기준)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MapPin, label: "수집 지역", value: "서울 전체" },
            { icon: Briefcase, label: "고용 형태", value: "계약직" },
            { icon: Clock, label: "근무 기간", value: "1주일 ~ 3개월" },
            { icon: ShieldCheck, label: "추가 필터", value: "3.3% 제거" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-3 text-center">
              <Icon className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{label}</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ======== 메인 페이지 ========
export default async function Home({ searchParams }: SearchParamsProps) {
  const resolvedParams = await searchParams;

  let query = db
    .selectFrom('jobs')
    .selectAll()
    .where('is_safe', '=', true)
    .orderBy('created_at', 'desc');

  const area = typeof resolvedParams.area === 'string' ? resolvedParams.area : null;
  if (area && area !== '전체') {
    query = query.where('location', 'like', `%${area}%`);
  }

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

  const excludeStr = typeof resolvedParams.exclude === 'string' ? resolvedParams.exclude : null;
  if (excludeStr) {
    const keywords = excludeStr.split(',').map(x => x.trim()).filter(Boolean);
    for (const kw of keywords) {
      query = query.where('title', 'not like', `%${kw}%`);
      query = query.where('company_name', 'not like', `%${kw}%`);
    }
  }

  if (resolvedParams.min_hours === '40') {
    query = query.where('weekly_work_hours', '>=', 40);
  }
  if (resolvedParams.insured === '1') {
    query = query.where('has_employment_insurance', '=', true);
  }

  const jobs = await query.limit(100).execute();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
      {/* 헤더 */}
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              브릿지잡스
            </h1>
            <span className="hidden sm:inline text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-0.5 ml-1">
              자진퇴사 → 실업급여 수급 루트
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CrawlTriggerButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* 왜 브릿지잡스인가 */}
        <WhyBridgeJobs />

        {/* 검색 패널 */}
        <div className="mb-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            상세조건 필터
          </h2>
          <TagFilter />
        </div>

        {/* 공고 목록 */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              선별된 공고
              <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full text-sm font-bold">
                {jobs.length}건
              </span>
            </h2>
            {jobs.length > 0 && (
              <span className="text-xs text-zinc-400">3.3% 및 위험 공고는 표시되지 않습니다</span>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
              <ShieldCheck className="w-10 h-10 text-zinc-300 mb-3" />
              <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                아직 수집된 공고가 없습니다.
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
                우측 상단의 [강제 수집] 버튼을 눌러 알바몬에서 최신 공고를 받아오세요.
                이후 매일 새벽 3시에 자동으로 업데이트됩니다.
              </p>
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
