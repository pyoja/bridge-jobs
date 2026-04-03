"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { ArrowLeft, Heart, EyeOff, Briefcase } from "lucide-react";
import { JobType, JobCard } from "@/components/JobCard";
import { useJobPreferences } from "@/hooks/useJobPreferences";

export default function SavedJobsClient({ allJobs }: { allJobs: JobType[] }) {
  const { isFavorite, isHidden, loaded } = useJobPreferences();
  const [tab, setTab] = useState<"favorites" | "hidden">("favorites");
  const [displayedCount, setDisplayedCount] = useState(15);
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  if (!loaded) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 text-center text-zinc-500">불러오는 중...</div>;
  }

  const favJobs = allJobs.filter((j) => isFavorite(j.original_url));
  const hidJobs = allJobs.filter((j) => isHidden(j.original_url));

  const displayJobs = tab === "favorites" ? favJobs : hidJobs;
  const chunkedJobs = displayJobs.slice(0, displayedCount);

  // 탭이 바뀔 때 노출 갯수 리셋
  useEffect(() => {
    setDisplayedCount(15);
  }, [tab]);

  // 스크롤 시 추가 노출
  useEffect(() => {
    if (inView && displayedCount < displayJobs.length) {
      setDisplayedCount((prev) => prev + 15);
    }
  }, [inView, displayJobs.length, displayedCount]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-500 p-1.5 rounded-lg">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              내 보관함
            </h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* 탭 버튼 */}
        <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <button
            onClick={() => setTab("favorites")}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              tab === "favorites"
                ? "border-red-500 text-red-500"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Heart className={`w-4 h-4 ${tab === "favorites" ? "fill-current" : ""}`} />
            즐겨찾기 ({favJobs.length})
          </button>
          <button
            onClick={() => setTab("hidden")}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              tab === "hidden"
                ? "border-zinc-800 dark:border-zinc-200 text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            숨긴 공고 ({hidJobs.length})
          </button>
        </div>

        {displayJobs.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
            {tab === "favorites" ? (
              <Heart className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
            ) : (
              <EyeOff className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
            )}
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              {tab === "favorites" ? "저장된 즐겨찾기가 없습니다" : "숨긴 공고가 없습니다"}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              하트 아이콘을 눌러 저장하거나 숨기기 처리를 할 수 있습니다.
            </p>
            <Link
              href="/"
              className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Briefcase className="w-4 h-4" />
              공고 둘러보기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {chunkedJobs.map((job) => (
                <JobCard key={job.id} job={job} showHidden={tab === "hidden"} />
              ))}
            </div>
            
            {displayedCount < displayJobs.length && (
              <div ref={ref} className="h-20" />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
