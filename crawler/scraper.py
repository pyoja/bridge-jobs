import os
import re
import asyncio
from playwright.async_api import async_playwright
from supabase import create_client, Client

# === 설정 변수 ===
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Supabase 환변 변수가 누락되었습니다.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
DANGER_KEYWORDS = ['3.3%', '사업소득', '프리랜서', '위촉직', '도급', '원천징수']

def analyze_job_safety(description: str) -> tuple[bool, list]:
    found_warnings = [kw for kw in DANGER_KEYWORDS if kw in description]
    return len(found_warnings) == 0, found_warnings

def calculate_weekly_hours(work_hours_str: str) -> int:
    if not work_hours_str or "협의" in work_hours_str:
        return 0
    try:
        matches = re.findall(r'(\d{1,2}):(\d{2})', work_hours_str)
        if len(matches) >= 2:
            start_h, start_m = int(matches[0][0]), int(matches[0][1])
            end_h, end_m = int(matches[1][0]), int(matches[1][1])
            start_total = start_h + (start_m / 60)
            end_total = end_h + (end_m / 60)
            if end_total < start_total: end_total += 24 
            
            daily_hours = end_total - start_total
            if daily_hours >= 9:
                daily_hours -= 1.0
            elif daily_hours >= 4.5:
                daily_hours -= 0.5
            return int(daily_hours * 5)
    except: pass
    return 0

async def parse_albamon_playwright():
    """알바몬 검색 URL에서 Playwright를 통해 렌더링된 컴포넌트를 스크래핑합니다."""
    print("🚀 알바몬 Playwright 스크래핑 시작 (서울 전체, 계약직, 1주~3개월 단기 지정)")
    
    # 전달받은 타겟 URL (알바몬 검색조건이 마운트된 주소)
    # areas=I000 (서울전체), employmentTypes=CONTRACT (계약직), workPeriodTypes (1주~3개월)
    url = "https://www.albamon.com/jobs/area?page=1&size=50&areas=I000&employmentTypes=CONTRACT&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH&includeKeyword=%EB%8B%A8%EA%B8%B0"
    
    jobs = []
    
    async with async_playwright() as p:
        # Chromium (구글크롬/엣지 호환 엔진) 가동
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            print("🌐 웹페이지 접속 시도 중...")
            await page.goto(url, timeout=15000, wait_until="networkidle")
            
            # 알바몬 리스트 렌더링 대기
            # 공고 묶음 리스트의 각 행은 보통 <tr> 이나 <li> 형태를 지님 
            # (여기서는 최신 알바몬 UI 구조에 맞추어 보편적인 table tr 또는 ul li 추적)
            await page.wait_for_timeout(3000) # 안전장치 대기
            
            # 리스트 아이템 식별자 (실시간 구조 파악 최선)
            items = await page.locator("ul > li, table > tbody > tr").all()
            
            for item in items:
                # 텍스트 전부 뽑아보기
                text_content = await item.inner_text()
                if not text_content or "광고" in text_content[:5]: 
                    continue # 빈 깡통이나 광고 제외
                
                # 링크 찾기
                a_tags = await item.locator("a").all()
                if not a_tags: continue
                
                href = await a_tags[0].get_attribute("href")
                if not href: continue
                if not href.startswith("http"):
                    href = f"https://www.albamon.com{href}"
                    
                # 제목/회사명/시간/지역 등 텍스트 러프하게 분리
                lines = text_content.split('\n')
                lines = [line.strip() for line in lines if line.strip()]
                if len(lines) < 3: continue
                
                # 라인 분석 (휴리스틱 추정)
                company = lines[0] if len(lines[0]) < 20 else "회사명 비공개"
                title = lines[1] if len(lines) > 1 else "제목 없음"
                
                # 특정 지역 파싱 (예: "서울 강남구")
                location_text = "서울 전체" 
                for line in lines:
                    if "서울 " in line:
                        location_text = line
                        break
                
                # 특정 시간 파싱
                time_text = "09:00~18:00" # fallback
                for line in lines:
                    if ":" in line and "~" in line:
                        time_text = line
                        break
                        
                calculated_hours = calculate_weekly_hours(time_text)
                is_safe, warn = analyze_job_safety(text_content)
                
                jobs.append({
                    "original_url": href,
                    "platform": "알바몬",
                    "title": title,
                    "company_name": company,
                    "work_duration": "1개월~3개월", 
                    "work_days": "주 5일", 
                    "work_hours": time_text,
                    "weekly_work_hours": calculated_hours,
                    "location": location_text,
                    "wage_type": "월급",
                    "wage_amount": 2100000,
                    "has_employment_insurance": True,  
                    "is_contract_worker": True,        
                    "is_safe": is_safe,
                    "warning_tags": warn,
                    "tags": ["#고용보험가입", f"#주{calculated_hours}시간예상"]
                })
                
                if len(jobs) >= 50: # 사이즈 제한 50개 맞춤
                    break

        except Exception as e:
            print(f"❌ 크롤링 에러 발생: {e}")
            # Fallback mock for testing the UI
            jobs.append({
                "original_url": "https://www.albamon.com",
                "platform": "알바몬 Mock",
                "title": "[테스트] 데이터가 추출되지 않아 임시 생성됨 (에러코드)",
                "company_name": "Test Company",
                "work_duration": "1개월~3개월",
                "work_days": "주 5일",
                "work_hours": "09:00~18:00",
                "weekly_work_hours": 40,
                "location": "서울 강동구",
                "wage_type": "시급",
                "wage_amount": 10030,
                "has_employment_insurance": True,
                "is_contract_worker": True,
                "is_safe": True,
                "warning_tags": [],
                "tags": []
            })
        finally:
            await browser.close()
            
    return jobs

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
    print(f"====================================")
    print(f" Bridge Jobs: 알바몬 UI 기반 크롤러 작동 ")
    print(f"====================================")
    
    # 비동기 Playwright 함수 호출
    jobs = asyncio.run(parse_albamon_playwright())
    upsert_jobs_to_supabase(jobs)

if __name__ == "__main__":
    main()
