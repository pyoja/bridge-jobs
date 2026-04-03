import requests
from bs4 import BeautifulSoup

# JobKorea URL with some query parameters (based on standard JobKorea search URL structure)
# We might need to guess the exact codes or just search by keyword for now to see the HTML structure.
# keywords: "백엔드 개발자 프론트엔드 개발자 웹 개발자" + "계약직 아르바이트"
# localorder=1 means Seoul
url = "https://www.jobkorea.co.kr/Search/?stext=웹개발자&local=I000&jobtype=2,6"
# jobtype: 2 (계약직), 6 (아르바이트) -> depends on JobKorea's mapping

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Finding job items
    # Typically in JobKorea it's list-default or list-post
    job_lists = soup.find_all('li', class_='list-post')
    print(f"Found {len(job_lists)} list-post items.")
    
    if len(job_lists) == 0:
        # try another class
        job_lists = soup.select('.list-default .clear')
        print(f"Found {len(job_lists)} list-default clear items.")
        
    for item in job_lists[:3]:
        company_el = item.find('a', class_='name')
        company = company_el.text.strip() if company_el else "N/A"
        
        title_el = item.find('a', class_='title')
        title = title_el.text.strip() if title_el else "N/A"
        
        print(f"Company: {company}")
        print(f"Title: {title}")
        print("-" * 20)
except Exception as e:
    print(f"Error: {e}")
