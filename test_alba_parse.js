const fs = require('fs');

const text = fs.readFileSync('alba_dump.html', 'utf8');

const goodsListMatch = text.match(/<div class="goodsList"[^>]*>([\s\S]*?)<\/div>\s*<!--/i);
if (goodsListMatch) {
    // try matching individual goodsJob
    const jobs = goodsListMatch[1].match(/<div class="goodsJob"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/ig);
    console.log("Jobs found:", jobs ? jobs.length : 0);
    if (jobs && jobs.length > 0) {
        const firstJob = jobs[0];
        // find title / company
        const companyMatch = firstJob.match(/class="companyName"[^>]*>([^<]+)/);
        const titleMatch = firstJob.match(/class="jobTitle"[^>]*>([^<]+)/);
        const urlMatch = firstJob.match(/href="([^"]+)"/);
        
        console.log("Company:", companyMatch ? companyMatch[1].trim() : "N/A");
        console.log("Title:", titleMatch ? titleMatch[1].trim() : "N/A");
        console.log("URL:", urlMatch ? urlMatch[1] : "N/A");
        
        // Also dump the first job html to understand it
        fs.writeFileSync('first_alba_job.html', firstJob);
    }
} else {
    console.log("goodsList not found");
}
