import { Pedigree, ParentDogInfo, OwnerHistory, DongtaeInfo } from '../types';
import { DEFAULT_PEDIGREE_LAYOUTS } from '../config/pedigreeConfig';
import { PedigreePrintOptions } from './pedigreeShepherd';

const getColorAbbr = (color: string) => {
  if (!color) return '';
  const c = color.trim().toLowerCase();
  if (c.includes('wolf gray') || c.includes('wolf grey')) return 'wlf gr';
  if (c.includes('schwarz braun') || c.includes('black & brown') || c.includes('black brown') || c.includes('블랙브라운')) return 'sb';
  if (c.includes('black and tan') || c.includes('black tan') || c.includes('블랙탄')) return 'b&t';
  if (c.includes('black') || c.includes('검정') || c.includes('블랙') || c === 's') return 's';
  if (c.includes('white') || c.includes('백색') || c.includes('화이트') || c === 'w') return 'w';
  if (c.includes('gray') || c.includes('grey') || c.includes('회색')) return 'gr';
  if (c.includes('yellow') || c.includes('황색') || c.includes('옐로우')) return '황색';
  if (c.includes('red') || c.includes('적구') || c.includes('레드')) return '적구';
  if (c.includes('brindle') || c.includes('호구') || c.includes('호반')) return '호구';
  if (c.includes('light yellow') || c.includes('아이보리') || c.includes('크림')) return '크림';
  return color;
};

