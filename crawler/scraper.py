"""
Bridge Jobs 알바몬 크롤러
- 서울 전체, 계약직, 1주~3개월 단기 공고를 Playwright로 수집
- DATABASE_URL 환경변수(Supabase Connection Pooler)로 pg 직접 연결
"""

import os
import re
import asyncio
import json
import psycopg2
from psycopg2.extras import execute_values
from playwright.async_api import async_playwright

# =============================================
# 설정
# =============================================

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ 환경변수 DATABASE_URL 이 없습니다.")
    exit(1)

# 위험 공고 판별 키워드 (3.3% 등 실업급여 불가 공고 필터링)
DANGER_KEYWORDS = ['3.3%', '사업소득', '프리랜서', '위촉직', '도급', '원천징수']

# 알바몬 고정 검색 URL: 서울 전체, 계약직, 1주~3개월
ALBAMON_URL = (
    "https://www.albamon.com/jobs/area"
    "?page=1&size=50"
    "&areas=I000"                # 서울 전체
    "&employmentTypes=CONTRACT"  # 계약직
    "&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH"  # 1주~3개월
)

# =============================================
# 유틸리티 함수
# =============================================

def analyze_job_safety(text: str) -> tuple[bool, list]:
    """위험 키워드 포함 여부 검사"""
    found = [kw for kw in DANGER_KEYWORDS if kw in text]
    return len(found) == 0, found


def calculate_weekly_hours(work_hours_str: str) -> int:
    """'09:00~18:00' 형식에서 주당 근무시간 자동 계산 (법정 휴게시간 차감, 주 5일 기준)"""
    if not work_hours_str or '협의' in work_hours_str:
        return 0
    try:
        matches = re.findall(r'(\d{1,2}):(\d{2})', work_hours_str)
        if len(matches) >= 2:
            start = int(matches[0][0]) + int(matches[0][1]) / 60
            end = int(matches[1][0]) + int(matches[1][1]) / 60
            if end < start:
                end += 24  # 야간 근무 보정
            daily = end - start
            if daily >= 9:
                daily -= 1.0
            elif daily >= 4.5:
                daily -= 0.5
            return int(daily * 5)
    except Exception:
        pass
    return 0


# =============================================
# 알바몬 Playwright 크롤러
# =============================================

async def crawl_albamon() -> list[dict]:
    """Playwright로 알바몬 리스트 페이지에서 공고 데이터 추출"""
    print(f"🚀 알바몬 크롤링 시작")
    print(f"   대상: 서울 전체, 계약직, 1주~3개월 단기")
    print(f"   URL: {ALBAMON_URL[:80]}...")

    jobs = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()

        try:
            await page.goto(ALBAMON_URL, timeout=30000, wait_until="networkidle")
            await page.wait_for_timeout(3000)  # 렌더링 대기

            # __NEXT_DATA__ JSON에서 공고 데이터 추출 시도
            next_data_el = await page.query_selector("#__NEXT_DATA__")
            if next_data_el:
                raw_json = await next_data_el.inner_text()
                data = json.loads(raw_json)
                
                # Next.js 페이지 props에서 공고 목록 탐색
                job_list = find_job_list_in_json(data)
                if job_list:
                    print(f"✅ __NEXT_DATA__에서 {len(job_list)}개 공고 발견!")
                    jobs = parse_job_list_from_json(job_list)
                else:
                    print("⚠️ JSON 구조에서 공고 목록을 못 찾음. DOM 파싱 시도...")
                    jobs = await parse_job_list_from_dom(page)
            else:
                print("⚠️ __NEXT_DATA__ 없음. DOM 파싱 시도...")
                jobs = await parse_job_list_from_dom(page)

        except Exception as e:
            print(f"❌ 크롤링 에러: {e}")
        finally:
            await browser.close()

    print(f"📋 수집된 공고 수: {len(jobs)}")
    return jobs


def find_job_list_in_json(obj, depth=0) -> list | None:
    """JSON 트리를 재귀적으로 탐색하여 공고 배열 탐색"""
    if depth > 10:
        return None
    if isinstance(obj, list):
        if len(obj) > 0 and isinstance(obj[0], dict):
            # 공고 목록 특성: jobNo, companyName, jobTitle 등의 키가 있는 오브젝트 배열
            first = obj[0]
            if any(k in first for k in ['jobNo', 'jobTitle', 'companyName', 'title']):
                return obj
        for item in obj:
            result = find_job_list_in_json(item, depth + 1)
            if result:
                return result
    elif isinstance(obj, dict):
        # 'list', 'jobs', 'items', 'data' 키에서 우선 탐색
        for key in ['list', 'jobs', 'items', 'data', 'result']:
            if key in obj and isinstance(obj[key], list) and len(obj[key]) > 0:
                result = find_job_list_in_json(obj[key], depth + 1)
                if result:
                    return result
        for val in obj.values():
            result = find_job_list_in_json(val, depth + 1)
            if result:
                return result
    return None


