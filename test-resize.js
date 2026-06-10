const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto('http://localhost:8085/work.html', {waitUntil: 'networkidle2'});

    // Since we need to be logged in to see the matrix and be master, we can inject a mock currentUserDoc
    await page.evaluate(() => {
        window.currentUserDoc = { isMaster: true };
        window.currentUser = { uid: "test" };
        window.isMaster = true;
        
        // Mock the matrix data and call renderMatrix directly if possible
        // But renderMatrix is hidden inside initPerformanceLogic.
        // We can just call initPerformanceLogic and mock the DOM
    });
    
    // Instead of full login, let's just see if there are console errors on load
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.waitForTimeout(2000);
    await browser.close();
})();
