const fs = require('fs');

async function testAlbaEnc() {
  const url = "https://www.alba.co.kr/job/area/mainlocal?schnm=LOCAL&viewtype=L&sidocd=02&hidListView=LIST&hidSortCnt=50&page=1&strAreaMulti=02%7C%7C%EC%A0%84%EC%B2%B4%7C%7C";
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log("Headers:", Array.from(res.headers.entries()));
  
  // Try UTF8
  const utf8Text = buffer.toString('utf8');
  if (utf8Text.includes('유니클로') || utf8Text.includes('모집')) {
      console.log("UTF8 Decoded cleanly!");
  } else {
      console.log("UTF8 not matched.");
  }
  
  // Try EUC-KR
  const iconv = require('iconv-lite');
  const euckrText = iconv.decode(buffer, 'euc-kr');
  if (euckrText.includes('유니클로') || euckrText.includes('모집')) {
      console.log("EUC-KR Decoded cleanly!");
  } else {
      console.log("EUC-KR not matched.");
  }
}
testAlbaEnc();
