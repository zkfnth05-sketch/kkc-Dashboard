
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

  // 1. 컬럼 너비 설정 (샘플 기준 정밀 조정)
  worksheet.columns = [
    { header: 'A', key: 'A', width: 10 },
    { header: 'B', key: 'B', width: 30 },
    { header: 'C', key: 'C', width: 20 },
    { header: 'D', key: 'D', width: 30 },
    { header: 'E', key: 'E', width: 25 },
  ];

  const borderStyle: Partial<ExcelJS.Border> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // 2. 최상단 타이틀 (샘플 Row 01 - 18pt, Bold, Center)
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  worksheet.mergeCells(`A${titleRow.number}:E${titleRow.number}`);
  titleRow.height = 26.25;
  titleRow.getCell(1).style = {
    font: { bold: true, size: 18 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // 3. 그룹별 데이터 반복
  groups.forEach(group => {
    // 그룹 헤더 (샘플 Row 02 - 16pt, Bold, Center, Light Blue Fill)
    const gRow = worksheet.addRow([`그룹: ${group.groupName}`]);
    worksheet.mergeCells(`A${gRow.number}:E${gRow.number}`);
    gRow.height = 26.25;
    gRow.getCell(1).style = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } }
    };

    group.breeds.forEach(breed => {
      // 견종 헤더 (샘플 Row 03 - 14pt, Bold, Center)
      const bRow = worksheet.addRow([breed.breedName]);
      worksheet.mergeCells(`A${bRow.number}:E${bRow.number}`);
      bRow.height = 20.25;
      bRow.getCell(1).style = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };

      breed.classes.forEach(cls => {
        // 조별 헤더 (샘플 Row 04 - 11pt, Bold)
        const cRow = worksheet.addRow([cls.className]);
        worksheet.mergeCells(`A${cRow.number}:E${cRow.number}`);
        cRow.getCell(1).style = {
          font: { bold: true, size: 11 },
          alignment: { horizontal: 'left', vertical: 'middle' }
        };

        // 헤더와 데이터 사이의 빈 줄
        worksheet.addRow([]);

        cls.entries.forEach(entry => {
          // Row 1: [번호(14pt)] | [견명(11pt, Bold, B~C)] | [등록번호(D)] | [생년월일(E)]
          const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', entry.regNo, entry.birthDate]);
          worksheet.mergeCells(`B${r1.number}:C${r1.number}`);
          r1.height = 20.25;
          
          r1.getCell(1).font = { size: 14 };
          r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
          r1.getCell(2).font = { bold: true, size: 11 }; 
          r1.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' }; // 등록번호
          r1.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }; // 생년월일
          r1.getCell(5).font = { size: 9 };

          // Row 2: (공백) | [부(B~C)] | [모(D~E)]
          const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
          worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
          worksheet.mergeCells(`D${r2.number}:E${r2.number}`);
          r2.getCell(2).font = { size: 11 };
          r2.getCell(4).font = { size: 11 };

          // Row 3: (공백) | [Breeder(B~C)] | [Owner(D~E)]
          const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', `Owner: ${entry.owner}`, '']);
          worksheet.mergeCells(`B${r3.number}:C${r3.number}`);
          worksheet.mergeCells(`D${r3.number}:E${r3.number}`);
          r3.getCell(2).font = { size: 11 };
          r3.getCell(4).font = { size: 11 };

          // 테두리 설정
          [r1, r2, r3].forEach(row => {
            for(let i=1; i<=5; i++) {
              row.getCell(i).border = borderStyle;
            }
          });

          // 데이터 사이의 빈 줄
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
