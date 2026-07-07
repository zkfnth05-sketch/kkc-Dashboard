
import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, Trophy, Search, Undo, Copy, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { Pedigree, DongtaeInfo, ParentDogInfo, Evaluation, OwnerHistory } from '../types';
import { fetchDogsByUids, fetchPointsByRegNo, fetchPrizesByRegNo, fetchOwnerHistory, deleteOwnerHistory, fetchBridge } from '../services/memberService';
import { fetchDongtaeInfo } from '../services/dongtaeService'; // 👈 분리된 서비스 참조
import { AlertCircle } from 'lucide-react';
import { DEFAULT_PEDIGREE_LAYOUTS } from '../config/pedigreeConfig';

const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "확인", cancelText = "취소", isDanger = false }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="bg-gray-50 px-5 py-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-md transition-all active:scale-95 shadow-lg ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-100'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PedigreeDetailModalProps {
  pedigree: Pedigree;
  onClose: () => void;
  onEdit: (pedigree: Pedigree) => void;
  onOpenDongtaeForm: (dongtaeNo: string, dogId?: string) => void;
  onEditOwner: (id: string) => void;
  onEditEvaluation: (evaluation: Evaluation) => void;
  onManagePoints: (regNo: string) => void; 
  onDelete: (id: string) => void;
  onViewPedigreeByUid?: (uid: string) => void;
  tableName?: string;
  dogClasses?: any[];
}