const formatDateHyphen = (dateStr: string) => {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '-') return '-';
  try {
    const clean = dateStr.trim().split(' ')[0];
    const parts = clean.split(/[-./]/);
    if (parts.length === 3) {
      const y = parts[0];
      const m = String(parseInt(parts[1], 10)).padStart(2, '0');
      const d = String(parseInt(parts[2], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (clean.length === 8 && /^\d+$/.test(clean)) {
      const y = clean.substring(0, 4);
      const m = clean.substring(4, 6);
      const d = clean.substring(6, 8);
      return `${y}-${m}-${d}`;
    }
  } catch (e) {}
  return dateStr;
};

const formatGender = (gender: string) => {
  if (!gender) return '-';
  const g = gender.toLowerCase().trim();
  if (g === 'm' || g === 'male' || gender === '수컷') return '수컷';
  if (g === 'f' || g === 'female' || gender === '암컷') return '암컷';
  return gender;
};

const getLitterValue = (options: PedigreePrintOptions, key: keyof DongtaeInfo) => {
  if (options.isLoadingLitter) return '...';
  const isTextField = ['memo', 'spec_relate', 'dongtae_no', 'regno_start', 'regno_end'].includes(key);
  if (!options.litterInfo) return isTextField ? '-' : '0';
  const val = options.litterInfo[key];
  if (val !== undefined && val !== null) {
      const strVal = String(val).trim();
      if (strVal === "" || strVal === "null") return isTextField ? '-' : '0';
      return strVal;
  }
  return isTextField ? '-' : '0';
};

export const getGeneralRealValue = (key: string, options: PedigreePrintOptions) => {
  const { pedigree, ownerHistory, jindoLitterList, okStartDate, okEndDate, ancestorTree } = options;

  const isValidDate = (d: any) => {
    if (!d) return false;
    const str = String(d).trim();
    return str !== '' && str !== '0000-00-00' && str !== '0' && str !== '-';
  };

  if (key === 'dog_name') {
    const name = (pedigree.name || '').trim();
    const kennelEng = (pedigree.kennelNameEng || '').trim();
    return kennelEng ? `${name} ${kennelEng}` : name;
  }
  if (key === 'dog_gender') {
    const gVal = formatGender(pedigree.gender);
    if (gVal === '수컷') return 'MALE 수컷';
    if (gVal === '암컷') return 'FEMALE 암컷';
    return gVal;
  }
  if (key === 'dog_coat') {
    return pedigree.coatType || '-';
  }
  if (key === 'dog_color') {
    const colorVal = pedigree.color || '-';
    const coatVal = (pedigree.coatType || '').trim();
    const parts: string[] = [];
    const cleanColor = colorVal.trim();
    if (cleanColor && cleanColor !== '-' && cleanColor !== '0') parts.push(cleanColor);
    if (coatVal && coatVal !== '-' && coatVal !== '0') parts.push(coatVal);
    return parts.join(' ') || '-';
  }
  if (key === 'dog_birth') {
    return formatDateHyphen(pedigree.birthDate);
  }
  if (key === 'dog_join') {
    return formatDateHyphen(pedigree.joinDate);
  }
  if (key === 'dog_owner_change') {
    const latest = ownerHistory[0];
    let dateVal = '';
    if (latest && isValidDate(latest.change_date)) {
      dateVal = latest.change_date;
    } else if (latest && isValidDate(latest.sign_date)) {
      dateVal = latest.sign_date;
    }
    
    if (!isValidDate(dateVal)) {
      return '';
    }

    return formatDateHyphen(dateVal);
  }
  if (key === 'dog_breeder') return pedigree.breeder || '-';
  if (key === 'dog_breeder_addr') return pedigree.breederAddr || '-';
  if (key === 'dog_owner') return pedigree.owner || '-';
  if (key === 'dog_owner_addr') return pedigree.ownerAddr || '-';
  if (key === 'reg_no') return pedigree.regNo || '-';
  if (key === 'dog_dna') return '';
  if (key === 'microchip') return '';
  if (key === 'foreign_no') return pedigree.foreignNo || '-';
  if (key === 'foreign_no2') return pedigree.foreignNo2 || '-';
  if (key === 'domestic_no') return pedigree.domesticNo || '-';
  if (key === 'dongtae_no' || key === 'dog_litter') return jindoLitterList || '-';
  if (key === 'dog_breed') return pedigree.breed || '-';
  if (key === 'index_no') return '';
  if (key === 'ok_date') {
    const parts = [pedigree.specWin, pedigree.specDna, pedigree.specBone, pedigree.specTrain].map(s => (s || '').trim()).filter(Boolean);
    if (parts.length > 0) return parts.join(' / ');
    return pedigree.okDate || (pedigree.okStat === 'Y' ? '기록 확인' : '-');
  }
  if (key === 'ok_term') {
    const start = formatDateHyphen(okStartDate) || '';
    const end = formatDateHyphen(okEndDate) || '';
    if (!start && !end) return '-';
    if (start && end) return `${start}~${end}`;
    if (start) return `${start}~`;
    return `~${end}`;
  }
  if (key === 'birth_litter') return `Male: ${getLitterValue(options, 'birth_M')} / Female: ${getLitterValue(options, 'birth_F')}`;
  if (key === 'dog_relate') {
    const val = pedigree.specRelate || '-';
    if (val !== '-') {
      return val.split('/').map(part => part.trim().replace(/\s+/g, ' ')).filter(Boolean).join('\n');
    }
    return val;
  }
  if (key === 'litter_birth_m') return getLitterValue(options, 'birth_M') || '0';
  if (key === 'litter_birth_f') return getLitterValue(options, 'birth_F') || '0';
  if (key === 'litter_dead_m') return getLitterValue(options, 'dead_M') || '0';
  if (key === 'litter_dead_f') return getLitterValue(options, 'dead_F') || '0';
  if (key === 'litter_cancel_m') return getLitterValue(options, 'cancel_M') || '0';
  if (key === 'litter_cancel_f') return getLitterValue(options, 'cancel_F') || '0';
  if (key === 'litter_dead2_m') return getLitterValue(options, 'dead2_M') || '0';
  if (key === 'litter_dead2_f') return getLitterValue(options, 'dead2_F') || '0';
  if (key === 'litter_missing_m') return getLitterValue(options, 'missing_M') || '0';
  if (key === 'litter_missing_f') return getLitterValue(options, 'missing_F') || '0';
  if (key === 'litter_bringup_m') return getLitterValue(options, 'bringup_M') || '0';
  if (key === 'litter_bringup_f') return getLitterValue(options, 'bringup_F') || '0';
  if (key === 'litter_reg_m') return getLitterValue(options, 'reg_count_M') || '0';
  if (key === 'litter_reg_f') return getLitterValue(options, 'reg_count_F') || '0';

  if (key === 'birth_count') {
    const bm = parseInt(getLitterValue(options, 'birth_M')) || 0;
    const bf = parseInt(getLitterValue(options, 'birth_F')) || 0;
    const total = bm + bf;
    return total > 0 ? total.toString() : '1';
  }
  if (key === 'dead_count') {
    const dm = parseInt(getLitterValue(options, 'dead_M')) || 0;
    const df = parseInt(getLitterValue(options, 'dead_F')) || 0;
    const d2m = parseInt(getLitterValue(options, 'dead2_M')) || 0;
    const d2f = parseInt(getLitterValue(options, 'dead2_F')) || 0;
    return (dm + df + d2m + d2f).toString();
  }
  if (key === 'reg_count') return `Male: ${getLitterValue(options, 'reg_count_M')} / Female: ${getLitterValue(options, 'reg_count_F')}`;
  if (key === 'issue_date') {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // Ancestors
  if (key.startsWith('ancestor_')) {
    const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|birth|foreign|slash1|slash2|slash3|slash4)$/);
    if (match) {
      const nodeId = parseInt(match[1]);
      const field = match[2];
      if (field.startsWith('slash')) return '/';

      const dog = ancestorTree[nodeId];
      if (!dog) return '';
      
      if (field === 'name') {
        let dogName = (dog.name || '').trim();
        let saho = (dog.saho_eng || '').trim();
        if (!saho) {
          saho = (dog.saho || '').trim();
        }
        if (!dogName && !saho && dog.fullname) {
          const parts = dog.fullname.trim().split(/\s+/);
          if (parts.length > 1) {
            dogName = parts[0];
            saho = parts.slice(1).join(' ');
          }
        }
        if (dogName && saho) {
          return `${dogName} ${saho}`;
        }
        return dog.fullname || dogName || saho || '';
      }

      if (field === 'reg') {
        if (nodeId >= 2 && nodeId <= 15) {
          const rVal = (dog.reg_no || '').trim();
          const dom = (dog.foreign100 || '').trim();
          const train = (dog.spec_train || '').trim();
          const micro = (dog.micro || (dog as any).microchip || '').trim();
          const parts: string[] = [];
          if (rVal && rVal !== '0' && rVal !== '-') parts.push(rVal);
          if (dom && dom !== '0' && dom !== '-') parts.push(dom);
          if (train && train !== '0' && train !== '-') parts.push(train);
          if (micro && micro !== '0' && micro !== '-') parts.push(micro);
          return parts.join(' ');
        }
        
        // nodeId >= 16
        const rVal = (dog.reg_no || '').trim();
        const dom = (dog.foreign100 || '').trim();
        let regVal = '';
        if (rVal && rVal !== '0' && rVal !== '-') {
          regVal = rVal;
          if (dom && dom !== '0' && dom !== '-') {
            regVal += ' ' + dom;
          }
        } else if (dom && dom !== '0' && dom !== '-') {
          regVal = dom;
        } else {
          const f1 = (dog.foreign_no || '').trim();
          const f2 = (dog.foreign_no2 || '').trim();
          regVal = (f1 && f2) ? `${f1} ${f2}` : (f1 || f2 || '');
        }
        return regVal;
      }

      if (field === 'extra') {
        const extraList = [
          dog.spec_win,
          dog.spec_dna,
          dog.spec_bone,
          dog.spec_train
        ].map(s => (s || '').toString().trim()).filter(Boolean);
        return extraList.join(' ');
      }

      if (field === 'win') return dog.spec_win || '';
      if (field === 'train') return dog.spec_train || '';
      if (field === 'dna') return dog.spec_dna || '';
      if (field === 'bone') return dog.spec_bone || '';
      if (field === 'color') return getColorAbbr(dog.hair || '') || '';
      if (field === 'micro') return dog.micro || (dog as any).microchip || '';
      if (field === 'birth') return formatDateHyphen(dog.birth || '') || '';
      if (field === 'foreign') {
        const f1 = (dog.foreign_no || '').trim();
        const f2 = (dog.foreign_no2 || '').trim();
        return (f1 && f2) ? `${f1} ${f2}` : (f1 || f2 || '');
      }
    }
  }
  return '';
};

export const getGeneralSampleValue = (key: string) => {
  const generalData: Record<string, string> = {
    dog_name: 'A-ISAM OF DOG MASTER',
    reg_no: 'BM-C50074',
    dog_breed: 'Belgian Malinois',
    dog_gender: 'MALE 수컷',
    dog_birth: '2025-01-19',
    dog_color: 'FN BLK MSK',
    microchip: '',
    index_no: '',
    dog_dna: '',
    dog_litter: 'BM-C50071~BM-C50079',
    dog_breeder: 'Lee Tae Won',
    dog_breeder_addr: '대전 유성구 학하동 114-14',
    dog_owner: 'Lee Tae Won',
    dog_owner_addr: '대전 유성구 학하동 114-14',
    dog_join: '2025-03-14',
    dog_owner_change: '2025-03-14',
    issue_date: '2025-03-14',
    foreign_no: 'SZ-2385565',
    foreign_no2: 'SZ-2385565-2',
    domestic_no: 'KKC-D12345',
    ok_term: '-',
    dog_relate: '-',
    litter_birth_m: '0',
    litter_birth_f: '0',
    litter_dead_m: '0',
    litter_dead_f: '0',
    litter_cancel_m: '0',
    litter_cancel_f: '0',
    litter_dead2_m: '0',
    litter_dead2_f: '0',
    litter_missing_m: '0',
    litter_missing_f: '0',
    litter_bringup_m: '0',
    litter_bringup_f: '0',
    litter_reg_m: '0',
    litter_reg_f: '0',
    birth_litter: 'Male: 0 / Female: 0',
    birth_count: '0',
    dead_count: '0',
    reg_count: 'Male: 0 / Female: 0'
  };

  if (key in generalData) {
    return generalData[key];
  }

  if (key.startsWith('ancestor_')) {
    const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|birth|foreign|slash1|slash2|slash3|slash4)$/);
    if (match) {
      const node = parseInt(match[1]);
      const field = match[2];
      if (field.startsWith('slash')) return '/';

      const ancestors: Record<number, { name: string; reg: string; extra: string }> = {
        2: { name: 'IKE OF DOGMASTER', reg: 'BM-B70073 BGS-14-0001374-ROK', extra: 'BR BLK MSK' },
        3: { name: 'SUZY OF CHANEE HOUSE', reg: 'BM-C10083', extra: 'FN, BLK MSK' },
        4: { name: 'BILL OF MONAMI LAND FCI', reg: 'BM-B00211 BGS-08-0001038-ROK', extra: 'FN&BLK MSK' },
        5: { name: 'EASY VOM HORNBACHTAL', reg: 'BM-B00208 BGS-09-0001165-ROK', extra: 'grdgew' },
        6: { name: 'ELDO OF CHANEE HOUSE', reg: 'BM-C10075', extra: 'FN BLK MSK' },
        7: { name: 'MOLLY OF CHANEE HOUSE', reg: 'BM-B50226', extra: 'FN&BLK MSK' },
        8: { name: 'EGOR VOM TEUFELHUND', reg: 'BGS-06-0000872-ROK', extra: 'FN BLK' },
        9: { name: 'ELLIE OT VITOSHA', reg: 'BGS-07-0000883-ROK', extra: 'FN&BLK MSK' },
        10: { name: 'BUTSCH VON DER BOESEN NACHBARSCHAFT', reg: '', extra: 'FN BLK MSK' },
        11: { name: 'UNIC VON DER SCHOENEN ECKE(M)', reg: '', extra: 'grdgew' },
        12: { name: 'CLARA OF JONGHO HOUSE', reg: 'BM-B30262', extra: 'SBL BLK MSK' },
        13: { name: 'DASAN BILL OF JJS MALINOIS FCI', reg: 'BM-C10074 BGS-15-0004107-ROK', extra: 'FN BLK MSK' },
        14: { name: 'DOBI OF ILWOL NONGJANG', reg: 'BM-B30266', extra: 'FN' },
        15: { name: 'T2-SAEND OF TITI HOUSE', reg: 'BM-B20117', extra: 'FN' }
      };

      const dog = ancestors[node];
      if (dog) {
        if (field === 'name') return dog.name;
        if (field === 'reg') return dog.reg || '-';
        if (field === 'color') return dog.extra || '';
        if (field === 'extra') return node === 2 ? 'BH IGP1' : node === 3 ? 'BH' : '';
        if (field === 'birth') return '2021-06-15';
        if (field === 'foreign') return 'AKC-1234567';
      }
      return '';
    }
  }
  return '';
};

