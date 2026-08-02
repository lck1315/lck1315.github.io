const fs = require('fs');
let content = fs.readFileSync('/Users/cg/Documents/lck1315.github.io/work.js', 'utf8');

const targetStr = "        const alarmIcon = task._isDelayed ? `<i class=\"fa-solid fa-bell\" style=\"color: #e55039; font-size: 11px; margin-right: 5px;\" title=\"일정 지연 알림\"></i>` : '';";

const replacementStr = `        let alarmIcon = '';
        if (task._isDelayed) {
            alarmIcon = \`<i class="fa-solid fa-bell" style="color: #e55039; font-size: 11px; margin-right: 5px;" title="일정 지연 알림"></i>\`;
        } else if (task._isWarning) {
            alarmIcon = \`<i class="fa-solid fa-bell" style="color: #fa8231; font-size: 11px; margin-right: 5px;" title="마감일 임박 알림"></i>\`;
        }`;

content = content.replace(targetStr, replacementStr);

const targetInputStr = "style=\"flex: 1; ${task._isDelayed ? 'color: #e55039; font-weight: bold;' : ''}\">";
const replacementInputStr = "style=\"flex: 1; ${task._isDelayed ? 'color: #e55039; font-weight: bold;' : (task._isWarning ? 'color: #fa8231; font-weight: bold;' : '')}\">";

content = content.replace(targetInputStr, replacementInputStr);

fs.writeFileSync('/Users/cg/Documents/lck1315.github.io/work.js', content, 'utf8');
console.log('Replacement done');
