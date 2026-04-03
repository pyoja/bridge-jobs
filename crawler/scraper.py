"""
Bridge Jobs 알바몬 크롤러 v3 - requests 기반 (Playwright 제거)
- __NEXT_DATA__ JSON을 직접 파싱 (봇 탐지 우회)
- DATABASE_URL 환경변수로 psycopg2 연결
"""

import os
import re
import json
import time
import psycopg2
from psycopg2.extras import execute_values

try:
    import requests
except ImportError:
    import urllib.request as _urllib
    requests = None

# =============================================
# 설정
# =============================================
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ 환경변수 DATABASE_URL 이 없습니다.")
    exit(1)

DANGER_KEYWORDS = ['3.3%', '사업소득', '프리랜서', '위촉직', '도급', '원천징수']

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# =============================================
# 유틸리티 함수
# =============================================
def analyze_job_safety(text: str) -> tuple:
    found = [kw for kw in DANGER_KEYWORDS if kw in text]
    return len(found) == 0, found

def calculate_weekly_hours(work_hours_str: str) -> int:
    if not work_hours_str or '협의' in work_hours_str:
        return 0
    try:
        matches = re.findall(r'(\d{1,2}):(\d{2})', work_hours_str)
        if len(matches) >= 2:
            start = int(matches[0][0]) + int(matches[0][1]) / 60
            end = int(matches[1][0]) + int(matches[1][1]) / 60
            if end < start:
                end += 24
            daily = end - start
            if daily >= 9:
                daily -= 1.0
            elif daily >= 4.5:
                daily -= 0.5
            return int(daily * 5)
    except Exception:
        pass
    return 0

def normalize_wage(pay_str: str) -> int:
    if not pay_str:
        return 0
    try:
        return int(re.sub(r'[^0-9]', '', str(pay_str)))
    except Exception:
        return 0

def normalize_wage_type(pay_type_key: str) -> str:
    mapping = {
        "MONTHLY_SALARY": "월급",
        "HOURLY_WAGE": "시급",
        "DAILY_WAGE": "일급",
        "WEEKLY_WAGE": "주급",
    }
    return mapping.get(pay_type_key, "협의")

def fetch_html(url: str) -> str:
    """HTML을 가져오는 함수 (requests 우선, 없으면 urllib)"""
    if requests:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.text
    else:
        import urllib.request
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.read().decode("utf-8")

def parse_jobs_from_html(html: str) -> list:
    """__NEXT_DATA__ JSON에서 공고 컬렉션을 추출"""
    match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
        html, re.DOTALL
    )
    if not match:
        print("   ❌ __NEXT_DATA__ 없음 (봇 차단 또는 구조 변경)")
        return []
    
    data = json.loads(match.group(1))
    try:
        state_data = (
            data["props"]["pageProps"]["dehydratedState"]
            ["queries"][0]["state"]["data"]
        )
        collection = state_data["base"]["normal"]["collection"]
        return collection
    except (KeyError, IndexError, TypeError) as e:
        print(f"   ❌ JSON 경로 파싱 실패: {e}")
        return []

