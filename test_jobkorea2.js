const fs = require('fs');
const html = fs.readFileSync('jobkorea.html', 'utf8');

const listDefaultMatches = html.match(/list-default/g);
console.log("Found list-default:", listDefaultMatches ? listDefaultMatches.length : 0);

const jobListMatches = html.match(/post/g);
console.log("Found post:", jobListMatches ? jobListMatches.length : 0);

const titleMatches = html.match(/class=\"title\"/g);
console.log("Found class=title:", titleMatches ? titleMatches.length : 0);

const clearMatches = html.match(/class=\"clear\"/g);
console.log("Found class=clear:", clearMatches ? clearMatches.length : 0);

// Let's find exactly what class contains "웹개발자" or "백엔드개발자"
const idx = html.indexOf('개발자');
if (idx !== -1) {
    console.log(html.substring(Math.max(0, idx - 200), idx + 200));
}
