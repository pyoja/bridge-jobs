"""
Bridge Jobs 크롤러 v4 - requests 기반, BeautifulSoup 추가 (알바천국 지원)
- 알바몬 & 알바천국 무제한 페이지 수집
- DATABASE_URL 환경변수로 psycopg2 연결
"""

import os
import re
import json
import time
import psycopg2
from psycopg2.extras import execute_values
from bs4 import BeautifulSoup

try:
    import requests
except ImportError:
    requests = None

# =============================================
# 설정
# =============================================
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ 환경변수 DATABASE_URL 이 없습니다.")
    exit(1)

# psycopg2는 pgbouncer 파라미터를 인식하지 못하므로 제거
DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

DANGER_KEYWORDS = ['3.3%', '사업소득', '프리랜서', '위촉직', '도급', '원천징수']

# =============================================
# 스코어링 키워드 정의
# =============================================
SCORE_S = {
    '이직확인서': 50,
    '이직확인서 발급': 50,
    '실업급여': 50,
    '실급': 50,
    '상실신고': 50,
}

SCORE_A = {
    '단기 계약직': 20, '기간제': 20, '파견직': 20, '계약만료': 20, '근로계약서 작성': 20,
    '1개월': 20, '2개월': 20, '3개월': 20, '단기 알바': 20,
    '고용보험': 20, '4대보험': 20, '사대보험': 20,
}

SCORE_B = {
    '사무보조': 10, '데이터 라벨링': 10, '단순 포장': 10,
    '재고조사': 10, '관공서 알바': 10, '공공근로': 10,
}

BLACKLIST_KEYWORDS = {
    '3.3%': -100, '사업소득': -100, '원천징수': -100,
    '프리랜서': -100, '위촉직': -100, '도급': -100,
    '건별 지급': -100, '인센티브제': -100, '실적급': -100, '전액 수수료': -100,
}

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

def calculate_score(text: str) -> tuple[int, list[str]]:
    """텍스트에서 스코어링 키워드를 탐지하여 총점과 발견된 키워드 목록 반환.
    matched_keywords 형식: 'S|이직확인서', 'A|고용보험', 'B|사무보조', 'BL|3.3%'
    """
    score = 0
    matched = []

    # 블랙리스트 먼저 확인 (블랙리스트 발견 시 즉시 대폭 감점)
    for kw, pts in BLACKLIST_KEYWORDS.items():
        if kw in text:
            score += pts
            matched.append(f'BL|{kw}')

    # S급
    for kw, pts in SCORE_S.items():
        if kw in text and f'S|{kw}' not in matched:
            score += pts
            matched.append(f'S|{kw}')

    # A급
    for kw, pts in SCORE_A.items():
        if kw in text and f'A|{kw}' not in matched:
            score += pts
            matched.append(f'A|{kw}')

    # B급
    for kw, pts in SCORE_B.items():
        if kw in text and f'B|{kw}' not in matched:
            score += pts
            matched.append(f'B|{kw}')

    return score, matched

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
        "MONTHLY_SALARY": "월급", "HOURLY_WAGE": "시급",
        "DAILY_WAGE": "일급", "WEEKLY_WAGE": "주급",
    }
    return mapping.get(pay_type_key, "협의")

def fetch_html(url: str) -> str:
    if requests:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.text
    else:
        import urllib.request
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.read().decode("utf-8")


def parse_jobs_from_albamon_html(html: str) -> list:
    match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
        html, re.DOTALL
    )
    if not match:
        return []
    data = json.loads(match.group(1))
    try:
        return data["props"]["pageProps"]["dehydratedState"]["queries"][0]["state"]["data"]["base"]["normal"]["collection"]
    except Exception:
        return []

