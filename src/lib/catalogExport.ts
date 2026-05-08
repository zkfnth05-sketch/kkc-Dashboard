
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

  // 1. 컬럼 너비 설정 (샘플 파일 기준 최적화)
  worksheet.columns = [
    { header: 'A', key: 'A', width: 8 },
    { header: 'B', key: 'B', width: 20 },
    { header: 'C', key: 'C', width: 25 },
    { header: 'D', key: 'D', width: 20 },
    { header: 'E', key: 'E', width: 25 },
  ];

  // 스타일 정의
  const breedStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 12 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } }
  };

  const classStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 11 },
    alignment: { horizontal: 'left', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
  };

  const borderStyle: Partial<ExcelJS.Border> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // 2. 메인 타이틀 (상단 여백 포함)
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  worksheet.mergeCells(`A${titleRow.number}:E${titleRow.number}`);
  titleRow.height = 40;
  titleRow.getCell(1).style = {
    font: { bold: true, size: 16 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  worksheet.addRow([]); // 빈 줄

  // 3. 데이터 반복문
  groups.forEach(group => {
    group.breeds.forEach(breed => {
      // 견종 헤더 (샘플의 Row 26 형태)
      const bRow = worksheet.addRow([breed.breedName, breed.breedName, breed.breedName, breed.breedName, breed.breedName]);
      worksheet.mergeCells(`A${bRow.number}:E${bRow.number}`);
      bRow.getCell(1).style = breedStyle;
      bRow.height = 25;

      breed.classes.forEach(cls => {
        // 조별 헤더 (샘플의 Row 27 형태)
        const cRow = worksheet.addRow([cls.className]);
        worksheet.mergeCells(`A${cRow.number}:E${cRow.number}`);
        cRow.getCell(1).style = classStyle;
        cRow.height = 22;

        cls.entries.forEach(entry => {
          // Row 1: [번호(A)] | [견명(B~D)] | [등록번호(E)]
          const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', '', entry.regNo]);
          worksheet.mergeCells(`B${r1.number}:D${r1.number}`);
          
          r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
          r1.getCell(1).font = { bold: true };
          r1.getCell(2).font = { bold: true }; // 견명 볼드
          r1.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

          // Row 2: (공백) | [부(B~C)] | [모(D~E)]
          const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
          worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
          worksheet.mergeCells(`D${r2.number}:E${r2.number}`);
          r2.getCell(2).font = { size: 9 };
          r2.getCell(4).font = { size: 9 };

          // Row 3: (공백) | [Breeder(B~C)] | [Owner(D~E)]
          const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', `Owner: ${entry.owner}`, '']);
          worksheet.mergeCells(`B${r3.number}:C${r3.number}`);
          worksheet.mergeCells(`D${r3.number}:E${r3.number}`);
          r3.getCell(2).font = { size: 9 };
          r3.getCell(4).font = { size: 9 };

          // 전체 블록 테두리 설정 (샘플과 동일하게 각 행에 적용)
          [r1, r2, r3].forEach(row => {
            for(let i=1; i<=5; i++) {
              row.getCell(i).border = borderStyle;
            }
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
