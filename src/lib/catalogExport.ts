
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

  // 1. 컬럼 너비 설정 (사진 2 기준 정밀 조정)
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
    worksheet.columns = [
      { header: 'A', key: 'A', width: 10 },
      { header: 'B', key: 'B', width: 30 },
      { header: 'C', key: 'C', width: 20 },
      { header: 'D', key: 'D', width: 30 },
      { header: 'E', key: 'E', width: 25 },
    ];
  }

  const borderStyle: Partial<ExcelJS.Border> = {
    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
  };

  const lastCol = isShepherd ? 'F' : 'E';

  // 2. 타이틀 (셰퍼드는 바로 조별 헤더가 나오게 하기 위해 건너뜀)
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
        // 셰퍼드 전용 헤더 (사진 2: 연하늘색, 14pt 굵게, 중앙)
        const headerText = isShepherd ? cls.className : `${group.groupName} - ${breed.breedName} (${cls.className})`;
        const hRow = worksheet.addRow([headerText]);
        worksheet.mergeCells(`A${hRow.number}:${lastCol}${hRow.number}`);
        hRow.height = 24;
        hRow.getCell(1).style = {
          font: { bold: true, size: 14 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } },
          border: { bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } } }
        };

        worksheet.addRow([]); // 헤더 아래 여백

        cls.entries.forEach(entry => {
          if (isShepherd) {
            // [1행] 번호(A), 견명(B, 굵게), 등록번호(C), 생년월일(F)
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, entry.regNo, '', '', entry.birthDate]);
            r1.height = 18;
            r1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
            r1.getCell(1).font = { size: 10 };
            r1.getCell(2).font = { bold: true, size: 11 };
            r1.getCell(3).font = { size: 11 };
            r1.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
            r1.getCell(6).font = { size: 10 };

            // [2행] 부모 정보 (B열 시작, 10pt, 연한색)
            const parentInfo = `(${entry.sireName},${entry.sireRegNo}, ${entry.damName},${entry.damRegNo})`;
            const r2 = worksheet.addRow(['', parentInfo]);
            r2.height = 16;
            worksheet.mergeCells(`B${r2.number}:F${r2.number}`);
            r2.getCell(2).font = { size: 10, color: { argb: 'FF666666' } };

            // [3행] Breeder(B), Owner(C), 마이크로칩(D)
            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, `Owner: ${entry.owner}`, entry.microchip || '']);
            r3.height = 16;
            r3.getCell(2).font = { size: 10 };
            r3.getCell(3).font = { size: 10 };
            r3.getCell(4).font = { size: 10 };

            // 상단 테두리만 살짝 넣어서 데이터 묶음 구분 (사진 스타일)
            r1.getCell(1).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
            r1.getCell(2).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
            r1.getCell(3).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
            r1.getCell(6).border = { top: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
          } else {
            // 도그쇼용 기존 로직 (상세 생략, 보존)
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', entry.regNo, entry.birthDate]);
            worksheet.mergeCells(`B${r1.number}:C${r1.number}`);
            r1.getCell(2).font = { bold: true, size: 11 }; 
            const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
            worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
            worksheet.mergeCells(`D${r2.number}:E${r2.number}`);
            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', `Owner: ${entry.owner}`, '']);
            worksheet.mergeCells(`B${r3.number}:C${r3.number}`);
            worksheet.mergeCells(`D${r3.number}:E${r3.number}`);
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
