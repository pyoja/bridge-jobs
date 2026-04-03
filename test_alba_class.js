const fs = require('fs');

const text = fs.readFileSync('alba_dump.html', 'utf8');

const classMatches = text.match(/class="[^"]+"/g);
if (classMatches) {
    const uniqueClasses = new Set();
    classMatches.forEach(m => {
        m.split('"')[1].split(' ').forEach(c => uniqueClasses.add(c));
    });
    console.log(Array.from(uniqueClasses).filter(c => c.includes('Local') || c.includes('Job') || c.includes('list') || c.includes('table') || c.includes('goods') || c.includes('company')));
}
