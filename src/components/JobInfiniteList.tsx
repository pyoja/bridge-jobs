"use client";

import { useEffect, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { JobType, JobCard } from "@/components/JobCard";
import { getJobs, GetJobsParams } from "@/actions/getJobs";
import { Loader2 } from "lucide-react";

interface JobInfiniteListProps {
  initialJobs: JobType[];
  searchParams: GetJobsParams;
}

export function JobInfiniteList({ initialJobs, searchParams }: JobInfiniteListProps) {
  const [jobs, setJobs] = useState<JobType[]>(initialJobs);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialJobs.length === 15);
  const [isFetching, setIsFetching] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  // 초기 파라미터가 바뀔 때 상태 초기화 (페이지 이동이나 검색 조건 변경 시 대비)
  useEffect(() => {
    setJobs(initialJobs);
    setPage(1);
    setHasMore(initialJobs.length === 15);
  }, [initialJobs, searchParams]);

  const loadMoreJobs = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    
    try {
      const nextPage = page + 1;
      const newJobs = await getJobs({ ...searchParams, page: nextPage, limit: 15 });
      
      if (newJobs.length > 0) {
        setJobs(prev => {
          // 중복 방지 로직 도입
          const keys = new Set(prev.map(j => j.id));
          const uniqueNewJobs = newJobs.filter(j => !keys.has(j.id));
          return [...prev, ...uniqueNewJobs];
        });
        setPage(nextPage);
      }
      
      if (newJobs.length < 15) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more jobs", error);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, page, searchParams]);

  useEffect(() => {
    if (inView) {
      loadMoreJobs();
    }
  }, [inView, loadMoreJobs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
      
      {!hasMore && jobs.length > 0 && (
        <div className="flex justify-center py-12 text-zinc-400 text-sm font-medium">
          더 이상 공고가 없습니다
        </div>
      )}
    </div>
  );
}
