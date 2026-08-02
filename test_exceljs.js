const ExcelJS = require('exceljs');

async function test() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.getCell('A1').value = 1;
    ws.getCell('B1').value = 2;
    ws.getCell('A2').value = 3;
    ws.getCell('B2').value = 4;
    
    // Write shared formula
    ws.fillFormula('C1:C2', 'A1*B1');

    await wb.xlsx.writeFile('test_exceljs.xlsx');

    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.readFile('test_exceljs.xlsx');
    const ws2 = wb2.getWorksheet('Sheet1');
    console.log("C1 formula:", ws2.getCell('C1').formula, "sharedFormula:", ws2.getCell('C1').sharedFormula);
    console.log("C2 formula:", ws2.getCell('C2').formula, "sharedFormula:", ws2.getCell('C2').sharedFormula);
}
test();