export const PedigreeDetailModal: React.FC<PedigreeDetailModalProps> = ({ 
    pedigree, onClose, onEdit, onOpenDongtaeForm, onEditOwner, onEditEvaluation, onManagePoints, onDelete,
    onViewPedigreeByUid,
    tableName = 'dogTab',
    dogClasses = []
}) => {
  const [litterInfo, setLitterInfo] = useState<Partial<DongtaeInfo> | null>(null);
  const [isLoadingLitter, setIsLoadingLitter] = useState(false);
  const [sireInfo, setSireInfo] = useState<ParentDogInfo | null>(null);
  const [damInfo, setDamInfo] = useState<ParentDogInfo | null>(null);
  const [isLoadingParents, setIsLoadingParents] = useState(false);

  const [pointsList, setPointsList] = useState<any[]>([]);
  const [prizesList, setPrizesList] = useState<any[]>([]);
  const [ownerHistory, setOwnerHistory] = useState<OwnerHistory[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false });
  const [isPrinting, setIsPrinting] = useState(false);

  // 🎯 혈통서 인쇄 정밀 보정 상태
  const [activePrintType, setActivePrintType] = useState<'shepherd' | 'jindo' | 'general' | null>(null);
  const [ancestorTree, setAncestorTree] = useState<Record<number, ParentDogInfo>>({});
  const [fullLitterList, setFullLitterList] = useState<string>('');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [isEditingCoords, setIsEditingCoords] = useState(true);
  const [useSampleMode, setUseSampleMode] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [editorZoom, setEditorZoom] = useState(1.2);
  const [gridSize, setGridSize] = useState<number>(0.5); // mm
  const [editorCoords, setEditorCoords] = useState<Record<string, { left: number; top: number; fontSize?: number; width?: number }>>({});
  
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [offsetLeft, setOffsetLeft] = useState<number>(0);
  const [fontScale, setFontScale] = useState<number>(100);
  const [fontBold, setFontBold] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

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

  const getSampleValue = (key: string, type: string) => {
    if (type === 'shepherd') {
      if (key === 'dog_name') return 'Xamo vom Grafenbrunn';
      if (key === 'dog_gender') return 'MALE (수컷)';
      if (key === 'dog_coat') return 'stock hair';
      if (key === 'dog_color') return 'schwarz braun';
      if (key === 'dog_birth') return '2022년 11월 28일';
      if (key === 'dog_join') return '2024-10-28';
      if (key === 'dog_owner_change') return '2025년 10월 19일';
      if (key === 'dog_breeder') return 'Dirk Scheerer';
      if (key === 'dog_breeder_addr') return 'Bergweg 3, 56179 Vallendar';
      if (key === 'dog_owner') return '김기흥';
      if (key === 'dog_owner_addr') return '경남 김해시 한림면 금곡리 590-1';
      if (key === 'reg_no') return 'KSZ-C40386';
      if (key === 'microchip') return '981189900142765';
      if (key === 'foreign_no') return 'SZ-2385565';
      if (key === 'dongtae_no') return 'Xamo sb KSZ-C40386';
      if (key === 'ok_date') return 'HD ED / BH IGP1';
      if (key === 'dog_relate') return '*Ursa v. Ghattas(3-3)/*Enosch v. Amasis *Bella v. Ghattas(4-4)';
      if (key === 'litter_birth_m') return '1';
      if (key === 'litter_birth_f') return '0';
      if (key === 'litter_dead_m') return '0';
      if (key === 'litter_dead_f') return '0';
      if (key === 'litter_cancel_m') return '0';
      if (key === 'litter_cancel_f') return '0';
      if (key === 'litter_reg_m') return '1';
      if (key === 'litter_reg_f') return '0';
      if (key === 'litter_total_m') return '1';
      if (key === 'litter_total_f') return '0';
      if (key === 'birth_litter') return 'Male: 1 / Female: 0';
      if (key === 'birth_count') return '1';
      if (key === 'dead_count') return '0';
      if (key === 'reg_count') return 'Male: 1 / Female: 0';
      if (key === 'issue_date') return '2026년 7월 6일';
      
      if (key.startsWith('ancestor_')) {
        const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|slash1|slash2|slash3|slash4)$/);
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
                 return 'sb';
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
                 return `${s.name || ''} DNA gpr.`;
               }
               if (field === 'reg') {
                 return `${s.reg || ''} IGP3`;
               }
               if (field === 'win') {
                 const sampleWin = node === 8 ? 'SG' : node === 9 ? 'V' : '';
                 return [sampleWin, 'HD ED'].filter(Boolean).join(' ');
               }
             }
             if (node >= 16 && node <= 31) {
               if (field === 'name') {
                 return `${s.name || ''} DNA gpr.`;
               }
               if (field === 'reg') {
                 return `${s.reg || ''} IGP3 HD ED`;
               }
             }
             if (field === 'win') return node === 2 ? 'SG' : node === 3 ? 'V(BSZS)' : '';
             if (field === 'train') return 'IGP3';
             if (field === 'dna') return 'DNA gpr.';
             if (field === 'bone') return 'HD ED';
             if (field === 'color') return 'sb';
             if (field === 'micro') return node === 2 ? '963007000778785' : node === 3 ? '963004001035661' : node === 4 ? '963007000778111' : node === 5 ? '963004001035222' : node === 6 ? '963007000778333' : node === 7 ? '963004001035444' : '';
             return s[field as keyof typeof s] || '';
           }
        }
      }
    }

    if (type === 'jindo') {
      if (key === 'dog_name') return '보미';
      if (key === 'reg_no') return 'KJ-C60028';
      if (key === 'dog_breed') return '진돗개';
      if (key === 'dog_gender') return 'FEMALE (암컷)';
      if (key === 'dog_birth') return '2025년 10월 23일';
      if (key === 'dog_color') return '황구';
      if (key === 'microchip') return '-';
      if (key === 'index_no') return '-';
      if (key === 'dog_litter') return '보미 황구 KJ-C60028';
      if (key === 'dog_breeder') return '최하식';
      if (key === 'dog_breeder_addr') return '충북 충주시 금가면 하담리 35-5';
      if (key === 'dog_owner') return '최하식';
      if (key === 'dog_owner_addr') return '충북 충주시 금가면 하담리 35-5';
      if (key === 'issue_date') return '2026년 3월 17일';
      
      if (key.startsWith('ancestor_')) {
        const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|slash1|slash2|slash3|slash4)$/);
        if (match) {
          const node = parseInt(match[1]);
          const field = match[2];
          if (field.startsWith('slash')) return '/';
          if (node === 2) {
            if (field === 'name') return '삼호 충주금가견사';
            if (field === 'reg') return 'KJ-C10092';
            if (field === 'extra') return '황구';
            return '';
          }
          if (node === 3) {
            if (field === 'name') return '홍 피어리스';
            if (field === 'reg') return 'KJ-C10077';
            if (field === 'extra') return '황구';
            return '';
          }
          return field === 'name' ? `진도 조상 ${node}` : field === 'reg' ? `KJ-A00${node}` : '';
        }
      }
    }

    if (type === 'general') {
      if (key === 'dog_name') return 'Arin';
      if (key === 'reg_no') return 'KSZ-C60236';
      if (key === 'dog_breed') return 'German Shepherd Dog';
      if (key === 'dog_gender') return 'FEMALE (암컷)';
      if (key === 'dog_birth') return '2025년 10월 23일';
      if (key === 'dog_color') return 'sb';
      if (key === 'microchip') return '981189900142765';
      if (key === 'index_no') return '-';
      if (key === 'dog_litter') return 'Arin sb KSZ-C60236';
      if (key === 'dog_breeder') return '최하식';
      if (key === 'dog_breeder_addr') return '충북 충주시 금가면 하담리 35-5';
      if (key === 'dog_owner') return '최하식';
      if (key === 'dog_owner_addr') return '충북 충주시 금가면 하담리 35-5';
      if (key === 'issue_date') return '2026년 3월 17일';

      if (key.startsWith('ancestor_')) {
        const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|slash1|slash2|slash3|slash4)$/);
        if (match) {
          const node = parseInt(match[1]);
          const field = match[2];
          if (field.startsWith('slash')) return '/';
          return field === 'name' ? `일반 조상 ${node}` : field === 'reg' ? `GEN-C00${node}` : 'sb';
        }
      }
    }
    return '';
  };

  const getRealValue = (key: string, type: 'shepherd' | 'jindo' | 'general') => {
    const isValidDate = (d: any) => {
      if (!d) return false;
      const str = String(d).trim();
      return str !== '' && str !== '0000-00-00' && str !== '0' && str !== '-';
    };

    if (key === 'dog_name') return pedigree.fullName || pedigree.name || '-';
    if (key === 'dog_gender') return formatGender(pedigree.gender);
    if (key === 'dog_coat') return pedigree.coatType || (type === 'shepherd' ? 'stock hair' : '-');
    if (key === 'dog_color') return pedigree.color || '-';
    if (key === 'dog_birth') return formatDateKr(pedigree.birthDate);
    if (key === 'dog_join') return pedigree.joinDate || '-';
    if (key === 'dog_owner_change') {
      const latest = ownerHistory[0];
      let dateVal = '';
      if (latest && isValidDate(latest.change_date)) {
        dateVal = latest.change_date;
      } else if (latest && isValidDate(latest.sign_date)) {
        dateVal = latest.sign_date;
      }
      
      // 1. 승인일 문자열 우선 체크
      if (!isValidDate(dateVal) && isValidDate(pedigree.editDate)) {
        dateVal = pedigree.editDate!;
      }
      
      // 2. UNIX 타임스탬프 기반 승인일(signdate) 변환 체크 (최우선 폴백)
      if (!isValidDate(dateVal)) {
        const ts = pedigree.signdate || (pedigree as any).signdate || (pedigree as any).moddate;
        if (ts && !isNaN(Number(ts)) && Number(ts) > 0) {
          const dObj = new Date(Number(ts) * 1000);
          const y = dObj.getFullYear();
          const m = String(dObj.getMonth() + 1).padStart(2, '0');
          const d = String(dObj.getDate()).padStart(2, '0');
          dateVal = `${y}-${m}-${d}`;
        }
      }

      // 3. 기타 DB 상의 원본 sign_date 체크
      if (!isValidDate(dateVal) && isValidDate((pedigree as any).sign_date)) {
        dateVal = (pedigree as any).sign_date;
      }
      
      // 4. 소유자 변경 기록이나 승인일이 모두 부재할 경우에만 최종적으로 등록일(joinDate / reg_date)로 폴백
      if (!isValidDate(dateVal)) {
        if (isValidDate(pedigree.joinDate)) {
          dateVal = pedigree.joinDate!;
        } else if (isValidDate((pedigree as any).reg_date)) {
          dateVal = (pedigree as any).reg_date;
        } else if (isValidDate((pedigree as any).registrationDate)) {
          dateVal = (pedigree as any).registrationDate;
        }
      }
      return formatDateKr(dateVal);
    }
    if (key === 'dog_breeder') return pedigree.breeder || '-';
    if (key === 'dog_breeder_addr') return pedigree.breederAddr || '-';
    if (key === 'dog_owner') return pedigree.owner || '-';
    if (key === 'dog_owner_addr') return pedigree.ownerAddr || '-';
    if (key === 'reg_no') return pedigree.regNo || '-';
    if (key === 'microchip') return pedigree.microchip || (pedigree as any).micro || '-';
    if (key === 'foreign_no') return pedigree.foreignNo || pedigree.domesticNo || '-';
    if (key === 'dongtae_no' || key === 'dog_litter') return fullLitterList || '-';
    if (key === 'dog_breed') return pedigree.breed || '-';
    if (key === 'index_no') return pedigree.indexNo || '-';
    if (key === 'ok_date') {
      const parts = [pedigree.specWin, pedigree.specDna, pedigree.specBone, pedigree.specTrain].map(s => (s || '').trim()).filter(Boolean);
      if (parts.length > 0) return parts.join(' / ');
      return pedigree.okDate || (pedigree.okStat === 'Y' ? '기록 확인' : '-');
    }
    if (key === 'birth_litter') return `Male: ${getLitterValue('birth_M')} / Female: ${getLitterValue('birth_F')}`;
    if (key === 'dog_relate') return pedigree.specRelate || '-';
    if (key === 'litter_birth_m') return getLitterValue('birth_M') || '0';
    if (key === 'litter_birth_f') return getLitterValue('birth_F') || '0';
    if (key === 'litter_dead_m') {
      const dm = parseInt(getLitterValue('dead_M')) || 0;
      const d2m = parseInt(getLitterValue('dead2_M')) || 0;
      return (dm + d2m).toString();
    }
    if (key === 'litter_dead_f') {
      const df = parseInt(getLitterValue('dead_F')) || 0;
      const d2f = parseInt(getLitterValue('dead2_F')) || 0;
      return (df + d2f).toString();
    }
    if (key === 'litter_cancel_m') return getLitterValue('cancel_M') || '0';
    if (key === 'litter_cancel_f') return getLitterValue('cancel_F') || '0';
    if (key === 'litter_reg_m') return getLitterValue('reg_count_M') || '0';
    if (key === 'litter_reg_f') return getLitterValue('reg_count_F') || '0';
    if (key === 'litter_total_m') return getLitterValue('reg_count_M') || '0';
    if (key === 'litter_total_f') return getLitterValue('reg_count_F') || '0';

    if (key === 'birth_litter') return `Male: ${getLitterValue('birth_M')} / Female: ${getLitterValue('birth_F')}`;
    if (key === 'birth_count') {
      const bm = parseInt(getLitterValue('birth_M')) || 0;
      const bf = parseInt(getLitterValue('birth_F')) || 0;
      const total = bm + bf;
      return total > 0 ? total.toString() : '1';
    }
    if (key === 'dead_count') {
      const dm = parseInt(getLitterValue('dead_M')) || 0;
      const df = parseInt(getLitterValue('dead_F')) || 0;
      const d2m = parseInt(getLitterValue('dead2_M')) || 0;
      const d2f = parseInt(getLitterValue('dead2_F')) || 0;
      return (dm + df + d2m + d2f).toString();
    }
    if (key === 'reg_count') return `Male: ${getLitterValue('reg_count_M')} / Female: ${getLitterValue('reg_count_F')}`;
    if (key === 'issue_date') return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
    
    // Ancestors
    if (key.startsWith('ancestor_')) {
      const match = key.match(/^ancestor_(\d+)_(name|reg|extra|win|train|dna|bone|color|micro|slash1|slash2|slash3|slash4)$/);
      if (match) {
        const nodeId = parseInt(match[1]);
        const field = match[2];
        if (field.startsWith('slash')) return '/';
        const dog = ancestorTree[nodeId];
        if (!dog) return '';
        
         if (field === 'name') {
           const nameVal = dog.fullname || dog.name || '';
           if (type === 'shepherd' && nodeId >= 4 && nodeId <= 31) {
             const dnaVal = (dog.spec_dna || '').trim();
             return [nameVal, dnaVal].filter(Boolean).join(' ');
           }
           return nameVal;
         }
         if (field === 'reg') {
           let regVal = (dog.reg_no || '').trim();
           if (!regVal || regVal === '0' || regVal === '-') {
             const f1 = (dog.foreign_no || '').trim();
             const f2 = (dog.foreign_no2 || '').trim();
             regVal = (f1 && f2) ? `${f1} ${f2}` : (f1 || f2 || '');
           }
           if (type === 'shepherd') {
             if (nodeId === 2 || nodeId === 3) {
               const dnaVal = (dog.spec_dna || '').trim();
               const boneVal = (dog.spec_bone || '').trim();
               return [regVal, dnaVal, boneVal].filter(Boolean).join(' ');
             }
             if (nodeId >= 8 && nodeId <= 15) {
               const trainVal = (dog.spec_train || '').trim();
               return [regVal, trainVal].filter(Boolean).join(' ');
             }
             if (nodeId >= 16 && nodeId <= 31) {
               const trainVal = (dog.spec_train || '').trim();
               const boneVal = (dog.spec_bone || '').trim();
               const winVal = (dog.spec_win || '').trim();
               return [regVal, trainVal, boneVal, winVal].map(s => s.trim()).filter(Boolean).join(' ');
             }
           }
           return regVal;
         }
        if (field === 'extra') {
          const extraList = [
            dog.spec_win,
            dog.spec_dna,
            dog.spec_bone,
            dog.spec_train,
            getColorAbbr(dog.hair)
          ].map(s => (s || '').toString().trim()).filter(Boolean);
          return extraList.join(' / ');
        }
        if (field === 'win') {
          if (type === 'shepherd' && nodeId >= 8 && nodeId <= 15) {
            const winVal = (dog.spec_win || '').trim();
            const boneVal = (dog.spec_bone || '').trim();
            return [winVal, boneVal].filter(Boolean).join(' ');
          }
          return dog.spec_win || '';
        }
        if (field === 'train') {
          if (type === 'shepherd' && nodeId >= 4 && nodeId <= 7) {
            const trainVal = (dog.spec_train || '').trim();
            const boneVal = (dog.spec_bone || '').trim();
            return [trainVal, boneVal].filter(Boolean).join(' ');
          }
          return dog.spec_train || '';
        }
        if (field === 'dna') return dog.spec_dna || '';
        if (field === 'bone') return dog.spec_bone || '';
        if (field === 'color') return getColorAbbr(dog.hair) || '';
        if (field === 'micro') return dog.micro || (dog as any).microchip || '';
      }
    }
    return '';
  };

  const fetchDogsByKeys = async (keys: string[]): Promise<Record<string, ParentDogInfo>> => {
    const cleanedKeys = Array.from(new Set(keys.map(k => (k || '').toString().trim()).filter(k => k && k !== '0' && k !== '-' && k !== '미등록')));
    if (cleanedKeys.length === 0) return {};
    try {
      const byUid = await fetchDogsByUids(cleanedKeys, tableName);
      const missingKeys = cleanedKeys.filter(k => !byUid[k]);
      let byRegNo: Record<string, ParentDogInfo> = {};
      if (missingKeys.length > 0) {
        const { fetchDogsByRegNos } = await import('../services/memberService');
        byRegNo = await fetchDogsByRegNos(missingKeys, tableName);
      }
      const result: Record<string, ParentDogInfo> = {};
      cleanedKeys.forEach(k => {
        const dog = byUid[k] || byRegNo[k];
        if (dog) {
          result[k] = dog;
        }
      });
      return result;
    } catch (e) {
      console.error("Error in fetchDogsByKeys:", e);
      return {};
    }
  };

  const handleResetCoords = () => {
    if (!activePrintType) return;
    if (window.confirm("모든 좌표와 오차 설정을 기본 초기값으로 리셋하시겠습니까?")) {
      localStorage.removeItem(`pedigree_coords_${activePrintType}`);
      localStorage.removeItem(`pedigree_offset_${activePrintType}_top`);
      localStorage.removeItem(`pedigree_offset_${activePrintType}_left`);
      localStorage.removeItem(`pedigree_offset_${activePrintType}_scale`);
      localStorage.removeItem(`pedigree_offset_${activePrintType}_bold`);

      setOffsetTop(0);
      setOffsetLeft(0);
      setFontScale(100);
      setFontBold(true);
      setEditorCoords({ ...DEFAULT_PEDIGREE_LAYOUTS[activePrintType].fields });
      setSelectedFieldKey(null);
    }
  };

  const handleCopyCoords = () => {
    if (!activePrintType) return;
    const jsonStr = JSON.stringify(editorCoords, null, 2);
    navigator.clipboard.writeText(jsonStr)
      .then(() => {
        alert("🎉 보정된 좌표 데이터 JSON이 클립보드에 복사되었습니다!\n\n개발자에게 이 JSON 내용을 전달하면 기본 좌표로 저장할 수 있습니다.");
      })
      .catch(err => {
        prompt("클립보드 복사에 실패했습니다. 아래 텍스트를 직접 복사하세요:", jsonStr);
      });
  };

  const generatePrintHtml = (type: 'shepherd' | 'jindo' | 'general', useSample: boolean) => {
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
      const coord = finalCoords[key];
      let val = useSample ? getSampleValue(key, type) : getRealValue(key, type);
      if (val === undefined || val === null) val = '';

      const isBold = key === 'dog_name' || key === 'reg_no' || key === 'microchip' || key.endsWith('_name');
      const fontStyle = isBold ? 'font-weight: bold;' : '';
      const isAncestor = key.startsWith('ancestor_');
      const widthStyle = (coord.width && !isAncestor) ? `width: ${coord.width}mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` : '';

      fieldsHtml += `
        <div class="field" 
             style="left: ${coord.left}mm; top: ${coord.top}mm; font-size: ${coord.fontSize || 0.95}em; ${fontStyle} ${widthStyle}">
          ${val}
        </div>
      `;
    });

    const isLandscape = layout.isLandscape;
    const pageWidth = isLandscape ? '297mm' : '210mm';
    const pageHeight = isLandscape ? '210mm' : '297mm';
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

  const printViaIframe = (type: 'shepherd' | 'jindo' | 'general', htmlContent: string) => {
    let iframe = document.getElementById('pedigree-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'pedigree-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 50);
    }
  };

  const handlePrintAction = () => {
    if (!activePrintType) return;
    const htmlContent = generatePrintHtml(activePrintType, useSampleMode);
    printViaIframe(activePrintType, htmlContent);
  };

  const handleDragStart = (e: React.MouseEvent, key: string) => {
    if (!isEditingCoords) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldKey(key);

    const startX = e.clientX;
    const startY = e.clientY;

    const currentCoords = editorCoords[key] || { left: 0, top: 0 };
    const baseLeft = currentCoords.left;
    const baseTop = currentCoords.top;

    const isLandscape = DEFAULT_PEDIGREE_LAYOUTS[activePrintType!].isLandscape;
    const containerWidthMm = isLandscape ? 297 : 210;
    
    const container = document.getElementById('pedigree-canvas');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const widthPx = rect.width;
    const pxToMm = containerWidthMm / widthPx;

    const onMouseMove = (moveEvent: MouseEvent) => {
      let dx = (moveEvent.clientX - startX) * pxToMm;
      let dy = (moveEvent.clientY - startY) * pxToMm;

      let newLeft = baseLeft + dx;
      let newTop = baseTop + dy;

      if (gridSize > 0) {
        newLeft = Math.round(newLeft / gridSize) * gridSize;
        newTop = Math.round(newTop / gridSize) * gridSize;
      }

      setEditorCoords(prev => {
        const next = {
          ...prev,
          [key]: {
            ...prev[key],
            left: parseFloat(newLeft.toFixed(2)),
            top: parseFloat(newTop.toFixed(2))
          }
        };
        localStorage.setItem(`pedigree_coords_${activePrintType}`, JSON.stringify(next));
        return next;
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePrintType || !selectedFieldKey || !isEditingCoords) return;

      let step = 0.1;
      if (e.shiftKey) step = 0.5;

      const currentCoords = editorCoords[selectedFieldKey] || { left: 0, top: 0, fontSize: 0.95 };
      let moved = false;
      let nextLeft = currentCoords.left;
      let nextTop = currentCoords.top;
      let nextFontSize = currentCoords.fontSize || 0.95;

      if (e.key === 'ArrowLeft') {
        nextLeft = parseFloat((nextLeft - step).toFixed(2));
        moved = true;
      } else if (e.key === 'ArrowRight') {
        nextLeft = parseFloat((nextLeft + step).toFixed(2));
        moved = true;
      } else if (e.key === 'ArrowUp') {
        nextTop = parseFloat((nextTop - step).toFixed(2));
        moved = true;
      } else if (e.key === 'ArrowDown') {
        nextTop = parseFloat((nextTop + step).toFixed(2));
        moved = true;
      } else if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        const sizeStep = e.shiftKey ? 0.05 : 0.01;
        if (e.key === '[') {
          nextFontSize = parseFloat(Math.max(0.1, nextFontSize - sizeStep).toFixed(2));
        } else {
          nextFontSize = parseFloat((nextFontSize + sizeStep).toFixed(2));
        }
        moved = true;
      }

      if (moved) {
        e.preventDefault();
        setEditorCoords(prev => {
          const next = {
            ...prev,
            [selectedFieldKey]: {
              ...prev[selectedFieldKey],
              left: nextLeft,
              top: nextTop,
              fontSize: nextFontSize
            }
          };
          localStorage.setItem(`pedigree_coords_${activePrintType}`, JSON.stringify(next));
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePrintType, selectedFieldKey, isEditingCoords, editorCoords]);

  const handlePrint = async (type: 'shepherd' | 'jindo' | 'general') => {
    setIsPrinting(true);
    try {
      const tree: Record<number, ParentDogInfo> = {};
      
      tree[1] = {
        uid: pedigree.id,
        reg_no: pedigree.regNo,
        name: pedigree.name,
        fullname: pedigree.fullName,
        fa_regno: pedigree.sireRegNo,
        mo_regno: pedigree.damRegNo,
        hair: pedigree.color,
        sex: pedigree.gender,
        birth: pedigree.birthDate,
        dog_class: pedigree.breed,
        saho: pedigree.kennel,
        saho_eng: pedigree.kennelNameEng,
        poss_name: pedigree.owner,
        poss_addr: pedigree.ownerAddr,
        breed_name: pedigree.breeder,
        breed_addr: pedigree.breederAddr
      } as any;

      // 2세대 로드
      const gen2Keys = [pedigree.sireRegNo, pedigree.damRegNo].filter(u => u && u !== '0' && u !== '-' && u !== '미등록');
      if (gen2Keys.length > 0) {
        const gen2Data = await fetchDogsByKeys(gen2Keys);
        if (pedigree.sireRegNo && gen2Data[pedigree.sireRegNo]) tree[2] = gen2Data[pedigree.sireRegNo];
        if (pedigree.damRegNo && gen2Data[pedigree.damRegNo]) tree[3] = gen2Data[pedigree.damRegNo];
      }

      // 3세대 로드
      const gen3Keys: string[] = [];
      [2, 3].forEach(idx => {
        const dog = tree[idx];
        if (dog) {
          if (dog.fa_regno && dog.fa_regno !== '0' && dog.fa_regno !== '-') gen3Keys.push(dog.fa_regno);
          if (dog.mo_regno && dog.mo_regno !== '0' && dog.mo_regno !== '-') gen3Keys.push(dog.mo_regno);
        }
      });
      if (gen3Keys.length > 0) {
        const gen3Data = await fetchDogsByKeys(gen3Keys);
        if (tree[2]) {
          if (tree[2].fa_regno && gen3Data[tree[2].fa_regno]) tree[4] = gen3Data[tree[2].fa_regno];
          if (tree[2].mo_regno && gen3Data[tree[2].mo_regno]) tree[5] = gen3Data[tree[2].mo_regno];
        }
        if (tree[3]) {
          if (tree[3].fa_regno && gen3Data[tree[3].fa_regno]) tree[6] = gen3Data[tree[3].fa_regno];
          if (tree[3].mo_regno && gen3Data[tree[3].mo_regno]) tree[7] = gen3Data[tree[3].mo_regno];
        }
      }

      // 4세대 로드
      const gen4Keys: string[] = [];
      [4, 5, 6, 7].forEach(idx => {
        const dog = tree[idx];
        if (dog) {
          if (dog.fa_regno && dog.fa_regno !== '0' && dog.fa_regno !== '-') gen4Keys.push(dog.fa_regno);
          if (dog.mo_regno && dog.mo_regno !== '0' && dog.mo_regno !== '-') gen4Keys.push(dog.mo_regno);
        }
      });
      if (gen4Keys.length > 0) {
        const gen4Data = await fetchDogsByKeys(gen4Keys);
        for (let idx = 4; idx <= 7; idx++) {
          const dog = tree[idx];
          if (dog) {
            const leftChild = idx * 2;
            const rightChild = idx * 2 + 1;
            if (dog.fa_regno && gen4Data[dog.fa_regno]) tree[leftChild] = gen4Data[dog.fa_regno];
            if (dog.mo_regno && gen4Data[dog.mo_regno]) tree[rightChild] = gen4Data[dog.mo_regno];
          }
        }
      }

      // 5세대 로드
      if (type !== 'general') {
        const gen5Keys: string[] = [];
        for (let idx = 8; idx <= 15; idx++) {
          const dog = tree[idx];
          if (dog) {
            if (dog.fa_regno && dog.fa_regno !== '0' && dog.fa_regno !== '-') gen5Keys.push(dog.fa_regno);
            if (dog.mo_regno && dog.mo_regno !== '0' && dog.mo_regno !== '-') gen5Keys.push(dog.mo_regno);
          }
        }
        if (gen5Keys.length > 0) {
          const gen5Data = await fetchDogsByKeys(gen5Keys);
          for (let idx = 8; idx <= 15; idx++) {
            const dog = tree[idx];
            if (dog) {
              const leftChild = idx * 2;
              const rightChild = idx * 2 + 1;
              if (dog.fa_regno && gen5Data[dog.fa_regno]) tree[leftChild] = gen5Data[dog.fa_regno];
              if (dog.mo_regno && gen5Data[dog.mo_regno]) tree[rightChild] = gen5Data[dog.mo_regno];
            }
          }
        }
      }

      setAncestorTree(tree);

      let siblings: any[] = [];
      if (pedigree.dongtaeNo && pedigree.dongtaeNo !== '-' && pedigree.dongtaeNo !== '0' && pedigree.dongtaeNo.trim() !== '') {
        const res = await fetchBridge({
          mode: 'list',
          table: 'dogTab',
          search: pedigree.dongtaeNo,
          field: 'dongtae_no',
          exact: true,
          limit: 100
        });
        if (res.success && res.data) {
          siblings = res.data.filter((d: any) => d.uid?.toString() !== pedigree.id);
        }
      }

      const siblingListFormatted = siblings.map(s => {
        const sName = s.fullname || s.name || '';
        const sReg = s.reg_no || '';
        const sColor = s.hair || '';
        const sColorAbbr = getColorAbbr(sColor);
        return `${sName} ${sColorAbbr} / ${sReg}`;
      }).join(', ');

      const mainDogColorAbbr = getColorAbbr(pedigree.color);
      const fullLitterList = `${pedigree.fullName || pedigree.name} ${mainDogColorAbbr} / ${pedigree.regNo}${siblingListFormatted ? ', ' + siblingListFormatted : ''}`;

      setAncestorTree(tree);
      setFullLitterList(fullLitterList);
      
      const defaultFields = DEFAULT_PEDIGREE_LAYOUTS[type].fields;
      let initialCoords = { ...defaultFields };
      const savedCoords = localStorage.getItem(`pedigree_coords_${type}`);
      if (savedCoords) {
        try {
          const parsed = JSON.parse(savedCoords);
          Object.keys(parsed).forEach(k => {
            if (initialCoords[k]) {
              const savedItem = parsed[k];
              if (savedItem && typeof savedItem.left === 'number' && savedItem.left > 0 && typeof savedItem.top === 'number' && savedItem.top > 0) {
                initialCoords[k] = { ...initialCoords[k], ...savedItem };
              }
            }
          });
        } catch (e) {}
      }
      setEditorCoords(initialCoords);

      const savedTop = parseFloat(localStorage.getItem(`pedigree_offset_${type}_top`) || '0');
      const savedLeft = parseFloat(localStorage.getItem(`pedigree_offset_${type}_left`) || '0');
      const savedScale = parseInt(localStorage.getItem(`pedigree_offset_${type}_scale`) || '100');
      const savedBold = localStorage.getItem(`pedigree_offset_${type}_bold`) !== 'false';
      
      setOffsetTop(savedTop);
      setOffsetLeft(savedLeft);
      setFontScale(savedScale);
      setFontBold(savedBold);

      setActivePrintType(type);
    } catch (err: any) {
      console.error(err);
      alert(`데이터 로드 실패: ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const loadOwnerHistory = async () => {
    if (pedigree.id) {
      try {
        const history = await fetchOwnerHistory(pedigree.id);
        const sorted = [...history].sort((a, b) => {
            const dateA = a.change_date || '0000-00-00';
            const dateB = b.change_date || '0000-00-00';
            return dateB.localeCompare(dateA);
        });
        setOwnerHistory(sorted);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    const loadLitterInfo = async () => {
        if (pedigree.dongtaeNo && pedigree.dongtaeNo !== '-' && pedigree.dongtaeNo.trim() !== '' && pedigree.dongtaeNo !== '0') {
            setIsLoadingLitter(true);
            try {
                const info = await fetchDongtaeInfo(pedigree.dongtaeNo);
                setLitterInfo(info);
            } catch (error) {
                console.error("Error loading litter info:", error);
            } finally {
                setIsLoadingLitter(false);
            }
        } else {
            setLitterInfo(null);
        }
    };
    
    const loadParentInfo = async () => {
        setIsLoadingParents(true);
        try {
            const sireVal = (pedigree.sireRegNo || '').toString().trim();
            const damVal = (pedigree.damRegNo || '').toString().trim();
            const sireSearch = (pedigree.sireRegNoText || sireVal);
            const damSearch = (pedigree.damRegNoText || damVal);
            
            const searchKeys = [sireSearch, damSearch, sireVal, damVal].filter(v => v !== '' && v !== '미등록' && v !== '0' && v !== '-');
            
            if (searchKeys.length > 0) {
                const fetched = await fetchDogsByKeys(searchKeys);
                const getDog = (key: string, backupKey?: string) => fetched[key] || (backupKey ? fetched[backupKey] : null);
                setSireInfo(getDog(sireSearch, sireVal));
                setDamInfo(getDog(damSearch, damVal));
            }
        } catch (err) {
            console.error("Parent load error:", err);
        } finally {
            setIsLoadingParents(false);
        }
    };

    loadLitterInfo();
    loadParentInfo();
    loadOwnerHistory();
    
    if (pedigree.regNo && String(pedigree.regNo).trim() !== '') {
      fetchPointsByRegNo(pedigree.regNo).then(setPointsList).catch(console.error);
      fetchPrizesByRegNo(pedigree.regNo).then(setPrizesList).catch(console.error);
    }
  }, [pedigree.id, tableName]);
  
  const getLitterValue = (key: keyof DongtaeInfo) => {
    if (isLoadingLitter) return '...';
    // 🛡️ 텍스트 필드와 숫자 필드의 기본값을 구분합니다.
    const isTextField = ['memo', 'spec_relate', 'dongtae_no', 'regno_start', 'regno_end'].includes(key);
    
    if (!litterInfo) return isTextField ? '-' : '0';
    
    const val = litterInfo[key];
    if (val !== undefined && val !== null) {
        const strVal = String(val).trim();
        if (strVal === "" || strVal === "null") return isTextField ? '-' : '0';
        return strVal;
    }
    return isTextField ? '-' : '0';
  };

  const handleDeleteHistory = async (uid: string) => {
    console.log("Preparing to delete owner history with UID:", uid);
    if (!uid) {
        alert("삭제할 항목의 식별자(UID)가 없습니다.");
        return;
    }
    
    setConfirmModal({
        isOpen: true,
        title: '변경 이력 삭제',
        message: '이 소유자 변경 기록을 정말 삭제하시겠습니까?',
        isDanger: true,
        onConfirm: async () => {
            try {
                const res = await deleteOwnerHistory(uid);
                console.log("Server response:", res);
                if (res && res.success) {
                    alert('삭제가 완료되었습니다.');
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    await loadOwnerHistory();
                } else {
                    alert('서버 응답 실패: ' + (res?.message || '알 수 없는 이유로 실패했습니다.'));
                }
            } catch (e: any) {
                console.error("Delete failed:", e);
                alert('삭제 실패: ' + (e.message || '알 수 없는 오류가 발생했습니다.'));
            }
        }
    });
  };

  const formatGender = (gender: string) => {
    if (!gender) return '-';
    const g = gender.toLowerCase().trim();
    if (g === 'm' || g === 'male' || gender === '수컷') return '수컷';
    if (g === 'f' || g === 'female' || gender === '암컷') return '암컷';
    return gender;
  };

  const thStyle = "px-2 py-2 text-left font-normal text-gray-500 bg-white border-b border-gray-100 text-[13px] w-[110px]";
  const tdStyle = "px-2 py-2 border-b border-gray-100 text-[13px] font-medium text-gray-800";
  const sectionTitleStyle = "px-4 py-2 bg-[#f8f9fa] border-b border-gray-200 font-bold text-gray-700 text-[14px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[1520px] h-[92vh] flex flex-col rounded-md shadow-2xl overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-[17px] font-bold text-gray-800">혈통서 상세 정보</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 bg-[#f0f2f5]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>기본 정보</div>
                   <table className="w-full"><tbody>
                       <tr><th className={thStyle}>등록번호</th><td className={tdStyle}><span className="font-bold">{pedigree.regNo || '-'}</span></td><th className={thStyle}>등록 타입</th><td className={tdStyle}>{pedigree.regType === 'D' ? '자견' : pedigree.regType === 'N' ? 'NR' : pedigree.regType || '-'}</td></tr>
                   </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>소유자, 번식자 정보</div>
                   <table className="w-full"><tbody>
                       <tr><th className={thStyle}>소유자명</th><td className={tdStyle}>{pedigree.owner || '-'}</td><th className={thStyle}>소유자 ID</th><td className={tdStyle}><span onClick={() => pedigree.ownerId && onEditOwner(pedigree.ownerId)} className="text-blue-500 cursor-pointer hover:underline font-bold">{pedigree.ownerId || '-'}</span></td></tr>
                       <tr><th className={thStyle}>연락처</th><td className={tdStyle}>{pedigree.ownerPhone || '-'}</td><th className={thStyle}>주소</th><td className={tdStyle}>{pedigree.ownerAddr || '-'}</td></tr>
                       <tr><th className={thStyle}>번식자명</th><td className={tdStyle}>{pedigree.breeder || '-'}</td><th className={thStyle}>번식자 ID</th><td className={tdStyle}>-</td></tr>
                       <tr><th className={thStyle}>연락처</th><td className={tdStyle}>{pedigree.breederPhone || '-'}</td><th className={thStyle}>주소</th><td className={tdStyle}>{pedigree.breederAddr || '-'}</td></tr>
                   </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>특이 사항 및 기타 정보</div>
                   <table className="w-full table-fixed"><tbody>
                       <tr><th className={thStyle}>고관절 검사</th><td className={tdStyle}>{pedigree.specBone || '-'}</td><th className={thStyle}>특이사항 (DNA)</th><td className={tdStyle}>{pedigree.specDna || '-'}</td></tr>
                       <tr><th className={thStyle}>종견인정평정</th><td className={tdStyle} colSpan={3}>{pedigree.okDate || (pedigree.okStat === 'Y' ? '기록 확인' : '-')}</td></tr>
                       <tr><th className={thStyle}>훈련</th><td className={tdStyle}>{pedigree.specTrain || '-'}</td><th className={thStyle}>근친번식</th><td className={tdStyle}>{pedigree.specRelate || '-'}</td></tr>
                       <tr>
                           <th className={thStyle}>수상 경력</th>
                           <td className={tdStyle} colSpan={3}>
                               <div>{pedigree.specWin || '-'}</div>
                               {pointsList.length > 0 && (
                                  <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded p-2 text-[11px] max-h-32 overflow-y-auto">
                                    <div className="font-bold text-blue-800 mb-1 border-b border-blue-200 pb-1 flex items-center gap-1"><Trophy size={11} className="text-yellow-500"/> 공식 도그쇼 포인트 내역 (point 테이블)</div>
                                    <ul className="space-y-1">
                                      {pointsList.map((pt: any) => (
                                        <li key={pt.id} className="text-gray-600 flex items-start gap-1">
                                          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                                          <span><span className="font-bold text-gray-800">{pt.title}</span> ({pt.regDate}) - <span className="text-blue-600 font-bold">{pt.points}P</span> / {pt.award}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                               )}
                           </td>
                       </tr>
                       <tr>
                           <th className={thStyle}>수상 경력2</th>
                           <td className={tdStyle} colSpan={3}>
                               <div>{pedigree.specWin2 || '-'}</div>
                               {prizesList.length > 0 && (
                                  <div className="mt-2 bg-indigo-50/50 border border-indigo-100 rounded p-2 text-[11px] max-h-32 overflow-y-auto">
                                    <div className="font-bold text-indigo-800 mb-1 border-b border-indigo-200 pb-1 flex items-center gap-1"><Trophy size={11} className="text-indigo-400"/> 공식 상력 기록 내역 (prize_dogTab)</div>
                                    <ul className="space-y-1">
                                      {prizesList.map((pz: any) => (
                                        <li key={pz.id} className="text-gray-600 flex items-start gap-1">
                                          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                                          <span><span className="font-bold text-gray-800">{pz.dogShowName}</span> ({pz.date}) - 심사위원: {pz.judge} / {pz.points}P</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                               )}
                           </td>
                       </tr>
                       <tr><th className={thStyle}>국내타단체번호</th><td className={tdStyle}>{pedigree.domesticNo || '-'}</td><th className={thStyle}>외국타단체번호</th><td className={tdStyle}>{pedigree.foreignNo || '-'}</td></tr>
                       <tr><th className={thStyle}>외국타단체번호2</th><td className={tdStyle}>{pedigree.foreignNo2 || '-'}</td><th className={thStyle}>마이크로칩번호</th><td className={tdStyle}>{pedigree.microchip || '-'}</td></tr>
                        <tr><th className={thStyle}>색인번호</th><td className={tdStyle} colSpan={3}><span className="text-blue-600 font-bold">{pedigree.indexNo || '-'}</span></td></tr>
                       <tr><th className={thStyle}>메모</th><td className={tdStyle} colSpan={3}>{pedigree.memo || '-'}</td></tr>
                   </tbody></table>
               </div>

               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>소유자 변경 이력</div>
                    <div className="p-0 bg-white min-h-[100px] max-h-[400px] overflow-y-auto">
                        {ownerHistory.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                                    <tr>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600">변경일자</th>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600">새 소유자</th>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600">소유자 ID</th>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600 text-center">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {ownerHistory.map((h, idx) => (
                                        <tr key={h.uid || idx} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-2.5 text-[12px] text-gray-500 font-medium">{h.change_date || h.sign_date}</td>
                                            <td className="px-4 py-2.5 text-[12px] text-gray-900 font-bold">{h.poss_name}</td>
                                            <td className="px-4 py-2.5 text-[12px]">
                                                <span 
                                                    onClick={() => h.poss_id && onEditOwner(h.poss_id)} 
                                                    className="text-blue-600 font-bold cursor-pointer hover:underline"
                                                >
                                                    {h.poss_id || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[12px] text-center">
                                                <button 
                                                    onClick={() => handleDeleteHistory(h.uid || (h as any).id)} 
                                                    className="text-red-500 hover:underline font-bold"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-24 flex flex-col items-center justify-center text-gray-400 italic text-[13px] px-4">
                                소유자 변경 이력이 없습니다.
                            </div>
                        )}
                    </div>
               </div>
            </div>
            <div className="space-y-5">
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>애견 정보</div>
                   <table className="w-full"><tbody>
                       <tr><th className={thStyle}>견명</th><td className={tdStyle}>{pedigree.name || '-'}</td><th className={thStyle}>풀네임</th><td className={tdStyle}>{pedigree.fullName || '-'}</td></tr>
                       <tr>
                            <th className={thStyle}>그룹</th>
                            <td className={tdStyle}>
                                {(() => {
                                    const found = dogClasses.find((c: any) => c.breed === pedigree.breed);
                                    return found ? found.group : (pedigree.group || '-');
                                })()}
                            </td>
                            <th className={thStyle}>견종</th>
                            <td className={tdStyle}>
                                {(() => {
                                    const found = dogClasses.find((c: any) => c.breed === pedigree.breed);
                                    if (found) {
                                        return (
                                            <div className="flex flex-col">
                                                <span className="text-blue-600 font-bold text-[11px]">{found.keyy}</span>
                                                <span className="font-bold">{pedigree.breed}</span>
                                            </div>
                                        );
                                    }
                                    return pedigree.breed || '-';
                                })()}
                            </td>
                        </tr>
                       <tr><th className={thStyle}>성별</th><td className={tdStyle}>{formatGender(pedigree.gender)}</td><th className={thStyle}>생년월일</th><td className={tdStyle}>{pedigree.birthDate || '-'}</td></tr>
                       <tr><th className={thStyle}>모색</th><td className={tdStyle}>{pedigree.color || '-'}</td><th className={thStyle}>모종</th><td className={tdStyle}>{pedigree.coatType || '-'}</td></tr>
                       <tr><th className={thStyle}>견사호</th><td className={tdStyle}>{pedigree.kennel || '-'}</td><th className={thStyle}>견사호(영문)</th><td className={tdStyle}>{pedigree.kennelNameEng || '-'}</td></tr>
                   </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                    <div className={sectionTitleStyle}>부모견 정보</div>
                    <table className="w-full table-fixed"><tbody>
                        <tr className="bg-blue-50/20 border-b border-gray-100">
                            <th className={thStyle}>부견 UID</th>
                            <td className={tdStyle}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-blue-700 font-bold">{pedigree.sireRegNo || '-'}</span>
                                    <button 
                                        onClick={() => pedigree.sireRegNo && onViewPedigreeByUid?.(pedigree.sireRegNo)}
                                        className="bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0 flex items-center gap-1"
                                    >
                                        <Search size={11} /> 정보보기
                                    </button>
                                </div>
                            </td>
                            <th className={thStyle}><div className="flex items-center gap-1.5 font-bold">{sireInfo ? <Check size={14} className="text-blue-500" /> : <div className="w-3 h-3 bg-gray-100 rounded-full" />}부견 등록번호</div></th>
                            <td className={tdStyle}><span className="text-gray-900 font-bold">{sireInfo?.reg_no || pedigree.sireRegNoText || (isLoadingParents ? '조회중...' : '-')}</span></td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <th className={thStyle}>부견명</th>
                            <td colSpan={3} className="px-3 py-2.5 border-b border-gray-100 text-[13px] font-bold text-blue-800 bg-white">
                                {sireInfo?.fullname || sireInfo?.name || pedigree.sireNameText || '-'}
                            </td>
                        </tr>
                        <tr className="bg-pink-50/20 border-t-2 border-gray-100">
                            <th className={thStyle}>모견 UID</th>
                            <td className={tdStyle}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-pink-700 font-bold">{pedigree.damRegNo || '-'}</span>
                                    <button 
                                        onClick={() => pedigree.damRegNo && onViewPedigreeByUid?.(pedigree.damRegNo)}
                                        className="bg-white border border-pink-200 text-pink-600 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-pink-600 hover:text-white transition-all shadow-sm shrink-0 flex items-center gap-1"
                                    >
                                        <Search size={11} /> 정보보기
                                    </button>
                                </div>
                            </td>
                            <th className={thStyle}><div className="flex items-center gap-1.5 font-bold">{damInfo ? <Check size={14} className="text-pink-500" /> : <div className="w-3 h-3 bg-gray-100 rounded-full" />}모견 등록번호</div></th>
                            <td className={tdStyle}><span className="text-gray-900 font-bold">{damInfo?.reg_no || pedigree.damRegNoText || (isLoadingParents ? '조회중...' : '-')}</span></td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <th className={thStyle}>모견명</th>
                            <td colSpan={3} className="px-3 py-2.5 border-b border-gray-100 text-[13px] font-bold text-pink-800 bg-white">
                                {damInfo?.fullname || damInfo?.name || pedigree.damNameText || '-'}
                            </td>
                        </tr>
                    </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>동태 정보</div>
                   <table className="w-full table-fixed"><tbody>
                        <tr><th className={thStyle}>동태자 코드</th><td className={tdStyle}>{getLitterValue('dongtae_no') || pedigree.dongtaeNo || '-'}</td><th className={thStyle}>근친 번식</th><td className={tdStyle}>{getLitterValue('spec_relate') && getLitterValue('spec_relate') !== '-' ? getLitterValue('spec_relate') : (pedigree.specRelate || '-')}</td></tr>
                        <tr><th className={thStyle}>시작 등록번호</th><td className={tdStyle}>{getLitterValue('regno_start')}</td><th className={thStyle}>끝 등록번호</th><td className={tdStyle}>{getLitterValue('regno_end')}</td></tr>
                        <tr><th className={thStyle}>출산(수컷)</th><td className={tdStyle}>{getLitterValue('birth_M')}</td><th className={thStyle}>출산(암컷)</th><td className={tdStyle}>{getLitterValue('birth_F')}</td></tr>
                        <tr><th className={thStyle}>등록건(수컷)</th><td className={tdStyle}>{getLitterValue('reg_count_M')}</td><th className={thStyle}>등록건(암컷)</th><td className={tdStyle}>{getLitterValue('reg_count_F')}</td></tr>
                        <tr><th className={thStyle}>비고</th><td className={tdStyle} colSpan={3}>{getLitterValue('memo')}</td></tr>
                   </tbody></table>
               </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-[#f8f9fa] flex justify-end items-center gap-2 shrink-0">
            <button onClick={() => onOpenDongtaeForm(pedigree.dongtaeNo, pedigree.id)} className="px-4 py-1.5 bg-[#4b5563] text-white text-[13px] font-medium rounded hover:bg-gray-700 transition-colors shadow-sm">동태정보 입력</button>
            
            {/* 3종 인쇄 버튼 */}
            <div className="flex gap-1.5 ml-4">
              <button 
                onClick={() => handlePrint('shepherd')} 
                disabled={isPrinting}
                className="px-4 py-1.5 bg-blue-600 text-white text-[13px] font-bold rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1 disabled:bg-blue-300"
              >
                {isPrinting ? <Loader2 size={14} className="animate-spin" /> : null}
                셰퍼드 인쇄
              </button>
              <button 
                onClick={() => handlePrint('jindo')} 
                disabled={isPrinting}
                className="px-4 py-1.5 bg-green-600 text-white text-[13px] font-bold rounded hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1 disabled:bg-green-300"
              >
                {isPrinting ? <Loader2 size={14} className="animate-spin" /> : null}
                진돗개 인쇄
              </button>
              <button 
                onClick={() => handlePrint('general')} 
                disabled={isPrinting}
                className="px-4 py-1.5 bg-amber-600 text-white text-[13px] font-bold rounded hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-1 disabled:bg-amber-300"
              >
                {isPrinting ? <Loader2 size={14} className="animate-spin" /> : null}
                일반/리트리버 인쇄
              </button>
            </div>

            <button onClick={() => onDelete(pedigree.id)} className="px-6 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[13px] font-bold rounded hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm ml-auto">삭제하기</button>
            <button onClick={() => onEdit(pedigree)} className="px-6 py-1.5 bg-[#374151] text-white text-[13px] font-bold rounded hover:bg-black transition-all ml-2 shadow-md">수정하기</button>
        </div>
      </div>

      {activePrintType && (() => {
        const layout = DEFAULT_PEDIGREE_LAYOUTS[activePrintType];
        const isLandscape = layout.isLandscape;
        const pageWidthMm = isLandscape ? 297 : 210;
        const pageHeightMm = isLandscape ? 210 : 297;
        
        const offsetTopMm = `${offsetTop}mm`;
        const offsetLeftMm = `${offsetLeft}mm`;
        
        return (
          <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between font-sans text-slate-200">
            {/* Top Toolbar */}
            <div className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xl shrink-0">
              <div className="flex items-center gap-3">
                <Printer className="text-indigo-400 animate-pulse" size={22} />
                <div>
                  <h3 className="font-bold text-base text-white">{layout.title} 정밀 보정 에디터</h3>
                  <p className="text-xs text-slate-400">마우스 드래그 및 방향키(이동), 대괄호 [ ] (글자 크기) 조절 가능</p>
                </div>
              </div>

              {/* Status & Help Alert */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-md border border-slate-700 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-slate-300 font-semibold">
                  {selectedFieldKey ? (
                    <span className="text-indigo-300">
                      선택 필드: <strong className="text-white">{selectedFieldKey}</strong> ({useSampleMode ? getSampleValue(selectedFieldKey, activePrintType) : getRealValue(selectedFieldKey, activePrintType)})
                    </span>
                  ) : "편집할 필드를 클릭하여 선택하세요"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 mr-2"
                >
                  {isSidebarOpen ? "사이드바 접기 ◀" : "사이드바 열기 ▶"}
                </button>
                <button 
                  onClick={handleResetCoords}
                  className="px-3.5 py-1.5 bg-rose-950/50 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white rounded text-xs font-bold transition-all"
                >
                  기초 초기화
                </button>
                <button 
                  onClick={handleCopyCoords}
                  className="px-3.5 py-1.5 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 hover:text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Copy size={13} /> 좌표 JSON 복사
                </button>
                <button 
                  onClick={handlePrintAction}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Printer size={13} /> 인쇄하기
                </button>
                <button 
                  onClick={() => setActivePrintType(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded text-xs font-bold transition-all"
                >
                  닫기
                </button>
              </div>
            </div>

            {/* Sidebar Controls & Content Layout */}
            <div className="w-full flex flex-1 overflow-hidden">
              {/* Sidebar */}
              {isSidebarOpen && (
                <div className="w-80 bg-slate-900/50 border-r border-slate-800/80 p-5 flex flex-col gap-5 overflow-y-auto shrink-0 font-sans">
                  {/* 1. Selected Field Detail Settings (개별 조정) - 최상위 배치 */}
                  {selectedFieldKey ? (() => {
                    const coord = editorCoords[selectedFieldKey] || { left: 0, top: 0, fontSize: 0.95 };
                    const val = useSampleMode ? getSampleValue(selectedFieldKey, activePrintType!) : getRealValue(selectedFieldKey, activePrintType!);
                    
                    const handleUpdateCoord = (updates: Partial<typeof coord>) => {
                      setEditorCoords(prev => {
                        const next = {
                          ...prev,
                          [selectedFieldKey]: {
                            ...prev[selectedFieldKey],
                            ...updates
                          }
                        };
                        localStorage.setItem(`pedigree_coords_${activePrintType}`, JSON.stringify(next));
                        return next;
                      });
                    };

                    return (
                      <div className="flex flex-col gap-3 bg-slate-800/60 p-4 rounded-lg border-2 border-amber-500/80 shadow-2xl">
                        <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          🎯 [개별 설정] 선택 필드 글자크기/위치
                        </h4>
                        <div className="text-[11px] text-white truncate bg-slate-950/80 p-2 rounded border border-slate-800">
                          <strong className="text-amber-300">선택됨:</strong> {selectedFieldKey} <br/>
                          <span className="text-slate-400 text-[10px]">내용: {val || '(빈값)'}</span>
                        </div>

                        {/* Font Size Selector */}
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1 font-semibold flex justify-between">
                            <span>글자 크기 (em)</span>
                            <span className="text-amber-400 font-bold">{coord.fontSize || 0.95} em</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleUpdateCoord({ fontSize: parseFloat(Math.max(0.1, (coord.fontSize || 0.95) - 0.05).toFixed(2)) })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 hover:border-amber-500/50 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              step="0.01" 
                              min="0.1"
                              value={coord.fontSize || 0.95} 
                              onChange={e => handleUpdateCoord({ fontSize: parseFloat(parseFloat(e.target.value).toFixed(2)) || 0.95 })}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded h-7 text-center text-xs text-white font-bold" 
                            />
                            <button 
                              onClick={() => handleUpdateCoord({ fontSize: parseFloat(((coord.fontSize || 0.95) + 0.05).toFixed(2)) })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 hover:border-amber-500/50 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Width Selector */}
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1 font-semibold flex justify-between">
                            <span>가로 너비 (mm)</span>
                            <span className="text-slate-400">{coord.width ? `${coord.width} mm` : '자동'}</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleUpdateCoord({ width: Math.max(0, (coord.width || 0) - 1) })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              step="1" 
                              min="0"
                              placeholder="자동"
                              value={coord.width || ''} 
                              onChange={e => handleUpdateCoord({ width: parseInt(e.target.value) || undefined })}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded h-7 text-center text-xs text-white font-bold" 
                            />
                            <button 
                              onClick={() => handleUpdateCoord({ width: (coord.width || 0) + 1 })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Left position */}
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1 font-semibold flex justify-between">
                            <span>가로 위치 (left, mm)</span>
                            <span className="text-slate-400">{coord.left} mm</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleUpdateCoord({ left: parseFloat((coord.left - 0.5).toFixed(2)) })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              step="0.1" 
                              value={coord.left} 
                              onChange={e => handleUpdateCoord({ left: parseFloat(parseFloat(e.target.value).toFixed(2)) || 0 })}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded h-7 text-center text-xs text-white font-bold" 
                            />
                            <button 
                              onClick={() => handleUpdateCoord({ left: parseFloat((coord.left + 0.5).toFixed(2)) })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Top position */}
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1 font-semibold flex justify-between">
                            <span>세로 위치 (top, mm)</span>
                            <span className="text-slate-400">{coord.top} mm</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleUpdateCoord({ top: parseFloat((coord.top - 0.5).toFixed(2)) })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              step="0.1" 
                              value={coord.top} 
                              onChange={e => handleUpdateCoord({ top: parseFloat(parseFloat(e.target.value).toFixed(2)) || 0 })}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded h-7 text-center text-xs text-white font-bold" 
                            />
                            <button 
                              onClick={() => handleUpdateCoord({ top: parseFloat((coord.top + 0.5).toFixed(2)) })}
                              className="w-7 h-7 bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-xs font-bold rounded flex items-center justify-center transition-all text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800 text-center py-6 text-xs text-slate-400">
                      💡 화면에서 보정할 단어(글자)를 마우스로 클릭하시면 여기에 <strong className="text-amber-400">"개별 글자 크기 조절"</strong> 패널이 열립니다!
                    </div>
                  )}

                  {/* 2. Global Calibration */}
                  <div className="flex flex-col gap-3.5 bg-slate-800/40 p-4 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-wider">⚠️ 전체 모든 글자 일괄 오차 조정</h4>
                    
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">전체 상하 이동 (mm)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={offsetTop} 
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setOffsetTop(val);
                          localStorage.setItem(`pedigree_offset_${activePrintType}_top`, val.toString());
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white font-bold" 
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">전체 좌우 이동 (mm)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={offsetLeft} 
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setOffsetLeft(val);
                          localStorage.setItem(`pedigree_offset_${activePrintType}_left`, val.toString());
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white font-bold" 
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 text-rose-400 font-bold">⚠️ 전체 모든 글자 크기 배율 (%)</label>
                      <input 
                        type="number" 
                        step="1" 
                        value={fontScale} 
                        onChange={e => {
                          const val = parseInt(e.target.value) || 100;
                          setFontScale(val);
                          localStorage.setItem(`pedigree_offset_${activePrintType}_scale`, val.toString());
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white font-bold" 
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 py-1 border-t border-slate-800">
                      <span className="text-xs text-slate-300 font-sans">전체 폰트 두껍게 출력</span>
                      <input 
                        type="checkbox" 
                        checked={fontBold}
                        onChange={e => {
                          setFontBold(e.target.checked);
                          localStorage.setItem(`pedigree_offset_${activePrintType}_bold`, e.target.checked.toString());
                        }}
                        className="w-4.5 h-4.5 cursor-pointer rounded accent-indigo-500 bg-slate-950 border-slate-800" 
                      />
                    </div>
                  </div>

                  {/* 3. Editor Settings */}
                  <div className="flex flex-col gap-3.5 bg-slate-800/40 p-4 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">3. 에디터 뷰 컨트롤</h4>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">화면 줌 스케일 ({Math.round(editorZoom * 100)}%)</label>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditorZoom(prev => Math.max(0.4, parseFloat((prev - 0.1).toFixed(2))))} 
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded"
                        >
                          -
                        </button>
                        <input 
                          type="range" 
                          min="0.4" 
                          max="2.5" 
                          step="0.05"
                          value={editorZoom} 
                          onChange={e => setEditorZoom(parseFloat(e.target.value))}
                          className="flex-1 accent-indigo-500 bg-slate-950" 
                        />
                        <button 
                          onClick={() => setEditorZoom(prev => Math.min(2.5, parseFloat((prev + 0.1).toFixed(2))))} 
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">그리드 스냅 (Grid Snap)</label>
                      <select 
                        value={gridSize} 
                        onChange={e => setGridSize(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                      >
                        <option value="0">그리드 끔 (자유 이동)</option>
                        <option value="0.5">0.5 mm 스냅</option>
                        <option value="1">1.0 mm 스냅</option>
                        <option value="2">2.0 mm 스냅</option>
                        <option value="5">5.0 mm 스냅</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-1 pt-2.5 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">배경 가이드 백지 투명화</span>
                        <input 
                          type="checkbox" 
                          checked={showGuide}
                          onChange={e => setShowGuide(e.target.checked)}
                          className="w-4.5 h-4.5 cursor-pointer rounded accent-indigo-500" 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-semibold text-emerald-400">🎯 대상견 샘플 데이터 대조</span>
                        <input 
                          type="checkbox" 
                          checked={useSampleMode}
                          onChange={e => setUseSampleMode(e.target.checked)}
                          className="w-4.5 h-4.5 cursor-pointer rounded accent-emerald-500" 
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-semibold text-amber-400 font-sans">🛠️ 마우스 드래그 좌표 이동</span>
                        <input 
                          type="checkbox" 
                          checked={isEditingCoords}
                          onChange={e => setIsEditingCoords(e.target.checked)}
                          className="w-4.5 h-4.5 cursor-pointer rounded accent-amber-500" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Helper Info */}
                  <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800 text-xs leading-relaxed text-slate-400">
                    <h4 className="font-bold text-xs text-slate-300 mb-2">💡 미세조정 단축키</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>필드를 선택하고 <strong className="text-slate-200">방향키(← → ↑ ↓)</strong>를 입력하면 <strong className="text-white">0.1mm</strong> 단위로 미세 이동합니다.</li>
                      <li><strong className="text-slate-200">Shift + 방향키</strong> 입력시 <strong className="text-white">0.5mm</strong> 단위로 빠르게 이동합니다.</li>
                      <li><strong className="text-slate-200">[ ] (대괄호)</strong> 키로 개별 글자 크기 배율을 조절합니다. (<strong className="text-slate-200">Shift + [ ]</strong>은 대폭 조절)</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Workspace / Canvas Area */}
              <div className="flex-1 bg-slate-950 overflow-auto p-8 flex items-start justify-center">
                <div 
                  style={{
                    width: `${pageWidthMm * editorZoom}mm`,
                    height: `${pageHeightMm * editorZoom}mm`,
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  <div 
                    id="pedigree-canvas"
                    className="bg-white text-black absolute top-0 left-0 border-4 border-indigo-900/40 shadow-2xl transition-all origin-top-left"
                    style={{
                      width: `${pageWidthMm}mm`,
                      height: `${pageHeightMm}mm`,
                      transform: `scale(${editorZoom})`,
                      backgroundImage: showGuide ? `url('${layout.bgImage}')` : 'none',
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      boxSizing: 'content-box'
                    }}
                  >
                    {/* Grid Overlay */}
                    {gridSize > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none" 
                        style={{
                          backgroundImage: `
                            linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
                          `,
                          backgroundSize: `${gridSize}mm ${gridSize}mm`
                        }}
                      />
                    )}

                    {/* Print Offset Margin Preview Box */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        transform: `translate(${offsetLeftMm}, ${offsetTopMm})`,
                        fontSize: `calc(9pt * (${fontScale} / 100))`,
                        fontWeight: fontBold ? 'bold' : 'normal',
                        lineHeight: 1.15
                      }}
                    >
                      {/* Render Coordinates */}
                      {Object.keys(editorCoords).map(key => {
                        const coord = editorCoords[key];
                        const val = useSampleMode ? getSampleValue(key, activePrintType) : getRealValue(key, activePrintType);
                        const isSelected = selectedFieldKey === key;
                        const isBold = key === 'dog_name' || key === 'reg_no' || key === 'microchip' || key.endsWith('_name');
                        
                        let nodeId: number | null = null;
                        if (key.startsWith('ancestor_')) {
                          const match = key.match(/^ancestor_(\d+)_/);
                          if (match) nodeId = parseInt(match[1]);
                        }

                        let selectedNodeId: number | null = null;
                        if (selectedFieldKey && selectedFieldKey.startsWith('ancestor_')) {
                          const match = selectedFieldKey.match(/^ancestor_(\d+)_/);
                          if (match) selectedNodeId = parseInt(match[1]);
                        }

                        // Generation colors (Transparent background, only borders)
                        // Split into Sire side (Cool colors) vs Dam side (Warm colors)
                        let genStyle = 'bg-transparent border-gray-300 text-gray-800';
                        if (nodeId !== null) {
                          let isSireSide = false;
                          let temp = nodeId;
                          while (temp > 1) {
                            if (temp === 2) {
                              isSireSide = true;
                              break;
                            }
                            temp = Math.floor(temp / 2);
                          }

                          if (isSireSide) {
                            // Sire Lineage: Cool Colors
                            if (nodeId === 2) {
                              genStyle = 'bg-transparent border-blue-600 text-blue-900 font-bold'; // 1대 부
                            } else if (nodeId >= 4 && nodeId <= 5) {
                              genStyle = 'bg-transparent border-cyan-500 text-cyan-900'; // 2대 부계
                            } else if (nodeId >= 8 && nodeId <= 11) {
                              genStyle = 'bg-transparent border-teal-500 text-teal-900'; // 3대 부계
                            } else if (nodeId >= 16 && nodeId <= 23) {
                              genStyle = 'bg-transparent border-indigo-400 text-indigo-900'; // 4대 부계
                            }
                          } else {
                            // Dam Lineage: Warm Colors
                            if (nodeId === 3) {
                              genStyle = 'bg-transparent border-pink-600 text-pink-900 font-bold'; // 1대 모
                            } else if (nodeId >= 6 && nodeId <= 7) {
                              genStyle = 'bg-transparent border-rose-400 text-rose-900'; // 2대 모계
                            } else if (nodeId >= 12 && nodeId <= 15) {
                              genStyle = 'bg-transparent border-fuchsia-400 text-fuchsia-900'; // 3대 모계
                            } else if (nodeId >= 24 && nodeId <= 31) {
                              genStyle = 'bg-transparent border-amber-500 text-amber-950'; // 4대 모계
                            }
                          }
                        }

                        let highlightStyle = '';
                        let opacityStyle = ''; // No opacity fade-out

                        if (selectedFieldKey) {
                          if (isSelected) {
                            highlightStyle = 'ring-2 ring-indigo-600 bg-indigo-50/20 text-indigo-950 font-extrabold z-[999] scale-105 shadow-md border-indigo-600';
                          } else if (nodeId !== null && nodeId === selectedNodeId) {
                            highlightStyle = 'border-dashed border-indigo-500 text-indigo-950 ring-1 ring-indigo-400 z-[99]';
                          }
                        } else {
                          highlightStyle = 'hover:border-amber-400';
                        }

                        return (
                          <div
                            key={key}
                            onMouseDown={e => handleDragStart(e, key)}
                            className={`absolute select-none pointer-events-auto border transition-all text-left whitespace-nowrap
                              ${isEditingCoords ? 'cursor-move' : 'cursor-pointer'}
                              ${key.startsWith('ancestor_') ? '' : 'truncate'}
                              ${genStyle} ${highlightStyle} ${opacityStyle}
                            `}
                            style={{
                              left: `${coord.left}mm`,
                              top: `${coord.top}mm`,
                              fontSize: `${coord.fontSize || 0.95}em`,
                              fontWeight: isBold ? 'bold' : 'inherit',
                              width: (coord.width && !key.startsWith('ancestor_')) ? `${coord.width}mm` : 'auto',
                              padding: '1px 2px',
                              minHeight: '4mm'
                            }}
                            title={`[${key}] L:${coord.left} T:${coord.top} S:${coord.fontSize || 0.95}`}
                          >
                            {val || <span className="text-[7pt] text-rose-500 opacity-60 italic">({key} 빈값)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Footer Info */}
            <div className="w-full bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>KKF Admin Dashboard • High-Performance Pedigree Print Calibration Module</span>
              <span>A4 Dimensions: {pageWidthMm}mm × {pageHeightMm}mm (1:1 Ratio)</span>
            </div>
          </div>
        );
      })()}

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
};
