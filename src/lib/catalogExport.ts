
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
  microchip?: string;
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

export const exportDogShowCatalog = async (title: string, groups: CatalogGroup[], isShepherd: boolean = false) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Catalog');

  // 1. 컬럼 너비 설정 (사진 기준 정밀 조정)
  if (isShepherd) {
    worksheet.columns = [
      { header: 'A', key: 'A', width: 8 },  // 번호
      { header: 'B', key: 'B', width: 35 }, // 견명 / Sire&Dam / Breeder
      { header: 'C', key: 'C', width: 25 }, // 등록번호 / Owner
      { header: 'D', key: 'D', width: 25 }, // 마이크로칩
      { header: 'E', key: 'E', width: 15 }, 
      { header: 'F', key: 'F', width: 20 }, // 생년월일
    ];
  } else {
    worksheet.columns = [
      { header: 'A', key: 'A', width: 10 },
      { header: 'B', key: 'B', width: 30 },
      { header: 'C', key: 'C', width: 20 },
      { header: 'D', key: 'D', width: 30 },
      { header: 'E', key: 'E', width: 25 },
    ];
  }

  const borderStyle: Partial<ExcelJS.Border> = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };

  const lastCol = isShepherd ? 'F' : 'E';

  // 2. 최상단 타이틀 (도그쇼만 표시, 셰퍼드는 바로 조별 시작)
  if (!isShepherd) {
    const titleRow = worksheet.addRow([title.toUpperCase()]);
    worksheet.mergeCells(`A${titleRow.number}:${lastCol}${titleRow.number}`);
    titleRow.height = 26.25;
    titleRow.getCell(1).style = {
      font: { bold: true, size: 18 },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
  }

  // 3. 데이터 반복
  groups.forEach(group => {
    group.breeds.forEach(breed => {
      breed.classes.forEach(cls => {
        // 셰퍼드 전용 헤더 (사진 2의 '유견 C 암조')
        const headerText = isShepherd ? cls.className : `그룹: ${group.groupName} - ${breed.breedName} (${cls.className})`;
        const hRow = worksheet.addRow([headerText]);
        worksheet.mergeCells(`A${hRow.number}:${lastCol}${hRow.number}`);
        hRow.height = 22;
        hRow.getCell(1).style = {
          font: { bold: true, size: 12 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } }
        };

        worksheet.addRow([]); // 헤더 아래 공백

        cls.entries.forEach(entry => {
          if (isShepherd) {
            // Row 1: [번호] | [견명] | [등록번호] | | | [생년월일]
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, entry.regNo, '', '', entry.birthDate]);
            r1.getCell(1).alignment = { horizontal: 'right' };
            r1.getCell(2).font = { bold: true };
            r1.getCell(6).alignment = { horizontal: 'center' };

            // Row 2: (공백) | (부이름, 부번호, 모이름, 모번호)
            const parentInfo = `(${entry.sireName},${entry.sireRegNo}, ${entry.damName},${entry.damRegNo})`;
            const r2 = worksheet.addRow(['', parentInfo]);
            worksheet.mergeCells(`B${r2.number}:F${r2.number}`);
            r2.getCell(2).font = { size: 10, color: { argb: 'FF404040' } };

            // Row 3: (공백) | Breeder: ... | Owner: ... | [Microchip]
            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, `Owner: ${entry.owner}`, entry.microchip || '']);
            r3.getCell(2).font = { size: 10 };
            r3.getCell(3).font = { size: 10 };
            r3.getCell(4).font = { size: 10 };

            // 셰퍼드는 테두리를 최소화 (데이터 구분용)
            [r1, r2, r3].forEach(row => {
              row.getCell(2).border = { left: { style: 'thin', color: { argb: 'FFD9D9D9' } } };
            });
          } else {
            // 기존 도그쇼 스타일 유지
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', entry.regNo, entry.birthDate]);
            worksheet.mergeCells(`B${r1.number}:C${r1.number}`);
            r1.getCell(2).font = { bold: true, size: 11 };
            r1.getCell(4).alignment = { horizontal: 'left' };
            r1.getCell(5).alignment = { horizontal: 'center' };

            const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
            worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
            worksheet.mergeCells(`D${r2.number}:E${r2.number}`);

            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', `Owner: ${entry.owner}`, '']);
            worksheet.mergeCells(`B${r3.number}:C${r3.number}`);
            worksheet.mergeCells(`D${r3.number}:E${r3.number}`);

            [r1, r2, r3].forEach(row => {
              for(let i=1; i<=5; i++) row.getCell(i).border = borderStyle;
            });
          }
          worksheet.addRow([]); // 데이터 간 공백
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
