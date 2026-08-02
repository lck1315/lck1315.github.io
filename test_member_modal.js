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
server.listen(8136);

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
                            onSnapshot: () => () => {},
                            get: async () => ({ exists: true, data: () => ({ isMaster: true, isApproved: true }) })
                        }),
                        where: () => ({ get: async () => ({ empty: false }) })
                    })
                }),
                auth: () => ({
                    onAuthStateChanged: () => {}
                })
            }),
            app: () => window.firebase.initializeApp()
        };
    });
    
    await page.goto('http://localhost:8136/work.html');
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => {
        window.psData = [
            { id: 'p1', name: '알파 프로젝트', parentId: null, status: '진행 중', endDate: '2026-07-20' },
            { id: 't1', name: 'UI 디자인', parentId: 'p1', assignee: '홍길동, 임꺽정', status: '진행 중', endDate: '2026-07-15' },
            { id: 't2', name: 'DB 설계', parentId: 'p1', assignee: '김철수', status: '완료', endDate: '2026-07-10' },
            { id: 'p2', name: '베타 프로젝트', parentId: null, status: '완료', endDate: '2026-07-01' },
            { id: 't3', name: '서버 연동', parentId: 'p2', assignee: '홍길동', status: '완료', endDate: '2026-06-30' },
            { id: 'p3', name: '지연된 프로젝트', parentId: null, status: '진행 중', endDate: '2026-07-01', _isDelayed: true },
            { id: 't4', name: '지연 작업', parentId: 'p3', assignee: '임꺽정', status: '진행 중', endDate: '2026-07-01', _isDelayed: true },
            { id: 'p4', name: '경고 프로젝트', parentId: null, status: '진행 중', endDate: '2026-07-12', _isWarning: true },
            { id: 't5', name: '경고 작업', parentId: 'p4', assignee: '김철수', status: '진행 중', endDate: '2026-07-12', _isWarning: true }
        ];
        
        const overlay = document.getElementById('ps-auth-lock');
        if (overlay) overlay.style.display = 'none';
        
        try {
            document.getElementById('member-projects-modal').classList.remove('hidden');
            // Try to call the function directly if possible
            if (typeof openMemberProjectsModal === 'function') {
                openMemberProjectsModal();
            } else {
                console.log("openMemberProjectsModal is not defined globally.");
                // Let's trigger click
                document.getElementById('ps-btn-member-projects').click();
            }
        } catch (e) {
            console.error(e);
        }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/Users/cg/Documents/lck1315.github.io/member_modal4.png' });
    
    await browser.close();
    server.close();
})();
