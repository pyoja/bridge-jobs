import requests
from bs4 import BeautifulSoup

url = (
    f"https://www.alba.co.kr/job/area/mainlocal?schnm=LOCAL&viewtype=L&sidocd=02"
    f"&hidListView=LIST&hidSortCnt=50&page=1&strAreaMulti=02%7C%7C%EC%A0%84%EC%B2%B4%7C%7C"
    f"&workperiodcd=H03&workperiodcd=H04&hiretypecd=K03&welfarecd=T01%2C+T02%2C+T03%2C+T04"
)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
}

print("Fetching:", url)
response = requests.get(url, headers=headers)
print("Status:", response.status_code)

soup = BeautifulSoup(response.text, 'html.parser')

normal_info = soup.find(id="NormalInfo")
if not normal_info:
    print("NormalInfo not found")
    print(response.text[:500])
else:
    print("NormalInfo found")
    tbody = normal_info.find("tbody")
    if tbody:
        rows = tbody.find_all("tr")
        print("Tr count:", len(rows))
        for row in rows[:2]:
            title_el = row.select_one(".title span.company")
            print("Title element:", title_el)
    else:
        print("Tbody not found")
