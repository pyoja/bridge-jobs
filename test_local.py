"""
로컬 테스트용: requests + HTML 파싱으로 알바몬 __NEXT_DATA__ 추출
(Playwright 없이 빠르게 구조 확인)
"""
import json
import re
import urllib.request

url = (
    "https://www.albamon.com/jobs/area"
    "?page=1&size=50"
    "&areas=I000"
    "&employmentTypes=CONTRACT"
    "&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH"
)

req = urllib.request.Request(url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
})
with urllib.request.urlopen(req, timeout=15) as res:
    html = res.read().decode("utf-8")

match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>', html, re.DOTALL)
if not match:
    print("❌ __NEXT_DATA__ 없음")
    exit(1)

data = json.loads(match.group(1))
try:
    state_data = data["props"]["pageProps"]["dehydratedState"]["queries"][0]["state"]["data"]
    collection = state_data["base"]["normal"]["collection"]
    print(f"✅ collection 길이: {len(collection)}")
    if collection:
        first = collection[0]
        print("첫 공고 -", "제목:", first.get("recruitTitle","?"), "/ 지역:", first.get("workplaceArea","?"), "/ 시간:", first.get("workingTime","?"))
except Exception as e:
    print(f"❌ 파싱 실패: {e}")
    print("queries[0].state.data 키:", list(data["props"]["pageProps"]["dehydratedState"]["queries"][0]["state"]["data"].keys()))