# =============================================
# 크롤링 메인
# =============================================
def crawl_all_pages(max_pages: int = 10) -> list:
    all_jobs = []
    
    for page_num in range(1, max_pages + 1):
        url = (
            "https://www.albamon.com/jobs/area"
            f"?page={page_num}&size=50"
            "&areas=I000"
            "&employmentTypes=CONTRACT"
            "&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH"
        )
        
        print(f"📄 {page_num}페이지 수집 중... ({url[:70]}...)")
        
        try:
            html = fetch_html(url)
            collection = parse_jobs_from_html(html)
            
            if not collection:
                print(f"   ⚠️ {page_num}페이지에서 공고를 찾지 못했습니다. 중단합니다.")
                break
            
            page_jobs = []
            for item in collection:
                try:
                    recruit_no = item.get("recruitNo", "")
                    title = item.get("recruitTitle", "").strip()
                    company = item.get("companyName", "회사명 비공개").strip()
                    working_time = item.get("workingTime", "")
                    working_period = item.get("workingPeriod", "단기")
                    workplace_area = item.get("workplaceArea", "서울")
                    pay_raw = item.get("pay", "0")
                    pay_type_key = item.get("payType", {}).get("key", "HOURLY_WAGE")
                    
                    if not title or not recruit_no:
                        continue
                    
                    job_url = f"https://www.albamon.com/jobs/detail/{recruit_no}"
                    weekly_hours = calculate_weekly_hours(working_time)
                    is_safe, warnings = analyze_job_safety(title + " " + company)
                    
                    tags = ["#계약직", "#고용보험가입"]
                    if weekly_hours >= 40:
                        tags.append("#주40시간이상")
                    elif weekly_hours >= 15:
                        tags.append("#주15시간이상")
                    
                    page_jobs.append({
                        "original_url": job_url,
                        "platform": "알바몬",
                        "title": title,
                        "company_name": company,
                        "work_duration": working_period,
                        "work_days": "주 5일",
                        "work_hours": working_time,
                        "weekly_work_hours": weekly_hours,
                        "location": workplace_area,
                        "wage_type": normalize_wage_type(pay_type_key),
                        "wage_amount": normalize_wage(pay_raw),
                        "has_employment_insurance": True,
                        "is_contract_worker": True,
                        "is_safe": is_safe,
                        "warning_tags": warnings,
                        "tags": tags
                    })
                except Exception:
                    continue
            
            all_jobs.extend(page_jobs)
            print(f"   ✅ {len(page_jobs)}개 수집 (누적: {len(all_jobs)}개)")
            
            # 페이지 간 딜레이 (차단 방지)
            if page_num < max_pages:
                time.sleep(1.5)
                
        except Exception as e:
            print(f"   ❌ {page_num}페이지 에러: {e}")
            break
    
    return all_jobs

# =============================================
# DB 저장
# =============================================
def upsert_jobs(jobs: list):
    if not jobs:
        print("적재할 공고가 없습니다.")
        return
    
    print(f"\n📦 {len(jobs)}개 공고를 DB에 저장 중...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        records = [
            (
                j["original_url"], j["platform"], j["title"], j["company_name"],
                j["work_duration"], j["work_days"], j["work_hours"],
                j.get("weekly_work_hours", 0), j.get("location", "서울"),
                j.get("wage_type", "시급"), j.get("wage_amount", 0),
                j.get("has_employment_insurance", True), j.get("is_contract_worker", True),
                j.get("is_safe", True), j.get("warning_tags", []), j.get("tags", [])
            )
            for j in jobs
        ]
        
        execute_values(cur, """
            INSERT INTO jobs (
                original_url, platform, title, company_name,
                work_duration, work_days, work_hours,
                weekly_work_hours, location,
                wage_type, wage_amount,
                has_employment_insurance, is_contract_worker,
                is_safe, warning_tags, tags
            ) VALUES %s
            ON CONFLICT (original_url) DO UPDATE SET
                title = EXCLUDED.title,
                company_name = EXCLUDED.company_name,
                work_hours = EXCLUDED.work_hours,
                weekly_work_hours = EXCLUDED.weekly_work_hours,
                location = EXCLUDED.location,
                wage_amount = EXCLUDED.wage_amount,
                is_safe = EXCLUDED.is_safe,
                warning_tags = EXCLUDED.warning_tags,
                tags = EXCLUDED.tags
        """, records)
        
        conn.commit()
        print(f"✅ DB 저장 완료! ({len(records)}건)")
    except Exception as e:
        conn.rollback()
        print(f"❌ DB 저장 실패: {e}")
        raise
    finally:
        cur.close()
        conn.close()

# =============================================
# 메인 실행
# =============================================
def main():
    print("=" * 50)
    print("  Bridge Jobs 크롤러 v3 (requests 기반)")
    print("  알바몬: 서울 전체, 계약직, 1주~3개월")
    print("=" * 50)
    
    jobs = crawl_all_pages(max_pages=10)
    upsert_jobs(jobs)
    
    print("=" * 50)
    print(f"  완료! 총 {len(jobs)}개 수집")
    print("=" * 50)

if __name__ == "__main__":
    main()