export const generateGeneralPrintHtml = (options: PedigreePrintOptions): string => {
  const type = 'general';
  const layout = DEFAULT_PEDIGREE_LAYOUTS[type];
  const finalCoords = { ...layout.fields };
  const saved = localStorage.getItem(`pedigree_coords_${type}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(k => {
        if (finalCoords[k]) {
          const savedItem = parsed[k];
          if (savedItem && typeof savedItem.left === 'number' && savedItem.left > 0 && typeof savedItem.top === 'number' && savedItem.top > 0) {
            finalCoords[k] = { ...finalCoords[k], ...savedItem };
          }
        }
      });
    } catch (e) {}
  }

  let fieldsHtml = '';
  Object.keys(finalCoords).forEach(key => {
    const matchReg = key.match(/^ancestor_(\d+)_reg$/);
    if (matchReg) {
      const nodeId = parseInt(matchReg[1]);
      if (nodeId >= 16 && nodeId <= 31) return;
    }
    const coord = finalCoords[key];
    let val = options.useSample ? getGeneralSampleValue(key) : getGeneralRealValue(key, options);
    if (val === undefined || val === null) val = '';

    const isBold = (key === 'dog_name' ? false : (key === 'reg_no' || key.endsWith('_name')));
    const fontStyle = (isBold ? 'font-weight: bold;' : '') + (key === 'dog_name' ? " font-family: 'Times New Roman', Georgia, serif; text-align: center; font-weight: 300; letter-spacing: -0.03em; transform: scaleX(0.85); transform-origin: center; display: inline-block;" : '');
    const isAncestor = key.startsWith('ancestor_');
    const isWrap = key === 'dog_relate' || key === 'dongtae_no' || key === 'dog_litter';
    const wrapStyle = isWrap ? 'white-space: pre-line; word-break: break-all;' : '';
    
    let widthStyle = '';
    const matchAncestor = key.match(/^ancestor_(\d+)_/);
    if (matchAncestor) {
      const nodeId = parseInt(matchAncestor[1], 10);
      if (nodeId >= 2 && nodeId <= 15) {
        const w = coord.width || 70;
        widthStyle = `width: ${w}mm; white-space: nowrap;`;
      }
    } else {
      const coordWidth = coord.width || (key === 'dog_name' ? 120 : undefined);
      if (coordWidth && key !== 'dog_color') {
        widthStyle = `width: ${coordWidth}mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
      }
    }

    const formattedVal = typeof val === 'string' ? (isWrap ? val.replace(/\n/g, '<br />') : val.replace(/\n/g, ' ')) : val;

    fieldsHtml += `
      <div class="field" 
           style="left: ${coord.left - 210}mm; top: ${coord.top}mm; font-size: ${coord.fontSize || 0.95}em; ${fontStyle} ${widthStyle} ${wrapStyle}">
        ${formattedVal}
      </div>
    `;
  });

  const pageWidth = `${layout.pageWidth}mm`;
  const pageHeight = `${layout.pageHeight}mm`;
  const pageSize = layout.pageSize;

  const savedTop = localStorage.getItem(`pedigree_offset_${type}_top`) || '0';
  const savedLeft = localStorage.getItem(`pedigree_offset_${type}_left`) || '0';
  const savedScale = localStorage.getItem(`pedigree_offset_${type}_scale`) || '100';
  const savedBold = localStorage.getItem(`pedigree_offset_${type}_bold`) !== 'false';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${layout.title}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      background-color: transparent;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Dotum', sans-serif;
      -webkit-print-color-adjust: exact;
    }
    .print-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 210mm;
      height: 297mm;
      transform: translate(${savedLeft}mm, ${savedTop}mm);
      font-size: calc(9pt * (${savedScale} / 100));
      font-weight: ${savedBold ? 'bold' : 'normal'};
      color: black;
      line-height: 1.15;
    }
    .field {
      position: absolute;
      white-space: nowrap;
      box-sizing: border-box;
    }
    @media print {
      body {
        background-color: transparent;
      }
    }
  </style>
</head>
<body>
  <div class="print-content">
    ${fieldsHtml}
  </div>
</body>
</html>
  `;
};
