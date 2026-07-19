import { Pedigree, ParentDogInfo, OwnerHistory, DongtaeInfo } from '../types';
import { DEFAULT_PEDIGREE_LAYOUTS } from '../config/pedigreeConfig';

export interface PedigreePrintOptions {
  pedigree: Pedigree;
  useSample: boolean;
  ancestorTree: Record<number, ParentDogInfo>;
  ownerHistory: OwnerHistory[];
  litterInfo: Partial<DongtaeInfo> | null;
  isLoadingLitter: boolean;
  fullLitterList: string;
  sireLitterRange: string;
  damLitterRange: string;
  sireOkTerm: string;
  damOkTerm: string;
  jindoLitterList: string;
  okStartDate: string;
  okEndDate: string;
}

const formatDateKr = (dateStr: string) => {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '-') return '-';
  try {
    const clean = dateStr.trim().split(' ')[0];
    const parts = clean.split(/[-./]/);
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10).toString();
      const d = parseInt(parts[2], 10).toString();
      return `${y}년 ${m}월 ${d}일`;
    }
    if (clean.length === 8 && /^\d+$/.test(clean)) {
      const y = clean.substring(0, 4);
      const m = parseInt(clean.substring(4, 6), 10).toString();
      const d = parseInt(clean.substring(6, 8), 10).toString();
      return `${y}년 ${m}월 ${d}일`;
    }
  } catch (e) {}
  return dateStr;
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

const formatYearMonth = (dateStr: string) => {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '-') return '';
  try {
    const clean = dateStr.trim().split(' ')[0];
    const parts = clean.split(/[-./]/);
    if (parts.length >= 2) {
      const y = parts[0];
      const m = String(parseInt(parts[1], 10)).padStart(2, '0');
      return `${y}-${m}`;
    }
    if (clean.length >= 6 && /^\d+$/.test(clean)) {
      const y = clean.substring(0, 4);
      const m = clean.substring(4, 6);
      return `${y}-${m}`;
    }
  } catch (e) {}
  return '';
};

const formatGender = (gender: string) => {
  if (!gender) return '-';
  const g = gender.toLowerCase().trim();
  if (g === 'm' || g === 'male' || gender === '수컷') return '수컷';
  if (g === 'f' || g === 'female' || gender === '암컷') return '암컷';
  return gender;
};

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

export const wrapTextAt30 = (str: string) => {
  if (!str) return '';
  if (str.length < 30) return str;
  const half = Math.floor(str.length / 2);
  const spaceIdx = str.indexOf(' ', half);
  if (spaceIdx !== -1) {
    return str.substring(0, spaceIdx) + '\n' + str.substring(spaceIdx + 1);
  }
  return str.substring(0, 30) + '\n' + str.substring(30);
};

export const wrapTextAt25 = (str: string) => {
  if (!str) return '';
  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < str.length; i++) {
    current += str[i];
    if (current.length >= 25) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
};

export const wrapTextAt35 = (str: string) => {
  if (!str) return '';
  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < str.length; i++) {
    current += str[i];
    if (current.length >= 35) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
};

