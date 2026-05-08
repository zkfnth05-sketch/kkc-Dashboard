
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

  // 1. 컬럼 너비 설정 (셰퍼드는 6컬럼, 도그쇼는 5컬럼)
  if (isShepherd) {
    worksheet.columns = [
      { header: 'A', key: 'A', width: 10 },
      { header: 'B', key: 'B', width: 35 },
      { header: 'C', key: 'C', width: 20 },
      { header: 'D', key: 'D', width: 25 },
      { header: 'E', key: 'E', width: 15 },
      { header: 'F', key: 'F', width: 15 },
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
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  const lastCol = isShepherd ? 'F' : 'E';
  const lastColIdx = isShepherd ? 6 : 5;

  // 2. 최상단 타이틀
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  worksheet.mergeCells(`A${titleRow.number}:${lastCol}${titleRow.number}`);
  titleRow.height = 26.25;
  titleRow.getCell(1).style = {
    font: { bold: true, size: 18 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // 3. 그룹별 데이터 반복
  groups.forEach(group => {
    // 셰퍼드는 '그룹:' 문구 없이 바로 조 명칭이 나올 수 있으므로 체크
    const groupHeaderText = isShepherd ? group.groupName : `그룹: ${group.groupName}`;
    const gRow = worksheet.addRow([groupHeaderText]);
    worksheet.mergeCells(`A${gRow.number}:${lastCol}${gRow.number}`);
    gRow.height = isShepherd ? 22 : 26.25;
    gRow.getCell(1).style = {
      font: { bold: true, size: isShepherd ? 14 : 16 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } }
    };

    group.breeds.forEach(breed => {
      // 셰퍼드는 견종 헤더를 건너뛰거나 작게 표시할 수 있음 (도그쇼용 유지)
      if (!isShepherd) {
        const bRow = worksheet.addRow([breed.breedName]);
        worksheet.mergeCells(`A${bRow.number}:${lastCol}${bRow.number}`);
        bRow.height = 20.25;
        bRow.getCell(1).style = {
          font: { bold: true, size: 14 },
          alignment: { horizontal: 'center', vertical: 'middle' }
        };
      }

      breed.classes.forEach(cls => {
        // 도그쇼용 조별 헤더 (셰퍼드는 이미 gRow에서 처리됨)
        if (!isShepherd) {
          const cRow = worksheet.addRow([cls.className]);
          worksheet.mergeCells(`A${cRow.number}:${lastCol}${cRow.number}`);
          cRow.getCell(1).style = {
            font: { bold: true, size: 11 },
            alignment: { horizontal: 'left', vertical: 'middle' }
          };
        }

        // 헤더와 데이터 사이의 빈 줄
        worksheet.addRow([]);

        cls.entries.forEach(entry => {
          if (isShepherd) {
            // 셰퍼드 Row 1: [번호] | [견명(굵게)] | [등록번호] | (공백) | (공백) | [생년월일(F)]
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, entry.regNo, '', '', entry.birthDate]);
            r1.getCell(2).font = { bold: true, size: 11 };
            r1.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

            // 셰퍼드 Row 2: (공백) | [부/모 정보] (B열에 통합)
            const r2 = worksheet.addRow(['', `(${entry.sireName},${entry.sireRegNo}, ${entry.damName},${entry.damRegNo})`]);
            worksheet.mergeCells(`B${r2.number}:F${r2.number}`);
            r2.getCell(2).font = { size: 10 };

            // 셰퍼드 Row 3: (공백) | [Breeder] | [Owner] | [Microchip(D)]
            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, `Owner: ${entry.owner}`, entry.microchip || '-']);
            r3.getCell(2).font = { size: 10 };
            r3.getCell(3).font = { size: 10 };
            r3.getCell(4).font = { size: 10 };

            [r1, r2, r3].forEach(row => {
              for(let i=1; i<=6; i++) row.getCell(i).border = borderStyle;
            });
          } else {
            // 도그쇼 Row 1: [번호] | [견명] | [등록번호(D)] | [생년월일(E)]
            const r1 = worksheet.addRow([entry.entryNo, entry.dogName, '', entry.regNo, entry.birthDate]);
            worksheet.mergeCells(`B${r1.number}:C${r1.number}`);
            r1.getCell(2).font = { bold: true, size: 11 }; 
            r1.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
            r1.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
            r1.getCell(5).font = { size: 9 };

            // 도그쇼 Row 2: 부/모
            const r2 = worksheet.addRow(['', `부: ${entry.sireName} (${entry.sireRegNo})`, '', `모: ${entry.damName} (${entry.damRegNo})`, '']);
            worksheet.mergeCells(`B${r2.number}:C${r2.number}`);
            worksheet.mergeCells(`D${r2.number}:E${r2.number}`);

            // 도그쇼 Row 3: Breeder/Owner
            const r3 = worksheet.addRow(['', `Breeder: ${entry.breeder}`, '', `Owner: ${entry.owner}`, '']);
            worksheet.mergeCells(`B${r3.number}:C${r3.number}`);
            worksheet.mergeCells(`D${r3.number}:E${r3.number}`);

            [r1, r2, r3].forEach(row => {
              for(let i=1; i<=5; i++) row.getCell(i).border = borderStyle;
            });
          }

          worksheet.addRow([]); // 데이터 사이 빈 줄
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
