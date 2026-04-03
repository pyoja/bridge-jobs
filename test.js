const url = "https://www.albamon.com/jobs/area?page=1&size=50&areas=I000&employmentTypes=CONTRACT&excludeKeywords=%EB%B0%B0%EB%8B%AC%2C%EC%97%AC%EB%93%9C%EB%A6%84%2C%EA%B1%B4%EA%B0%95%EA%B8%B0%EB%8A%A5%2C%ED%99%94%EC%9E%A5%ED%92%88%2C%EA%B0%95%EB%82%A8%2C%EC%97%90%EC%96%B4%EC%BB%A8&workPeriodTypes=ONE_WEEK_TO_ONE_MONTH%2CONE_MONTH_TO_THREE_MONTH&includeKeyword=%EB%8B%A8%EA%B8%B0";

fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
}).then(res => res.text()).then(html => {
  const match = html.match(/id="__NEXT_DATA__" type="application\/json">({.*?})<\/script>/is);
  if(match) {
        const data = JSON.parse(match[1]);
        // The data is usually in data.props.pageProps.initialState.xxx
        // Since we don't know the exact Redux/React Query state path, we do a recursive search for jobs
        let foundJobs = null;
        function findJobsList(obj) {
            if(!obj || typeof obj !== 'object') return;
            if(Array.isArray(obj)) {
                if(obj.length > 0 && obj[0].jobNo && obj[0].companyName) {
                    foundJobs = obj;
                    return;
                }
                for(let item of obj) findJobsList(item);
            } else {
                for(let key in obj) {
                    if(key === 'list' && Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][0].jobNo) {
                        foundJobs = obj[key];
                        return;
                    }
                    findJobsList(obj[key]);
                    if(foundJobs) return;
                }
            }
        }
        findJobsList(data);
        if(foundJobs) {
            console.log("Found jobs array! Length:", foundJobs.length);
            console.log("First job:", JSON.stringify(foundJobs[0], null, 2));
        } else {
            console.log("Could not auto-find jobs array in JSON.");
        }
  }
}).catch(console.error);
