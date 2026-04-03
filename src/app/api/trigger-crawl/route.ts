import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = body.keyword || '사무보조 계약직';

    // GitHub PAT 토큰 체크
    const pat = process.env.GITHUB_PAT;
    if (!pat) {
      return NextResponse.json({ success: false, error: "서버에 GITHUB_PAT 환경 변수가 설정되지 않았습니다." }, { status: 400 });
    }

    // 깃허브 웹훅(API) 규격대로 호출
    // 레포지토리 주소: pyoja/bridge-jobs
    const response = await fetch("https://api.github.com/repos/pyoja/bridge-jobs/actions/workflows/crawler.yml/dispatches", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `Bearer ${pat}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ref: "main", // 실행할 브랜치
        inputs: {
          keyword: keyword // 우리가 .yml에서 정의한 입력 변수
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ success: false, error: errText }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: "크롤링 강제 가동 신호 전송 완료!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
