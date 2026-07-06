
import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, Trophy, Search } from 'lucide-react';
import { Pedigree, DongtaeInfo, ParentDogInfo, Evaluation, OwnerHistory } from '../types';
import { fetchDogsByUids, fetchPointsByRegNo, fetchPrizesByRegNo, fetchOwnerHistory, deleteOwnerHistory, fetchBridge } from '../services/memberService';
import { fetchDongtaeInfo } from '../services/dongtaeService'; // 👈 분리된 서비스 참조
import { AlertCircle } from 'lucide-react';

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

  const formatDateKr = (dateStr: string) => {
    if (!dateStr || dateStr === '0000-00-00') return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
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

  const openPrintPreview = (type: 'shepherd' | 'jindo' | 'general', tree: Record<number, ParentDogInfo>, fullLitterList: string) => {

    const layouts = {
      shepherd: {
        title: '저먼 셰퍼드 혈통서 인쇄',
        bgImage: '/pedigree_templates/KakaoTalk_20260706_141939066.jpg',
      },
      jindo: {
        title: '진돗개 혈통서 인쇄',
        bgImage: '/pedigree_templates/KakaoTalk_20260706_141920649.jpg',
      },
      general: {
        title: '일반/리트리버 혈통서 인쇄',
        bgImage: '/pedigree_templates/KakaoTalk_20260706_141944995.jpg',
      }
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

    const targetLayout = layouts[type];
    let fieldsHtml = '';
    
    const getDogDisplay = (nodeId: number) => {
      const dog = tree[nodeId];
      if (!dog) return { name: '', reg: '', extra: '' };
      
      const name = dog.fullname || dog.name || '';
      const reg = dog.reg_no || '';
      const extraList = [dog.spec_bone, dog.spec_train, getColorAbbr(dog.hair)].filter(Boolean);
      const extra = extraList.join(' / ');
      
      return { name, reg, extra };
    };

    function renderShepherdAncestor(nodeId: number, left: string, top: string, width: string = '48mm', height: string = '12mm', gen: number | boolean = 1) {
      const { name, reg, extra } = getDogDisplay(nodeId);
      const s = shepherdSamples[nodeId] || { name: '', reg: '', extra: '' };
      
      let actualGen = 1;
      if (typeof gen === 'boolean') {
        actualGen = gen ? 4 : 1;
      } else {
        actualGen = gen;
      }

      let nameSz = '0.9em';
      let regSz = '0.75em';
      let extraSz = '0.7em';
      
      let regOffset = 4.5;
      let extraOffset = 8.5;
      
      if (actualGen === 2) {
        nameSz = '0.83em';
        regSz = '0.72em';
        extraSz = '0.67em';
        regOffset = 3.8;
        extraOffset = 7.2;
      } else if (actualGen === 3) {
        nameSz = '0.78em';
        regSz = '0.68em';
        regOffset = 3.3;
      } else if (actualGen === 4) {
        nameSz = '0.72em';
        regSz = '0.61em';
        regOffset = 2.8;
      }

      const lVal = parseFloat(left) || 0;
      const tVal = parseFloat(top) || 0;
      const unit = 'mm';

      const nameLeft = `${lVal}${unit}`;
      const nameTop = `${tVal}${unit}`;
      const regLeft = `${lVal}${unit}`;
      const regTop = `${tVal + regOffset}${unit}`;
      const extraLeft = `${lVal}${unit}`;
      const extraTop = `${tVal + extraOffset}${unit}`;

      return `
        <!-- 조상 ${nodeId} 견명 -->
        <div class="field" 
             data-key="ancestor_${nodeId}_name"
             data-real="${name}"
             data-sample="${s.name}"
             style="left: ${nameLeft}; top: ${nameTop}; font-size: ${nameSz}; font-weight: bold; width: ${width}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${name}
        </div>
        <!-- 조상 ${nodeId} 등록번호 -->
        <div class="field" 
             data-key="ancestor_${nodeId}_reg"
             data-real="${reg}"
             data-sample="${s.reg}"
             style="left: ${regLeft}; top: ${regTop}; font-size: ${regSz}; width: ${width}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${reg}
        </div>
        ${actualGen <= 2 && extra ? `
        <!-- 조상 ${nodeId} 추가정보 -->
        <div class="field" 
             data-key="ancestor_${nodeId}_extra"
             data-real="${extra}"
             data-sample="${s.extra || ''}"
             style="left: ${extraLeft}; top: ${extraTop}; font-size: ${extraSz}; color: #334155; width: ${width}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${extra}
        </div>
        ` : ''}
      `;
    }

    if (type === 'shepherd') {
      fieldsHtml = `
        <!-- 본견 기본 정보 -->
        <div class="field" data-key="dog_name" data-real="${pedigree.fullName || pedigree.name || '-'}" data-sample="Xamo vom Grafenbrunn" style="left: 34.0mm; top: 31.0mm; font-weight: bold; font-size: 1.05em;">${pedigree.fullName || pedigree.name || '-'}</div>
        
        <div class="field" data-key="dog_gender" data-real="${pedigree.gender === 'M' ? 'MALE (수컷)' : 'FEMALE (암컷)'}" data-sample="MALE (수컷)" style="left: 34.0mm; top: 41.5mm; font-size: 0.95em;">${pedigree.gender === 'M' ? 'MALE (수컷)' : 'FEMALE (암컷)'}</div>
        <div class="field" data-key="dog_coat" data-real="${pedigree.coatType || 'stock hair'}" data-sample="stock hair" style="left: 92.0mm; top: 41.5mm; font-size: 0.95em;">${pedigree.coatType || 'stock hair'}</div>
        
        <div class="field" data-key="dog_color" data-real="${pedigree.color || '-'}" data-sample="schwarz braun" style="left: 34.0mm; top: 52.0mm; font-size: 0.95em;">${pedigree.color || '-'}</div>
        
        <div class="field" data-key="dog_birth" data-real="${formatDateKr(pedigree.birthDate)}" data-sample="2012년 11월 28일" style="left: 34.0mm; top: 62.5mm; font-size: 0.95em;">${formatDateKr(pedigree.birthDate)}</div>
        <div class="field" data-key="dog_join" data-real="${pedigree.joinDate || '-'}" data-sample="2012-11-28" style="left: 92.0mm; top: 62.5mm; font-size: 0.95em;">${pedigree.joinDate || '-'}</div>
        
        <div class="field" data-key="dog_owner_change" data-real="${ownerHistory[0]?.change_date || '-'}" data-sample="2025-10-19" style="left: 92.0mm; top: 73.0mm; font-size: 0.95em;">${ownerHistory[0]?.change_date || '-'}</div>

        <!-- 번식자/소유자 정보 (좌측 상단에 위치) -->
        <div class="field" data-key="dog_breeder" data-real="${pedigree.breeder || '-'}" data-sample="Dirk Scheerer" style="left: 34.0mm; top: 73.0mm; font-weight: bold; font-size: 0.95em;">${pedigree.breeder || '-'}</div>
        <div class="field" data-key="dog_breeder_addr" data-real="${pedigree.breederAddr || '-'}" data-sample="Bergweg 3, 56179 Vallendar" style="left: 34.0mm; top: 77.5mm; font-size: 0.78em; max-width: 55mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pedigree.breederAddr || '-'}</div>
        
        <div class="field" data-key="dog_owner" data-real="${pedigree.owner || '-'}" data-sample="김기원" style="left: 34.0mm; top: 85.0mm; font-weight: bold; font-size: 0.95em;">${pedigree.owner || '-'}</div>
        <div class="field" data-key="dog_owner_addr" data-real="${pedigree.ownerAddr || '-'}" data-sample="경남 김해시 삼계동" style="left: 34.0mm; top: 89.5mm; font-size: 0.78em; max-width: 55mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pedigree.ownerAddr || '-'}</div>

        <!-- 중앙 회색 박스 등록번호 정보 -->
        <div class="field" data-key="reg_no" data-real="${pedigree.regNo || '-'}" data-sample="KSZ-C40386" style="left: 146mm; top: 43.5mm; font-weight: bold; color: #1e3a8a; font-size: 1.0em;">${pedigree.regNo || '-'}</div>
        <div class="field" data-key="microchip" data-real="${pedigree.microchip || '-'}" data-sample="410160010795337" style="left: 146mm; top: 54.0mm; font-weight: bold; font-size: 1.0em;">${pedigree.microchip || '-'}</div>
        <div class="field" data-key="foreign_no" data-real="${pedigree.foreignNo || pedigree.domesticNo || '-'}" data-sample="SZ-2385565 SZ-독일세퍼드협회 전용 코드" style="left: 146mm; top: 64.5mm; font-size: 0.95em;">${pedigree.foreignNo || pedigree.domesticNo || '-'}</div>
        <div class="field" data-key="dongtae_no" data-real="${pedigree.dongtaeNo || '-'}" data-sample="Xamo sb / KSZ-C40386" style="left: 146mm; top: 75.0mm; font-size: 0.9em; max-width: 42mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pedigree.dongtaeNo || '-'}</div>

        <!-- 4대 혈통도 계보 (30 Ancestors) -->
        <!-- 1대 (Parents) -->
        ${renderShepherdAncestor(2, '18mm', '86.0mm', '50mm', '13mm', 1)} <!-- 부견 -->
        ${renderShepherdAncestor(3, '18mm', '143.0mm', '50mm', '13mm', 1)} <!-- 모견 -->

        <!-- 2대 (Grandparents) -->
        ${renderShepherdAncestor(4, '74mm', '76.0mm', '50mm', '11mm', 2)}
        ${renderShepherdAncestor(5, '74mm', '104.0mm', '50mm', '11mm', 2)}
        ${renderShepherdAncestor(6, '74mm', '133.0mm', '50mm', '11mm', 2)}
        ${renderShepherdAncestor(7, '74mm', '161.0mm', '50mm', '11mm', 2)}

        <!-- 3대 (Great-grandparents) -->
        ${renderShepherdAncestor(8, '132mm', '69.5mm', '50mm', '9mm', 3)}
        ${renderShepherdAncestor(9, '132mm', '83.5mm', '50mm', '9mm', 3)}
        ${renderShepherdAncestor(10, '132mm', '97.5mm', '50mm', '9mm', 3)}
        ${renderShepherdAncestor(11, '132mm', '111.5mm', '50mm', '9mm', 3)}
        ${renderShepherdAncestor(12, '132mm', '126.0mm', '50mm', '9mm', 3)}
        ${renderShepherdAncestor(13, '132mm', '140.0mm', '50mm', '9mm', 3)}
        ${renderShepherdAncestor(14, '132mm', '154.0mm', '50mm', '9mm', 3)}
        ${renderShepherdAncestor(15, '132mm', '168.0mm', '50mm', '9mm', 3)}

        <!-- 4대 (Great-great-grandparents) -->
        ${renderShepherdAncestor(16, '188mm', '67.0mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(17, '188mm', '73.8mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(18, '188mm', '80.6mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(19, '188mm', '87.4mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(20, '188mm', '94.2mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(21, '188mm', '101.0mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(22, '188mm', '107.8mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(23, '188mm', '114.6mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(24, '188mm', '121.4mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(25, '188mm', '128.2mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(26, '188mm', '135.0mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(27, '188mm', '141.8mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(28, '188mm', '148.6mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(29, '188mm', '155.4mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(30, '188mm', '162.2mm', '50mm', '6.8mm', 4)}
        ${renderShepherdAncestor(31, '188mm', '169.0mm', '50mm', '6.8mm', 4)}

        <!-- 우측 상단 평가 및 출생 통계 정보 -->
        <div class="field" data-key="ok_date" data-real="${pedigree.okDate || '-'}" data-sample="2025-04 ~ 2027-04" style="left: 210.5mm; top: 13.5mm; font-size: 0.85em;">${pedigree.okDate || '-'}</div>
        <div class="field" data-key="birth_litter" data-real="Male: ${getLitterValue('birth_M')} / Female: ${getLitterValue('birth_F')}" data-sample="Male: 2 / Female: 3" style="left: 228mm; top: 41.5mm; font-size: 0.85em;">Male: ${getLitterValue('birth_M')} / Female: ${getLitterValue('birth_F')}</div>
        <div class="field" data-key="birth_count" data-real="${getLitterValue('birth_count') || '1'}" data-sample="1" style="left: 228mm; top: 49.0mm; font-size: 0.85em;">${getLitterValue('birth_count') || '1'}</div>
        <div class="field" data-key="dead_count" data-real="0" data-sample="0" style="left: 228mm; top: 56.5mm; font-size: 0.85em;">0</div>
        <div class="field" data-key="reg_count" data-real="Male: ${getLitterValue('reg_count_M')} / Female: ${getLitterValue('reg_count_F')}" data-sample="Male: 2 / Female: 3" style="left: 228mm; top: 64.0mm; font-size: 0.85em;">Male: ${getLitterValue('reg_count_M')} / Female: ${getLitterValue('reg_count_F')}</div>

        <!-- 하단 발행일 정보 (협회 직인 근처) -->
        <div class="field" data-key="issue_date" data-real="${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}" data-sample="2026년 7월 6일" style="left: 140mm; top: 189mm; font-size: 1.1em; font-weight: bold;">
          ${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
        </div>
      `;
    } else if (type === 'jindo') {
      fieldsHtml = `
        <!-- 본견 기본 정보 -->
        <div class="field" data-key="dog_name" data-real="${pedigree.fullName || pedigree.name || '-'}" data-sample="백구" style="left: 45mm; top: 40mm; font-weight: bold;">${pedigree.fullName || pedigree.name || '-'}</div>
        <div class="field" data-key="reg_no" data-real="${pedigree.regNo || '-'}" data-sample="KKC-12345" style="left: 145mm; top: 40mm; font-weight: bold;">${pedigree.regNo || '-'}</div>
        
        <div class="field" data-key="dog_breed" data-real="${pedigree.breed || '진돗개'}" data-sample="진돗개" style="left: 45mm; top: 47mm;">${pedigree.breed || '진돗개'}</div>
        <div class="field" data-key="dog_gender" data-real="${pedigree.gender === 'M' ? 'MALE (수컷)' : 'FEMALE (암컷)'}" data-sample="MALE (수컷)" style="left: 145mm; top: 47mm;">${pedigree.gender === 'M' ? 'MALE (수컷)' : 'FEMALE (암컷)'}</div>
        
        <div class="field" data-key="dog_birth" data-real="${formatDateKr(pedigree.birthDate)}" data-sample="2020년 5월 5일" style="left: 45mm; top: 54mm;">${formatDateKr(pedigree.birthDate)}</div>
        <div class="field" data-key="dog_color" data-real="${pedigree.color || '-'}" data-sample="황구" style="left: 145mm; top: 54mm;">${pedigree.color || '-'}</div>
        
        <div class="field" data-key="microchip" data-real="${pedigree.microchip || '-'}" data-sample="410160011223344" style="left: 45mm; top: 61mm;">${pedigree.microchip || '-'}</div>
        <div class="field" data-key="index_no" data-real="${pedigree.indexNo || '-'}" data-sample="IND-999" style="left: 145mm; top: 61mm;">${pedigree.indexNo || '-'}</div>
        
        <div class="field" data-key="dog_litter" data-real="${fullLitterList}" data-sample="황구 3 / 백구 2" style="left: 45mm; top: 68mm; width: 155mm; white-space: normal; line-height: 1.2; font-size: 0.85em;">
          ${fullLitterList}
        </div>

        <!-- 4대 혈통도 계보 (30 Ancestors) -->
        <!-- 1대 (Parents) -->
        ${renderShepherdAncestor(2, '15mm', '109mm')} <!-- 부견 -->
        ${renderShepherdAncestor(3, '15mm', '180mm')} <!-- 모견 -->

        <!-- 2대 (Grandparents) -->
        ${renderShepherdAncestor(4, '65mm', '92mm')}
        ${renderShepherdAncestor(5, '65mm', '126mm')}
        ${renderShepherdAncestor(6, '65mm', '163mm')}
        ${renderShepherdAncestor(7, '65mm', '197mm')}

        <!-- 3대 (Great-grandparents) -->
        ${renderShepherdAncestor(8, '115mm', '84mm')}
        ${renderShepherdAncestor(9, '115mm', '101mm')}
        ${renderShepherdAncestor(10, '115mm', '118mm')}
        ${renderShepherdAncestor(11, '115mm', '135mm')}
        ${renderShepherdAncestor(12, '115mm', '155mm')}
        ${renderShepherdAncestor(13, '115mm', '172mm')}
        ${renderShepherdAncestor(14, '115mm', '189mm')}
        ${renderShepherdAncestor(15, '115mm', '206mm')}

        <!-- 4대 (Great-great-grandparents) -->
        ${renderShepherdAncestor(16, '163mm', '80mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(17, '163mm', '88.5mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(18, '163mm', '97mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(19, '163mm', '105.5mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(20, '163mm', '114mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(21, '163mm', '122.5mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(22, '163mm', '131mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(23, '163mm', '139.5mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(24, '163mm', '151mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(25, '163mm', '159.5mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(26, '163mm', '168mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(27, '163mm', '176.5mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(28, '163mm', '185mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(29, '163mm', '193.5mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(30, '163mm', '202mm', '48mm', '8mm', true)}
        ${renderShepherdAncestor(31, '163mm', '210.5mm', '48mm', '8mm', true)}

        <!-- 번식자/소유자 정보 -->
        <div class="field" data-key="dog_breeder" data-real="${pedigree.breeder || '-'}" data-sample="홍길동" style="left: 35mm; top: 236mm; font-weight: bold;">${pedigree.breeder || '-'}</div>
        <div class="field" data-key="dog_breeder_addr" data-real="${pedigree.breederAddr || '-'}" data-sample="서울시 종로구" style="left: 35mm; top: 242mm; font-size: 0.85em;">${pedigree.breederAddr || '-'}</div>
        
        <div class="field" data-key="dog_owner" data-real="${pedigree.owner || '-'}" data-sample="이몽룡" style="left: 35mm; top: 255mm; font-weight: bold;">${pedigree.owner || '-'}</div>
        <div class="field" data-key="dog_owner_addr" data-real="${pedigree.ownerAddr || '-'}" data-sample="경기도 성남시" style="left: 35mm; top: 261mm; font-size: 0.85em;">${pedigree.ownerAddr || '-'}</div>

        <div class="field" data-key="issue_date" data-real="${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}" data-sample="2026년 7월 6일" style="left: 140mm; top: 279mm; font-size: 1.1em; font-weight: bold;">
          ${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
        </div>
      `;
    } else {
      fieldsHtml = `
        <!-- 본견 기본 정보 -->
        <div class="field" data-key="dog_name" data-real="${pedigree.fullName || pedigree.name || '-'}" data-sample="해피" style="left: 45mm; top: 40mm; font-weight: bold;">${pedigree.fullName || pedigree.name || '-'}</div>
        <div class="field" data-key="reg_no" data-real="${pedigree.regNo || '-'}" data-sample="KKC-56789" style="left: 145mm; top: 40mm; font-weight: bold;">${pedigree.regNo || '-'}</div>
        
        <div class="field" data-key="dog_breed" data-real="${pedigree.breed || '-'}" data-sample="푸들" style="left: 45mm; top: 47mm;">${pedigree.breed || '-'}</div>
        <div class="field" data-key="dog_gender" data-real="${pedigree.gender === 'M' ? 'MALE (수컷)' : 'FEMALE (암컷)'}" data-sample="FEMALE (암컷)" style="left: 145mm; top: 47mm;">${pedigree.gender === 'M' ? 'MALE (수컷)' : 'FEMALE (암컷)'}</div>
        
        <div class="field" data-key="dog_birth" data-real="${formatDateKr(pedigree.birthDate)}" data-sample="2021년 10월 10일" style="left: 45mm; top: 54mm;">${formatDateKr(pedigree.birthDate)}</div>
        <div class="field" data-key="dog_color" data-real="${pedigree.color || '-'}" data-sample="갈색" style="left: 145mm; top: 54mm;">${pedigree.color || '-'}</div>
        
        <div class="field" data-key="microchip" data-real="${pedigree.microchip || '-'}" data-sample="410160022334455" style="left: 45mm; top: 61mm;">${pedigree.microchip || '-'}</div>
        <div class="field" data-key="index_no" data-real="${pedigree.indexNo || '-'}" data-sample="IND-777" style="left: 145mm; top: 61mm;">${pedigree.indexNo || '-'}</div>
        
        <div class="field" data-key="dog_litter" data-real="${fullLitterList}" data-sample="갈색 2 / 흰색 1" style="left: 45mm; top: 68mm; width: 155mm; white-space: normal; line-height: 1.2; font-size: 0.85em;">
          ${fullLitterList}
        </div>

        <!-- 3대 혈통도 계보 (14 Ancestors) -->
        <!-- 1대 (Parents) -->
        ${renderShepherdAncestor(2, '18mm', '125mm')} <!-- 부견 -->
        ${renderShepherdAncestor(3, '18mm', '185mm')} <!-- 모견 -->

        <!-- 2대 (Grandparents) -->
        ${renderShepherdAncestor(4, '78mm', '102mm')}
        ${renderShepherdAncestor(5, '78mm', '142mm')}
        ${renderShepherdAncestor(6, '78mm', '168mm')}
        ${renderShepherdAncestor(7, '78mm', '208mm')}

        <!-- 3대 (Great-grandparents) -->
        ${renderShepherdAncestor(8, '138mm', '92mm')}
        ${renderShepherdAncestor(9, '138mm', '112mm')}
        ${renderShepherdAncestor(10, '138mm', '132mm')}
        ${renderShepherdAncestor(11, '138mm', '152mm')}
        ${renderShepherdAncestor(12, '138mm', '172mm')}
        ${renderShepherdAncestor(13, '138mm', '192mm')}
        ${renderShepherdAncestor(14, '138mm', '212mm')}
        ${renderShepherdAncestor(15, '138mm', '232mm')}

        <!-- 번식자/소유자 정보 -->
        <div class="field" data-key="dog_breeder" data-real="${pedigree.breeder || '-'}" data-sample="박문수" style="left: 35mm; top: 246mm; font-weight: bold;">${pedigree.breeder || '-'}</div>
        <div class="field" data-key="dog_breeder_addr" data-real="${pedigree.breederAddr || '-'}" data-sample="부산시 해운대구" style="left: 35mm; top: 251mm; font-size: 0.85em;">${pedigree.breederAddr || '-'}</div>
        
        <div class="field" data-key="dog_owner" data-real="${pedigree.owner || '-'}" data-sample="성춘향" style="left: 35mm; top: 262mm; font-weight: bold;">${pedigree.owner || '-'}</div>
        <div class="field" data-key="dog_owner_addr" data-real="${pedigree.ownerAddr || '-'}" data-sample="전라북도 남원시" style="left: 35mm; top: 267mm; font-size: 0.85em;">${pedigree.ownerAddr || '-'}</div>

        <div class="field" data-key="issue_date" data-real="${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}" data-sample="2026년 7월 6일" style="left: 140mm; top: 279mm; font-size: 1.1em; font-weight: bold;">
          ${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
        </div>
      `;
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) {
      alert('팝업 차단이 설정되어 있습니다. 팝업 허용 후 다시 시도해 주세요.');
      return;
    }

    const prefix = `pedigree_offset_${type}`;
    const savedTop = localStorage.getItem(`${prefix}_top`) || '0';
    const savedLeft = localStorage.getItem(`${prefix}_left`) || '0';
    const savedScale = localStorage.getItem(`${prefix}_scale`) || '100';
    const savedBold = localStorage.getItem(`${prefix}_bold`) !== 'false';

    const isLandscape = type === 'shepherd';
    const pageWidth = isLandscape ? '297mm' : '210mm';
    const pageHeight = isLandscape ? '210mm' : '297mm';
    const pageSize = isLandscape ? 'A4 landscape' : 'A4 portrait';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${targetLayout.title}</title>
  <style>
    :root {
      --offset-top: ${savedTop}mm;
      --offset-left: ${savedLeft}mm;
      --font-scale: ${savedScale}%;
      --font-weight: ${savedBold ? 'bold' : 'normal'};
      --line-height-scale: 1.15;
    }
    @page {
      size: ${pageSize};
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Dotum', sans-serif;
      -webkit-print-color-adjust: exact;
    }
    .toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background-color: #1e293b;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      z-index: 1000;
    }
    .toolbar-title {
      font-size: 15px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }
    .control-group label {
      color: #94a3b8;
      font-weight: 500;
    }
    .control-group input[type="number"] {
      width: 55px;
      padding: 5px 8px;
      border: 1px solid #475569;
      background-color: #334155;
      color: white;
      border-radius: 4px;
      text-align: center;
      outline: none;
      font-weight: bold;
    }
    .control-group input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }
    .btn-primary:hover {
      background-color: #2563eb;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background-color: #475569;
      color: white;
    }
    .btn-secondary:hover {
      background-color: #334155;
    }
    .page-container {
      width: ${pageWidth};
      height: ${pageHeight};
      background-color: white;
      margin: 80px auto 40px auto;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      position: relative;
      box-sizing: border-box;
    }
    .bg-guide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('${targetLayout.bgImage}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      opacity: 0.35;
      pointer-events: none;
    }
    .bg-guide.hidden {
      display: none;
    }
    .print-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: translate(var(--offset-left), var(--offset-top));
      font-size: calc(9pt * (var(--font-scale) / 100));
      font-weight: var(--font-weight);
      color: black;
      line-height: var(--line-height-scale);
    }
    .field {
      position: absolute;
      white-space: nowrap;
      box-sizing: border-box;
      font-family: inherit;
    }
    .ancestor-box {
      position: absolute;
      width: 48mm;
      height: 14mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      line-height: 1.1;
      font-family: inherit;
    }
    .ancestor-name {
      font-weight: bold;
      font-size: 0.9em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ancestor-reg {
      font-size: 0.8em;
    }
    .ancestor-extra {
      font-size: 0.75em;
      color: #334155;
    }
    
    /* 편집 모드 용 스타일 */
    .field[data-key], .ancestor-box[data-key] {
      cursor: default;
      transition: outline 0.1s;
    }
    body.edit-active .field[data-key]:hover, 
    body.edit-active .ancestor-box[data-key]:hover {
      cursor: move;
      outline: 1px dashed #fbbf24 !important;
    }
    .selected-field {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px;
      background-color: rgba(59, 130, 246, 0.1) !important;
    }
    
    @media print {
      body {
        background-color: transparent;
      }
      .toolbar {
        display: none !important;
      }
      .page-container {
        margin: 0 !important;
        box-shadow: none !important;
        width: ${pageWidth} !important;
        height: ${pageHeight} !important;
      }
      .bg-guide {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">
      🖨️ ${targetLayout.title}
    </div>
    <div class="controls">
      <div class="control-group">
        <label>상하 오차 (mm)</label>
        <input type="number" id="offsetTop" step="0.5" value="${savedTop}">
      </div>
      <div class="control-group">
        <label>좌우 오차 (mm)</label>
        <input type="number" id="offsetLeft" step="0.5" value="${savedLeft}">
      </div>
      <div class="control-group">
        <label>크기 (%)</label>
        <input type="number" id="fontScale" step="5" value="${savedScale}">
      </div>
      <div class="control-group">
        <label>굵게</label>
        <input type="checkbox" id="fontBold" ${savedBold ? 'checked' : ''}>
      </div>
      <div class="control-group" style="margin-left: 10px;">
        <input type="checkbox" id="showGuide" checked>
        <label for="showGuide" style="color: white; cursor: pointer;">가이드 배경지 보기</label>
      </div>
      <div class="control-group" style="margin-left: 10px;">
        <input type="checkbox" id="sampleMode">
        <label for="sampleMode" style="color: #60a5fa; cursor: pointer; font-weight: bold;">🎯 샘플 대조 모드</label>
      </div>
      <div class="control-group" style="margin-left: 10px;">
        <input type="checkbox" id="editMode">
        <label for="editMode" style="color: #fbbf24; cursor: pointer; font-weight: bold;">🛠️ 드래그 편집</label>
      </div>
      <button class="btn btn-secondary" onclick="resetOffsets()">기초 초기화</button>
      <button class="btn btn-primary" onclick="doPrint()">인쇄하기</button>
      <button class="btn" id="copyCoordsBtn" style="background-color: #10b981; color: white; font-weight: bold; margin-left: 8px;">📋 최종 좌표 복사</button>
    </div>
  </div>

  <div class="page-container">
    <div class="bg-guide" id="guideBg"></div>
    <div class="print-content">
      ${fieldsHtml}
    </div>
  </div>

  <script>
    const type = '${type}';
    const prefix = 'pedigree_offset_' + type;

    const offsetTopInput = document.getElementById('offsetTop');
    const offsetLeftInput = document.getElementById('offsetLeft');
    const fontScaleInput = document.getElementById('fontScale');
    const fontBoldInput = document.getElementById('fontBold');
    const showGuideCheckbox = document.getElementById('showGuide');
    const sampleModeCheckbox = document.getElementById('sampleMode');
    const guideBg = document.getElementById('guideBg');

    function updateStyles() {
      const topVal = offsetTopInput.value;
      const leftVal = offsetLeftInput.value;
      const scaleVal = fontScaleInput.value;
      const boldVal = fontBoldInput.checked;

      document.documentElement.style.setProperty('--offset-top', topVal + 'mm');
      document.documentElement.style.setProperty('--offset-left', leftVal + 'mm');
      document.documentElement.style.setProperty('--font-scale', scaleVal + '%');
      document.documentElement.style.setProperty('--font-weight', boldVal ? 'bold' : 'normal');

      localStorage.setItem(prefix + '_top', topVal);
      localStorage.setItem(prefix + '_left', leftVal);
      localStorage.setItem(prefix + '_scale', scaleVal);
      localStorage.setItem(prefix + '_bold', boldVal);
    }

    function updateSampleData() {
      const useSample = sampleModeCheckbox ? sampleModeCheckbox.checked : false;
      document.querySelectorAll('[data-real]').forEach(el => {
        el.textContent = useSample ? el.getAttribute('data-sample') : el.getAttribute('data-real');
      });
    }

    offsetTopInput.addEventListener('input', updateStyles);
    offsetLeftInput.addEventListener('input', updateStyles);
    fontScaleInput.addEventListener('input', updateStyles);
    fontBoldInput.addEventListener('change', updateStyles);

    showGuideCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        guideBg.classList.remove('hidden');
      } else {
        guideBg.classList.add('hidden');
      }
    });

    if (sampleModeCheckbox) {
      sampleModeCheckbox.addEventListener('change', updateSampleData);
      updateSampleData();
    }

    function resetOffsets() {
      offsetTopInput.value = '0';
      offsetLeftInput.value = '0';
      fontScaleInput.value = '100';
      fontBoldInput.checked = true;
      updateStyles();
    }

    function doPrint() {
      const checked = showGuideCheckbox.checked;
      showGuideCheckbox.checked = false;
      guideBg.classList.add('hidden');

      window.print();

      showGuideCheckbox.checked = checked;
      if (checked) {
        guideBg.classList.remove('hidden');
      }
    }

    /* 초정밀 보정 에디터 컨트롤 스크립트 */
    let isEditing = false;
    let activeElement = null;

    editModeCheckbox.addEventListener('change', (e) => {
      isEditing = e.target.checked;
      if (isEditing) {
        document.body.classList.add('edit-active');
      } else {
        document.body.classList.remove('edit-active');
        if (activeElement) {
          activeElement.classList.remove('selected-field');
          activeElement = null;
        }
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!isEditing) return;
      const target = e.target.closest('[data-key]');
      if (!target) return;

      e.preventDefault();
      if (activeElement) {
        activeElement.classList.remove('selected-field');
      }
      activeElement = target;
      activeElement.classList.add('selected-field');

      const startX = e.clientX;
      const startY = e.clientY;
      
      const container = document.querySelector('.page-container');
      const containerWidth = container.clientWidth;
      const pxToMm = 297 / containerWidth;

      let baseLeft = parseFloat(activeElement.style.left) || 0;
      let baseTop = parseFloat(activeElement.style.top) || 0;

      function onMouseMove(moveEvent) {
        const dx = (moveEvent.clientX - startX) * pxToMm;
        const dy = (moveEvent.clientY - startY) * pxToMm;

        activeElement.style.left = (baseLeft + dx).toFixed(2) + 'mm';
        activeElement.style.top = (baseTop + dy).toFixed(2) + 'mm';
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    document.addEventListener('keydown', (e) => {
      if (!isEditing || !activeElement) return;

      let step = 0.1;
      if (e.shiftKey) step = 0.5;

      let baseLeft = parseFloat(activeElement.style.left) || 0;
      let baseTop = parseFloat(activeElement.style.top) || 0;
      let moved = false;

      if (e.key === 'ArrowLeft') {
        activeElement.style.left = (baseLeft - step).toFixed(2) + 'mm';
        moved = true;
      } else if (e.key === 'ArrowRight') {
        activeElement.style.left = (baseLeft + step).toFixed(2) + 'mm';
        moved = true;
      } else if (e.key === 'ArrowUp') {
        activeElement.style.top = (baseTop - step).toFixed(2) + 'mm';
        moved = true;
      } else if (e.key === 'ArrowDown') {
        activeElement.style.top = (baseTop + step).toFixed(2) + 'mm';
        moved = true;
      }

      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        let currSizeStr = activeElement.style.fontSize;
        let sizeVal = 1.0;
        let unit = 'em';

        if (currSizeStr) {
          sizeVal = parseFloat(currSizeStr);
          unit = currSizeStr.replace(/[0-9.]/g, '') || 'em';
        } else {
          if (activeElement.classList.contains('ancestor-box')) {
            sizeVal = 1.0;
            unit = 'em';
          } else {
            sizeVal = 0.95;
            unit = 'em';
          }
        }

        const sizeStep = e.shiftKey ? 0.05 : 0.01;
        if (e.key === '[') {
          sizeVal = Math.max(0.1, sizeVal - sizeStep);
        } else {
          sizeVal = sizeVal + sizeStep;
        }

        activeElement.style.fontSize = sizeVal.toFixed(2) + unit;
        moved = true;
      }

      if (moved) {
        e.preventDefault();
      }
    });

    copyCoordsBtn.addEventListener('click', () => {
      const coords = {};
      document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        coords[key] = {
          left: el.style.left,
          top: el.style.top,
          fontSize: el.style.fontSize || ''
        };
      });

      const jsonStr = JSON.stringify(coords, null, 2);
      
      const textarea = document.createElement('textarea');
      textarea.value = jsonStr;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          alert('🎉 모든 좌표 및 글자 크기 데이터가 클립보드에 성공적으로 복사되었습니다!\\n\\n채팅창에 붙여넣기(Ctrl+V) 하여 제미나이에게 전송해주시면 영구 저장해 드립니다.');
        } else {
          throw new Error('copy failed');
        }
      } catch (err) {
        prompt('클립보드 자동 복사에 실패했습니다. 아래 텍스트를 전체 선택(Ctrl+A) 후 복사(Ctrl+C)하여 전달해주세요:', jsonStr);
        if (textarea.parentNode) {
          document.body.removeChild(textarea);
        }
      }
    });
  </script>
