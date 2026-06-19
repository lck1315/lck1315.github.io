const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Inject mock data into localStorage before loading
    await page.evaluateOnNewDocument(() => {
        window.localStorage.setItem('psData', JSON.stringify([
            {
                id: '1',
                name: 'Test Project',
                isExpanded: true,
                children: [
                    { id: '1-1', name: 'Task 1', startDate: '2026-06-10', endDate: '2026-06-12' },
                    { id: '1-2', name: 'Task 2', startDate: '2026-06-11', endDate: '2026-06-15' }
                ]
            }
        ]));
    });
    
    await page.goto('http://localhost:8085/work.html');
    await new Promise(r => setTimeout(r, 2000));
    
    // Force render
    await page.evaluate(() => {
        if (typeof renderPsScheduler === 'function') renderPsScheduler();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const rects = await page.evaluate(() => {
        const trs = document.querySelectorAll('.ps-tree-row');
        const hlines = document.querySelectorAll('.ps-gantt-hline');
        const blocks = document.querySelectorAll('.ps-gantt-block');
        
        let res = "TreeRows: ";
        for(let i=0; i<Math.min(trs.length, 5); i++) res += trs[i].getBoundingClientRect().top.toFixed(1) + ", ";
        res += "\nHlines: ";
        for(let i=0; i<Math.min(hlines.length, 5); i++) res += hlines[i].getBoundingClientRect().top.toFixed(1) + ", ";
        res += "\nBlocks: ";
        for(let i=0; i<Math.min(blocks.length, 5); i++) res += blocks[i].getBoundingClientRect().top.toFixed(1) + ", ";
        
        const treeBody = document.querySelector('.ps-tree-body');
        const ganttBody = document.querySelector('.ps-gantt-body');
        res += `\nTreeBody Top: ${treeBody ? treeBody.getBoundingClientRect().top : 'null'}`;
        res += `\nGanttBody Top: ${ganttBody ? ganttBody.getBoundingClientRect().top : 'null'}`;
        
        return res;
    });
    console.log(rects);
    
    await browser.close();
})();
