import SavedJobsClient from "./SavedJobsClient";


export const revalidate = 0; // 보관함은 항상 최신 상태

export default function SavedPage() {
  // 서버에서 공고를 모두 가져오지 않음
  // 클라이언트가 localStorage의 URL 목록을 읽은 뒤 필요한 것만 요청
  return <SavedJobsClient />;
}
