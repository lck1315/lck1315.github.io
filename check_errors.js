const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    let filePath = '.' + urlPath;
    if (filePath === './') filePath = './work.html';
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(500); res.end('Error');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});
server.listen(8131);

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 800 });
    page.on('console', msg => console.log('LOG:', msg.text()));
    
    await page.evaluateOnNewDocument(() => {
        window.firebase = {
            apps: [],
            initializeApp: () => ({
                firestore: () => ({
                    collection: () => ({
                        doc: () => ({
                            onSnapshot: (cb) => {
                                cb({ exists: true, data: () => ({ isMaster: true, isApproved: true }) });
                                return () => {};
                            },
                            get: async () => ({ exists: true, data: () => ({ isMaster: true, isApproved: true }) }),
                            update: async () => {}
                        }),
                        where: () => ({ get: async () => ({ empty: false }) })
                    })
                }),
                auth: () => ({
                    onAuthStateChanged: (cb) => {
                        setTimeout(() => cb({ uid: 'mock_uid', email: 'test@test.com' }), 500);
                    },
                    signOut: () => {}
                })
            }),
            app: () => window.firebase.initializeApp()
        };
    });
    
    await page.goto('http://localhost:8131/work.html');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
        const perfTab = document.querySelector('.work-tab[data-tab="performance"]');
        if (perfTab) {
            perfTab.click();
        }
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const styles = await page.evaluate(() => {
        const main = document.getElementById('tab-main');
        const perf = document.getElementById('tab-performance');
        return {
            mainClasses: main.className,
            mainDisplay: window.getComputedStyle(main).display,
            perfClasses: perf.className,
            perfDisplay: window.getComputedStyle(perf).display
        };
    });
    console.log('STYLES:', styles);
    
    await browser.close();
    server.close();
})();
