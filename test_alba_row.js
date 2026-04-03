const fs = require('fs');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

async function testAlba() {
  const url = "https://www.alba.co.kr/job/area/mainlocal?schnm=LOCAL&viewtype=L&sidocd=02&hidListView=LIST&hidSortCnt=50&page=1&strAreaMulti=02%7C%7C%EC%A0%84%EC%B2%B4%7C%7C&workperiodcd=H03&workperiodcd=H04&hiretypecd=K03&welfarecd=T01%2C+T02%2C+T03%2C+T04";
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = iconv.decode(Buffer.from(await res.arrayBuffer()), 'euc-kr');
  const $ = cheerio.load(text);
  
  const firstRow = $('#NormalInfo tbody tr').eq(0).html();
  fs.writeFileSync('first_alba_row.html', firstRow);
}
testAlba();