# =============================================
# 크롤러: 알바몬
# =============================================
def crawl_albamon() -> list:
    all_jobs = []
    page_num = 1
    
    print("\n--- [알바몬] 수집 시작 ---")
    while True:
        url = (
            "https://www.albamon.com/jobs/area"
            f"?page={page_num}&size=50"
            "&areas=I000"
            "&employmentTypes=CONTRACT"
            "&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH"
        )
        
        try:
            html = fetch_html(url)
            collection = parse_jobs_from_albamon_html(html)
            
            if not collection:
                print(f"📄 [알바몬] {page_num}페이지 - 더 이상 공고가 없습니다. (수집 종료)")
                break
                
            page_jobs = []
            for item in collection:
                try:
                    recruit_no = item.get("recruitNo", "")
                    title = item.get("recruitTitle", "").strip()
                    company = item.get("companyName", "회사명 비공개").strip()
                    working_time = item.get("workingTime", "")
                    working_period = item.get("workingPeriod", "1주~3개월")
                    workplace_area = item.get("workplaceArea", "서울")
                    pay_raw = item.get("pay", "0")
                    pay_type_key = item.get("payType", {}).get("key", "HOURLY_WAGE")
                    
                    if not title or not recruit_no: continue
                    
                    job_url = f"https://www.albamon.com/jobs/detail/{recruit_no}"
                    weekly_hours = calculate_weekly_hours(working_time)
                    is_safe, warnings = analyze_job_safety(title + " " + company)
                    full_text = title + " " + company + " " + working_period
                    job_score, matched_kws = calculate_score(full_text)
                    
                    tags = ["#계약직", "#고용보험가입"]
                    if weekly_hours >= 40: tags.append("#주40시간이상")
                    elif weekly_hours >= 15: tags.append("#주15시간이상")
                    
                    page_jobs.append({
                        "original_url": job_url,
                        "platform": "알바몬",
                        "title": title,
                        "company_name": company,
                        "work_duration": working_period,
                        "work_days": "주 5일", # 기본값
                        "work_hours": working_time,
                        "weekly_work_hours": weekly_hours,
                        "location": workplace_area,
                        "wage_type": normalize_wage_type(pay_type_key),
                        "wage_amount": normalize_wage(pay_raw),
                        "has_employment_insurance": True,
                        "is_contract_worker": True,
                        "is_safe": is_safe,
                        "warning_tags": warnings,
                        "tags": tags,
                        "score": job_score,
                        "matched_keywords": matched_kws,
                    })
                except Exception:
                    continue
            
            all_jobs.extend(page_jobs)
            print(f"📄 [알바몬] {page_num}페이지: ✅ {len(page_jobs)}개 수집 (누적: {len(all_jobs)}개)")
            
            page_num += 1
            if page_num > 100: # 무한루프 방지 (최대 5000개 수집)
                break
            time.sleep(1.5)
            
        except Exception as e:
            print(f"   ❌ [알바몬] {page_num}페이지 에러: {e}")
            break
            
    return all_jobs

