"use client";

import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, Suspense } from "react";

const FILTER_TAGS = [
  "#1개월이하",
  "#1~3개월단기",
  "#주15시간이상",
  "#고용보험가입",
  "#계약직",
];

function TagFilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get('tag');

  const onTagClick = useCallback((tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const rawTag = tag.replace('#', '');
    
    if (params.get('tag') === rawTag) {
      params.delete('tag'); // 이미 선택된 태그 재클릭 시 해제
    } else {
      params.set('tag', rawTag);
    }
    
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="w-full py-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          빠른 조건 필터
        </h3>
        <div className="flex flex-wrap gap-2">
          {FILTER_TAGS.map((tag) => {
            const rawTag = tag.replace('#', '');
            const isActive = currentTag === rawTag;
            
            return (
              <Badge
                key={tag}
                variant={isActive ? "default" : "outline"}
                className={`px-4 py-1.5 text-sm cursor-pointer rounded-full transition-colors dark:border-zinc-800 ${
                  isActive 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'border-zinc-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/30'
                }`}
                onClick={() => onTagClick(tag)}
              >
                {tag}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TagFilter() {
  return (
    <Suspense fallback={<div className="h-24" />}>
      <TagFilterContent />
    </Suspense>
  );
}
