"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Search, RotateCcw } from "lucide-react";

const SEOUL_AREAS = [
  "전체", "강남구", "강동구", "강북구", "강서구",
  "관악구", "광진구", "구로구", "금천구", "노원구",
  "도봉구", "동대문구", "동작구", "마포구", "서대문구",
  "서초구", "성동구", "성북구", "송파구", "양천구",
  "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
];

type WorkPeriod = "all" | "short" | "medium";

function FilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [platform, setPlatform] = useState(searchParams.get('platform') || 'all');
  const [area, setArea] = useState(searchParams.get('area') || '전체');
  const [include, setInclude] = useState(searchParams.get('include') || '');
  const [exclude, setExclude] = useState(searchParams.get('exclude') || '');
  const [workPeriod, setWorkPeriod] = useState<WorkPeriod>(
    (searchParams.get('period') as WorkPeriod) || 'all'
  );
  const [minHours, setMinHours] = useState(searchParams.get('min_hours') === '40');

  const applyFilter = (overrides?: Partial<{
    platform: string; area: string; include: string; exclude: string;
    workPeriod: WorkPeriod; minHours: boolean;
  }>) => {
    const pf = overrides?.platform ?? platform;
    const a = overrides?.area ?? area;
    const inc = overrides?.include ?? include;
    const exc = overrides?.exclude ?? exclude;
    const wp = overrides?.workPeriod ?? workPeriod;
    const mh = overrides?.minHours ?? minHours;

    const params = new URLSearchParams();
    if (pf && pf !== 'all') params.set('platform', pf);
    if (a && a !== '전체') params.set('area', a);
    if (inc.trim()) params.set('include', inc.trim());
    if (exc.trim()) params.set('exclude', exc.trim());
    if (wp !== 'all') params.set('period', wp);
    if (mh) params.set('min_hours', '40');
    router.push(`/?${params.toString()}`);
  };

  const resetAll = () => {
    setPlatform('all');
    setArea('전체');
    setInclude('');
    setExclude('');
    setWorkPeriod('all');
    setMinHours(false);
    router.push('/');
  };

  return (
    <div className="w-full mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-5 shadow-sm flex flex-col gap-4">

      {/* 1행: 플랫폼 + 지역 + 주40시간 */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 overflow-x-auto pb-1">
        
        {/* 플랫폼 */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            수집처
          </label>
          <select
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); applyFilter({ platform: e.target.value }); }}
            className="appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none w-32"
          >
            <option value="all">전체보기</option>
            <option value="알바몬">알바몬</option>
            <option value="알바천국">알바천국</option>
            <option value="잡코리아">잡코리아</option>
          </select>
        </div>

        {/* 지역 */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            지역 (서울)
          </label>
          <select
            value={area}
            onChange={(e) => { setArea(e.target.value); applyFilter({ area: e.target.value }); }}
            className="appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none w-40"
          >
            {SEOUL_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* 근무기간 라디오 */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            근무기간
          </label>
          <div className="flex gap-2">
            {([
              { value: 'all', label: '전체' },
              { value: 'short', label: '1주~1개월' },
              { value: 'medium', label: '1~3개월' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setWorkPeriod(value); applyFilter({ workPeriod: value }); }}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                  workPeriod === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 주40시간 체크박스 */}
        <div className="pb-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={minHours}
              onChange={(e) => { setMinHours(e.target.checked); applyFilter({ minHours: e.target.checked }); }}
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">주 40시간 이상</span>
          </label>
        </div>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      {/* 2행: 검색/키워드 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            검색어 (직무, 회사 등)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={include}
              onChange={(e) => setInclude(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
              placeholder="예: 웹개발자, 카카오"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex gap-1 items-center">
            제외 키워드
            <span className="text-[10px] text-zinc-400">(쉼표 구분)</span>
          </label>
          <input
            type="text"
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            placeholder="예: 배달, 뷰티"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => applyFilter()}
          className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Search className="w-4 h-4" />
          검색
        </button>
        <button
          onClick={resetAll}
          title="필터 초기화"
          className="flex items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          초기화
        </button>
      </div>
    </div>
  );
}

export function TagFilter() {
  return (
    <Suspense fallback={<div className="h-36 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-xl mb-6" />}>
      <FilterContent />
    </Suspense>
  );
}
