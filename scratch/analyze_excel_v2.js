
import ExcelJS from 'exceljs';

const filePath = '4.4 도그쇼 A링 출진리스트.xlsx';

async function analyzeExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  console.log(`--- Detailed Analysis (First 50 rows) ---`);
  
  for (let i = 1; i <= 50; i++) {
    const row = worksheet.getRow(i);
    const rowData = [];
    for (let j = 1; j <= 5; j++) {
      const cell = row.getCell(j);
      let val = cell.value;
      if (val && typeof val === 'object' && val.richText) {
        val = val.richText.map(rt => rt.text).join('');
      }
      const bold = cell.font?.bold ? 'B' : '';
      const alignment = cell.alignment?.horizontal || '';
      rowData.push(`[${val}](${bold}|${alignment})`);
    }
    console.log(`Row ${i.toString().padStart(2, '0')}: ${rowData.join(' | ')}`);
  }
}

analyzeExcel().catch(console.error);
