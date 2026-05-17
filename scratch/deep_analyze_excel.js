
import ExcelJS from 'exceljs';

const filePath = '4.4 도그쇼 A링 출진리스트.xlsx';

async function deepAnalyzeExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  console.log(`--- Deep Style Analysis of ${filePath} ---`);
  
  // 분석할 대표 행들 (타이틀, 그룹, 견종, 조별, 데이터1, 데이터2, 데이터3)
  const targetRows = [1, 2, 3, 4, 6, 7, 8]; 
  
  targetRows.forEach(rowIdx => {
    const row = worksheet.getRow(rowIdx);
    console.log(`\n[Row ${rowIdx}] Height: ${row.height}`);
    
    for (let j = 1; j <= 5; j++) {
      const cell = row.getCell(j);
      console.log(`  Cell ${openpyxl_letter(j)}:`);
      console.log(`    Value: ${cell.value}`);
      console.log(`    Font: size=${cell.font?.size}, bold=${cell.font?.bold}, color=${JSON.stringify(cell.font?.color)}`);
      console.log(`    Fill: ${JSON.stringify(cell.fill)}`);
      console.log(`    Alignment: ${JSON.stringify(cell.alignment)}`);
      console.log(`    Border: ${JSON.stringify(cell.border)}`);
    }
  });
}

function openpyxl_letter(n) {
  return String.fromCharCode(64 + n);
}

deepAnalyzeExcel().catch(console.error);
