import requests
from bs4 import BeautifulSoup

url = "https://www.alba.co.kr/job/area/mainlocal?schnm=LOCAL&viewtype=L&sidocd=02&hidListView=LIST&hidSortCnt=50&page=1&strAreaMulti=02%7C%7C%EC%A0%84%EC%B2%B4%7C%7C&workperiodcd=H03&workperiodcd=H04&hiretypecd=K03&welfarecd=T01%2C+T02%2C+T03%2C+T04"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')

# find the job list container
job_list = soup.select('#NormalInfo > table > tbody > tr')
print(f"Found {len(job_list)} job rows (including hidden/ad rows)")

for row in job_list[:10]:
    # Look for normal job rows, they usually have specific classes or structures
    title_el = row.select_one('.title span.company')
    if not title_el:
        continue
    
    company = row.select_one('.company .store')
    company_name = company.text.strip() if company else "N/A"
    
    title = title_el.text.strip()
    
    area_el = row.select_one('.local')
    area = area_el.text.strip() if area_el else "N/A"
    
    pay_type_el = row.select_one('.pay .payIcon')
    pay_type = pay_type_el.text.strip() if pay_type_el else "N/A"
    
    pay_amount_el = row.select_one('.pay .number')
    pay_amount = pay_amount_el.text.strip() if pay_amount_el else "N/A"
    
    time_el = row.select_one('.data .time')
    time_str = time_el.text.strip() if time_el else "N/A"

    print(f"Company: {company_name}")
    print(f"Title: {title}")
    print(f"Area: {area}")
    print(f"Pay: {pay_type} {pay_amount}")
    print(f"Time: {time_str}")
    print("-" * 20)

