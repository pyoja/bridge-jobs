const https = require('https');

const url = "https://www.jobkorea.co.kr/Search/?stext=웹개발자&local=I000&jobtype=2,6";
const req = https.get(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("HTML length:", data.length);
    const fs = require('fs');
    fs.writeFileSync('jobkorea.html', data);
    
    // Quick regex to see if list-post or clear exists
    const listPostMatches = data.match(/class="list-post"/g);
    console.log("Found list-post:", listPostMatches ? listPostMatches.length : 0);
    
    const articleMatches = data.match(/class="article"/g);
    console.log("Found article:", articleMatches ? articleMatches.length : 0);
  });
});
req.on('error', console.error);
