"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useRef, useEffect } from "react";
import { Search, RotateCcw, ChevronDown, X, MapPin } from "lucide-react";

const SEOUL_GU_LIST = [
  "강남구", "강동구", "강북구", "강서구", "관악구",
  "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구",
  "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구"
];

const PLATFORMS = [
  { value: 'all', label: '전체보기' },
  { value: '알바몬', label: '알바몬' },
  { value: '알바천국', label: '알바천국' },
  { value: '잡코리아', label: '잡코리아' },
];

type WorkPeriod = "all" | "short" | "medium";

// 수집처 드롭다운 컴포넌트
function PlatformDropdown({
  value, onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = PLATFORMS.find(o => o.value === value)?.label ?? '전체보기';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative w-32" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all bg-white dark:bg-zinc-900 shadow-sm
          ${open ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/40 text-blue-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : 'text-zinc-400'}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
          {PLATFORMS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                ${value === opt.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 지역 다중선택 드롭다운 컴포넌트
function AreaMultiDropdown({
  selected, onChange,
}: {
  selected: string[];
  onChange: (areas: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (gu: string) => {
    if (selected.includes(gu)) {
      onChange(selected.filter(x => x !== gu));
    } else {
      onChange([...selected, gu]);
    }
  };

  const label = selected.length === 0 ? '전체 (서울)' : `${selected[0]}${selected.length > 1 ? ` 외 ${selected.length - 1}` : ''}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all bg-white dark:bg-zinc-900 shadow-sm min-w-[160px]
          ${open ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/40 text-blue-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'}`}
      >
        <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
        <span className="flex-1 text-left truncate">{label}</span>
        {selected.length > 0 && (
          <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : 'text-zinc-400'}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden w-64">
          {/* 전체 선택 초기화 */}
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-zinc-100 dark:border-zinc-800 transition-colors
              ${selected.length === 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 font-semibold' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
          >
            전체 (서울) — 선택 초기화
          </button>
          {/* 구 목록 (그리드) */}
          <div className="grid grid-cols-3 gap-0 max-h-64 overflow-y-auto p-2">
            {SEOUL_GU_LIST.map(gu => {
              const active = selected.includes(gu);
              return (
                <button
                  key={gu}
                  type="button"
                  onClick={() => toggle(gu)}
                  className={`text-xs font-medium px-2 py-2 rounded-lg m-0.5 transition-all text-center
                    ${active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                >
                  {gu}
                </button>
              );
            })}
          </div>
          {/* 하단 적용 버튼 */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">{selected.join(', ')}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1 font-semibold"
              >
                적용
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [platform, setPlatform] = useState(searchParams.get('platform') || 'all');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    searchParams.get('areas') ? searchParams.get('areas')!.split(',').filter(Boolean) : []
  );
  
  const [includeInput, setIncludeInput] = useState("");
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  
  const [excludeInput, setExcludeInput] = useState("");
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  
  const [workPeriod, setWorkPeriod] = useState<WorkPeriod>(
    (searchParams.get('period') as WorkPeriod) || 'all'
  );
  const [minHours, setMinHours] = useState(searchParams.get('min_hours') === '40');

  useEffect(() => {
    let incArr = JSON.parse(localStorage.getItem('bridge_includes') || '[]');
    let excArr = JSON.parse(localStorage.getItem('bridge_excludes') || '[]');

    const urlInc = searchParams.get('include');
    if (urlInc) incArr = Array.from(new Set([...incArr, ...urlInc.split(',').filter(Boolean)]));
    
    const urlExc = searchParams.get('exclude');
    if (urlExc) excArr = Array.from(new Set([...excArr, ...urlExc.split(',').filter(Boolean)]));

    setIncludeTags(incArr);
    setExcludeTags(excArr);

    localStorage.setItem('bridge_includes', JSON.stringify(incArr));
    localStorage.setItem('bridge_excludes', JSON.stringify(excArr));

    if ((incArr.length > 0 && !urlInc) || (excArr.length > 0 && !urlExc)) {
       applyFilter({ include: incArr, exclude: excArr }, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = (overrides?: Partial<{
    platform: string; areas: string[]; include: string[]; exclude: string[];
    workPeriod: WorkPeriod; minHours: boolean;
  }>, replace = false) => {
    const pf = overrides?.platform ?? platform;
    const ar = overrides?.areas ?? selectedAreas;
    const inc = overrides?.include ?? includeTags;
    const exc = overrides?.exclude ?? excludeTags;
    const wp = overrides?.workPeriod ?? workPeriod;
    const mh = overrides?.minHours ?? minHours;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // 필터 변경 시 무조건 1페이지로
    
    if (pf && pf !== 'all') params.set('platform', pf); else params.delete('platform');
    if (ar.length > 0) params.set('areas', ar.join(',')); else params.delete('areas');
    if (inc.length > 0) params.set('include', inc.join(',')); else params.delete('include');
    if (exc.length > 0) params.set('exclude', exc.join(',')); else params.delete('exclude');
    if (wp !== 'all') params.set('period', wp); else params.delete('period');
    if (mh) params.set('min_hours', '40'); else params.delete('min_hours');

    if (replace) {
      router.replace(`/?${params.toString()}`);
    } else {
      router.push(`/?${params.toString()}`);
    }
  };

  const handleAreasChange = (areas: string[]) => {
    setSelectedAreas(areas);
    applyFilter({ areas });
  };

  const resetAll = () => {
    setPlatform('all');
    setSelectedAreas([]);
    setIncludeTags([]);
    setExcludeTags([]);
    setIncludeInput('');
    setExcludeInput('');
    setWorkPeriod('all');
    setMinHours(false);
    localStorage.removeItem('bridge_includes');
    localStorage.removeItem('bridge_excludes');
    router.push('/');
  };

  const handleAddInclude = () => {
    if (!includeInput.trim()) return;
    const newTags = Array.from(new Set([...includeTags, includeInput.trim()]));
    setIncludeTags(newTags);
    setIncludeInput('');
    localStorage.setItem('bridge_includes', JSON.stringify(newTags));
    applyFilter({ include: newTags });
  };

  const handleRemoveInclude = (tag: string) => {
    const newTags = includeTags.filter(t => t !== tag);
    setIncludeTags(newTags);
    localStorage.setItem('bridge_includes', JSON.stringify(newTags));
    applyFilter({ include: newTags });
  };

  const handleAddExclude = () => {
    if (!excludeInput.trim()) return;
    const newTags = Array.from(new Set([...excludeTags, excludeInput.trim()]));
    setExcludeTags(newTags);
    setExcludeInput('');
    localStorage.setItem('bridge_excludes', JSON.stringify(newTags));
    applyFilter({ exclude: newTags });
  };

  const handleRemoveExclude = (tag: string) => {
    const newTags = excludeTags.filter(t => t !== tag);
    setExcludeTags(newTags);
    localStorage.setItem('bridge_excludes', JSON.stringify(newTags));
    applyFilter({ exclude: newTags });
  };

  // 검색 버튼 클릭 시 (작성 중인 키워드들도 마저 넣기)
  const handleSearchSubmit = () => {
    let newIncs = [...includeTags];
    let newExcs = [...excludeTags];
    
    if (includeInput.trim()) {
      newIncs = Array.from(new Set([...newIncs, includeInput.trim()]));
      setIncludeTags(newIncs);
      setIncludeInput('');
      localStorage.setItem('bridge_includes', JSON.stringify(newIncs));
    }
    
    if (excludeInput.trim()) {
      newExcs = Array.from(new Set([...newExcs, excludeInput.trim()]));
      setExcludeTags(newExcs);
      setExcludeInput('');
      localStorage.setItem('bridge_excludes', JSON.stringify(newExcs));
    }

    applyFilter({ include: newIncs, exclude: newExcs });
  };

  return (
    <div className="w-full mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-5 shadow-sm flex flex-col gap-4">

      {/* 1행: 수집처 + 지역 + 근무기간 + 주40시간 */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 flex-wrap">

        {/* 수집처 */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">수집처</label>
          <PlatformDropdown
            value={platform}
            onChange={(val) => { setPlatform(val); applyFilter({ platform: val }); }}
          />
        </div>

        {/* 지역 다중선택 */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            지역 (서울 · 복수 선택 가능)
          </label>
          <AreaMultiDropdown
            selected={selectedAreas}
            onChange={handleAreasChange}
          />
        </div>

        {/* 근무기간 버튼들 */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">근무기간</label>
          <div className="flex gap-1.5">
            {([
              { value: 'all', label: '전체' },
              { value: 'short', label: '1주~1개월' },
              { value: 'medium', label: '1~3개월' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setWorkPeriod(value); applyFilter({ workPeriod: value }); }}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all shadow-sm ${
                  workPeriod === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 주40시간 체크박스 */}
        <div className="pb-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
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

      {/* 선택된 지역 태그 표시 */}
      {selectedAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedAreas.map(gu => (
            <span
              key={gu}
              className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg px-2.5 py-1"
            >
              {gu}
              <button
                type="button"
                onClick={() => handleAreasChange(selectedAreas.filter(x => x !== gu))}
                className="ml-0.5 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <hr className="border-zinc-100 dark:border-zinc-800" />

      {/* 2행: 검색/키워드 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex justify-between items-center">
            <span>검색어 (직무, 회사 등)</span>
            <span className="text-[10px] text-zinc-400 font-normal">엔터키로 추가</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={includeInput}
              onChange={(e) => setIncludeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddInclude()}
              placeholder="예: 웹개발자, 카카오"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
            />
          </div>
          {includeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {includeTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-lg pl-2 pr-1.5 py-1 border border-blue-100 dark:border-blue-800/50 shadow-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50">
                  {tag}
                  <button type="button" onClick={() => handleRemoveInclude(tag)} className="hover:text-red-500 opacity-70 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex justify-between items-center">
            <span>제외 키워드</span>
            <span className="text-[10px] text-zinc-400 font-normal">엔터키로 추가</span>
          </label>
          <input
            type="text"
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExclude()}
            placeholder="예: 배달, 뷰티"
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none transition-all shadow-sm"
          />
          {excludeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {excludeTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px] font-bold rounded-lg pl-2 pr-1.5 py-1 border border-red-100 dark:border-red-800/50 shadow-sm transition-all hover:bg-red-100 dark:hover:bg-red-900/50">
                  {tag}
                  <button type="button" onClick={() => handleRemoveExclude(tag)} className="hover:text-red-500 opacity-70 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 h-[42px]">
          <button
            onClick={handleSearchSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl px-5 text-sm font-semibold transition-all shadow-sm"
          >
            <Search className="w-4 h-4" />
            검색
          </button>
          <button
            onClick={resetAll}
            className="flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl px-4 text-sm transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TagFilter() {
  return (
    <Suspense fallback={<div className="h-36 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-2xl mb-6" />}>
      <FilterContent />
    </Suspense>
  );
}
