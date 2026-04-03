const fs = require('fs');
const cheerio = require('cheerio');

const text = fs.readFileSync('first_alba_row.html', 'utf8');
const $ = cheerio.load(text);

const company_el = $("span.company");
const title_el = $("span.title");
const link_el = $("td.title a.info");
const area_el = $("td.local");
const data_el = $("td.data");
const pay_el = $("td.pay");

console.log("Company:", company_el.text().replace('<em class="L_MyAd_"></em>', '').trim());
console.log("Title:", title_el.text().trim());
console.log("Link:", link_el.attr('href'));
console.log("Local:", area_el.text().trim());
console.log("Data:", data_el.text().trim());
console.log("Pay:", pay_el.text().trim());
