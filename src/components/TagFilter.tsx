"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Search } from "lucide-react";

const SEOUL_AREAS = [
  "전체", "강남구", "강동구", "강북구", "강서구",
  "관악구", "광진구", "구로구", "금천구", "노원구",
  "도봉구", "동대문구", "동작구", "마포구", "서대문구",
  "서초구", "성동구", "성북구", "송파구", "양천구",
  "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
];

function FilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 상태 관리
  const [area, setArea] = useState(searchParams.get('area') || '전체');
  const [include, setInclude] = useState(searchParams.get('include') || '');
  const [exclude, setExclude] = useState(searchParams.get('exclude') || '');
  
  // 체크박스 상태
  const hasMinHours = searchParams.get('min_hours') === '40';
  const hasInsured = searchParams.get('insured') === '1';

  // 라우팅 (검색 실행)
  const applyFilter = (newArea?: string, newMinH?: boolean, newInsured?: boolean) => {
    const params = new URLSearchParams();
    
    const targetArea = newArea !== undefined ? newArea : area;
    if (targetArea && targetArea !== '전체') params.set('area', targetArea);
    
    if (include.trim()) params.set('include', include.trim());
    if (exclude.trim()) params.set('exclude', exclude.trim());
    
    const minHoursChecked = newMinH !== undefined ? newMinH : hasMinHours;
    const insuredChecked = newInsured !== undefined ? newInsured : hasInsured;
    
    if (minHoursChecked) params.set('min_hours', '40');
    if (insuredChecked) params.set('insured', '1');
    
    // 조건이 항상 고정이므로 contract 파라미터는 제거 (백엔드 기본적용 권장)
    router.push(`/?${params.toString()}`);
  };

  // 키워드 입력 후 엔터키 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilter();
    }
  };

  return (
    <div className="w-full mb-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-6 shadow-sm flex flex-col gap-5">
      
      {/* 1. 지역 및 핵심 필터 줄 */}
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            지역 선택 (서울)
          </label>
          <select 
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              applyFilter(e.target.value);
            }}
            className="w-full md:w-48 appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {SEOUL_AREAS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-6 pb-2">
           <label className="flex items-center space-x-2.5 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={hasMinHours}
              onChange={(e) => applyFilter(undefined, e.target.checked, undefined)}
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">주 40시간 이상</span>
          </label>
          
          <label className="flex items-center space-x-2.5 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={hasInsured}
              onChange={(e) => applyFilter(undefined, undefined, e.target.checked)}
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">고용보험 무조건 가입</span>
          </label>
        </div>
      </div>

      <hr className="border-t border-zinc-100 dark:border-zinc-800" />

      {/* 2. 키워드 필터 줄 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            포함할 키워드 (예: 단기, 사무)
          </label>
          <input 
            type="text"
            value={include}
            onChange={(e) => setInclude(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="포함할 단어 입력"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex justify-between">
            제외할 키워드 (쉼표 구분)
            <span className="text-[10px] text-zinc-400">예: 배달, 뷰티</span>
          </label>
          <input 
            type="text"
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="제외할 단어 쉼표로 구분"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        <button 
          onClick={() => applyFilter()}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors"
        >
          <Search className="w-4 h-4" />
          조건 검색
        </button>
      </div>

    </div>
  );
}

export function TagFilter() {
  return (
    <Suspense fallback={<div className="h-40 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-xl mb-8" />}>
      <FilterContent />
    </Suspense>
  );
}