# =============================================
# 크롤러: 알바천국
# =============================================
def crawl_alba_heaven() -> list:
    all_jobs = []
    page_num = 1
    
    print("\n--- [알바천국] 수집 시작 ---")
    while True:
        url = (
            f"https://www.alba.co.kr/job/area/mainlocal?schnm=LOCAL&viewtype=L&sidocd=02"
            f"&hidListView=LIST&hidSortCnt=50&page={page_num}&strAreaMulti=02%7C%7C%EC%A0%84%EC%B2%B4%7C%7C"
            f"&workperiodcd=H03&workperiodcd=H04&hiretypecd=K03&welfarecd=T01%2C+T02%2C+T03%2C+T04"
        )
        
        try:
            html = fetch_html(url)
            soup = BeautifulSoup(html, 'html.parser')
            
            normal_info = soup.find(id="NormalInfo")
            if not normal_info:
                print(f"📄 [알바천국] {page_num}페이지 - 더 이상 공고가 없습니다. (수집 종료)")
                break
                
            tbody = normal_info.find("tbody")
            if not tbody: break
            
            rows = tbody.find_all("tr")
            if not rows or len(rows) == 0: break
            
            page_jobs = []
            found_valid = False
            
            for row in rows:
                if row.get("class") and "empty" in row.get("class"):
                    continue
                    
                company_el = row.select_one("td.title span.company")
                if not company_el: continue
                company = company_el.text.strip()
                
                title_el = row.select_one("td.title span.title")
                title = title_el.text.strip() if title_el else "제목 없음"
                
                link_el = row.select_one("td.title a.info")
                job_url = "https://www.alba.co.kr" + link_el["href"] if link_el and link_el.has_attr("href") else ""
                
                if not job_url: continue
                
                area_el = row.select_one(".local")
                workplace_area = area_el.text.strip().replace('\xa0', ' ') if area_el else "서울"
                
                # 근무기간 (알바천국은 별도로 검색했으므로 기본값 사용 하거나 공고 본문 내용 사용)
                working_period = "1주~3개월" 
                
                data_el = row.select_one(".data")
                working_time = ""
                if data_el:
                    time_span = data_el.select_one(".time")
                    working_time = time_span.text.strip() if time_span else ""
                
                pay_el = row.select_one(".pay")
                pay_raw = "0"
                pay_type_key = "HOURLY_WAGE"
                
                if pay_el:
                    num_el = pay_el.select_one(".number")
                    pay_raw = num_el.text.strip() if num_el else "0"
                    
                    icon_el = pay_el.select_one(".payIcon")
                    pay_type_text = icon_el.text.strip() if icon_el else ""
                    
                    mapping = {"시급": "HOURLY_WAGE", "일급": "DAILY_WAGE", "주급": "WEEKLY_WAGE", "월급": "MONTHLY_SALARY"}
                    pay_type_key = mapping.get(pay_type_text, "HOURLY_WAGE")
                
                found_valid = True
                weekly_hours = calculate_weekly_hours(working_time)
                is_safe, warnings = analyze_job_safety(title + " " + company)
                full_text = title + " " + company + " " + working_period
                job_score, matched_kws = calculate_score(full_text)
                
                tags = ["#계약직", "#고용보험가입"]
                if weekly_hours >= 40: tags.append("#주40시간이상")
                elif weekly_hours >= 15: tags.append("#주15시간이상")
                
                page_jobs.append({
                    "original_url": job_url,
                    "platform": "알바천국",
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
                    "tags": tags,
                    "score": job_score,
                    "matched_keywords": matched_kws,
                })
                
            if not found_valid:
                print(f"📄 [알바천국] {page_num}페이지 - 유효 공고 없음. (수집 종료)")
                break
                
            all_jobs.extend(page_jobs)
            print(f"📄 [알바천국] {page_num}페이지: ✅ {len(page_jobs)}개 수집 (누적: {len(all_jobs)}개)")
            
            page_num += 1
            if page_num > 100: # 무한루프 방지
                break
            time.sleep(1.5)
            
        except Exception as e:
            print(f"   ❌ [알바천국] {page_num}페이지 에러: {e}")
            break

    return all_jobs

