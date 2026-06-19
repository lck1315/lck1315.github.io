const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        // Mock Firebase Auth and Firestore directly!
        await page.evaluateOnNewDocument(() => {
            window.localStorage.setItem('debug_bypass_auth', 'true');
        });
        
        await page.goto('http://localhost:8085/work.html');
        await new Promise(r => setTimeout(r, 6000));
        
        const rects = await page.evaluate(() => {
            const trs = document.querySelectorAll('.ps-tree-row');
            const hlines = document.querySelectorAll('.ps-gantt-hline');
            const blocks = document.querySelectorAll('.ps-gantt-block');
            
            let res = "TreeRows: ";
            for(let i=0; i<Math.min(trs.length, 5); i++) res += trs[i].getBoundingClientRect().top + ", ";
            res += "\nHlines: ";
            for(let i=0; i<Math.min(hlines.length, 5); i++) res += hlines[i].getBoundingClientRect().top + ", ";
            res += "\nBlocks: ";
            for(let i=0; i<Math.min(blocks.length, 5); i++) res += blocks[i].getBoundingClientRect().top + ", ";
            return res;
        });
        console.log(rects);
        
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();
