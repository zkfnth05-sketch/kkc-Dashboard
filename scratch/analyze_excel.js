
import ExcelJS from 'exceljs';

const filePath = '4.4 도그쇼 A링 출진리스트.xlsx';

async function analyzeExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  console.log(`--- Analyzing ${filePath} ---`);
  
  // 1. 컬럼 너비
  worksheet.columns.forEach((col, idx) => {
    console.log(`Column ${idx + 1} width: ${col.width}`);
  });

  // 2. 병합 정보
  console.log("\nMerged Cells:");
  const merges = worksheet.model.merges;
  merges.forEach(m => console.log(` - ${m}`));

  // 3. 상위 30행 데이터 및 스타일
  console.log("\nRow Data & Styles (First 30 rows):");
  for (let i = 1; i <= 30; i++) {
    const row = worksheet.getRow(i);
    const rowData = [];
    for (let j = 1; j <= 5; j++) {
      const cell = row.getCell(j);
      const val = cell.value;
      const bold = cell.font?.bold ? 'B' : '';
      const bgColor = cell.fill?.fgColor?.argb || '';
      rowData.push(`[${val}](${bold}|${bgColor})`);
    }
    console.log(`Row ${i.toString().padStart(2, '0')}: ${rowData.join(' | ')}`);
  }
}

analyzeExcel().catch(console.error);
