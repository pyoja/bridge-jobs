const fs = require('fs');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

async function testAlba() {
  const url = "https://www.alba.co.kr/job/area/mainlocal?schnm=LOCAL&viewtype=L&sidocd=02&hidListView=LIST&hidSortCnt=50&page=1&strAreaMulti=02%7C%7C%EC%A0%84%EC%B2%B4%7C%7C&workperiodcd=H03&workperiodcd=H04&hiretypecd=K03&welfarecd=T01%2C+T02%2C+T03%2C+T04";
  const res = await fetch(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const text = iconv.decode(buffer, 'euc-kr');
  
  const $ = cheerio.load(text);
  
  const normalInfo = $('#NormalInfo');
  console.log("NormalInfo length:", normalInfo.length);
  
  if (normalInfo.length) {
     const tbody = normalInfo.find('tbody');
     console.log("tbody length:", tbody.length);
     
     if (tbody.length) {
        const rows = tbody.find('tr');
        console.log("tr length:", rows.length);
        
        // Print class and title of first row
        const firstRow = rows.eq(0);
        console.log("classes:", firstRow.attr('class'));
        console.log("company:", firstRow.find(".title span.company").text().trim());
        console.log("title:", firstRow.find(".title a.goodsBox-info").text().trim());
        
        let validCount = 0;
        rows.each((i, el) => {
            const row = $(el);
            if(row.attr('class') && row.attr('class').includes('empty')) return;
            const title_el = row.find(".title span.company");
            if (title_el.length) validCount++;
        });
        console.log("Valid Rows with company:", validCount);
     }
  }
}
testAlba().catch(console.error);
