const fs = require('fs');

const dateObjects = [];
let d = new Date(2025, 11, 28);
for(let i=0; i<10; i++) {
    dateObjects.push(new Date(d));
    d.setDate(d.getDate() + 1);
}

let monthGroups = [];
let weekGroups = [];
let yearGroups = [];
let dayCells = '';
let weekdayCells = '';
const weekdaysKR = ['일', '월', '화', '수', '목', '금', '토'];

if (dateObjects.length > 0) {
    let currentMonth = dateObjects[0].getMonth();
    let monthColspan = 0;
    
    let currentYear = dateObjects[0].getFullYear();
    let yearColspan = 0;
    
    let weekColspan = 0;
    let currentBlockWeekNum = 0;
    
    function getStrictYearWeek(y, m, day) {
        const dt = new Date(y, m, day);
        const firstDayOfYear = new Date(y, 0, 1);
        const dayOfWeekOfFirstDay = firstDayOfYear.getDay(); 
        const daysToFirstSunday = dayOfWeekOfFirstDay === 0 ? 0 : 7 - dayOfWeekOfFirstDay;
        const firstSunday = new Date(y, 0, 1 + daysToFirstSunday);
        if (dt <= firstSunday) return 1;
        const msSinceFirstSunday = dt.getTime() - firstSunday.getTime();
        const daysSinceFirstSunday = Math.round(msSinceFirstSunday / 86400000);
        return Math.floor(daysSinceFirstSunday / 7) + 2;
    }
    
    for (let i = 0; i < dateObjects.length; i++) {
        const dObj = dateObjects[i];
        const day = dObj.getDay(); // 0: Sun, 1: Mon
        const m = dObj.getMonth();
        const y = dObj.getFullYear();
        
        if (y === currentYear) {
            yearColspan++;
        } else {
            yearGroups.push({ text: currentYear + '년', colspan: yearColspan });
            currentYear = y;
            yearColspan = 1;
        }
        
        if (m === currentMonth) {
            monthColspan++;
        } else {
            monthGroups.push({ text: (currentMonth + 1) + '월', colspan: monthColspan });
            currentMonth = m;
            monthColspan = 1;
        }
        
        if (weekColspan === 0) {
            currentBlockWeekNum = getStrictYearWeek(y, m, dObj.getDate());
        }
        
        weekColspan++;
        
        const isLastDayOfYear = (m === 11 && dObj.getDate() === new Date(y, 11, 31).getDate());
        const isLastDayOfChart = (i === dateObjects.length - 1);
        
        if (day === 0 || isLastDayOfYear || isLastDayOfChart) {
            weekGroups.push({ text: currentBlockWeekNum + '주차', colspan: weekColspan });
            weekColspan = 0;
        }
        
        if (isLastDayOfChart) {
            monthGroups.push({ text: (currentMonth + 1) + '월', colspan: monthColspan });
            yearGroups.push({ text: currentYear + '년', colspan: yearColspan });
        }
        
        let color = '#333';
        let bg = '#fff';
        if (day === 0) { color = 'red'; bg = '#fff0f0'; }
        if (day === 6) { color = 'blue'; bg = '#f0f4ff'; }
        
        dayCells += `<th style="background:#f8f9fa; border:1px solid #ddd; min-width:25px;">${dObj.getDate()}</th>`;
        weekdayCells += `<th style="color:${color}; background:${bg}; border:1px solid #ddd; font-weight:normal;">${weekdaysKR[day]}</th>`;
    }
}

let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
    table { border-collapse: collapse; font-family: 'Malgun Gothic', sans-serif; font-size: 9pt; }
    th, td { border: 1px solid #d1d5db; text-align: center; vertical-align: middle; white-space: nowrap; height: 25px; }
    .header-cell { background: #f1f5f9; font-weight: bold; }
    .row-project { background: #ede9fe; font-weight: bold; }
    .row-task { background: #ffffff; }
</style>
</head>
<body>
<table>
    <thead>
        <tr>
            <th rowspan="5" class="header-cell" style="width: 40px;">No.</th>
            <th rowspan="5" class="header-cell" style="width: 250px; text-align:left; padding-left:8px;">Project / Task</th>
            <th rowspan="5" class="header-cell" style="width: 80px;">Assignee</th>
            <th rowspan="5" class="header-cell" style="width: 80px;">Status</th>
            <th rowspan="5" class="header-cell" style="width: 90px;">Start</th>
            <th rowspan="5" class="header-cell" style="width: 90px;">End</th>
            ${yearGroups.map(yg => `<th colspan="${yg.colspan}" class="header-cell" style="background:#e2e8f0; font-size:10pt;">${yg.text}</th>`).join('')}
        </tr>
        <tr>
            ${weekGroups.map(wg => `<th colspan="${wg.colspan}" class="header-cell">${wg.text}</th>`).join('')}
        </tr>
        <tr>
            ${monthGroups.map(mg => `<th colspan="${mg.colspan}" class="header-cell">${mg.text}</th>`).join('')}
        </tr>
        <tr>${dayCells}</tr>
        <tr>${weekdayCells}</tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>Test</td>
            <td>John</td>
            <td>Done</td>
            <td>2025-12-28</td>
            <td>2026-01-06</td>
            ${dateObjects.map(() => `<td></td>`).join('')}
        </tr>
    </tbody>
</table>
</body>
</html>
`;

fs.writeFileSync('/Users/cg/Documents/lck1315.github.io/test_excel.html', html);
console.log('Done');
