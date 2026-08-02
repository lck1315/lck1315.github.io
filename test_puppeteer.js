const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './test_luckysheet_formula.html';
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.xlsx': contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
    }
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(500); res.end('Sorry, check with the site admin for error: '+error.code+' ..\n'); res.end();
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});
server.listen(8125);

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:8125/');
    await new Promise(r => setTimeout(r, 5000)); // wait 5 seconds
    
    const result = await page.evaluate(() => {
        return {
            testResult: window.testResult,
            calcChainCheck: window.calcChainCheck
        };
    });
    console.log("Result:", result);
    
    await browser.close();
    server.close();
})();
