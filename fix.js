const fs = require('fs');

const file = '/Users/cg/Documents/lck1315.github.io/work.js';
let content = fs.readFileSync(file, 'utf8');

// Replace line 502 logic
const lines = content.split('\n');

const fixString = `        if (typeof renderPerformances === 'function') renderPerformances();
        if (window.renderWorkMembersChatList) window.renderWorkMembersChatList();
        if (typeof renderPsScheduler === 'function') renderPsScheduler();
        if (typeof renderNotices === 'function') renderNotices();
    }

    auth.onAuthStateChanged((user) => {`;

// Find where "renderSchedules();" is, around line 501
const idx = lines.findIndex(l => l.includes('renderSchedules();'));

if (idx !== -1) {
    // Delete the bad line (idx + 1)
    lines.splice(idx + 1, 1, fixString);
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Fixed!");
} else {
    console.log("Could not find renderSchedules");
}
