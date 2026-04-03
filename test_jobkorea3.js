const fs = require('fs');

const html = fs.readFileSync('jobkorea.html', 'utf8');

// The jobs are inside div with data-sentry-component="CardJob"
const cardJobs = html.match(/data-sentry-component="CardJob"[\s\S]*?<\/div><\/div><\/div><\/div>/g) || [];
console.log(`Found ${cardJobs.length} CardJobs`);

if (cardJobs.length > 0) {
    const firstJob = cardJobs[0];
    
    // Company name: alt="XXX 로고" or inside text-typo-b2-16
    const corpMatch = firstJob.match(/text-typo-b2-16[^>]*>([^<]+)<\/span>/);
    console.log("Corp:", corpMatch ? corpMatch[1] : "N/A");

    // Title: <span class="text-typo-b1-18 font-semibold truncate text-gray900">...</span>
    const titleMatch = firstJob.match(/text-typo-b1-18[^>]*>([^<]+)<\/span>/);
    console.log("Title:", titleMatch ? titleMatch[1] : "N/A");
    
    // Link: href="https://www.jobkorea.co.kr/Recruit/GI_Read/48896964..."
    const linkMatch = firstJob.match(/href="([^"]+GI_Read[^"]+)"/);
    console.log("URL:", linkMatch ? linkMatch[1] : "N/A");
}
