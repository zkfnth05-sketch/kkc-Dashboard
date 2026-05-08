
import ExcelJS from 'exceljs';

interface CatalogEntry {
  entryNo: number;
  dogName: string;
  regNo: string;
  birthDate: string;
  sireName: string;
  sireRegNo: string;
  damName: string;
  damRegNo: string;
  breeder: string;
  owner: string;
}

interface CatalogGroup {
  groupName: string;
  breeds: {
    breedName: string;
    classes: {
      className: string;
      entries: CatalogEntry[];
    }[];
  }[];
}

export const exportDogShowCatalog = async (title: string, groups: CatalogGroup[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dog Show Catalog');

  // 1. 컬럼 너비 설정
  worksheet.columns = [
    { header: '번호', key: 'no', width: 10 },
    { header: '정보1', key: 'info1', width: 45 },
    { header: '정보2', key: 'info2', width: 35 },
    { header: '정보3', key: 'info3', width: 25 },
  ];

  // 스타일 정의
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 14 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } }
  };

  const breedStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 12 },
    alignment: { horizontal: 'left', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
  };

  const classStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 11 },
    alignment: { horizontal: 'left', vertical: 'middle' }
  };

  const borderStyle: Partial<ExcelJS.Border> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // 2. 메인 타이틀
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  worksheet.mergeCells(`A${titleRow.number}:D${titleRow.number}`);
  titleRow.height = 40;
  titleRow.getCell(1).style = {
    font: { bold: true, size: 18 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  let currentRow = 2;

  // 3. 그룹/견종/조/데이터 반복문
  groups.forEach(group => {
    // Group Header
    const gRow = worksheet.addRow([`[[ ${group.groupName.toUpperCase()} GROUP ]]`]);
    worksheet.mergeCells(`A${gRow.number}:D${gRow.number}`);
    gRow.getCell(1).style = headerStyle;
    gRow.height = 30;

    group.breeds.forEach(breed => {
      // Breed Header
      const bRow = worksheet.addRow([`[ ${breed.breedName} ]`]);
      worksheet.mergeCells(`A${bRow.number}:D${bRow.number}`);
      bRow.getCell(1).style = breedStyle;
      bRow.height = 25;

      breed.classes.forEach(cls => {
        // Class Header (e.g., ADULT 암조)
        const cRow = worksheet.addRow([cls.className]);
        worksheet.mergeCells(`A${cRow.number}:D${cRow.number}`);
        cRow.getCell(1).style = classStyle;
        cRow.height = 22;

        cls.entries.forEach(entry => {
          // Row 1: No | Name | RegNo | Birth
          const r1 = worksheet.addRow([entry.entryNo, entry.dogName, entry.regNo, entry.birthDate]);
          r1.getCell(1).alignment = { horizontal: 'center' };
          r1.getCell(1).font = { bold: true };
          r1.getCell(2).font = { bold: true, color: { argb: 'FF0000FF' } }; // 견명 파란색 (구분용)
          
          // Row 2: | Sire: Name (Reg) | Dam: Name (Reg) | 
          const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, `모: ${entry.damName} (${entry.damRegNo})`, '']);
          worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
          
          // Row 3: | Breeder: Name | Owner: Name | 
          const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, `Owner: ${entry.owner}`, '']);
          worksheet.mergeCells(`B${r3.number}:C${r3.number}`);

          // 스타일 및 테두리 (한 블록으로 묶기)
          [r1, r2, r3].forEach(row => {
            row.eachCell(cell => {
              cell.border = borderStyle;
              cell.alignment = { ...cell.alignment, vertical: 'middle' };
            });
          });

          // 구분용 빈 줄
          worksheet.addRow([]);
        });
      });
    });
  });

  // 4. 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title}_카탈로그.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
