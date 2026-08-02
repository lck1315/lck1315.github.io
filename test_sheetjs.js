const XLSX = require('xlsx');
const fs = require('fs');

// Create a workbook with formulas
const wb = XLSX.utils.book_new();
const wsData = [
  ['A', 'B', 'C', 'D'],
  [1, 2, {t:'n', f:'A2*B2'}, {t:'n', f:'$A$2*B2'}],
  [3, 4, {t:'n', f:'A3*B3'}, {t:'n', f:'$A$3*B3'}],
  [5, 6, {t:'n', f:'A4*B4'}, {t:'n', f:'$A$4*B4'}]
];
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "test_formulas.xlsx");

// Read it back
const wb2 = XLSX.readFile("test_formulas.xlsx", {cellFormula: true});
const ws2 = wb2.Sheets["Sheet1"];
console.log("C2:", ws2['C2'] ? ws2['C2'].f : 'none');
console.log("C3:", ws2['C3'] ? ws2['C3'].f : 'none');
console.log("C4:", ws2['C4'] ? ws2['C4'].f : 'none');
