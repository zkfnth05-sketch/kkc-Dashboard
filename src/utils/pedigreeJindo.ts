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

export const getJindoRealValue = (key: string, options: PedigreePrintOptions) => {
  const { pedigree, ownerHistory, jindoLitterList, okStartDate, okEndDate, ancestorTree } = options;

  const isValidDate = (d: any) => {
    if (!d) return false;
    const str = String(d).trim();
    return str !== '' && str !== '0000-00-00' && str !== '0' && str !== '-';
  };

  if (key === 'dog_name') {
    const namePart = (pedigree.name || '').trim();
    const sahoPart = (pedigree.kennel || pedigree.kennelNameEng || '').trim();
    if (namePart && sahoPart) {
      return `${namePart} ${sahoPart}`;
    }
    return pedigree.fullName || pedigree.name || '-';
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
    return pedigree.color || '-';
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
  if (key === 'dog_dna') return pedigree.specDna || '-';
  if (key === 'microchip') {
    const micro = (pedigree.microchip || (pedigree as any).micro || '').trim();
    const index = (pedigree.indexNo || '').trim();
    const parts: string[] = [];
    if (micro && micro !== '0' && micro !== '-') parts.push(micro);
    if (index && index !== '0' && index !== '-') parts.push(index);
    return parts.join(' / ') || '-';
  }
  if (key === 'foreign_no') return (pedigree.foreignNo && pedigree.foreignNo !== '-') ? pedigree.foreignNo : '';
  if (key === 'foreign_no2') return (pedigree.foreignNo2 && pedigree.foreignNo2 !== '-') ? pedigree.foreignNo2 : '';
  if (key === 'domestic_no') return (pedigree.domesticNo && pedigree.domesticNo !== '-') ? pedigree.domesticNo : '';
  if (key === 'other_org' || key === 'other_org_no') return ((pedigree as any).otherOrgNo || (pedigree as any).other_org || (pedigree as any).other_org_no || '');
  if (key === 'dongtae_no' || key === 'dog_litter') return jindoLitterList || '-';
  if (key === 'dog_breed') return pedigree.breed || '-';
  if (key === 'index_no') return pedigree.indexNo || '-';
  if (key === 'ok_date') {
    const parts = [pedigree.specWin, pedigree.specDna, pedigree.specBone, pedigree.specTrain].map(s => (s || '').trim()).filter(Boolean);
    if (parts.length > 0) return parts.join(' / ');
    return pedigree.okDate || (pedigree.okStat === 'Y' ? '기록 확인' : '-');
  }
  if (key === 'ok_term') {
    const start = formatDateHyphen(okStartDate) || '';
    const end = formatDateHyphen(okEndDate) || '';
    if (!start && !end) return '종견인정검사 기간 -';
    if (start && end) return `종견인정검사 기간 ${start}~${end}`;
    if (start) return `종견인정검사 기간 ${start}`;
    if (end) return `종견인정검사 기간 ${end}`;
    return '종견인정검사 기간 -';
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
    const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|birth|foreign|litter|slash1|slash2|slash3|slash4)$/);
    if (match) {
      const nodeId = parseInt(match[1]);
      const field = match[2];
      if (field.startsWith('slash')) return '/';

      const dog = ancestorTree[nodeId];
      if (!dog) return '';
      
      if (field === 'litter') {
        if (nodeId === 2 || nodeId === 3) {
          return nodeId === 2 ? (options.sireLitterRange || '') : (options.damLitterRange || '');
        }
        return '';
      }
      
      if (field === 'name') {
        let dogName = (dog.name || '').trim();
        let saho = (dog.saho || dog.saho_eng || '').trim();
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
        return getColorAbbr(dog.hair || '') || '';
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

export const getJindoSampleValue = (key: string) => {
  if (key === 'dog_name') return '보미';
  if (key === 'ok_term') return '종견인정검사 기간 2025-06-01~2027-06-01';
  if (key === 'dog_relate') return '백호(3-3)\n천룡(4-4)';
  if (key === 'litter_birth_m') return '3';
  if (key === 'litter_birth_f') return '2';
  if (key === 'litter_dead_m') return '0';
  if (key === 'litter_dead_f') return '0';
  if (key === 'litter_cancel_m') return '0';
  if (key === 'litter_cancel_f') return '0';
  if (key === 'litter_dead2_m') return '0';
  if (key === 'litter_dead2_f') return '0';
  if (key === 'litter_missing_m') return '0';
  if (key === 'litter_missing_f') return '0';
  if (key === 'litter_bringup_m') return '3';
  if (key === 'litter_bringup_f') return '2';
  if (key === 'litter_reg_m') return '3';
  if (key === 'litter_reg_f') return '2';
  if (key === 'birth_litter') return 'Male: 3 / Female: 2';
  if (key === 'birth_count') return '5';
  if (key === 'dead_count') return '0';
  if (key === 'reg_count') return 'Male: 3 / Female: 2';
  if (key === 'reg_no') return 'KJ-C60028';
  if (key === 'dog_breed') return '진돗개';
  if (key === 'dog_gender') return 'FEMALE 암컷';
  if (key === 'dog_birth') return '2025-10-23';
  if (key === 'dog_color') return '황구';
  if (key === 'microchip') return '';
  if (key === 'index_no') return '-';
  if (key === 'dog_litter') return '보미\nKJ-C60028';
  if (key === 'dog_breeder') return '최하식';
  if (key === 'dog_breeder_addr') return '충북 충주시 금가면 하담리 35-5';
  if (key === 'dog_owner') return '최하식';
  if (key === 'dog_owner_addr') return '충북 충주시 금가면 하담리 35-5';
  if (key === 'dog_join') return '2025-10-28';
  if (key === 'dog_owner_change') return '2025-11-05';
  if (key === 'issue_date') return '2026-03-17';
  
  if (key.startsWith('ancestor_')) {
    const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|litter|slash1|slash2|slash3|slash4)$/);
    if (match) {
      const node = parseInt(match[1]);
      const field = match[2];
      if (field.startsWith('slash')) return '/';
      if (node === 2) {
        if (field === 'name') return '삼호 충주금가견사';
        if (field === 'reg') return 'KJ-C10092';
        if (field === 'extra') return '지정 전람회 우수';
        if (field === 'color') return '황구';
        if (field === 'litter') return 'KJ-C10092~KJ-C10095';
        return '';
      }
      if (node === 3) {
        if (field === 'name') return '홍 피어리스';
        if (field === 'reg') return 'KJ-C10077';
        if (field === 'extra') return '';
        if (field === 'color') return '황구';
        if (field === 'litter') return 'KJ-C10077~KJ-C10079';
        return '';
      }
      if (field === 'color') return '황구';
      return field === 'name' ? `진도 조상 ${node}` : field === 'reg' ? `KJ-A00${node}` : '';
    }
  }
  return '';
};

export const getJindoScaledCoords = (coords: Record<string, any>) => {
  return coords;
};

export const generateJindoPrintHtml = (options: PedigreePrintOptions): string => {
  const type = 'jindo';
  const layout = DEFAULT_PEDIGREE_LAYOUTS[type];
  let finalCoords = { ...layout.fields };
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
  finalCoords = getJindoScaledCoords(finalCoords);

  let fieldsHtml = '';
  Object.keys(finalCoords).forEach(key => {
    const coord = finalCoords[key];
    let val = options.useSample ? getJindoSampleValue(key) : getJindoRealValue(key, options);
    if (val === undefined || val === null) val = '';

    const isBold = key === 'dog_name' || key === 'reg_no' || key.endsWith('_name');
    const fontStyle = (isBold ? 'font-weight: bold;' : '') + (key === 'dog_name' ? ' font-family: inherit; text-align: left;' : '');
    const isAncestor = key.startsWith('ancestor_');
    const isWrap = key === 'dog_relate' || key === 'dongtae_no' || key === 'dog_litter';
    const wrapStyle = isWrap ? 'white-space: pre-line; word-break: break-all;' : '';
    let coordWidth = coord.width;
    const widthStyle = coordWidth 
      ? (isAncestor 
          ? `width: ${coordWidth}mm;` 
          : `width: ${coordWidth}mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`)
      : '';

    const formattedVal = typeof val === 'string' ? (isWrap ? val.replace(/\n/g, '<br />') : val.replace(/\n/g, ' ')) : val;

    fieldsHtml += `
      <div class="field" 
           style="left: ${coord.left}mm; top: ${coord.top}mm; font-size: ${coord.fontSize || 0.95}em; ${fontStyle} ${widthStyle} ${wrapStyle}">
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
      width: ${pageWidth};
      height: ${pageHeight};
      overflow: hidden;
      background-color: transparent;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Dotum', sans-serif;
      -webkit-print-color-adjust: exact;
    }
    .print-content {
      position: absolute;
      top: 0;
      left: 0;
      width: ${pageWidth};
      height: ${pageHeight};
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
