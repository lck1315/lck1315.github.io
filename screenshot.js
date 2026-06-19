const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        // Let's create a local HTML file that mimics the structure exactly to see the 단차 visually
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .ps-main-workspace { display: flex; height: 500px; width: 1000px; background: #eee; }
                
                .ps-left-panel { width: 300px; display: flex; flex-direction: column; border-right: 1px solid #ccc; }
                .ps-left-toolbar { height: 45px; background: #ddd; }
                .ps-tree-header { height: 125px; background: #ccc; border-bottom: 1px solid #aaa; }
                .ps-tree-body { flex: 1; overflow: hidden; background: #fff; }
                .ps-tree-row { height: 30px; border-bottom: 1px solid #eee; display: flex; align-items: center; padding-left: 10px; }
                
                .ps-right-panel { flex: 1; display: flex; flex-direction: column; }
                .ps-right-toolbar { height: 45px; background: #ddd; }
                .ps-gantt-container { flex: 1; overflow: auto; position: relative; background: #fff; }
                .ps-gantt-header { height: 125px; background: #ccc; position: sticky; top: 0; z-index: 10; }
                .ps-gantt-body { position: relative; height: 1000px; }
                .ps-gantt-horizontal-lines { position: absolute; top: 0; left: 0; right: 0; }
                .ps-gantt-hline { height: 30px; border-bottom: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="ps-main-workspace">
                <div class="ps-left-panel">
                    <div class="ps-left-toolbar">Toolbar L</div>
                    <div class="ps-tree-header">Header L</div>
                    <div class="ps-tree-body" id="treeBody">
                        ${Array.from({length: 30}).map((_, i) => `<div class="ps-tree-row">Row ${i+1}</div>`).join('')}
                    </div>
                </div>
                <div class="ps-right-panel">
                    <div class="ps-right-toolbar">Toolbar R</div>
                    <div class="ps-gantt-container" id="ganttContainer">
                        <div class="ps-gantt-header">Header R</div>
                        <div class="ps-gantt-body" id="ganttBody">
                            <div class="ps-gantt-horizontal-lines">
                                ${Array.from({length: 30}).map((_, i) => `<div class="ps-gantt-hline"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <script>
                const ganttContainer = document.getElementById('ganttContainer');
                const treeBody = document.getElementById('treeBody');
                ganttContainer.addEventListener('scroll', () => {
                    treeBody.scrollTop = ganttContainer.scrollTop;
                });
            </script>
        </body>
        </html>
        `;
        await page.setContent(html);
        await page.screenshot({ path: 'test_layout.png' });
        
        // scroll down by 100px
        await page.evaluate(() => {
            document.getElementById('ganttContainer').scrollTop = 100;
        });
        await new Promise(r => setTimeout(r, 100));
        await page.screenshot({ path: 'test_layout_scroll.png' });
        
        await browser.close();
        console.log("Screenshots generated");
    } catch(e) {
        console.error(e);
    }
})();
