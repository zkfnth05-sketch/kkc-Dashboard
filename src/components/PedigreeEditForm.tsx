import { Pedigree, ParentDogInfo, OwnerHistory } from '../types';
import { fetchDogsByRegNos, fetchDogsByUids, fetchOwnerHistory, addOwnerChange, deleteOwnerHistory, fetchPointsByRegNo, fetchPrizesByRegNo } from '../services/memberService';
import { fetchHairs, addDogClass, addHairColor, fetchDogClasses, deleteDogClass, deleteHairColor } from '../services/pedigreeService';
import { PersonSearchModal } from './MemberSearchModal';
import { OwnerChangeModal } from './OwnerChangeModal';
import { CheckpointBar } from './CheckpointBar';
import { Loader2, Save, Edit, Trash2, AlertCircle, X, RotateCcw, Trophy, Settings, Calendar } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface PedigreeEditFormProps {
  pedigree: Pedigree;
  onSave: (updatedPedigree: Pedigree) => void;
  onCancel: () => void;
  onGoToPoints?: () => void;
  onGoToPrizes?: () => void;
  onOpenDongtaeForm: (dongtaeNo: string) => void;
  onEditOtherDog?: (uid: string) => void;
  tableName?: string;
  memberTableName?: string;
  checkpoints?: any[];
  onRestore?: (checkpoint: any) => void;
  dogClasses?: any[];
}

const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "확인", cancelText = "취소", isDanger = false }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3 text-gray-800">
            <AlertCircle className={isDanger ? "text-red-500" : "text-blue-500"} size={24} />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="bg-gray-50 p-4 flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">{cancelText}</button>
          <button 
            onClick={onConfirm} 
            className={`px-6 py-2 text-sm font-bold text-white rounded shadow-sm transition-all active:scale-95 ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 text-[13px]">
    {children}
  </div>
);

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[11px] text-gray-500 w-28 shrink-0 flex items-center leading-tight">
    {children}
  </label>
);

const InputField = ({ label, value, onChange, placeholder, readOnly, type = "text", button, className = "", maxLength }: any) => {
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  // 날짜 입력 필드일 경우 하이브리드 처리를 위해 내부 로직 추가
  const isDate = type === "date";
  
  return (
    <div className={`flex items-center mb-1 ${className}`}>
      <Label>{label}</Label>
      <div className="flex-1 flex gap-1 relative group">
        <input 
          type={isDate ? "text" : type} 
          className={`flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none focus:border-blue-500 ${readOnly ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-800'}`}
          value={value || ''}
          onChange={e => onChange ? onChange(e.target.value) : null}
          placeholder={isDate ? "예: 2024-04-20" : placeholder}
          readOnly={readOnly}
          maxLength={maxLength}
        />
        {isDate && !readOnly && (
          <div className="relative">
            <button 
              type="button" 
              onClick={() => dateInputRef.current?.showPicker()}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Calendar size={14} />
            </button>
            <input 
              type="date" 
              ref={dateInputRef}
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
              onChange={e => onChange(e.target.value)}
            />
          </div>
        )}
        {maxLength && !readOnly && value && String(value).length >= maxLength && (
          <div className="absolute -top-6 right-0 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            최대 {maxLength}자 입력 가능
          </div>
        )}
        {button}
      </div>
    </div>
  );
};

