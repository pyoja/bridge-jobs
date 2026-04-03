process.stdout.setEncoding('utf8');
const url = "https://www.albamon.com/jobs/area?page=1&size=50&areas=I000&employmentTypes=CONTRACT&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH";

fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
}).then(res => res.text()).then(html => {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/s);
  const data = JSON.parse(match[1]);
  const state = data.props.pageProps.dehydratedState.queries[0].state.data;
  
  const collection = state.base.normal.collection;
  
  console.log("공고 수:", collection.length);
  const first = collection[0];
  
  // 모든 키-값 출력
  process.stdout.write("--- 첫 번째 공고 전체 ---\n");
  process.stdout.write(JSON.stringify(first, null, 2) + "\n");
}).catch(console.error);
