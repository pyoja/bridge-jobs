const fs = require('fs');

const html = fs.readFileSync('alba_heaven.html', 'utf8');

// The jobs are inside `<tbody>` inside `#NormalInfo`
const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/g);
if (!tbodyMatch) return console.log("No tbody found");

let normalInfoContent = "";
const normalInfoIndex = html.indexOf('id="NormalInfo"');
if (normalInfoIndex !== -1) {
  const tableIndex = html.indexOf('<table', normalInfoIndex);
  const endTableIndex = html.indexOf('</table>', tableIndex);
  normalInfoContent = html.substring(tableIndex, endTableIndex + 8);
} else {
  return console.log("No NormalInfo block found");
}

let jobCount = 0;
const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
let trMatch;
while ((trMatch = trRegex.exec(normalInfoContent)) !== null) {
  const tr = trMatch[1];
  
  if (tr.includes('class="empty"')) continue; // <tr class="empty">등록된 채용정보가 없습니다.</tr>
  if (tr.includes('회사명 비공개') && tr.includes('광고')) continue; // Skip some ads maybe
  
  // 회사명
  const companyMatch = tr.match(/<span class="company">([\s\S]*?)<\/span>/);
  const company = companyMatch ? companyMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // 제목/링크
  const titleMatch = tr.match(/<span class="title">([\s\S]*?)<\/span>/);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  const urlMatch = tr.match(/href="([^"]+)"/);
  const url = urlMatch ? "https://www.alba.co.kr" + urlMatch[1] : '';

  // 지역
  const areaMatch = tr.match(/<td class="local[^"]*">([\s\S]*?)<\/td>/);
  const areaParts = areaMatch ? areaMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  // 기간, 요일, 시간
  const dataMatch = tr.match(/<td class="data">([\s\S]*?)<\/td>/);
  let duration = '', days = '', time = '';
  if (dataMatch) {
    const dataHtml = dataMatch[1];
    duration = (dataHtml.match(/<span class="time">([^<]+)<\/span>/) || [])[1] || '';
  }

  // 급여
  const payMatch = tr.match(/<td class="pay">([\s\S]*?)<\/td>/);
  let payType = '', payAmount = '';
  if (payMatch) {
    const payHtml = payMatch[1];
    payType = (payHtml.match(/<span class="payIcon[^"]*">([^<]+)<\/span>/) || [])[1] || '';
    payAmount = (payHtml.match(/<span class="number[^"]*">([^<]+)<\/span>/) || [])[1] || '';
  }

  if (title) {
    jobCount++;
    if (jobCount <= 3) {
      console.log(`[Job ${jobCount}]`);
      console.log(`Company: ${company}`);
      console.log(`Title: ${title}`);
      console.log(`Area: ${areaParts}`);
      console.log(`Pay: ${payType} ${payAmount}`);
      console.log(`URL: ${url}`);
      console.log('---');
    }
  }
}
console.log(`Total jobs found: ${jobCount}`);