const ParentDogBox = ({ type, dog, isSearching, regNo, onRegNoChange, onSearch, onClear, onEditRecord }: any) => {
  const displayRegNo = (regNo === '0') ? '미등록' : (regNo || '');
  return (
    <div className="border border-gray-100 rounded bg-gray-50/30 mb-4 overflow-hidden shadow-sm">
      <div className="p-2 border-b border-gray-100 bg-white">
        <InputField 
          label={`${type === 'sire' ? '부견' : '모견'} 등록번호`} 
          value={displayRegNo} 
          onChange={(val: string) => onRegNoChange(val)}
          className="mb-0"
          button={
            <button type="button" onClick={(e) => { e.preventDefault(); onSearch(); }} className="bg-white border border-gray-300 px-3 h-7 text-[11px] rounded-sm font-bold shrink-0">
              {isSearching ? <Loader2 size={12} className="animate-spin" /> : '조회'}
            </button>
          }
        />
      </div>
      <div className="p-3 pl-24 text-[11px] leading-relaxed text-gray-600 min-h-[140px] relative">
        {dog ? (
          <>
            <div className="font-bold text-gray-900 mb-1">{dog.fullname || dog.name || '이름 없음'}</div>
            <div>생년월일: {dog.birth || '-'}</div>
            <div>견종: {dog.dog_class || '-'}</div>
            <div>모색: {dog.hair || '-'}</div>
            <div>견사호(영문): {dog.saho_eng || '-'}</div>
            <div>등록번호: <span className="text-blue-600 font-bold">{(!dog.reg_no || dog.reg_no === '0') ? '미등록' : dog.reg_no}</span></div>
            <div className="text-gray-400 mt-1">UID: {dog.uid}</div>
            <div className="mt-3 flex gap-1 pt-2 border-t border-gray-100">
              <button type="button" onClick={(e) => { e.preventDefault(); onEditRecord(); }} className="flex-1 bg-white border border-gray-200 h-8 text-[11px] font-bold text-gray-700 rounded-sm hover:bg-gray-50 flex items-center justify-center gap-1 shadow-xs"><Edit size={12} className="text-blue-500" /> 정보 수정</button>
              <button type="button" onClick={(e) => { e.preventDefault(); onClear(); }} className="flex-1 bg-white border border-gray-200 h-8 text-[11px] font-bold text-red-500 rounded-sm hover:bg-red-50 flex items-center justify-center gap-1 shadow-xs"><Trash2 size={12} /> 연결 삭제</button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-gray-300 italic">부모견 UID를 입력하고 조회 버튼을 누르세요.</div>
        )}
      </div>
    </div>
  );
};