</body>
</html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

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

      const gen2Uids = [pedigree.sireRegNo, pedigree.damRegNo].filter(u => u && u !== '0' && u !== '-' && u !== '미등록');
      if (gen2Uids.length > 0) {
        const gen2Data = await fetchDogsByUids(gen2Uids, tableName);
        if (pedigree.sireRegNo && gen2Data[pedigree.sireRegNo]) tree[2] = gen2Data[pedigree.sireRegNo];
        if (pedigree.damRegNo && gen2Data[pedigree.damRegNo]) tree[3] = gen2Data[pedigree.damRegNo];
      }

      const gen3Uids: string[] = [];
      [2, 3].forEach(idx => {
        const dog = tree[idx];
        if (dog) {
          if (dog.fa_regno && dog.fa_regno !== '0' && dog.fa_regno !== '-') gen3Uids.push(dog.fa_regno);
          if (dog.mo_regno && dog.mo_regno !== '0' && dog.mo_regno !== '-') gen3Uids.push(dog.mo_regno);
        }
      });
      if (gen3Uids.length > 0) {
        const gen3Data = await fetchDogsByUids(gen3Uids, tableName);
        if (tree[2]) {
          if (tree[2].fa_regno && gen3Data[tree[2].fa_regno]) tree[4] = gen3Data[tree[2].fa_regno];
          if (tree[2].mo_regno && gen3Data[tree[2].mo_regno]) tree[5] = gen3Data[tree[2].mo_regno];
        }
        if (tree[3]) {
          if (tree[3].fa_regno && gen3Data[tree[3].fa_regno]) tree[6] = gen3Data[tree[3].fa_regno];
          if (tree[3].mo_regno && gen3Data[tree[3].mo_regno]) tree[7] = gen3Data[tree[3].mo_regno];
        }
      }

      const gen4Uids: string[] = [];
      [4, 5, 6, 7].forEach(idx => {
        const dog = tree[idx];
        if (dog) {
          if (dog.fa_regno && dog.fa_regno !== '0' && dog.fa_regno !== '-') gen4Uids.push(dog.fa_regno);
          if (dog.mo_regno && dog.mo_regno !== '0' && dog.mo_regno !== '-') gen4Uids.push(dog.mo_regno);
        }
      });
      if (gen4Uids.length > 0) {
        const gen4Data = await fetchDogsByUids(gen4Uids, tableName);
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

      if (type !== 'general') {
        const gen5Uids: string[] = [];
        for (let idx = 8; idx <= 15; idx++) {
          const dog = tree[idx];
          if (dog) {
            if (dog.fa_regno && dog.fa_regno !== '0' && dog.fa_regno !== '-') gen5Uids.push(dog.fa_regno);
            if (dog.mo_regno && dog.mo_regno !== '0' && dog.mo_regno !== '-') gen5Uids.push(dog.mo_regno);
          }
        }
        if (gen5Uids.length > 0) {
          const gen5Data = await fetchDogsByUids(gen5Uids, tableName);
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

      openPrintPreview(type, tree, fullLitterList);
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
                const byUid = await fetchDogsByUids(searchKeys, tableName);
                const missingKeys = searchKeys.filter(k => !byUid[k]);
                let byRegNo: Record<string, ParentDogInfo> = {};
                if (missingKeys.length > 0) {
                    const fetchDogsByRegNos = (await import('../services/memberService')).fetchDogsByRegNos;
                    byRegNo = await fetchDogsByRegNos(missingKeys, tableName);
                }
                const getDog = (key: string, backupKey?: string) => byUid[key] || byRegNo[key] || (backupKey ? (byUid[backupKey] || byRegNo[backupKey]) : null);
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
                        <tr><th className={thStyle}>동태자 코드</th><td className={tdStyle}>{getLitterValue('dongtae_no') || pedigree.dongtaeNo || '-'}</td><th className={thStyle}>근친 번식</th><td className={tdStyle}>{getLitterValue('spec_relate')}</td></tr>
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
