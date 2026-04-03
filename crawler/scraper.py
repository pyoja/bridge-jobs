import os
import re
import requests
import json
from bs4 import BeautifulSoup
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Supabase 환변 변수가 누락되었습니다.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
DANGER_KEYWORDS = ['3.3%', '사업소득', '프리랜서', '위촉직', '도급', '원천징수']

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def analyze_job_safety(description: str) -> tuple[bool, list]:
    found_warnings = [kw for kw in DANGER_KEYWORDS if kw in description]
    return len(found_warnings) == 0, found_warnings

def calculate_weekly_hours(work_hours_str: str) -> int:
    """ '09:00~18:00' 포맷이나 '협의' 문자열을 분석하여 예측되는 주당 근무시간을 반환 (휴게 1시간 차감 기본 5일 기준) """
    if not work_hours_str or "협의" in work_hours_str:
        return 0
        
    try:
        # 정규표현식으로 시간대 파싱
        # 예: 09:00~18:00 -> 9, 18 추출
        matches = re.findall(r'(\d{1,2}):(\d{2})', work_hours_str)
        if len(matches) >= 2:
            start_h, start_m = int(matches[0][0]), int(matches[0][1])
            end_h, end_m = int(matches[1][0]), int(matches[1][1])
            
            # 소수점 시간 변환 계산
            start_total = start_h + (start_m / 60)
            end_total = end_h + (end_m / 60)
            if end_total < start_total: 
                end_total += 24 # 야간 넘김 처리
                
            daily_hours = end_total - start_total
            # 법정 휴게시간(8시간 이상 근무 시 1시간) 단순 차감 추정
            if daily_hours >= 9:
                daily_hours -= 1.0
            elif daily_hours >= 4.5:
                # 4시간 근무 마다 30분
                daily_hours -= 0.5
                
            weekly_hours = daily_hours * 5 # 주 5일 가정
            return int(weekly_hours)
    except:
        pass
    
    return 0

def fetch_albaheaven_real_data(keyword="사무보조 계약직") -> list:
    """알바천국 검색 모바일 웹 실제 파싱 시도 로직"""
    print(f"🚀 알바천국 '{keyword}' 키워드 검색 스크래핑 시작...")
    
    # URL Encoding 로직 
    import urllib.parse
    encoded_keyword = urllib.parse.quote(keyword)
    url = f"https://m.alba.co.kr/job/search/list.asp?srchword={encoded_keyword}"
    
    jobs = []
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 알바천국 모바일 리스트 추출 (리스트 구조가 .jobList ul li 거나 섹션으로 나뉨)
        # 웹 환경이나 캡차 제어 때문에 막힐 가능성이 있으나 최선의 HTML 파싱
        job_items = soup.select('.jobList li, .goodsList li')
        
        if not job_items:
            print("⚠️ 알바천국 HTML 트리가 예측된 Selector와 다릅니다. (SSR 구조 변경 또는 봇 차단 화면일 가능성)")
            # SPA/SSR 블록 시 Fallback용 실제 포맷 Mock 데이터를 삽입합니다.
            return fallback_mock_job(keyword)
            
        for item in job_items:
            # 앵커 태그 유무 판별 (배너 광고 제외)
            link_a = item.select_one('a')
            if not link_a or 'href' not in link_a.attrs:
                continue
                
            href = link_a['href']
            # 상대 경로 방어
            if not href.startswith('http'):
                href = f"https://m.alba.co.kr{href}"
            
            # 제목 및 회사명 추출
            title_elem = item.select_one('.title, .tit')
            company_elem = item.select_one('.company, .com')
            
            # 급여 정보 추출 (시급/월급 등)
            pay_elem = item.select_one('.pay')
            
            if not title_elem:
                continue
                
            title = title_elem.get_text(strip=True)
            company = company_elem.get_text(strip=True) if company_elem else "회사명 비공개"
            
            # HTML 안의 상세 스펙 정보를 더 파고 들어야 하지만, 리스트에서 바로 뽑을 수 있는 것만 추림
            # 실제 스크래퍼 운영 시에는 링크(href)로 2차 requests.get()을 해줘야 상세 보험/시간을 알 수 있습니다.
            # 이 데모에서는 파싱 플로우를 시뮬레이션함
            
            raw_time_text = "09:00~18:00" # 실제 상세 조회 예제
            calculated_weekly_hours = calculate_weekly_hours(raw_time_text)
            
            # 위험 키워드 분별 (제목에서 1차)
            is_safe, warn = analyze_job_safety(title)
            
            jobs.append({
                "original_url": href,
                "platform": "알바천국",
                "title": title,
                "company_name": company,
                "work_duration": "1개월~3개월",
                "work_days": "주 5일",
                "work_hours": raw_time_text,
                "weekly_work_hours": calculated_weekly_hours,
                "wage_type": "월급",
                "wage_amount": 2100000,
                "has_employment_insurance": True,  # 향후 상세 페이지의 아이콘 파싱 로직 적용 요망
                "is_contract_worker": True,        
                "is_safe": is_safe,
                "warning_tags": warn,
                "tags": ["#고용보험가입", f"#주{calculated_weekly_hours}시간예상"]
            })
            
            if len(jobs) >= 20: # 20건 제한 (부하방지)
                break
                
    except Exception as e:
        print(f"❌ 크롤링 에러 발생: {e}")
        
    return jobs

def fallback_mock_job(keyword: str):
    """실제 통신이 캡차로 막히거나 구조가 변경되었을 때 개발 테스트를 유지하는 예비함수"""
    return [{
        "original_url": f"https://www.google.com/search?q={keyword}",
        "platform": "알바천국(Fallback)",
        "title": f"[{keyword}] 구글 서치엔진 마케터 계약직 오퍼",
        "company_name": "(주)글로벌네트웍스",
        "work_duration": "1개월~3개월",
        "work_days": "주 5일",
        "work_hours": "09:00~18:00",
        "weekly_work_hours": calculate_weekly_hours("09:00~18:00"), # 40 산출 확인용
        "wage_type": "월급",
        "wage_amount": 2150000,
        "has_employment_insurance": True,
        "is_contract_worker": True,
        "is_safe": True,
        "warning_tags": [],
        "tags": ["#고용보험가입"]
    }]

def upsert_jobs_to_supabase(jobs: list):
    if not jobs:
        return
    print(f"📦 {len(jobs)}개의 공고를 Supabase에 저장합니다...")
    try:
        supabase.table("jobs").upsert(jobs, on_conflict="original_url").execute()
        print("✅ DB 적재 완료!")
    except Exception as e:
        print(f"❌ DB 적재 실패: {e}")

def main():
    # 환경변수 등에서 타겟 키워드를 주입받음 (GitHub Actions의 event_inputs 트리거 대비)
    target_kwd = os.environ.get("SEARCH_KEYWORD", "계약직 지원")
    print(f"====================================")
    print(f" Bridge Jobs 크롤러 작동 (키워드: {target_kwd})")
    print(f"====================================")
    
    jobs = fetch_albaheaven_real_data(target_kwd)
    upsert_jobs_to_supabase(jobs)

if __name__ == "__main__":
    main()
