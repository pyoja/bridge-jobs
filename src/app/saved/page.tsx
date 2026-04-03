import { db } from "@/lib/db";
import SavedJobsClient from "./SavedJobsClient";

export const revalidate = 60;

export default async function SavedPage() {
  // DB에서 500건 최신 공고 가져오기
  const jobs = await db
    .selectFrom('jobs')
    .selectAll()
    .where('is_safe', '=', true)
    .orderBy('created_at', 'desc')
    .limit(500)
    .execute();

  return <SavedJobsClient allJobs={jobs} />;
}