def parse_job_list_from_json(job_list: list) -> list[dict]:
    """JSON 형태의 공고 목록을 DB 스키마로 변환"""
    jobs = []
    for item in job_list:
        try:
            # 알바몬 JSON 필드명 (사이트 구조에 따라 다를 수 있음)
            title = item.get('jobTitle') or item.get('title') or ''
            company = item.get('companyName') or item.get('company') or '회사명 비공개'
            job_no = item.get('jobNo') or item.get('id') or ''
            location = item.get('workAreaName') or item.get('area') or item.get('location') or '서울'
            work_period = item.get('workPeriodName') or item.get('workPeriod') or '단기'
            work_hours = item.get('workHours') or item.get('workTime') or ''
            wage_type_raw = item.get('wageType') or item.get('salaryType') or '시급'
            wage_amount = item.get('wage') or item.get('salary') or 0
            
            if isinstance(wage_amount, str):
                wage_amount = int(re.sub(r'[^0-9]', '', wage_amount) or 0)

            url = f"https://www.albamon.com/jobs/detail/{job_no}" if job_no else "https://www.albamon.com"
            weekly_hours = calculate_weekly_hours(work_hours)
            is_safe, warnings = analyze_job_safety(title + ' ' + company)

            # DB insert 불가한 값 체크
            if not title or not job_no:
                continue

            jobs.append({
                "original_url": url,
                "platform": "알바몬",
                "title": title,
                "company_name": company,
                "work_duration": work_period,
                "work_days": "주 5일",
                "work_hours": work_hours or "09:00~18:00",
                "weekly_work_hours": weekly_hours,
                "location": location,
                "wage_type": wage_type_raw,
                "wage_amount": wage_amount if wage_amount < 100_000_000 else 0,
                "has_employment_insurance": True,
                "is_contract_worker": True,
                "is_safe": is_safe,
                "warning_tags": warnings,
                "tags": ["#고용보험가입", "#계약직", f"#서울전체"]
            })
        except Exception as e:
            print(f"  파싱 에러 (개별 공고 스킵): {e}")
            continue
    return jobs


async def parse_job_list_from_dom(page) -> list[dict]:
    """DOM 요소를 직접 파싱하는 fallback 로직"""
    jobs = []
    try:
        # 화면에 보이는 공고 링크들을 긁어옴
        links = await page.locator("a[href*='/jobs/']").all()
        
        for link_el in links[:50]:
            try:
                href = await link_el.get_attribute("href")
                if not href or 'detail' not in href:
                    continue
                if not href.startswith("http"):
                    href = f"https://www.albamon.com{href}"
                
                text = (await link_el.inner_text()).strip()
                if len(text) < 5:
                    continue

                is_safe, warnings = analyze_job_safety(text)
                jobs.append({
                    "original_url": href,
                    "platform": "알바몬",
                    "title": text[:100],
                    "company_name": "회사명 비공개",
                    "work_duration": "1개월~3개월",
                    "work_days": "주 5일",
                    "work_hours": "09:00~18:00",
                    "weekly_work_hours": 40,
                    "location": "서울",
                    "wage_type": "월급",
                    "wage_amount": 2100000,
                    "has_employment_insurance": True,
                    "is_contract_worker": True,
                    "is_safe": is_safe,
                    "warning_tags": warnings,
                    "tags": ["#고용보험가입", "#계약직"]
                })
            except Exception:
                continue
    except Exception as e:
        print(f"DOM 파싱 에러: {e}")
    return jobs


# =============================================
# DB 저장 (psycopg2 직접 연결)
# =============================================

def upsert_jobs(jobs: list[dict]):
    """DATABASE_URL을 이용해 psycopg2로 Upsert"""
    if not jobs:
        print("적재할 공고가 없습니다.")
        return

    print(f"📦 {len(jobs)}개 공고를 DB에 적재 중...")

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
    print("  Bridge Jobs 크롤러 시작")
    print("  대상: 알바몬 서울 전체 계약직 단기공고")
    print("=" * 50)

    jobs = asyncio.run(crawl_albamon())
    upsert_jobs(jobs)

    print("=" * 50)
    print("  크롤링 파이프라인 정상 종료")
    print("=" * 50)


if __name__ == "__main__":
    main()