export const wrapTextAt45 = (str: string) => {
  if (!str) return '';
  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < str.length; i++) {
    current += str[i];
    if (current.length >= 45) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
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

const isSahoAlreadyInName = (name: string, saho: string) => {
  if (!name || !saho) return true;
  const cleanName = name.toLowerCase().trim();
  const cleanSaho = saho.toLowerCase().trim();
  
  if (cleanName.includes(cleanSaho)) return true;
  
  const stopWords = new Set(['vom', 'von', 'der', 'dem', 'den', 'aus', 'de', 'of', 'v.', 'v', 'del']);
  const sahoWords = cleanSaho.split(/\s+/).filter(w => w && !stopWords.has(w));
  
  if (sahoWords.length === 0) return true;
  
  return sahoWords.every(word => cleanName.includes(word));
};

const extractMissingFieldsFromFullname = (dog: ParentDogInfo) => {
  const fullname = (dog.fullname || '').trim();
  const name = (dog.name || '').trim();
  const sahoEng = (dog.saho_eng || '').trim();

  let dna = (dog.spec_dna || '').trim();
  let bone = (dog.spec_bone || '').trim();
  let train = (dog.spec_train || '').trim();
  let win = (dog.spec_win || '').trim();

  if (!fullname) {
    return { spec_dna: dna, spec_bone: bone, spec_train: train, spec_win: win };
  }

  let remaining = fullname;
  if (name) {
    const escName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    remaining = remaining.replace(new RegExp(escName, 'gi'), '');
  }
  if (sahoEng) {
    const escSaho = sahoEng.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    remaining = remaining.replace(new RegExp(escSaho, 'gi'), '');
  }

  remaining = remaining.replace(/[\s,\/]+/g, ' ').trim();

  if (!remaining) {
    return { spec_dna: dna, spec_bone: bone, spec_train: train, spec_win: win };
  }

  // Extract DNA if empty
  if (!dna || dna === '-' || !dna.trim()) {
    const dnaMatch = remaining.match(/DNA\s*(?:gpr\.?|gpr)?/i);
    if (dnaMatch) {
      dna = dnaMatch[0];
      remaining = remaining.replace(dnaMatch[0], '');
    }
  }

  // Extract Bone/Hip status if empty
  if (!bone || bone === '-' || !bone.trim()) {
    const boneMatch = remaining.match(/\b(?:HD|ED|AD)(?:\s+(?:HD|ED|AD))*\b/i);
    if (boneMatch) {
      bone = boneMatch[0];
      remaining = remaining.replace(boneMatch[0], '');
    }
  }

  // Extract show ratings/awards if empty
  if (!win || win === '-' || !win.trim()) {
    const winRegex = /\b(?:VA[1-3]|VA|SG|V)\b/g;
    const winMatches = remaining.match(winRegex);
    if (winMatches) {
      win = winMatches.join(' ');
      winMatches.forEach(m => {
        remaining = remaining.replace(m, '');
      });
    }
  }

  return {
    spec_dna: dna,
    spec_bone: bone,
    spec_train: train,
    spec_win: win
  };
};

export const getShepherdRealValue = (key: string, options: PedigreePrintOptions) => {
  const { pedigree, ownerHistory, fullLitterList, okStartDate, okEndDate, sireLitterRange, damLitterRange, sireOkTerm, damOkTerm, ancestorTree: rawAncestorTree } = options;

  const ancestorTree = Object.keys(rawAncestorTree).reduce((acc, k) => {
    const nodeId = parseInt(k);
    const dog = rawAncestorTree[nodeId];
    if (dog) {
      acc[nodeId] = {
        ...dog,
        ...extractMissingFieldsFromFullname(dog)
      };
    }
    return acc;
  }, {} as Record<number, ParentDogInfo>);

  const isValidDate = (d: any) => {
    if (!d) return false;
    const str = String(d).trim();
    return str !== '' && str !== '0000-00-00' && str !== '0' && str !== '-';
  };

  if (key === 'dog_name') {
    const name = (pedigree.name || '').trim();
    const kennelEng = (pedigree.kennelNameEng || '').trim();
    if (kennelEng && !isSahoAlreadyInName(name, kennelEng)) {
      return `${name} ${kennelEng}`;
    }
    return name;
  }
  if (key === 'dog_gender') {
    const gVal = formatGender(pedigree.gender);
    if (gVal === '수컷') return 'MALE 수컷';
    if (gVal === '암컷') return 'FEMALE 암컷';
    return gVal;
  }
  if (key === 'dog_coat') {
    const coatVal = pedigree.coatType || 'stock hair';
    const c = coatVal.trim().toLowerCase();
    if (c.includes('long stock') || c.includes('long coat') || c.includes('장모') || c.includes('롱')) {
      return 'Long stock hair';
    }
    if (c.includes('stock') || c.includes('단모') || c.includes('숏') || c.includes('이중모')) {
      return 'stock hair';
    }
    return coatVal;
  }
  if (key === 'dog_color') {
    const colorVal = pedigree.color || '-';
    if (colorVal !== '-') {
      const c = colorVal.trim().toLowerCase();
      if (c === 'sb' || c.includes('schwarz braun') || c.includes('black & brown') || c.includes('black brown') || c.includes('블랙브라운') || c.includes('블랙 브라운')) {
        return 'schwarz braun';
      }
      if (c === 'wlf gr' || c.includes('wolf gray') || c.includes('wolf grey') || c.includes('울프그레이') || c.includes('울프 그레이')) {
        return 'wolf gray';
      }
      if (c === 'b&t' || c.includes('black and tan') || c.includes('black tan') || c.includes('블랙탄') || c.includes('블랙 탄')) {
        return 'black & tan';
      }
      if (c === 's' || c.includes('black') || c.includes('검정') || c.includes('블랙')) {
        return 'black';
      }
      if (c === 'w' || c.includes('white') || c.includes('백색') || c.includes('화이트')) {
        return 'white';
      }
      if (c === 'gr' || c.includes('gray') || c.includes('grey') || c.includes('회색')) {
        return 'gray';
      }
    }
    return colorVal;
  }
  if (key === 'dog_birth') {
    return formatDateKr(pedigree.birthDate);
  }
  if (key === 'dog_join') {
    return pedigree.joinDate || '-';
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
  if (key === 'microchip') return pedigree.microchip || (pedigree as any).micro || '-';
  if (key === 'foreign_no') return (pedigree.foreignNo && pedigree.foreignNo !== '-') ? pedigree.foreignNo : '';
  if (key === 'foreign_no2') return (pedigree.foreignNo2 && pedigree.foreignNo2 !== '-') ? pedigree.foreignNo2 : '';
  if (key === 'domestic_no') return (pedigree.domesticNo && pedigree.domesticNo !== '-') ? pedigree.domesticNo : '';
  if (key === 'other_org' || key === 'other_org_no') return ((pedigree as any).otherOrgNo || (pedigree as any).other_org || (pedigree as any).other_org_no || '');
  if (key === 'dongtae_no' || key === 'dog_litter') return fullLitterList || '-';
  if (key === 'dog_breed') return pedigree.breed || '-';
  if (key === 'index_no') return pedigree.indexNo || '-';
  if (key === 'ok_date') return '';
  if (key === 'ok_term') {
    const start = formatYearMonth(okStartDate);
    const end = formatYearMonth(okEndDate);
    if (!start && !end) return '';
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
    const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|litter|ok_term|ok_content|birth|foreign|slash1|slash2|slash3|slash4)$/);
    if (match) {
      const nodeId = parseInt(match[1]);
      const field = match[2];
      if (field.startsWith('slash')) return '/';

      let parentRegVal = '';
      if (nodeId === 2 || nodeId === 3) {
        const dog = ancestorTree[nodeId];
        if (dog) {
          let rVal = (dog.reg_no || '').trim();
          if (!rVal || rVal === '0' || rVal === '-') {
            const dom = (dog.foreign100 || '').trim();
            if (dom && dom !== '0' && dom !== '-') {
              parentRegVal = dom;
            } else {
              const f1 = (dog.foreign_no || '').trim();
              const f2 = (dog.foreign_no2 || '').trim();
              parentRegVal = (f1 && f2) ? `${f1} ${f2}` : (f1 || f2 || '');
            }
          } else {
            parentRegVal = rVal;
          }
        }
        if (!parentRegVal || parentRegVal === '0' || parentRegVal === '-') {
          const fallbackReg = nodeId === 2 ? pedigree.sireRegNo : pedigree.damRegNo;
          const fallbackRegText = nodeId === 2 ? pedigree.sireRegNoText : pedigree.damRegNoText;
          parentRegVal = (fallbackRegText || fallbackReg || '').toString().trim();
        }
      }

      if (field === 'litter') {
        if (nodeId === 2 || nodeId === 3) {
          const dbRange = nodeId === 2 ? sireLitterRange : damLitterRange;
          
          let fallbackVal = '';
          const dog = ancestorTree[nodeId];
          if (dog) {
            const rVal = (dog.reg_no || '').trim();
            if (!rVal || rVal === '0' || rVal === '-') {
              const dom = (dog.foreign100 || '').trim();
              if (dom && dom !== '0' && dom !== '-') {
                fallbackVal = dom;
              } else {
                const f1 = (dog.foreign_no || '').trim();
                const f2 = (dog.foreign_no2 || '').trim();
                fallbackVal = (f1 && f2) ? `${f1}~${f2}` : (f1 || f2 || '');
              }
            } else {
              fallbackVal = rVal;
            }
          }
          if (!fallbackVal || fallbackVal === '0' || fallbackVal === '-') {
            const fallbackReg = nodeId === 2 ? pedigree.sireRegNo : pedigree.damRegNo;
            const fallbackRegText = nodeId === 2 ? pedigree.sireRegNoText : pedigree.damRegNoText;
            fallbackVal = (fallbackRegText || fallbackReg || '').toString().trim();
          }

          const rawVal = dbRange ? dbRange : fallbackVal;
          if (rawVal.length >= 25) {
            return rawVal.replace('~', '~\n');
          }
          return rawVal;
        }
        return '';
      }

      if (field === 'ok_term') {
        if (nodeId === 2 || nodeId === 3) {
          const rawVal = nodeId === 2 ? sireOkTerm : damOkTerm;
          if (rawVal.length >= 25) {
            return rawVal.replace('~', '~\n');
          }
          return rawVal;
        }
        return '';
      }

      if (field === 'ok_content') {
        if (nodeId === 2 || nodeId === 3) {
          const dog = ancestorTree[nodeId];
          const rawVal = dog ? (dog.spec_male || '').trim() : '';
          return wrapTextAt25(rawVal);
        }
        return '';
      }

      const dog = ancestorTree[nodeId];
      if (!dog) return '';
      
      if (field === 'name') {
        const dogName = (dog.name || dog.fullname || '').trim();
        const sahoEng = (dog.saho_eng || '').trim();
        let nameVal = dogName;
        if (nodeId === 2 || nodeId === 3) {
          if (dogName && sahoEng && !isSahoAlreadyInName(dogName, sahoEng)) {
            nameVal = `${dogName}\n${sahoEng}`;
          } else {
            nameVal = dogName || sahoEng || '';
          }
        } else if (nodeId >= 4 && nodeId <= 7) {
          if (dogName && sahoEng && !isSahoAlreadyInName(dogName, sahoEng)) {
            nameVal = `${dogName} ${sahoEng}`;
          } else {
            nameVal = dogName || sahoEng || '';
          }
        } else {
          nameVal = (dog.fullname || dog.name || '').trim();
        }
        if (nodeId >= 4 && nodeId <= 7) {
          const dnaVal = (dog.spec_dna || '').trim();
          return [nameVal, dnaVal].filter(Boolean).join(' ');
        }

        if (nodeId >= 8 && nodeId <= 15) {
          const dnaVal = (dog.spec_dna || '').trim();
          const line1 = [nameVal, dnaVal].filter(Boolean).join(' ');

          const rVal = (dog.reg_no || '').trim();
          const dom = (dog.foreign100 || '').trim();
          const f1 = (dog.foreign_no || '').trim();
          const f2 = (dog.foreign_no2 || '').trim();
          const trainVal = (dog.spec_train || '').trim();
          const regParts = [rVal, f1, f2, dom, trainVal]
            .map(s => s.trim())
            .filter(s => s && s !== '0' && s !== '-');
          let line2 = regParts.join(' ');
          if (line2.length >= 35) {
            line2 = wrapTextAt35(line2);
          }

          const winVal = (dog.spec_win || '').trim();
          const boneVal = (dog.spec_bone || '').trim();
          const line3 = [winVal, boneVal].map(s => s.trim()).filter(Boolean).join(' ');

          return [line1, line2, line3].filter(Boolean).join('\n');
        }

        if (nodeId >= 16 && nodeId <= 31) {
          const dnaVal = (dog.spec_dna || '').trim();
          const baseName = [nameVal, dnaVal].filter(Boolean).join(' ');
          const rVal = (dog.reg_no || '').trim();
          const dom = (dog.foreign100 || '').trim();
          const f1 = (dog.foreign_no || '').trim();
          const f2 = (dog.foreign_no2 || '').trim();
          const regParts = [rVal, f1, f2, dom]
            .map(s => s.trim())
            .filter(s => s && s !== '0' && s !== '-');
          const regVal = regParts.join(' ');
          const trainVal = (dog.spec_train || '').trim();
          const boneVal = (dog.spec_bone || '').trim();
          const winVal = (dog.spec_win || '').trim();
          let regLine = [regVal, trainVal, boneVal, winVal].map(s => s.trim()).filter(Boolean).join(' ');
          if (regLine.length >= 45) {
            regLine = wrapTextAt45(regLine);
          }
          return regLine ? `${baseName}\n${regLine}` : baseName;
        }
        return nameVal;
      }

      if (field === 'reg') {
        if (nodeId >= 8 && nodeId <= 31) {
          return '';
        }
        const rVal = (dog.reg_no || '').trim();
        const dom = (dog.foreign100 || '').trim();
        const f1 = (dog.foreign_no || '').trim();
        const f2 = (dog.foreign_no2 || '').trim();
        const regParts = [rVal, f1, f2, dom]
          .map(s => s.trim())
          .filter(s => s && s !== '0' && s !== '-');

        if (nodeId >= 8 && nodeId <= 15) {
          const trainVal = (dog.spec_train || '').trim();
          const regStr = [...regParts, trainVal].map(s => s.trim()).filter(Boolean).join(' ');
          if (regStr.length >= 30) {
            return wrapTextAt30(regStr);
          }
          return regStr;
        }

        const regVal = regParts.join(' ');

        if (nodeId === 2 || nodeId === 3) {
          const dnaVal = (dog.spec_dna || '').trim();
          const boneVal = (dog.spec_bone || '').trim();
          return [regVal, dnaVal, boneVal].filter(Boolean).join(' ');
        }
        return regVal;
      }

      if (field === 'extra') {
        if (nodeId >= 8 && nodeId <= 31) return '';
        const extraList = [
          dog.spec_win,
          dog.spec_dna,
          dog.spec_bone,
          dog.spec_train
        ].map(s => (s || '').toString().trim()).filter(Boolean);
        return extraList.join(' ');
      }

      if (field === 'win') {
        if (nodeId >= 8 && nodeId <= 31) return '';
        const winVal = (dog.spec_win || '').trim();
        const boneVal = (dog.spec_bone || '').trim();
        return [winVal, boneVal].filter(Boolean).join(' ');
      }
      if (field === 'train') {
        if (nodeId >= 8 && nodeId <= 31) return '';
        const trainVal = (dog.spec_train || '').trim();
        const boneVal = (dog.spec_bone || '').trim();
        return [trainVal, boneVal].filter(Boolean).join(' ');
      }
      if (field === 'dna') return (nodeId >= 8 && nodeId <= 31) ? '' : (dog.spec_dna || '');
      if (field === 'bone') return (nodeId >= 8 && nodeId <= 31) ? '' : (dog.spec_bone || '');
      if (field === 'color') return (nodeId >= 8 && nodeId <= 31) ? '' : (dog.hair || '');
      if (field === 'micro') return (nodeId >= 8 && nodeId <= 31) ? '' : (dog.micro || (dog as any).microchip || '');
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

const shepherdSamples: Record<number, { name: string, reg: string, extra: string }> = {
  2: { name: 'Tarzan z Lomeckeho polesi', reg: 'KSZ-C00647', extra: 'BH IGP1 / WLF GR' },
  3: { name: 'C-Jessi vom Priapus', reg: 'KSZ-C10228', extra: 'BH / WLF GR' },
  4: { name: 'Butsch von der Schiffslaeche', reg: 'KSZ-B60839', extra: 'HD' },
  5: { name: 'Sharon von Der Schwarzen...', reg: 'KSZ-B80159', extra: 'V3 VA1 DNA HD ED AD' },
  6: { name: 'Basko of Sunqsim Cas Ken...', reg: 'KSZ-B00250', extra: 'SG HD ED' },
  7: { name: 'Hera of Dog School', reg: 'KSZ-A90045', extra: 'VA1(CH) V SG 6 BSZS HD ED' },
  8: { name: 'Allegro ze Zdeneho mlyna', reg: '2', extra: '' },
  9: { name: 'Perla z Vojanky', reg: 'SZ-2312796 IPO3 IGP3', extra: '' },
  10: { name: 'Butsch von der Schiffslaeche', reg: 'KSZ-B60839', extra: '' },
  11: { name: 'Sharon von Der Schwarzen...', reg: 'KSZ-B80159', extra: '' },
  12: { name: 'Basko of Sunqsim Cas Ken...', reg: 'KSZ-B00250', extra: '' },
  13: { name: 'Hera of Dog School', reg: 'KSZ-A90045', extra: '' },
  14: { name: 'Zwack vom Holzwinkel', reg: 'SBCPA-197768 IPO1', extra: '' },
  15: { name: 'Diva de Renaudloup', reg: 'SZ-2280805 ZB IPO1 IPO2', extra: '' },
  16: { name: 'Fantom ze Stribrneho kam...', reg: '1', extra: '' },
  17: { name: 'Baira Suche Lazce', reg: '0', extra: '' },
  18: { name: 'Norbert Aritar Bastet', reg: '15', extra: '' },
  19: { name: 'Luna z Vojanky', reg: 'VA HD ED', extra: '' },
  20: { name: 'Mistr sveta WUSV *Bolle J...', reg: 'SZ-2292360 FI-45845/14', extra: '' },
  21: { name: '*Gambana von der Schiffl...', reg: 'V3 VA1 DNA HD ED AD', extra: '' },
  22: { name: 'Qvido Vepeden', reg: 'SBCPA-197768 IPO1', extra: '' },
  23: { name: 'Kobra z Kraje Husitu', reg: 'SZ-2280805 ZB', extra: '' },
  24: { name: 'Quasi vom Fuchsstein', reg: 'KSZ-A80905', extra: '' },
  25: { name: 'Anka of 15 Kennel', reg: 'KSZ-A80751', extra: '' },
  26: { name: 'Fyl du Triangle Magique', reg: 'KSZ-A60862', extra: '' },
  27: { name: 'Diva vom Hermes', reg: 'KSZ-A70053', extra: '' },
  28: { name: '*Javir vom Talka Marda', reg: 'SZ-2242016', extra: '' },
  29: { name: 'Quixie vom Holzwinkel', reg: 'SZ-2258762', extra: '' },
  30: { name: 'Como vom Rurdamm', reg: 'SBCPA-192325', extra: '' },
  31: { name: 'Zaire de Renaudloup', reg: 'KSZ-B50938', extra: '' }
};

export const getShepherdSampleValue = (key: string) => {
  if (key === 'dog_name') return 'Xamo vom Grafenbrunn';
  if (key === 'dog_gender') return 'MALE 수컷';
  if (key === 'dog_coat') return 'stock hair';
  if (key === 'dog_color') return 'schwarz braun';
  if (key === 'dog_birth') return '2022년 11월 28일';
  if (key === 'dog_join') return '2024-10-28';
  if (key === 'dog_owner_change') return '2025-10-19';
  if (key === 'dog_breeder') return 'Dirk Scheerer';
  if (key === 'dog_breeder_addr') return 'Bergweg 3, 56179 Vallendar';
  if (key === 'dog_owner') return '김기흥';
  if (key === 'dog_owner_addr') return '경남 김해시 한림면 금곡리 590-1';
  if (key === 'reg_no') return 'KSZ-C40386';
  if (key === 'microchip') return '981189900142765';
  if (key === 'foreign_no') return 'SZ-2385565';
  if (key === 'dongtae_no' || key === 'dog_litter') return 'Xamo sb / Xanti sb / Xaver sb\nKSZ-C40386~KSZ-C40388';
  if (key === 'ok_date') return '';
  if (key === 'ok_term') {
    return '2025-06~2027-06';
  }
  if (key === 'dog_relate') return '*Ursa v. Ghattas(3-3)\n*Enosch v. Amasis *Bella v. Ghattas(4-4)';
  if (key === 'litter_birth_m') return '1';
  if (key === 'litter_birth_f') return '0';
  if (key === 'litter_dead_m') return '0';
  if (key === 'litter_dead_f') return '0';
  if (key === 'litter_cancel_m') return '0';
  if (key === 'litter_cancel_f') return '0';
  if (key === 'litter_dead2_m') return '0';
  if (key === 'litter_dead2_f') return '0';
  if (key === 'litter_missing_m') return '0';
  if (key === 'litter_missing_f') return '0';
  if (key === 'litter_bringup_m') return '0';
  if (key === 'litter_bringup_f') return '0';
  if (key === 'litter_reg_m') return '1';
  if (key === 'litter_reg_f') return '0';
  if (key === 'birth_litter') return 'Male: 1 / Female: 0';
  if (key === 'birth_count') return '1';
  if (key === 'dead_count') return '0';
  if (key === 'reg_count') return 'Male: 1 / Female: 0';
  if (key === 'issue_date') return '2026-07-06';
  
  if (key.startsWith('ancestor_')) {
    const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|litter|ok_term|ok_content|slash1|slash2|slash3|slash4)$/);
    if (match) {
      const node = parseInt(match[1]);
      const field = match[2];
      if (field.startsWith('slash')) return '/';
       const s = shepherdSamples[node];
       if (s) {
         if (node === 2 || node === 3) {
           if (field === 'reg') {
             return `${s.reg || ''} DNA gpr. HD ED`;
           }
            if (field === 'litter') {
              const reg = s.reg || '';
              const rawVal = (reg === '-' ? '' : reg);
              if (rawVal.length >= 25) {
                return rawVal.replace('~', '~\n');
              }
              return rawVal;
            }
            if (field === 'ok_term') {
              return '2025-04~2027-04';
            }
            if (field === 'ok_content') {
              return wrapTextAt25('2025.11.15 Wiederankorung 2년');
            }
           if (field === 'micro') {
             return node === 2 ? '963007000778785' : '963007000778888';
           }
         }
         if (node >= 4 && node <= 7) {
           if (field === 'name') {
             return `${s.name || ''} DNA gpr.`;
           }
           if (field === 'train') {
             return 'IGP3 HD ED';
           }
           if (field === 'win') {
             return node === 4 ? 'VA(BSZS)' : node === 5 ? 'V' : node === 6 ? 'SG' : 'V';
           }
           if (field === 'color') {
             return 'schwarz braun';
           }
           if (field === 'micro') {
             return node === 4 ? '963007000778111' : node === 5 ? '963004001035222' : node === 6 ? '963007000778333' : '963004001035444';
           }
           if (field === 'reg') {
             return s.reg || '';
           }
         }
         if (node >= 8 && node <= 15) {
            if (field === 'name') {
              const line1 = `${s.name || ''} DNA gpr.`;
              const line2 = `${s.reg || ''} IGP3`;
              const sampleWin = node === 8 ? 'SG' : node === 9 ? 'V' : '';
              const line3 = [sampleWin, 'HD ED'].filter(Boolean).join(' ');
              return [line1, line2, line3].filter(Boolean).join('\n');
            }
            if (field === 'reg' || field === 'win' || field === 'train' || field === 'color' || field === 'micro') {
              return '';
            }
          }
          if (node >= 16 && node <= 31) {
            if (field === 'name') {
              const nameVal = `${s.name || ''} DNA gpr.`;
              let regLine = `${s.reg || ''} IGP3 HD ED`;
              if (regLine.length >= 45) {
                regLine = wrapTextAt45(regLine);
              }
              return `${nameVal}\n${regLine}`;
            }
            if (field === 'reg') {
              return '';
            }
          }
         if (field === 'win') return node === 2 ? 'SG' : node === 3 ? 'V(BSZS)' : '';
         if (field === 'train') return 'IGP3';
         if (field === 'dna') return 'DNA gpr.';
         if (field === 'bone') return 'HD ED';
         if (field === 'color') return 'schwarz braun';
         if (field === 'micro') return node === 2 ? '963007000778785' : node === 3 ? '963004001035661' : node === 4 ? '963007000778111' : node === 5 ? '963004001035222' : node === 6 ? '963007000778333' : node === 7 ? '963004001035444' : '';
         return s[field as keyof typeof s] || '';
       }
    }
  }
  return '';
};

export const generateShepherdPrintHtml = (options: PedigreePrintOptions): string => {
  const type = 'shepherd';
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
    const matchAncestor = key.match(/^ancestor_(\d+)_(reg|win|train|color|micro|extra)$/);
    if (matchAncestor) {
      const nodeId = parseInt(matchAncestor[1]);
      if (nodeId >= 8 && nodeId <= 31) return;
    }
    const coord = finalCoords[key];
    let val = options.useSample ? getShepherdSampleValue(key) : getShepherdRealValue(key, options);
    if (val === undefined || val === null) val = '';

    const isBold = key === 'dog_name' || key === 'reg_no' || key === 'microchip' || key.endsWith('_name');
    const fontStyle = (isBold ? 'font-weight: bold;' : '') + (key === 'dog_name' ? ' font-family: inherit; text-align: left;' : '');
    const isAncestor = key.startsWith('ancestor_');
    const isWrap = key === 'dog_relate' || key === 'dongtae_no' || key === 'dog_litter' || key.endsWith('_litter') || key.endsWith('_ok_term') || key.endsWith('_ok_content') || key.endsWith('_reg') || (key.startsWith('ancestor_') && key.endsWith('_name'));
    const wrapStyle = isWrap ? 'white-space: pre-line; word-break: break-all; line-height: 1.15;' : '';
    let coordWidth = coord.width;
    const matchName = key.match(/^ancestor_(\d+)_name$/);
    if (matchName) {
      const nodeId = parseInt(matchName[1]);
      if (nodeId >= 16 && nodeId <= 31) {
        if (!coordWidth || coordWidth < 60) {
          coordWidth = 60;
        }
      }
    }
    const widthStyle = coordWidth 
      ? (isAncestor 
          ? `width: ${coordWidth}mm;` 
          : `width: ${coordWidth}mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`)
      : '';

    const formattedVal = typeof val === 'string' ? (isWrap ? val.replace(/\n/g, '<br />') : val.replace(/\n/g, ' ')) : val;
    const linesCount = typeof val === 'string' ? val.split('\n').length : 1;
    let dynamicFontSize = coord.fontSize || 0.95;
    if (key.startsWith('ancestor_') && key.endsWith('_name') && linesCount >= 3) {
      dynamicFontSize = dynamicFontSize * (0.70 / 0.88);
    }

    fieldsHtml += `
      <div class="field" 
           style="left: ${coord.left}mm; top: ${coord.top}mm; font-size: ${dynamicFontSize}em; ${fontStyle} ${widthStyle} ${wrapStyle}">
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
      size: landscape;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 420mm;
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
