import { Pedigree, ParentDogInfo, OwnerHistory } from '../types';
import { fetchDogsByRegNos, fetchDogsByUids, fetchOwnerHistory, addOwnerChange, deleteOwnerHistory } from '../services/memberService';
import { PersonSearchModal } from './MemberSearchModal';
import { OwnerChangeModal } from './OwnerChangeModal';
import { CheckpointBar } from './CheckpointBar';
import { Loader2, Save, Edit, Trash2, AlertCircle, X, RotateCcw, Trophy, Settings } from 'lucide-react';
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

const InputField = ({ label, value, onChange, placeholder, readOnly, type = "text", button, className = "" }: any) => (
  <div className={`flex items-center mb-1 ${className}`}>
    <Label>{label}</Label>
    <div className="flex-1 flex gap-1">
      <input 
        type={type} 
        className={`flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none focus:border-blue-500 ${readOnly ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-800'}`}
        value={value || ''}
        onChange={e => onChange ? onChange(e.target.value) : null}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {button}
    </div>
  </div>
);

const ParentDogBox = ({ type, dog, isSearching, regNo, onRegNoChange, onSearch, onClear, onEditRecord }: any) => {
  const displayRegNo = (regNo === '0') ? '미등록' : (regNo || '');
  return (
    <div className="border border-gray-100 rounded bg-gray-50/30 mb-4 overflow-hidden shadow-sm">
      <div className="p-2 border-b border-gray-100 bg-white">
        <InputField 
          label={`${type === 'sire' ? '부견' : '모견'} UID`} 
          value={displayRegNo} 
          onChange={(val: string) => onRegNoChange(val.replace('미등록', ''))}
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
  memberTableName = 'memTab', checkpoints = [], onRestore 
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

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean; confirmText?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    setFormData({...pedigree});
    loadOwnerHistory();
    loadInitialParentInfo();
  }, [pedigree.id]); 

  const loadInitialParentInfo = async () => {
    // fa_regno, mo_regno에 들어있는 값이 UID이므로 fetchDogsByUids 사용
    const sireVal = pedigree.sireRegNo || pedigree.sireUid || '';
    const damVal = pedigree.damRegNo || pedigree.damUid || '';
    const searchKeys = [sireVal, damVal].filter(v => v && v.trim() !== '' && v !== '미등록' && v !== '0' && v !== '-');
    if (searchKeys.length === 0) return;
    try {
      if (sireVal && sireVal !== '미등록' && sireVal !== '0') setIsSearchingSire(true);
      if (damVal && damVal !== '미등록' && damVal !== '0') setIsSearchingDam(true);
      
      const byUid = await fetchDogsByUids(searchKeys, tableName);
      if (sireVal && byUid[sireVal]) setSireDetails(byUid[sireVal]);
      if (damVal && byUid[damVal]) setDamDetails(byUid[damVal]);
    } catch (e) { console.error("Parent Load Error:", e); } finally {
      setIsSearchingSire(false); setIsSearchingDam(false);
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
    const input = type === 'sire' ? formData.sireRegNo : formData.damRegNo;
    if (!input || input === '0' || input === '미등록') {
        setConfirmModal({ isOpen: true, title: '입력 확인', message: '조회할 UID를 입력해주세요.', onConfirm: () => setConfirmModal(p => ({...p, isOpen: false})) });
        return;
    }
    if (type === 'sire') setIsSearchingSire(true); else setIsSearchingDam(true);
    try {
      // UID 기반으로 직접 조회
      const byUid = await fetchDogsByUids([input], tableName);
      const found = Object.values(byUid)[0];
      if (found) {
        if (type === 'sire') { 
          setSireDetails(found); 
          setFormData(prev => ({ ...prev, sireName: found.name, sireUid: found.uid, sireRegNo: found.uid }));
        } else { 
          setDamDetails(found); 
          setFormData(prev => ({ ...prev, damName: found.name, damUid: found.uid, damRegNo: found.uid }));
        }
      } else {
        setConfirmModal({ isOpen: true, title: '검색 결과 없음', message: '해당 UID의 개체를 찾을 수 없습니다.', onConfirm: () => setConfirmModal(p => ({...p, isOpen: false})) });
      }
    } catch (e) {} finally { if (type === 'sire') setIsSearchingSire(false); else setIsSearchingDam(false); }
  };

  const handleClearParent = (type: 'sire' | 'dam') => {
    setConfirmModal({
      isOpen: true, title: '연결 삭제', message: `${type === 'sire' ? '부견' : '모견'} 연결 정보를 삭제하시겠습니까?\n삭제 후 하단의 '혈통서 저장'을 눌러야 최종 반영됩니다.`, isDanger: true,
      onConfirm: () => {
        if (type === 'sire') { setSireDetails(null); setFormData(prev => ({ ...prev, sireRegNo: '0', sireUid: '0', sireName: '' })); }
        else { setDamDetails(null); setFormData(prev => ({ ...prev, damRegNo: '0', damUid: '0', damName: '' })); }
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
              <InputField label="소유자 주소" value={formData.ownerAddr} onChange={(v:any) => handleChange('ownerAddr', v)} />
              <InputField label="소유자 전화번호" value={formData.ownerPhone} onChange={(v:any) => handleChange('ownerPhone', v)} />
              <InputField label="번식자명" value={formData.breeder} onChange={(v:any) => handleChange('breeder', v)} button={<button type="button" onClick={() => { setSearchTarget('breeder'); setSearchInitialQuery(formData.breeder); setIsPersonSearchModalOpen(true); }} className="bg-white border border-gray-300 px-3 h-7 text-[11px] rounded-sm font-bold">검색</button>} />
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
              <div className="flex items-center mb-1">
                <Label>성별</Label>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none" value={formData.gender} onChange={e => handleChange('gender', e.target.value)}>
                  <option value="암컷">암컷</option><option value="수컷">수컷</option>
                </select>
              </div>
              <div className="flex items-center mb-1">
                <Label>그룹</Label>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none" value={formData.group} onChange={e => handleChange('group', e.target.value)}>
                  <option value="Hound">Hound</option><option value="Working">Working</option><option value="Toy">Toy</option><option value="Terrier">Terrier</option>
                </select>
              </div>
              <div className="flex items-center mb-1">
                <Label>견종</Label>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none" value={formData.breed} onChange={e => handleChange('breed', e.target.value)}>
                  <option value="닥스훈트">닥스훈트</option><option value="진돗개">진돗개</option><option value="포메라니안">포메라니안</option>
                </select>
              </div>
              <InputField label="모색" value={formData.color} onChange={(v:any) => handleChange('color', v)} />
              <div className="flex items-center mb-1">
                <Label>모종</Label>
                <select className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none" value={formData.coatType} onChange={e => handleChange('coatType', e.target.value)}>
                  <option value="">-선택-</option><option value="단모">단모</option><option value="장모">장모</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden col-span-2">
            <SectionTitle>특이사항 및 기타 정보 (수정 가능 필드)</SectionTitle>
            <div className="p-4 grid grid-cols-2 gap-x-10 gap-y-1">
              <InputField label="관절 검사" value={formData.specBone} onChange={(v:any) => handleChange('specBone', v)} />
              <InputField label="특이사항(DNA)" value={formData.specDna} onChange={(v:any) => handleChange('specDna', v)} />
              
              <InputField label="종견인정평가" value={formData.okDate} onChange={(v:any) => handleChange('okDate', v)} />
              <InputField label="훈련" value={formData.specTrain} onChange={(v:any) => handleChange('specTrain', v)} />
              
              <InputField label="근친번식" value={formData.specRelate} onChange={(v:any) => handleChange('specRelate', v)} />
              <InputField label="메모" value={formData.memo} onChange={(v:any) => handleChange('memo', v)} />

              <InputField label="국내타단체번호" value={formData.domesticNo} onChange={(v:any) => handleChange('domesticNo', v)} />
              <InputField label="외국타단체번호" value={formData.foreignNo} onChange={(v:any) => handleChange('foreignNo', v)} />

              <InputField label="외국타단체번호2" value={formData.foreignNo2} onChange={(v:any) => handleChange('foreignNo2', v)} />
              <InputField label="마이크로칩번호" value={formData.microchip} onChange={(v:any) => handleChange('microchip', v)} />
              
              <div className="flex items-center mb-1 group">
                <Label>수상 경력 1</Label>
                <div className="flex-1 flex gap-1 items-center">
                  <input readOnly onClick={handleAwardFieldClick} className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none bg-gray-50 text-gray-400 cursor-pointer" value={formData.specWin || ''} placeholder="포인트 관리에서 수정" />
                  <button type="button" onClick={handleAwardFieldClick} className="bg-blue-50 text-blue-600 border border-blue-200 px-2 h-7 text-[10px] font-bold rounded-sm hover:bg-blue-100 shrink-0 flex items-center gap-1"><Settings size={10} /> 관리</button>
                </div>
              </div>
              <div className="flex items-center mb-1 group">
                <Label>수상 경력 2</Label>
                <div className="flex-1 flex gap-1 items-center">
                  <input readOnly onClick={handlePrizeFieldClick} className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-[12px] h-7 outline-none bg-gray-50 text-gray-400 cursor-pointer" value={formData.specWin2 || ''} placeholder="상력 관리에서 수정" />
                  <button type="button" onClick={handlePrizeFieldClick} className="bg-blue-50 text-blue-600 border border-blue-200 px-2 h-7 text-[10px] font-bold rounded-sm hover:bg-blue-100 shrink-0 flex items-center gap-1"><Settings size={10} /> 관리</button>
                </div>
              </div>
              <InputField label="등록일" value={formData.joinDate} onChange={(v:any) => handleChange('joinDate', v)} className="col-span-2" />
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden col-span-2">
            <SectionTitle>부모견 정보</SectionTitle>
            <div className="p-4 grid grid-cols-2 gap-x-10">
              <ParentDogBox type="sire" dog={sireDetails} isSearching={isSearchingSire} regNo={formData.sireRegNo} onRegNoChange={(v:any) => handleChange('sireRegNo', v)} onSearch={() => handleParentSearch('sire')} onClear={() => handleClearParent('sire')} onEditRecord={() => handleEditParentRecord('sire')} />
              <ParentDogBox type="dam" dog={damDetails} isSearching={isSearchingDam} regNo={formData.damRegNo} onRegNoChange={(v:any) => handleChange('damRegNo', v)} onSearch={() => handleParentSearch('dam')} onClear={() => handleClearParent('dam')} onEditRecord={() => handleEditParentRecord('dam')} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-6 items-start mb-10">
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden min-h-[100px]">
            <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
              <span className="font-bold text-gray-700 text-[13px]">소유자 변경 이력</span>
              <button type="button" onClick={() => setIsOwnerChangeModalOpen(true)} className="px-3 h-7 bg-white border border-gray-300 text-[11px] font-bold rounded hover:bg-gray-50 transition-colors">소유자 변경 추가</button>
            </div>
            <div className="p-4">
              {ownerHistory.length > 0 ? (
                <table className="w-full text-[11px] text-left">
                  <thead><tr className="border-b text-gray-400"><th className="pb-2 font-medium">변경일</th><th className="pb-2 font-medium">소유자</th><th className="pb-2 font-medium">ID</th><th className="pb-2 font-medium w-16 text-center">관리</th></tr></thead>
                  <tbody>
                    {ownerHistory.map((h, i) => (
                      <tr key={i} className="border-b border-gray-50 group">
                        <td className="py-2 text-gray-600">{h.ok_date}</td>
                        <td className="py-2 font-bold text-gray-800">{h.poss_name}</td>
                        <td className="py-2 text-gray-500">{h.poss_id}</td>
                        <td className="py-2 text-center">
                          <button type="button" onClick={() => { setConfirmModal({ isOpen: true, title: '이력 삭제', message: '삭제하시겠습니까?', isDanger: true, onConfirm: async () => { try { await deleteOwnerHistory(h.uid); loadOwnerHistory(); setConfirmModal(p=>({...p,isOpen:false})); } catch(e){alert(e.message);}}}); }} className="p-1.5 text-red-300 hover:text-red-500"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="text-[11px] text-gray-400 italic py-4 text-center">변경 이력이 없습니다.</div>}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button type="button" onClick={() => onOpenDongtaeForm(formData.dongtaeNo)} className="px-4 py-2 bg-[#4b5563] text-white text-[13px] rounded font-medium hover:bg-gray-700">동태정보 입력</button>
            <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-[14px] rounded font-bold hover:bg-gray-50">취소</button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="px-10 py-2.5 bg-[#1f2937] text-white text-[14px] rounded font-bold shadow-lg hover:bg-black flex items-center gap-2 transition-all active:scale-95">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 혈통서 저장
            </button>
          </div>
        </div>
      </div>
      <CustomConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} isDanger={confirmModal.isDanger} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(p => ({...p, isOpen: false}))} />
      <PersonSearchModal isOpen={isPersonSearchModalOpen} onClose={() => setIsPersonSearchModalOpen(false)} onSelectPerson={(p) => {
          if (searchTarget === 'owner') setFormData(prev => ({...prev, ownerId: p.data.id, owner: p.data.name, ownerPhone: p.data.phone, ownerAddr: p.data.address}));
          else setFormData(prev => ({...prev, breederId: p.data.id, breeder: p.data.name, breederPhone: p.data.phone, breederAddr: p.data.address}));
          setIsPersonSearchModalOpen(false);
      }} title={searchTarget === 'owner' ? '소유자 검색' : '번식자 검색'} initialQuery={searchInitialQuery} tableName={memberTableName} />
      <OwnerChangeModal isOpen={isOwnerChangeModalOpen} onClose={() => setIsOwnerChangeModalOpen(false)} onSave={async (data) => { try { await addOwnerChange({ ...data, dog_uid: pedigree.id }, tableName); setFormData(prev => ({ ...prev, ownerId: data.poss_id, owner: data.poss_name, ownerAddr: data.poss_addr })); setIsOwnerChangeModalOpen(false); loadOwnerHistory(); } catch (e: any) { alert(e.message); } }} memberTableName={memberTableName} />
    </div>
  );
};