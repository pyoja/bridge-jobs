"use server";

import { db } from "@/lib/db";
import { JobType } from "@/components/JobCard";

export async function getJobsByUrls(urls: string[]): Promise<JobType[]> {
  if (!urls || urls.length === 0) return [];

  // url 목록 기반으로 해당 공고들만 조회
  const jobs = await db
    .selectFrom('jobs')
    .selectAll()
    .where('original_url', 'in', urls)
    .execute();

  return jobs as JobType[];
}
