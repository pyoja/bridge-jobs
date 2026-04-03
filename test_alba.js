const fs = require('fs');

async function testAlba() {
  const url = "https://www.alba.co.kr/job/area/mainlocal?schnm=LOCAL&viewtype=L&sidocd=02&hidListView=LIST&hidSortCnt=50&page=1&strAreaMulti=02%7C%7C%EC%A0%84%EC%B2%B4%7C%7C&workperiodcd=H03&workperiodcd=H04&hiretypecd=K03&welfarecd=T01%2C+T02%2C+T03%2C+T04";
  const res = await fetch(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const text = await res.text();
  fs.writeFileSync('alba_dump.html', text);
  console.log("Dump written. Size:", text.length);
}
testAlba();
