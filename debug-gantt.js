const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Intercept API requests or just modify DOM after load
    await page.goto('http://localhost:8085/work.html');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
        // Clear containers
        const treeBody = document.getElementById('ps-tree-body');
        const ganttBody = document.getElementById('ps-gantt-body');
        const bgHlines = document.getElementById('ps-gantt-horizontal-lines');
        const ganttBlocks = document.getElementById('ps-gantt-blocks');
        
        if(!treeBody || !ganttBody) return;
        treeBody.innerHTML = '';
        bgHlines.innerHTML = '';
        ganttBlocks.innerHTML = '';
        
        let globalIndex = 0;
        for(let i=0; i<30; i++) {
            globalIndex++;
            // Left row
            const tr = document.createElement('div');
            tr.className = 'ps-tree-row';
            tr.style.cssText = 'height: 30px !important; min-height: 30px !important; max-height: 30px !important; display: flex; box-sizing: border-box; overflow: hidden;';
            tr.innerHTML = `<div style="width:100%; border-bottom:1px solid #ccc; background:#fafafa;">Row ${globalIndex}</div>`;
            treeBody.appendChild(tr);
            
            // Right row
            const hline = document.createElement('div');
            hline.className = 'ps-gantt-hline';
            hline.style.cssText = `width: 2000px; height: 30px !important; min-height: 30px !important; max-height: 30px !important; box-sizing: border-box; border-bottom:1px solid #ccc;`;
            bgHlines.appendChild(hline);
            
            // Block
            const block = document.createElement('div');
            block.style.cssText = `position: absolute; top: ${(globalIndex-1)*30 + 5}px; left: 100px; width: 200px; height: 20px; background: blue;`;
            ganttBlocks.appendChild(block);
        }
        ganttBody.style.height = `${(globalIndex+3)*30}px`;
    });
    
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'debug_gantt_1.png' });
    
    // Scroll
    await page.evaluate(() => {
        document.getElementById('ps-gantt-container').scrollTop = 150;
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'debug_gantt_2.png' });
    
    await browser.close();
})();
