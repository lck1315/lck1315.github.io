const fs = require('fs');
const XLSX = require('xlsx');

const fileData = fs.readFileSync('test.xlsx');
const workbook = XLSX.read(fileData, { type: 'buffer', cellFormula: true });

const sheet = workbook.Sheets[workbook.SheetNames[0]];
for (let key in sheet) {
    if (!key.startsWith('!')) {
        const cell = sheet[key];
        if (cell.f) {
            console.log(`SheetJS Cell ${key}: Formula = ${cell.f}, Value = ${cell.v}`);
        }
    }
}
