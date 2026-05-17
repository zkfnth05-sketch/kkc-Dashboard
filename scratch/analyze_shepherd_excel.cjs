
const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeShepherdExcel() {
    const filePath = path.join('c:', 'Users', 'zkfnt', 'Desktop', 'kkf-admin-dashboard', '[셰퍼드] 2025 KKC 저먼 셰퍼드 내셔널 쇼_신청자_목록.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    console.log(`--- Analyzing Shepherd Excel Styles ---`);
    console.log(`Worksheet Name: ${worksheet.name}`);

    // Analyze first 30 rows to get patterns
    for (let i = 1; i <= 30; i++) {
        const row = worksheet.getRow(i);
        if (!row.values || row.values.length === 0) continue;

        console.log(`\n[Row ${i}] Height: ${row.height}`);
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const address = cell.address;
            const value = cell.value;
            const font = cell.font || {};
            const fill = cell.fill || {};
            const alignment = cell.alignment || {};
            const border = cell.border || {};

            console.log(`  Cell ${address} (Col ${colNumber}):`);
            console.log(`    Value: ${JSON.stringify(value)}`);
            console.log(`    Font: size=${font.size}, bold=${font.bold}, color=${JSON.stringify(font.color)}`);
            console.log(`    Fill: type=${fill.type}, fgColor=${JSON.stringify(fill.fgColor)}`);
            console.log(`    Alignment: horizontal=${alignment.horizontal}, vertical=${alignment.vertical}`);
        });
    }
}

analyzeShepherdExcel().catch(err => console.error(err));
