
import ExcelJS from 'exceljs';

export type CatalogType = 'default' | 'shepherd' | 'jindo';

export const exportDogShowCatalog = async (title: string, groups: CatalogGroup[], type: CatalogType = 'default') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Catalog');

  const isShepherd = type === 'shepherd';
  const isJindo = type === 'jindo';

  // 1. 컬럼 너비 설정
  if (isShepherd || type === 'default') {
    worksheet.columns = [
      { header: 'A', key: 'A', width: 6 },   // 번호
      { header: 'B', key: 'B', width: 35 },  // 견명 / Sire&Dam / Breeder
      { header: 'C', key: 'C', width: 20 },  // Owner (Shepherd) / Name (Default)
      { header: 'D', key: 'D', width: 25 },  // Microchip (Shepherd) / Name (Default)
      { header: 'E', key: 'E', width: 25 },  // RegNo (Default)
      { header: 'F', key: 'F', width: 18 },  // BirthDate
    ];
  } else {
    // 진도견은 5컬럼 유지
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

  const lastCol = (isShepherd || type === 'default') ? 'F' : 'E';

  // 2. 타이틀 (셰퍼드 제외 표시)
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
    // [그룹 헤더] 도그쇼일 때만 별도 행으로 표시 (연하늘 배경)
    if (type === 'default') {
      const gRow = worksheet.addRow([group.groupName]);
      worksheet.mergeCells(`A${gRow.number}:${lastCol}${gRow.number}`);
      gRow.height = 25;
      gRow.getCell(1).style = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } },
        border: { bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } } }
      };
    }

    group.breeds.forEach(breed => {
      // [견종 헤더] 도그쇼일 때만 별도 행으로 표시 (굵게, 중앙)
      if (type === 'default') {
        const bRow = worksheet.addRow([breed.breedName]);
        worksheet.mergeCells(`A${bRow.number}:${lastCol}${bRow.number}`);
        bRow.height = 22;
        bRow.getCell(1).style = {
          font: { bold: true, size: 13 },
          alignment: { horizontal: 'center', vertical: 'middle' }
        };
      }

      breed.classes.forEach(cls => {
        // [조별 헤더]
        if (isShepherd || isJindo) {
          const headerText = cls.className;
          const hRow = worksheet.addRow([headerText]);
          worksheet.mergeCells(`A${hRow.number}:${lastCol}${hRow.number}`);
          hRow.height = 24;
          hRow.getCell(1).style = {
            font: { bold: true, size: 14 },
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } },
            border: { bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } } }
          };
          worksheet.addRow([]); 
        } else if (type === 'default') {
          const cRow = worksheet.addRow([cls.className]);
          worksheet.mergeCells(`A${cRow.number}:${lastCol}${cRow.number}`);
          cRow.height = 20;
          cRow.getCell(1).style = {
            font: { bold: true, size: 11 },
            alignment: { horizontal: 'left', vertical: 'middle' }
          };
          // 조 헤더 아래는 여백 없이 바로 데이터 시작 (사진 스타일)
        }

        cls.entries.forEach((entry, idx) => {
          if (isShepherd) {
            // 셰퍼드 레이아웃 유지
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
            worksheet.addRow([]);
          } else if (type === 'default') {
            // 도그쇼용 6컬럼 (A:No, B-D:Name, E:RegNo, F:BirthDate)
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', '', entry.regNo, entry.birthDate]);
            worksheet.mergeCells(`B${r1.number}:D${r1.number}`);
            r1.height = 18;
            r1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
            r1.getCell(2).font = { bold: true, size: 11 };
            r1.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };
            r1.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

            const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
            worksheet.mergeCells(`B${r2.number}:D${r2.number}`);
            worksheet.mergeCells(`E${r2.number}:F${r2.number}`);
            r2.height = 16;
            r2.getCell(2).font = { size: 10.5, color: { argb: 'FF666666' } };
            r2.getCell(5).font = { size: 10.5, color: { argb: 'FF666666' } };

            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', '', `Owner: ${entry.owner}`, '']);
            worksheet.mergeCells(`B${r3.number}:D${r3.number}`);
            worksheet.mergeCells(`E${r3.number}:F${r3.number}`);
            r3.height = 16;
            r3.getCell(2).font = { size: 10.5 };
            r3.getCell(5).font = { size: 10.5 };

            // 상단 테두리로 데이터 구분 (사진 스타일)
            [r1.getCell(1), r1.getCell(2), r1.getCell(5), r1.getCell(6)].forEach(cell => {
              cell.border = { top: { style: 'thin', color: { argb: 'FFD3D3D3' } } };
            });
          } else {
            // 진도견 레이아웃 유지
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', entry.regNo, entry.birthDate]);
            worksheet.mergeCells(`B${r1.number}:C${r1.number}`);
            r1.height = 18;
            r1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
            r1.getCell(2).font = { bold: true, size: 11 };
            r1.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
            r1.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

            const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
            worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
            worksheet.mergeCells(`D${r2.number}:E${r2.number}`);
            r2.getCell(2).font = { size: 11, color: { argb: 'FF666666' } };
            r2.getCell(4).font = { size: 11, color: { argb: 'FF666666' } };

            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', `Owner: ${entry.owner}`, '']);
            worksheet.mergeCells(`B${r3.number}:C${r3.number}`);
            worksheet.mergeCells(`D${r3.number}:E${r3.number}`);
            r3.getCell(2).font = { size: 11 };
            r3.getCell(4).font = { size: 11 };

            [r1, r2, r3].forEach(row => {
              for(let i=1; i<=5; i++) row.getCell(i).border = { top: { style: 'thin', color: { argb: 'FFF5F5F5' } } };
            });
            worksheet.addRow([]);
          }
        });
        
        // 조(Class)가 끝난 후에만 빈 줄 추가 (사진 스타일)
        if (type === 'default') {
          worksheet.addRow([]);
        }
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