export const PedigreeEditForm: React.FC<PedigreeEditFormProps> = ({ 
  pedigree, onSave, onCancel, onGoToPoints, onGoToPrizes, onOpenDongtaeForm, onEditOtherDog, tableName = 'dogTab', 
  memberTableName = 'memTab', checkpoints = [], onRestore, dogClasses = []
}) => {
  const [formData, setFormData] = useState<Pedigree>({...pedigree});
  const [ownerHistory, setOwnerHistory] = useState<OwnerHistory[]>([]);
  const [isPersonSearchModalOpen, setIsPersonSearchModalOpen] = useState(false);
  const [isOwnerChangeModalOpen, setIsOwnerChangeModalOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<'owner' | 'breeder' | null>(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isSearchingSire, setIsSearchingSire] = useState(false);
  const [isSearchingDam, setIsSearchingDam] = useState(false);
  const [sireDetails, setSireDetails] = useState<ParentDogInfo | null>(null);
  const [damDetails, setDamDetails] = useState<ParentDogInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hairOptions, setHairOptions] = useState<any[]>([]);
  const [dogClassesState, setDogClassesState] = useState<any[]>(dogClasses || []);
  const [pointsList, setPointsList] = useState<any[]>([]);
  const [prizesList, setPrizesList] = useState<any[]>([]);
  const [sireSearchInput, setSireSearchInput] = useState('');
  const [damSearchInput, setDamSearchInput] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean; confirmText?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    // 성별 정규화 (수컷 -> M, 암컷 -> F)
    let initialGender = pedigree.gender || 'M';
    if (initialGender === '수컷') initialGender = 'M';
    else if (initialGender === '암컷') initialGender = 'F';

    setFormData({...pedigree, gender: initialGender});
    loadOwnerHistory();
    loadInitialParentInfo();
    loadHairOptions();
    if (pedigree.regNo && String(pedigree.regNo).trim() !== '') {
      fetchPointsByRegNo(pedigree.regNo).then(setPointsList).catch(console.error);
      fetchPrizesByRegNo(pedigree.regNo).then(setPrizesList).catch(console.error);
    }
  }, [pedigree.id]); 

  const loadHairOptions = async () => {
    try {
      const hairs = await fetchHairs();
      setHairOptions(hairs.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (e) {
      console.error("Hair Load Error:", e);
    }
  };

  const loadInitialParentInfo = async () => {
    const sireVal = (pedigree.sireRegNo || pedigree.sireUid || '').toString().trim();
    const damVal = (pedigree.damRegNo || pedigree.damUid || '').toString().trim();
    
    const searchKeys = [sireVal, damVal].filter(v => v !== '' && v !== '미등록' && v !== '0' && v !== '-');
    if (searchKeys.length === 0) return;

    try {
      if (sireVal && sireVal !== '미등록' && sireVal !== '0') setIsSearchingSire(true);
      if (damVal && damVal !== '미등록' && damVal !== '0') setIsSearchingDam(true);
      
      // 1단계: UID로 먼저 시도
      const byUid = await fetchDogsByUids(searchKeys, tableName);
      
      // 2단계: 누락된 정보에 대해 등록번호로 추가 시도 (스마트 폴백)
      const missingKeys = searchKeys.filter(k => !byUid[k]);
      let byRegNo: Record<string, ParentDogInfo> = {};
      if (missingKeys.length > 0) {
        const fetchDogsByRegNos = (await import('../services/memberService')).fetchDogsByRegNos;
        byRegNo = await fetchDogsByRegNos(missingKeys, tableName);
      }

      const getDog = (key: string) => byUid[key] || byRegNo[key];

      if (sireVal) {
        const dog = getDog(sireVal);
        if (dog) {
          setSireDetails(dog);
          setSireSearchInput(dog.reg_no || '');
        }
      }
      if (damVal) {
        const dog = getDog(damVal);
        if (dog) {
          setDamDetails(dog);
          setDamSearchInput(dog.reg_no || '');
        }
      }
    } catch (e) { 
      console.error("Parent Load Error:", e); 
    } finally {
      setIsSearchingSire(false); 
      setIsSearchingDam(false);
    }
  };

  const loadOwnerHistory = async () => {
    try { const h = await fetchOwnerHistory(pedigree.id); setOwnerHistory(h); } catch (e) { console.error(e); }
  };

  const handleChange = (field: keyof Pedigree, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try { await onSave(formData); } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };

  const handleFullNameAssembly = (type: 'prefix' | 'suffix') => {
    const kennel = formData.kennelNameEng || formData.kennel || '';
    const name = formData.name || '';
    if (type === 'prefix') handleChange('fullName', `${name} OF ${kennel}`.trim());
    else handleChange('fullName', `${kennel} ${name}`.trim());
  };

  const handleParentSearch = async (type: 'sire' | 'dam') => {
    const input = type === 'sire' ? sireSearchInput : damSearchInput;
    if (!input || input.trim() === '') {
        setConfirmModal({ isOpen: true, title: '입력 확인', message: '조회할 등록번호를 입력해주세요.', onConfirm: () => setConfirmModal(p => ({...p, isOpen: false})) });
        return;
    }
    if (type === 'sire') setIsSearchingSire(true); else setIsSearchingDam(true);
    try {
      const results = await fetchDogsByRegNos([input], tableName);
      const found = Object.values(results)[0];
      if (found) {
        if (type === 'sire') { 
          setSireDetails(found); 
          setFormData(prev => ({ ...prev, sireName: found.name, sireUid: found.uid, sireRegNo: found.uid }));
          setSireSearchInput(found.reg_no || '');
        } else { 
          setDamDetails(found); 
          setFormData(prev => ({ ...prev, damName: found.name, damUid: found.uid, damRegNo: found.uid }));
          setDamSearchInput(found.reg_no || '');
        }
      } else {
        setConfirmModal({ isOpen: true, title: '검색 결과 없음', message: '해당 등록번호의 개체를 찾을 수 없습니다.', onConfirm: () => setConfirmModal(p => ({...p, isOpen: false})) });
      }
    } catch (e) {} finally { if (type === 'sire') setIsSearchingSire(false); else setIsSearchingDam(false); }
  };

  const handleClearParent = (type: 'sire' | 'dam') => {
    setConfirmModal({
      isOpen: true, title: '연결 삭제', message: `${type === 'sire' ? '부견' : '모견'} 연결 정보를 삭제하시겠습니까?\n삭제 후 하단의 '혈통서 저장'을 눌러야 최종 반영됩니다.`, isDanger: true,
      onConfirm: () => {
        if (type === 'sire') { 
          setSireDetails(null); 
          setSireSearchInput('');
          setFormData(prev => ({ ...prev, sireRegNo: '0', sireUid: '0', sireName: '' })); 
        }
        else { 
          setDamDetails(null); 
          setDamSearchInput('');
          setFormData(prev => ({ ...prev, damRegNo: '0', damUid: '0', damName: '' })); 
        }
        setConfirmModal(p => ({...p, isOpen: false}));
      }
    });
  };

  const handleEditParentRecord = (type: 'sire' | 'dam') => {
    const dog = type === 'sire' ? sireDetails : damDetails;
    if (!dog || !dog.uid || dog.uid === '0') {
      setConfirmModal({ isOpen: true, title: '정보 없음', message: '연결된 개체 정보가 없습니다.', onConfirm: () => setConfirmModal(p => ({...p, isOpen: false})) });
      return;
    }
    if (onEditOtherDog) {
      setConfirmModal({
        isOpen: true, title: '편집 이동', message: `현재 수정을 중단하고 ${type === 'sire' ? '부견' : '모견'} '${dog.name}'의 편집 화면으로 이동하시겠습니까?`,
        onConfirm: () => { onEditOtherDog(dog.uid); setConfirmModal(p => ({...p, isOpen: false})); }
      });
    }
  };

  const handleAwardFieldClick = () => {
    setConfirmModal({
      isOpen: true, title: '수상 경력 수정 안내', message: '수상경력은 포인트관리 페이지에서 내용을 입력 및 삭제해주세요.', confirmText: '포인트 관리 이동',
      onConfirm: () => { setConfirmModal(p => ({...p, isOpen: false})); if (onGoToPoints) onGoToPoints(); }
    });
  };

  const handlePrizeFieldClick = () => {
    setConfirmModal({
      isOpen: true, title: '상력 관리 이동', message: '수상 경력 2(상력)은 상력 관리 페이지에서 입력 및 삭제가 가능합니다. 이동하시겠습니까?', confirmText: '상력 관리 이동',
      onConfirm: () => { setConfirmModal(p => ({...p, isOpen: false})); if (onGoToPrizes) onGoToPrizes(); }
    });
  };

  const handleAddOwnerChange = async (data: any) => {
    try {
      const dbData = {
        dog_uid: formData.id,
        reg_no: formData.regNo,
        poss_id: data.poss_id,
        poss_name: data.poss_name,
        poss_name_eng: data.poss_name_eng,
        poss_addr: data.poss_addr,
        poss_phone: data.poss_phone,
        change_date: data.ok_date, // 여기서 data.ok_date(화면값)를 change_date(DB필드명)로 확실히 매핑
        sign_date: new Date().toISOString().split('T')[0]
      };
      await addOwnerChange(dbData, 'poss_changeTab');
      setIsOwnerChangeModalOpen(false);
      loadOwnerHistory();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '변경 이력 삭제',
      message: '이 소유자 변경 기록을 정말 삭제하시겠습니까?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteOwnerHistory(id);
          setConfirmModal(p => ({ ...p, isOpen: false }));
          loadOwnerHistory();
        } catch (e: any) {
          alert(e.message);
        }
      }
    });
  };

  const groups = Array.from(new Set(dogClasses.map(d => d.group))).filter(Boolean).sort();

  return (
    <div className="absolute inset-0 bg-[#f3f4f6] z-30 flex flex-col overflow-hidden text-gray-800 font-sans">
      <CheckpointBar checkpoints={checkpoints} onRestore={onRestore || (() => {})} onViewDiff={() => {}} />
      <div className="flex-1 overflow-y-auto p-8 pt-4">
        <h1 className="text-2xl font-bold mb-6">혈통서 수정</h1>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <SectionTitle>기본 · 소유자 · 번식자 정보</SectionTitle>
            <div className="p-4 space-y-0.5">
              <InputField label="고유번호 (UID)" value={formData.id} readOnly />
              <InputField label="등록번호" value={formData.regNo} onChange={(v:any) => handleChange('regNo', v)} />
              <div className="flex items-center mb-1">
                <Label>등록 타입</Label>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none" value={formData.regType} onChange={e => handleChange('regType', e.target.value)}>
                  <option value="D">자견</option><option value="N">NR</option><option value="I">수입견</option><option value="E">국내타단체견</option><option value="S">단독견</option>
                </select>
              </div>
              <InputField label="소유자명" value={formData.owner} onChange={(v:any) => handleChange('owner', v)} button={<button type="button" onClick={() => { setSearchTarget('owner'); setSearchInitialQuery(formData.owner); setIsPersonSearchModalOpen(true); }} className="bg-white border border-gray-300 px-3 h-7 text-[11px] rounded-sm font-bold">검색</button>} />
              <InputField label="소유자 아이디" value={formData.ownerId} onChange={(v:any) => handleChange('ownerId', v)} />
              <InputField label="소유자 주소" value={formData.ownerAddr} onChange={(v:any) => handleChange('ownerAddr', v)} />
              <InputField label="소유자 전화번호" value={formData.ownerPhone} onChange={(v:any) => handleChange('ownerPhone', v)} />
              <InputField label="번식자명" value={formData.breeder} onChange={(v:any) => handleChange('breeder', v)} button={<button type="button" onClick={() => { setSearchTarget('breeder'); setSearchInitialQuery(formData.breeder); setIsPersonSearchModalOpen(true); }} className="bg-white border border-gray-300 px-3 h-7 text-[11px] rounded-sm font-bold">검색</button>} />
              <InputField label="번식자 아이디" value={formData.breederId} onChange={(v:any) => handleChange('breederId', v)} />
              <InputField label="번식자 주소" value={formData.breederAddr} onChange={(v:any) => handleChange('breederAddr', v)} />
              <InputField label="번식자 전화번호" value={formData.breederPhone} onChange={(v:any) => handleChange('breederPhone', v)} />
            </div>
          </div>
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <SectionTitle>애견 정보</SectionTitle>
            <div className="p-4 space-y-0.5">
              <InputField label="견사호" value={formData.kennel} onChange={(v:any) => handleChange('kennel', v)} />
              <InputField label="견사호 (영문)" value={formData.kennelNameEng} onChange={(v:any) => handleChange('kennelNameEng', v)} />
              <InputField label="애견명" value={formData.name} onChange={(v:any) => handleChange('name', v)} />
              <div className="flex items-center mb-1">
                <Label>풀네임</Label>
                <div className="flex-1 flex gap-1 items-center">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button type="button" onClick={() => handleFullNameAssembly('prefix')} className="text-[9px] w-6 h-3.5 border border-gray-300 bg-white hover:bg-gray-50 font-bold">앞</button>
                    <button type="button" onClick={() => handleFullNameAssembly('suffix')} className="text-[9px] w-6 h-3.5 border border-gray-300 bg-white hover:bg-gray-50 font-bold">뒤</button>
                  </div>
                  <input className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none" value={formData.fullName || ''} onChange={e => handleChange('fullName', e.target.value)} />
                </div>
              </div>
              <InputField label="생년월일" type="date" value={formData.birthDate} onChange={(v:any) => handleChange('birthDate', v)} />
              <div className="flex items-center mb-1 h-7">
                <Label>성별</Label>
                <div className="flex gap-5 items-center">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-medium text-gray-700">
                    <input type="radio" checked={formData.gender === 'M'} onChange={() => handleChange('gender', 'M')} className="w-3.5 h-3.5 accent-blue-600" /> M (수컷)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-medium text-gray-700">
                    <input type="radio" checked={formData.gender === 'F'} onChange={() => handleChange('gender', 'F')} className="w-3.5 h-3.5 accent-blue-600" /> F (암컷)
                  </label>
                </div>
              </div>
              <div className="flex items-center mb-1">
                <Label>그룹</Label>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none cursor-pointer text-gray-800" value={formData.group || ''} onChange={e => {
                  handleChange('group', e.target.value);
                  handleChange('breed', ''); // 그룹 변경 시 견종 초기화 (신규 등록 방식)
                }}>
                  <option value="">- 선택 -</option>
                  {groups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  {formData.group && !dogClasses.some(d => d.group === formData.group) && <option value={formData.group}>{formData.group}</option>}
                </select>
              </div>
              <div className="flex flex-col mb-1 min-h-[50px]">
                <div className="flex justify-between items-end mb-1">
                   <Label>견종</Label>
                   <div className="flex gap-2">
                     <button 
                       type="button"
                       onClick={async () => {
                         const selected = dogClassesState.find(d => d.breed === formData.breed);
                         if (!selected || !selected.uid) { alert("삭제할 견종을 먼저 선택해주세요."); return; }
                         if (!confirm(`'${selected.breed}' 견종을 마스터 데이터에서 정말 삭제하시겠습니까?`)) return;
                         try {
                           const res = await deleteDogClass(selected.uid);
                           if (res.success) {
                             alert("삭제되었습니다.");
                             const updated = await fetchDogClasses();
                             setDogClassesState(updated);
                             setFormData({...formData, breed: ''}); 
                           }
                         } catch (e) { alert("삭제 실패: " + e); }
                       }}
                       className="text-[9px] text-red-500 hover:underline font-black mr-1"
                     >
                       삭제[-]
                     </button>
                     <button 
                       type="button"
                       onClick={async () => {
                         const name = prompt("추가할 한글 견종명을 입력하세요:");
                         if (!name) return;
                         const eng = prompt("추가할 영문 견종명을 입력하세요 (또는 한글명 입력):") || name;
                         const keyy = prompt("견종 코드(Prefix)를 입력하세요 (예: S, P, Y):");
                         if (!keyy) return;
                         const groupp = prompt("그룹 번호를 입력하세요 (예: 1, 2, 3...):") || "1";
                         
                         try {
                           const res = await addDogClass({ keyy, kor_name: name, name: eng, groupp });
                           if (res.success) {
                             alert("견종이 추가되었습니다.");
                             const updated = await fetchDogClasses();
                             setDogClassesState(updated);
                             setFormData({...formData, breed: name, group: groupp}); 
                           }
                         } catch (e) { alert("추가 실패: " + e); }
                       }}
                       className="text-[9px] text-blue-500 hover:underline font-black mr-1"
                     >
                       추가[+]
                     </button>
                   </div>
                </div>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none cursor-pointer text-gray-800" value={formData.breed || ''} onChange={e => {
                  handleChange('breed', e.target.value);
                  const foundDog = dogClassesState.find(d => d.breed === e.target.value);
                  if (foundDog && (!formData.group || formData.group !== foundDog.group)) {
                    handleChange('group', foundDog.group);
                  }
                }}>
                  <option value="">- 선택 -</option>
                  {(dogClassesState.filter(d => !formData.group || d.group === formData.group) as any[]).sort((a,b) => a.breed.localeCompare(b.breed)).map(d => (
                    <option key={d.breed} value={d.breed}>{d.breed}</option>
                  ))}
                  {formData.breed && !dogClassesState.some(d => d.breed === formData.breed) && <option value={formData.breed}>{formData.breed}</option>}
                </select>
              </div>
              <div className="flex flex-col mb-1 min-h-[50px]">
                <div className="flex justify-between items-end mb-1">
                   <Label>모색</Label>
                   <div className="flex gap-2">
                     <button 
                       type="button"
                       onClick={async () => {
                         const selected = hairOptions.find(h => h.name === formData.color);
                         if (!selected || !selected.uid) { alert("삭제할 모색을 먼저 선택해주세요."); return; }
                         if (!confirm(`'${selected.name}' 모색을 마스터 데이터에서 정말 삭제하시겠습니까?`)) return;
                         try {
                           const res = await deleteHairColor(selected.uid);
                           if (res.success) {
                             alert("삭제되었습니다.");
                             const updated = await fetchHairs();
                             setHairOptions(updated.sort((a,b) => a.name.localeCompare(b.name)));
                             setFormData({...formData, color: ''});
                           }
                         } catch (e) { alert("삭제 실패: " + e); }
                       }}
                       className="text-[9px] text-red-500 hover:underline font-black mr-1"
                     >
                       삭제[-]
                     </button>
                     <button 
                       type="button"
                       onClick={async () => {
                         const color = prompt("추가할 새로운 모색명을 입력하세요:");
                         if (!color) return;
                         try {
                           const res = await addHairColor(color);
                           if (res.success) {
                             alert("모색이 추가되었습니다.");
                             const updated = await fetchHairs();
                             setHairOptions(updated.sort((a,b) => a.name.localeCompare(b.name)));
                             setFormData({...formData, color: color});
                           }
                         } catch (e) { alert("추가 실패: " + e); }
                       }}
                       className="text-[9px] text-emerald-600 hover:underline font-black mr-1"
                     >
                       추가[+]
                     </button>
                   </div>
                </div>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none cursor-pointer text-gray-800" value={formData.color || ''} onChange={e => handleChange('color', e.target.value)}>
                  <option value="">모색 선택...</option>
                  {hairOptions.map(h => (
                    <option key={h.uid || h.name} value={h.name}>{h.name}</option>
                  ))}
                  {formData.color && !hairOptions.some(h => h.name === formData.color) && <option value={formData.color}>{formData.color}</option>}
                </select>
              </div>
              <div className="flex items-center mb-1">
                <Label>모종</Label>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none" value={formData.coatType} onChange={e => handleChange('coatType', e.target.value)}>
                  <option value="">-선택-</option>
                  <option value="stock hair">stock hair</option>
                  <option value="Long Coat">Long Coat</option>
                  {formData.coatType && formData.coatType !== 'stock hair' && formData.coatType !== 'Long Coat' && <option value={formData.coatType}>{formData.coatType}</option>}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden col-span-2">
            <SectionTitle>특이사항 및 기타 정보 (수정 가능 필드)</SectionTitle>
            <div className="p-4 grid grid-cols-2 gap-x-10 gap-y-1">
              <InputField 
                label="고관절검사" 
                value={formData.specBone} 
                onChange={(v:any) => handleChange('specBone', v)} 
                maxLength={100}
              />
              <InputField label="특이사항(DNA)" value={formData.specDna} onChange={(v:any) => handleChange('specDna', v)} maxLength={100} />
              
              <InputField label="종견인정평가" value={formData.okDate} onChange={(v:any) => handleChange('okDate', v)} maxLength={100} />
              <InputField label="훈련" value={formData.specTrain} onChange={(v:any) => handleChange('specTrain', v)} maxLength={20} />
              
              <InputField label="근친번식" value={formData.specRelate} onChange={(v:any) => handleChange('specRelate', v)} />
              <InputField label="메모" value={formData.memo} onChange={(v:any) => handleChange('memo', v)} />

              <InputField label="국내타단체번호" value={formData.domesticNo} onChange={(v:any) => handleChange('domesticNo', v)} />
              <InputField label="외국타단체번호" value={formData.foreignNo} onChange={(v:any) => handleChange('foreignNo', v)} />

              <InputField label="외국타단체번호2" value={formData.foreignNo2} onChange={(v:any) => handleChange('foreignNo2', v)} />
              <InputField label="마이크로칩번호" value={formData.microchip} onChange={(v:any) => handleChange('microchip', v)} />
              
              <div className="col-span-2">
                <InputField label="색인번호" value={formData.indexNo} onChange={(v:any) => handleChange('indexNo', v)} />
              </div>
              
              <div className="flex flex-col mb-1 group col-span-2">
                <div className="flex items-center mb-1">
                  <Label>수상 경력 1</Label>
                  <div className="flex-1 flex gap-1 items-center">
                    <input readOnly onClick={handleAwardFieldClick} className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none bg-gray-50 text-gray-400 cursor-pointer" value={formData.specWin || ''} placeholder="포인트/수상 관련 직접 입력 내용" />
                    <button type="button" onClick={handleAwardFieldClick} className="bg-blue-50 text-blue-600 border border-blue-200 px-2 h-7 text-[10px] font-bold rounded-sm hover:bg-blue-100 shrink-0 flex items-center gap-1"><Settings size={10} /> 포인트 관리</button>
                  </div>
                </div>
                {pointsList.length > 0 && (
                  <div className="pl-28 mt-1">
                    <div className="bg-blue-50/50 border border-blue-100 rounded p-2 text-[11px] max-h-32 overflow-y-auto">
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
                  </div>
                )}
              </div>
              
              <div className="flex flex-col mb-1 group col-span-2">
                <div className="flex items-center mb-1">
                  <Label>수상 경력 2</Label>
                  <div className="flex-1 flex gap-1 items-center">
                    <input readOnly onClick={handlePrizeFieldClick} className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none bg-gray-50 text-gray-400 cursor-pointer" value={formData.specWin2 || ''} placeholder="상력 관련 직접 입력 내용" />
                    <button type="button" onClick={handlePrizeFieldClick} className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 h-7 text-[10px] font-bold rounded-sm hover:bg-indigo-100 shrink-0 flex items-center gap-1"><Settings size={10} /> 상력 관리</button>
                  </div>
                </div>
                {prizesList.length > 0 && (
                  <div className="pl-28 mt-1">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded p-2 text-[11px] max-h-32 overflow-y-auto">
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
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <InputField label="등록일" type="date" value={formData.joinDate} onChange={(v:any) => handleChange('joinDate', v)} />
                <InputField label="수정일" type="date" value={formData.editDate} readOnly placeholder="저장 시 자동 갱신됨" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <SectionTitle>부모견 정보</SectionTitle>
            <div className="p-4 flex flex-col gap-4">
              <ParentDogBox 
                type="sire" 
                dog={sireDetails} 
                isSearching={isSearchingSire} 
                regNo={sireSearchInput}
                onRegNoChange={setSireSearchInput}
                onSearch={() => handleParentSearch('sire')}
                onClear={() => handleClearParent('sire')}
                onEditRecord={() => handleEditParentRecord('sire')}
              />
              <ParentDogBox 
                type="dam" 
                dog={damDetails} 
                isSearching={isSearchingDam} 
                regNo={damSearchInput}
                onRegNoChange={setDamSearchInput}
                onSearch={() => handleParentSearch('dam')}
                onClear={() => handleClearParent('dam')}
                onEditRecord={() => handleEditParentRecord('dam')}
              />
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-700 text-[13px]">소유자 변경 이력</span>
              <button 
                type="button" 
                onClick={() => setIsOwnerChangeModalOpen(true)}
                className="bg-white border border-gray-300 px-3 py-1 text-[11px] font-bold rounded hover:bg-gray-50 transition-colors"
              >
                소유자 변경 추가
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[160px] p-4">
              {ownerHistory.length > 0 ? (
                <div className="space-y-3">
                  {ownerHistory.map((h, idx) => (
                    <div key={h.uid || idx} className="text-[12px] p-3 border border-gray-100 rounded bg-gray-50/50 flex justify-between items-center group">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{h.poss_name}</span>
                          <span className="text-[10px] text-gray-400">({h.change_date || h.sign_date})</span>
                        </div>
                        <div className="text-gray-500 text-[11px] flex flex-col">
                          {h.poss_phone && <span className="text-blue-600">Tel: {h.poss_phone}</span>}
                          <span className="truncate max-w-[250px]">{h.poss_addr || '주소 정보 없음'}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteHistory(h.uid)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 italic text-[12px] py-10">
                  소유자 변경 이력이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center py-6 border-t border-gray-200 bg-white px-2 mt-auto shrink-0">
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded font-bold text-gray-500 hover:bg-gray-50 transition-colors">취소</button>
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => onOpenDongtaeForm(formData.dongtaeNo || '')}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              동태정보 입력
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-10 py-2.5 bg-blue-600 text-white rounded font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              혈통서 정보 저장하기
            </button>
          </div>
        </div>

      <CustomConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(p => ({...p, isOpen: false}))}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
      />

      {isPersonSearchModalOpen && (
        <PersonSearchModal
          isOpen={isPersonSearchModalOpen}
          title={searchTarget === 'owner' ? "소유자 검색" : "번식자 검색"}
          initialQuery={searchInitialQuery}
          onSelectPerson={(person) => {
            if (searchTarget === 'owner') {
              setFormData(prev => ({ 
                ...prev, 
                owner: person.name, 
                ownerId: person.data.id, // 👈 UID(숫자) 대신 로그인 ID(문자) 사용
                ownerAddr: person.data.address,
                ownerPhone: person.data.phone
              }));
            } else {
              setFormData(prev => ({ 
                ...prev, 
                breeder: person.name,
                breederId: person.data.id, // 👈 UID(숫자) 대신 로그인 ID(문자) 사용
                breederAddr: person.data.address,
                breederPhone: person.data.phone,
                // 🎯 [KSAHO AUTO-PROPAGATION] 번식자 선택 시 견사호 정보 동시 주입
                kennel: person.data.saho || prev.kennel,
                kennelNameEng: person.data.sahoEng || prev.kennelNameEng
              }));
            }
            setIsPersonSearchModalOpen(false);
          }}
          onClose={() => setIsPersonSearchModalOpen(false)}
          tableName={memberTableName}
          onlyWithSaho={searchTarget === 'breeder'}
        />
      )}

      {isOwnerChangeModalOpen && (
        <OwnerChangeModal
          isOpen={isOwnerChangeModalOpen}
          onClose={() => setIsOwnerChangeModalOpen(false)}
          onSave={handleAddOwnerChange}
          memberTableName={memberTableName}
        />
      )}
    </div>
  );
};