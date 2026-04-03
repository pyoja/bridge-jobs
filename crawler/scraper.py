"""
Bridge Jobs 알바몬 크롤러 v2
- __NEXT_DATA__.props.pageProps.dehydratedState.queries[0].state.data.base.normal.collection 경로로 공고 파싱
- DATABASE_URL 만 사용 (supabase-py 불필요)
"""

import os
import re
import json
import asyncio
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

DANGER_KEYWORDS = ['3.3%', '사업소득', '프리랜서', '위촉직', '도급', '원천징수']

# 서울 전체 + 계약직 + 1주~3개월 고정 URL
ALBAMON_URL = (
    "https://www.albamon.com/jobs/area"
    "?page=1&size=50"
    "&areas=I000"
    "&employmentTypes=CONTRACT"
    "&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH"
)

# =============================================
# 유틸리티 함수
# =============================================
def analyze_job_safety(text: str) -> tuple[bool, list]:
    found = [kw for kw in DANGER_KEYWORDS if kw in text]
    return len(found) == 0, found

def calculate_weekly_hours(work_hours_str: str) -> int:
    """'08:30~14:00' 형식을 주당 근무시간으로 계산 (주 5일 기준)"""
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
    """'1,621,278원' 같은 급여 문자열을 정수로 변환"""
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


# =============================================
# 알바몬 크롤러 (Playwright + __NEXT_DATA__ 파싱)
# =============================================
async def crawl_albamon() -> list[dict]:
    print(f"🚀 알바몬 크롤링 시작 (서울 전체, 계약직, 1주~3개월)")
    jobs = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()

        try:
            await page.goto(ALBAMON_URL, timeout=30000, wait_until="networkidle")
            await page.wait_for_timeout(2000)

            # __NEXT_DATA__ JSON에서 공고 컬렉션 추출
            next_data_text = await page.locator("#__NEXT_DATA__").inner_text()
            data = json.loads(next_data_text)

            # 경로: .props.pageProps.dehydratedState.queries[0].state.data.base.normal.collection
            state_data = data["props"]["pageProps"]["dehydratedState"]["queries"][0]["state"]["data"]
            collection = state_data["base"]["normal"]["collection"]

            print(f"✅ {len(collection)}개 공고 발견!")

            for item in collection:
                try:
                    recruit_no = item.get("recruitNo", "")
                    title = item.get("recruitTitle", "").strip()
                    company = item.get("companyName", "회사명 비공개").strip()
                    working_time = item.get("workingTime", "")
                    working_period = item.get("workingPeriod", "단기")
                    working_week = item.get("workingWeek", "")
                    workplace_area = item.get("workplaceArea", "서울")
                    pay_raw = item.get("pay", "0")
                    pay_type_key = item.get("payType", {}).get("key", "HOURLY_WAGE")

                    if not title or not recruit_no:
                        continue

                    url = f"https://www.albamon.com/jobs/detail/{recruit_no}"
                    weekly_hours = calculate_weekly_hours(working_time)
                    is_safe, warnings = analyze_job_safety(title + " " + company)

                    # 태그 생성
                    tags = ["#계약직"]
                    if weekly_hours >= 40:
                        tags.append("#주40시간이상")
                    elif weekly_hours >= 15:
                        tags.append("#주15시간이상")
                    if "1개월" in working_period and "3개월" in working_period:
                        tags.append("#1~3개월단기")
                    elif "1주" in working_period:
                        tags.append("#1주~1개월")
                    tags.append("#고용보험가입")

                    jobs.append({
                        "original_url": url,
                        "platform": "알바몬",
                        "title": title,
                        "company_name": company,
                        "work_duration": working_period,
                        "work_days": working_week or "주 5일",
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
                except Exception as e:
                    print(f"  개별 공고 파싱 에러 (스킵): {e}")
                    continue

        except Exception as e:
            print(f"❌ 크롤링 에러: {e}")
        finally:
            await browser.close()

    print(f"📋 총 {len(jobs)}개 공고 수집 완료")
    return jobs


# =============================================
# DB 저장 (psycopg2 직접 연결)
# =============================================
def upsert_jobs(jobs: list[dict]):
    if not jobs:
        print("적재할 공고가 없습니다.")
        return

    print(f"📦 {len(jobs)}개 공고를 DB에 저장 중...")

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
    print("  Bridge Jobs 크롤러 (알바몬 전용)")
    print("=" * 50)

    jobs = asyncio.run(crawl_albamon())
    upsert_jobs(jobs)

    print("=" * 50)
    print("  크롤링 완료")
    print("=" * 50)


if __name__ == "__main__":
    main()
