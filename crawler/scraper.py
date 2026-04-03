import os
import time
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# === 설정 변수 ===
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Supabase 연동 환경 변수가 없습니다.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 실업급여 요건 부적합 키워드 (함정 공고 검출용)
DANGER_KEYWORDS = ['3.3%', '사업소득', '프리랜서', '위촉직', '도급', '원천징수']

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def analyze_job_safety(description: str) -> tuple[bool, list]:
    """공고 상세 내용을 분석하여 함정 키워드 포함 여부 반환"""
    found_warnings = [kw for kw in DANGER_KEYWORDS if kw in description]
    # 위 키워드가 하나라도 있으면 안전하지 않음(is_safe = False)
    return len(found_warnings) == 0, found_warnings

def parse_albamon() -> list:
    """알바몬 단기 카테고리 스크래핑 로직 (실제 HTML 기반 예시)"""
    print("🚀 알바몬 URL 스크래핑 시작...")
    
    # 예시: 단기, 계약직 키워드 검색 페이지 (실제 URL 구조에 맞춰 조정 필요)
    url = "https://www.albamon.com/search?keyword=단기%20계약직"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"❌ 알바몬 페이지 로드 실패: {e}")
        return []

    jobs = []
    
    # 1. 공고 리스트 아이템 추출 (실제 사이트 클래스 'list-item' 등에 맞춰 변경 필요)
    # 아래는 크롤링 접근법을 보여주기 위한 가이드라인 로직입니다.
    items = soup.select('ul.list .list-item') # 실제 클래스명으로 변경 요망
    
    # items가 비어있다면, 사이트가 클라이언트 렌더링(React)이거나 구조가 다를 수 있음
    # 이 경우 API 직접 호출 방식(Network 탭) 혹은 Playwright 도입 필요.
    if not items:
        print("⚠️ HTML 구조에서 공고 목록을 못 찾았습니다. (SPA 클라이언트 렌더링일 경우 Playwright 권장)")
        # MVP 진행을 위해 샘플 데이터를 API에서 받아왔다고 가정하고 진행
        return mock_fetch_albamon_api()

    for item in items:
        title_elem = item.select_one('.title')
        company_elem = item.select_one('.company')
        if not title_elem or not company_elem:
            continue
            
        link = "https://www.albamon.com" + title_elem.get('href', '')
        title = title_elem.text.strip()
        company = company_elem.text.strip()
        
        # 2. 공고 상세 페이지 접속 (상세 스펙 확인)
        time.sleep(1) # 차단 방지를 위한 딜레이
        detail_desc = fetch_job_detail(link)
        is_safe, warnings = analyze_job_safety(detail_desc)
        
        # 태그 자동 생성
        generated_tags = ["#단기", "#계약직"]
        if is_safe:
            generated_tags.append("#고용보험가입")
            
        jobs.append({
            "original_url": link,
            "platform": "알바몬",
            "title": title,
            "company_name": company,
            "work_duration": "1개월~3개월", # 상세에서 파싱 요망
            "work_days": "주 5일",        # 상세에서 파싱 요망
            "work_hours": "09:00~18:00",  # 상세에서 파싱 요망
            "wage_type": "월급",          # 상세에서 파싱 요망
            "wage_amount": 2000000,
            "has_employment_insurance": True,
            "is_contract_worker": True,
            "is_safe": is_safe,
            "warning_tags": warnings,
            "tags": generated_tags
        })
    
    return jobs

def mock_fetch_albamon_api() -> list:
    """SPA 렌더링 대비 API 페이로드 Mock 응답"""
    return [{
        "original_url": "https://www.albamon.com/job/12345",
        "platform": "알바몬",
        "title": "쇼핑몰 피팅 및 포장 어시스턴트 단기",
        "company_name": "(주)스타일커머스",
        "work_duration": "1주일~1개월",
        "work_days": "주 2일",
        "work_hours": "13:00~18:00",
        "wage_type": "시급",
        "wage_amount": 10500,
        "has_employment_insurance": True,
        "is_contract_worker": True,
        "is_safe": True,
        "warning_tags": [],
        "tags": ["#1주일~1개월", "#고용보험가입"]
    }]

def fetch_job_detail(url: str) -> str:
    """공고 상세 본문 텍스트 추출"""
    try:
        res = requests.get(url, headers=HEADERS, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')
        # 상세 내용이 담긴 영역 추출 (클래스명 조정 필요)
        detail_div = soup.select_one('.detail-content')
        return detail_div.text if detail_div else ""
    except:
        return ""

def upsert_jobs_to_supabase(jobs: list):
    """Supabase Supabase-py 클라이언트로 Upsert"""
    if len(jobs) == 0:
        print("적재할 공고가 없습니다.")
        return
        
    print(f"📦 {len(jobs)}개의 공고를 Supabase에 Upsert 중...")
    try:
        response = supabase.table("jobs").upsert(jobs, on_conflict="original_url").execute()
        print("✅ DB 적재 완료!")
    except Exception as e:
        print(f"❌ DB 적재 실패: {e}")

def main():
    print("====================================")
    print(" Bridge Jobs 크롤러 작동 시작")
    print("====================================")
    
    jobs = parse_albamon()
    upsert_jobs_to_supabase(jobs)
    
    print("크롤링 파이프라인 무사 종료.")

if __name__ == "__main__":
    main()
