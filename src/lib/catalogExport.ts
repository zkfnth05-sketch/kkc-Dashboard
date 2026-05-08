
import ExcelJS from 'exceljs';

export type CatalogType = 'default' | 'shepherd' | 'jindo';

export const exportDogShowCatalog = async (title: string, groups: CatalogGroup[], type: CatalogType = 'default') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Catalog');

  const isShepherd = type === 'shepherd';
  const isJindo = type === 'jindo';

  // 1. 컬럼 너비 설정
  if (isShepherd) {
    worksheet.columns = [
      { header: 'A', key: 'A', width: 6 },   // 번호
      { header: 'B', key: 'B', width: 45 },  // 견명 / Sire&Dam / Breeder
      { header: 'C', key: 'C', width: 25 },  // 등록번호 / Owner
      { header: 'D', key: 'D', width: 30 },  // 마이크로칩
      { header: 'E', key: 'E', width: 10 }, 
      { header: 'F', key: 'F', width: 18 },  // 생년월일
    ];
  } else {
    // 도그쇼 & 진도견은 5컬럼
    worksheet.columns = [
      { header: 'A', key: 'A', width: 8 },
      { header: 'B', key: 'B', width: 35 },
      { header: 'C', key: 'C', width: 15 },
      { header: 'D', key: 'D', width: 25 },
      { header: 'E', key: 'E', width: 20 },
    ];
  }

  const borderStyle: Partial<ExcelJS.Border> = {
    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
  };

  const lastCol = isShepherd ? 'F' : 'E';

  // 2. 타이틀 (도그쇼 & 진도견 표시)
  if (!isShepherd) {
    const titleRow = worksheet.addRow([title.toUpperCase()]);
    worksheet.mergeCells(`A${titleRow.number}:${lastCol}${titleRow.number}`);
    titleRow.height = 30;
    titleRow.getCell(1).style = {
      font: { bold: true, size: 18 },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
  }

  // 3. 데이터 반복
  groups.forEach(group => {
    group.breeds.forEach(breed => {
      breed.classes.forEach(cls => {
        // 셰퍼드 & 진도견은 연하늘색 헤더 사용
        const headerText = (isShepherd || isJindo) ? cls.className : `${group.groupName} - ${breed.breedName} (${cls.className})`;
        const hRow = worksheet.addRow([headerText]);
        worksheet.mergeCells(`A${hRow.number}:${lastCol}${hRow.number}`);
        hRow.height = 24;
        hRow.getCell(1).style = {
          font: { bold: true, size: 14 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          fill: (isShepherd || isJindo) ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } } : undefined,
          border: { bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } } }
        };

        worksheet.addRow([]); // 헤더 아래 여백

        cls.entries.forEach(entry => {
          if (isShepherd) {
            // 셰퍼드 전용 6컬럼 3줄 레이아웃 (기존 유지)
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, entry.regNo, '', '', entry.birthDate]);
            r1.height = 18;
            r1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
            r1.getCell(2).font = { bold: true, size: 11 };
            r1.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

            const parentInfo = `(${entry.sireName},${entry.sireRegNo}, ${entry.damName},${entry.damRegNo})`;
            const r2 = worksheet.addRow(['', parentInfo]);
            worksheet.mergeCells(`B${r2.number}:F${r2.number}`);
            r2.getCell(2).font = { size: 11, color: { argb: 'FF666666' } };

            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, `Owner: ${entry.owner}`, entry.microchip || '']);
            r3.getCell(2).font = { size: 11 };
            r3.getCell(3).font = { size: 11 };
            r3.getCell(4).font = { size: 11 };

            r1.getCell(1).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
            r1.getCell(2).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
            r1.getCell(3).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
            r1.getCell(6).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
          } else {
            // 도그쇼 & 진도견용 5컬럼 3줄 레이아웃
            // [1행] 번호(A), 견명(B+C 병합), 등록번호(D), 생년월일(E)
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', entry.regNo, entry.birthDate]);
            worksheet.mergeCells(`B${r1.number}:C${r1.number}`);
            r1.height = 18;
            r1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
            r1.getCell(2).font = { bold: true, size: 11 };
            r1.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
            r1.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

            // [2행] 부/모 정보
            const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
            worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
            worksheet.mergeCells(`D${r2.number}:E${r2.number}`);
            r2.getCell(2).font = { size: 11, color: { argb: 'FF666666' } };
            r2.getCell(4).font = { size: 11, color: { argb: 'FF666666' } };

            // [3행] Breeder/Owner
            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', `Owner: ${entry.owner}`, '']);
            worksheet.mergeCells(`B${r3.number}:C${r3.number}`);
            worksheet.mergeCells(`D${r3.number}:E${r3.number}`);
            r3.getCell(2).font = { size: 11 };
            r3.getCell(4).font = { size: 11 };

            // 진도견은 사진처럼 아주 옅은 구분선 추가
            if (isJindo) {
              [r1, r2, r3].forEach(row => {
                for(let i=1; i<=5; i++) row.getCell(i).border = { top: { style: 'thin', color: { argb: 'FFF5F5F5' } } };
              });
            }
          }
          worksheet.addRow([]); // 데이터 간 여백
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