# =============================================
# 크롤러: 잡코리아
# =============================================
def crawl_jobkorea() -> list:
    all_jobs = []
    page_num = 1
    
    print("\n--- [잡코리아] 수집 시작 ---")
    while True:
        url = (
            f"https://www.jobkorea.co.kr/Search/?stext=백엔드개발자,프론트엔드개발자,웹개발자"
            f"&local=I000&jobtype=2,6&Page_No={page_num}"
        )
        
        try:
            html = fetch_html(url)
            soup = BeautifulSoup(html, 'html.parser')
            
            cards = soup.find_all(lambda tag: tag.name == 'div' and tag.get('data-sentry-component') == 'CardJob')
            
            if not cards or len(cards) == 0:
                print(f"📄 [잡코리아] {page_num}페이지 - 더 이상 공고가 없습니다. (수집 종료)")
                break
                
            page_jobs = []
            
            for card in cards:
                company_el = card.find("span", class_=re.compile(r"text-typo-b2-16"))
                company = company_el.text.strip() if company_el else "회사명 비공개"
                
                title_el = card.find("span", class_=re.compile(r"text-typo-b1-18"))
                title = title_el.text.strip() if title_el else ""
                if not title: continue
                
                link_el = card.find("a", href=re.compile(r"GI_Read"))
                job_url = link_el["href"] if link_el else ""
                if job_url.startswith("/"): job_url = "https://www.jobkorea.co.kr" + job_url
                elif not job_url.startswith("http"): continue
                
                location = "서울"
                chips = card.find_all("span", class_=re.compile(r"text-typo-b4-14"))
                for chip_el in chips:
                    txt = chip_el.text.strip()
                    if "서울 " in txt:
                        location = txt
                        break
                
                is_safe, warnings = analyze_job_safety(title + " " + company)
                full_text = title + " " + company
                job_score, matched_kws = calculate_score(full_text)
                
                tags = ["#계약직/아르바이트", "#IT개발"]
                wage_type = "협의"
                wage_amount = 0
                
                page_jobs.append({
                    "original_url": job_url,
                    "platform": "잡코리아",
                    "title": title,
                    "company_name": company,
                    "work_duration": "상세정보 확인",
                    "work_days": "주 5일",
                    "work_hours": "",
                    "weekly_work_hours": 0,
                    "location": location,
                    "wage_type": wage_type,
                    "wage_amount": wage_amount,
                    "has_employment_insurance": True,
                    "is_contract_worker": True,
                    "is_safe": is_safe,
                    "warning_tags": warnings,
                    "tags": tags,
                    "score": job_score,
                    "matched_keywords": matched_kws,
                })
                
            all_jobs.extend(page_jobs)
            print(f"📄 [잡코리아] {page_num}페이지: ✅ {len(page_jobs)}개 수집 (누적: {len(all_jobs)}개)")
            
            page_num += 1
            if page_num > 100: break
            time.sleep(1.5)
            
        except Exception as e:
            print(f"   ❌ [잡코리아] {page_num}페이지 에러: {e}")
            break
            
    return all_jobs

# =============================================
# DB 저장
# =============================================
def upsert_jobs(jobs: list):
    if not jobs:
        print("적재할 공고가 없습니다.")
        return
    
    print(f"\n📦 총 {len(jobs)}개 공고를 DB에 저장 중...")
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
                j.get("is_safe", True), j.get("warning_tags", []), j.get("tags", []),
                j.get("score", 0), j.get("matched_keywords", [])
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
                is_safe, warning_tags, tags,
                score, matched_keywords
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
                tags = EXCLUDED.tags,
                score = EXCLUDED.score,
                matched_keywords = EXCLUDED.matched_keywords
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
    print("=" * 60)
    print("  Bridge Jobs 자동화 크롤러 v4 (알바몬 + 알바천국)")
    print("  서울 전체 | 계약직 | 1주~3개월 | 데이터 무제한")
    print("=" * 60)
    
    albamon_jobs = crawl_albamon()
    alba_heaven_jobs = crawl_alba_heaven()
    jobkorea_jobs = crawl_jobkorea()
    
    total_jobs = albamon_jobs + alba_heaven_jobs + jobkorea_jobs
    print(f"\n✨ 수집 완료: 알바몬({len(albamon_jobs)}건) + 알바천국({len(alba_heaven_jobs)}건) + 잡코리아({len(jobkorea_jobs)}건) = 총 {len(total_jobs)}건")
    
    upsert_jobs(total_jobs)
    
    print("=" * 60)
    print(f"  실행 완료!")
    print("=" * 60)

if __name__ == "__main__":
    main()
