"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

function FilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const hasMinHours = searchParams.get('min_hours') === '40';
  const hasInsured = searchParams.get('insured') === '1';
  const hasContract = searchParams.get('contract') === '1';

  const toggleParam = useCallback((key: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="w-full mb-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 tracking-wide">
        실업급여 수급을 위한 필수 조건
      </h3>
      <div className="flex flex-col sm:flex-row gap-6">
        <label className="flex items-center space-x-2.5 cursor-pointer group">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            checked={hasMinHours}
            onChange={(e) => toggleParam('min_hours', '40', e.target.checked)}
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">주 40시간 이상</span>
        </label>
        
        <label className="flex items-center space-x-2.5 cursor-pointer group">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            checked={hasInsured}
            onChange={(e) => toggleParam('insured', '1', e.target.checked)}
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">고용보험 가입</span>
        </label>

        <label className="flex items-center space-x-2.5 cursor-pointer group">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            checked={hasContract}
            onChange={(e) => toggleParam('contract', '1', e.target.checked)}
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">단기/기간제 (계약만료)</span>
        </label>
      </div>
    </div>
  );
}

export function TagFilter() {
  return (
    <Suspense fallback={<div className="h-24 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-xl mb-8" />}>
      <FilterContent />
    </Suspense>
  );
}
