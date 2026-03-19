
import React, { useState, useEffect } from 'react';
import { DongtaeInfo } from '../types';
import { fetchDongtaeInfo, saveDongtaeInfo, generateDongtaeNo, deleteDongtaeInfo } from '../services/dongtaeService';
import { fetchDogsByUids, fetchBridge } from '../services/memberService';
import { Loader2, X, Dog } from 'lucide-react'; 
import { ParentDogInfo } from '../types';

interface DongtaeEditFormProps {
  initialDongtaeNo: string | null;
  linkedDogId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

const emptyDongtae: DongtaeInfo = {
    dongtae_no: '', 
    dongtae_name: '', dongtae_name2: '', dongtae_name3: '', dongtae_name4: '', dongtae_name5: '', 
    dongtae_name6: '', dongtae_name7: '', dongtae_name8: '', dongtae_name9: '', dongtae_name10: '', 
    dongtae_name11: '', dongtae_name12: '', dongtae_name13: '', dongtae_name14: '',
    regno_start: '', regno_end: '', spec_relate: '', 
    fa_reg_no: '', mo_reg_no: '', breeder: '', 
    reg_date: '', sign_date: '', memo: '',
    birth_M: '0', birth_F: '0', 
    dead_M: '0', dead_F: '0', 
    cancel_M: '0', cancel_F: '0', 
    dead2_M: '0', dead2_F: '0', 
    missing_M: '0', missing_F: '0', 
    bringup_M: '0', bringup_F: '0', 
    reg_count_M: '0', reg_count_F: '0'
};

const FormLabel = ({ children, required, isAuto }: React.PropsWithChildren<{ required?: boolean; isAuto?: boolean }>) => (
  <label className="text-[14px] font-bold text-gray-800 mb-2 flex items-center gap-2">
    <span>{children}</span>
    {required && <span className="text-red-500">*</span>}
    {isAuto && (
      <span className="bg-green-50 text-green-600 text-[10px] px-1.5 py-0.5 rounded-full border border-green-100 font-medium">
        자동 생성
      </span>
    )}
  </label>
);

const FormInput = ({ field, formData, onChange, placeholder, type = "text", className = "" }: any) => (
  <input
    type={type}
    className={`w-full border border-gray-300 rounded-sm px-3 py-1.5 text-[14px] h-10 outline-none focus:border-blue-500 bg-white transition-all ${className}`}
    value={(formData[field] as string) || ''}
    onChange={e => onChange(field, e.target.value)}
    placeholder={placeholder}
  />
);

export const DongtaeEditForm: React.FC<DongtaeEditFormProps> = ({ initialDongtaeNo, linkedDogId, onSave, onCancel }) => {
  const [formData, setFormData] = useState<DongtaeInfo>(emptyDongtae);
  const [searchDongtaeNo, setSearchDongtaeNo] = useState(initialDongtaeNo || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sireInfo, setSireInfo] = useState<ParentDogInfo | null>(null);
  const [damInfo, setDamInfo] = useState<ParentDogInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSearch = async (targetNo?: string) => {
    const noToSearch = targetNo || searchDongtaeNo;
    if (!noToSearch || noToSearch === '-' || noToSearch === '0') return;
    setIsLoading(true);
    try {
      const data = await fetchDongtaeInfo(noToSearch);
      let updatedData = data ? { ...data } : { ...emptyDongtae, dongtae_no: noToSearch };
      
      console.log(">> 🔍 조회 데이터 상세:", updatedData);

      // 1. 역추적 및 범위 계산 로직
      const childrenRes = await fetchBridge({
        mode: 'list',
        table: 'dogTab',
        search: noToSearch,
        field: 'dongtae_no'
      });
      
      if (childrenRes.success && childrenRes.data.length > 0) {
        // 이미 등록된 자녀들이 있다면 범위를 계산
        const regNos = childrenRes.data
          .map((d: any) => d.reg_no)
          .filter((r: any) => r && r.trim() !== '')
          .sort();
        
        if (regNos.length > 0) {
          updatedData.regno_start = regNos[0];
          updatedData.regno_end = regNos[regNos.length - 1];
        }

        // 부모 정보가 누락되었다면 첫 번째 자녀 데이터에서 가져옴
        const sample = childrenRes.data[0];
        if (!updatedData.fa_reg_no || updatedData.fa_reg_no === '0') updatedData.fa_reg_no = sample.fa_regno || '0';
        if (!updatedData.mo_reg_no || updatedData.mo_reg_no === '0') updatedData.mo_reg_no = sample.mo_regno || '0';
      } else if (linkedDogId) {
        // 자녀 데이터가 검색되지 않았는데 상세페이지에서 넘어왔다면, 현재 강아지 정보를 기준으로 함
        const dogRes = await fetchBridge({ mode: 'list', table: 'dogTab', search: linkedDogId, field: 'uid', limit: 1 });
        if (dogRes.success && dogRes.data.length > 0) {
          const dog = dogRes.data[0];
          updatedData.regno_start = updatedData.regno_start || dog.reg_no || '';
          updatedData.regno_end = updatedData.regno_end || dog.reg_no || '';
          if (!updatedData.fa_reg_no || updatedData.fa_reg_no === '0') updatedData.fa_reg_no = dog.fa_regno || '0';
          if (!updatedData.mo_reg_no || updatedData.mo_reg_no === '0') updatedData.mo_reg_no = dog.mo_regno || '0';
        }
      }

      setFormData(updatedData);

      // 2. 부모 상세 정보 로드
      const uids = [updatedData.fa_reg_no, updatedData.mo_reg_no].filter(v => v && v !== '0');
      if (uids.length > 0) {
        const dogInfos = await fetchDogsByUids(uids);
        setSireInfo(dogInfos[updatedData.fa_reg_no] || null);
        setDamInfo(dogInfos[updatedData.mo_reg_no] || null);
      } else {
        setSireInfo(null);
        setDamInfo(null);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDeleting) return; // 👈 삭제 중에는 다시 조회하지 않음
    
    if (initialDongtaeNo && initialDongtaeNo !== '-' && initialDongtaeNo !== '0' && initialDongtaeNo.trim() !== '') {
      // 이미 로드된 데이터와 같으면 중복 조회 방지
      if (formData.dongtae_no !== initialDongtaeNo) {
        handleSearch(initialDongtaeNo);
      }
    } else if (linkedDogId && !formData.uid) { // 👈 UID가 없을 때만 생성
      handleGenerate();
    }
  }, [initialDongtaeNo, linkedDogId]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const newNo = await generateDongtaeNo();
      setSearchDongtaeNo(newNo);
      
      const numericPart = newNo.replace(/[^0-9]/g, '');
      let baseData = { ...emptyDongtae, dongtae_no: newNo, memo: numericPart };

      if (linkedDogId) {
        const dogRes = await fetchBridge({ mode: 'list', table: 'dogTab', search: linkedDogId, field: 'uid', limit: 1 });
        if (dogRes.success && dogRes.data.length > 0) {
          const dog = dogRes.data[0];
          baseData.regno_start = dog.reg_no || '';
          baseData.regno_end = dog.reg_no || '';
          baseData.fa_reg_no = dog.fa_regno || '0';
          baseData.mo_reg_no = dog.mo_regno || '0';
          
          const uids = [dog.fa_regno, dog.mo_regno].filter(v => v && v !== '0');
          if (uids.length > 0) {
            const dogInfos = await fetchDogsByUids(uids);
            setSireInfo(dogInfos[dog.fa_regno] || null);
            setDamInfo(dogInfos[dog.mo_regno] || null);
          }
        }
      }

      // 🚀 [핵심] 번호 생성 즉시 DB에 '가등록'하여 UID를 미리 발급받습니다.
      const savedRes = await saveDongtaeInfo(baseData);
      if (savedRes.success && savedRes.id) {
        baseData.uid = savedRes.id;
        console.log(">> 🎫 신규 UID 발급 완료:", savedRes.id);
      }
      
      setFormData(baseData);
    } catch (error: any) {
      alert(`번호 생성 및 가등록 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveDongtaeInfo(formData);
      if (linkedDogId && formData.dongtae_no) {
        await fetchBridge({
          mode: 'update_record',
          table: 'dogTab',
          data: { uid: linkedDogId, dongtae_no: formData.dongtae_no }
        });
      }
      onSave(); 
    } catch (error: any) {
      alert(`DB 저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetUid = String(formData.uid || '').trim();
    if (!targetUid || targetUid === '0' || targetUid === 'undefined') {
      alert("삭제할 데이터의 고유번호가 없습니다. (번호를 먼저 조회/생성해 주세요)");
      return;
    }

    // 브라우저 confirm 대신 UI 상태를 변경합니다.
    setShowDeleteConfirm(true); 
  };

  const handleConfirmDelete = async () => {
    const targetUid = String(formData.uid || '').trim();
    
    setIsDeleting(true);
    setIsSaving(true);
    console.log(">> 🗑️ [최종 삭제 실행] ID:", targetUid);

    try {
      const res = await deleteDongtaeInfo(targetUid);
      if (res.success) {
        alert('데이터가 성공적으로 삭제되었습니다.');
        onSave(); // 모달 닫기
      } else {
        alert(`삭제 실패: ${res.error}`);
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      alert(`시스템 오류: ${err.message}`);
      setShowDeleteConfirm(false);
    } finally {
      setIsSaving(false);
      setIsDeleting(false);
    }
  };

  const handleChange = (field: keyof DongtaeInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans">
      <div className="bg-white w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden border border-gray-200 shadow-2xl">
        <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-[24px] font-bold text-gray-900">동태정보 수정</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-900 transition-colors"><X size={28} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-8 bg-white text-gray-800">
          <div className="max-w-4xl mx-auto space-y-10 pb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <FormLabel isAuto>동태자 코드 (dongtae_no) *</FormLabel>
                <div className="flex gap-2 flex-1 max-w-md">
                  <input 
                    type="text" 
                    className="flex-1 border border-gray-300 rounded-sm px-4 h-10 outline-none focus:border-blue-500 bg-gray-50 font-medium text-gray-800" 
                    value={searchDongtaeNo} 
                    onChange={e => setSearchDongtaeNo(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSearch(searchDongtaeNo)}
                    placeholder="동태자 코드를 입력하세요"
                  />
                  <button type="button" onClick={() => handleSearch(searchDongtaeNo)} className="bg-blue-500 text-white px-5 h-10 text-[13px] font-bold rounded-sm hover:bg-blue-600 transition-all">조회</button>
                  <button type="button" onClick={handleGenerate} className="bg-white border border-gray-300 text-gray-800 px-5 h-10 text-[13px] font-bold rounded-sm hover:bg-gray-50 transition-all">번호 생성</button>
                </div>
                {isLoading && <Loader2 className="animate-spin text-blue-500" size={20} />}
              </div>
              <p className="text-[12px] text-blue-600 ml-48">💡 혈통서 등록 시 시스템이 자동으로 생성하여 부여하는 번호입니다.</p>
            </div>
            <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Dog size={20} className="text-blue-500" /> 연결된 부모견 정보 (Parents Info)
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold shrink-0">부</div>
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-400">부견 (Sire)</p>
                    {sireInfo ? (
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">{sireInfo.fullname || sireInfo.name}</p>
                        <p className="text-[13px] text-blue-600 font-medium">{sireInfo.reg_no || '미등록'}</p>
                      </div>
                    ) : <p className="text-[14px] text-gray-300 italic">연결된 부견 정보가 없습니다.</p>}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 font-bold shrink-0">모</div>
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-400">모견 (Dam)</p>
                    {damInfo ? (
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">{damInfo.fullname || damInfo.name}</p>
                        <p className="text-[13px] text-pink-600 font-medium">{damInfo.reg_no || '미등록'}</p>
                      </div>
                    ) : <p className="text-[14px] text-gray-300 italic">연결된 모견 정보가 없습니다.</p>}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">동태자 이름</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {Array.from({ length: 14 }, (_, i) => i + 1).map(i => (
                  <div key={i}>
                    <FormLabel>이름 {i}</FormLabel>
                    <FormInput field={i === 1 ? 'dongtae_name' : `dongtae_name${i}`} formData={formData} onChange={handleChange} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">기타 정보</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-gray-800">
                <div><FormLabel isAuto>시작 등록번호</FormLabel><FormInput field="regno_start" formData={formData} onChange={handleChange} className="bg-gray-50" /></div>
                <div><FormLabel isAuto>끝 등록번호</FormLabel><FormInput field="regno_end" formData={formData} onChange={handleChange} className="bg-gray-50" /></div>
                <div><FormLabel>근친 번식 여부</FormLabel><FormInput field="spec_relate" formData={formData} onChange={handleChange} /></div>
                <div><FormLabel>비고</FormLabel><FormInput field="memo" formData={formData} onChange={handleChange} /></div>
                <div><FormLabel>출산 수컷</FormLabel><FormInput field="birth_M" formData={formData} onChange={handleChange} /></div>
                <div><FormLabel>출산 암컷</FormLabel><FormInput field="birth_F" formData={formData} onChange={handleChange} /></div>
                <div><FormLabel>등록건 수컷</FormLabel><FormInput field="reg_count_M" formData={formData} onChange={handleChange} /></div>
                <div><FormLabel>등록건 암컷</FormLabel><FormInput field="reg_count_F" formData={formData} onChange={handleChange} /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-10 py-6 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
          {!showDeleteConfirm ? (
            <>
              {formData.uid && formData.uid !== '0' && (
                <button 
                  type="button" 
                  onClick={handleDelete} 
                  className="bg-red-50 text-red-600 border border-red-200 font-bold px-8 h-10 rounded-sm hover:bg-red-600 hover:text-white transition-all mr-auto"
                >
                  동태 기록 완전 삭제
                </button>
              )}
              <button type="button" onClick={handleSave} disabled={isSaving || !formData.dongtae_no} className="bg-blue-600 text-white font-bold px-10 h-10 rounded-sm hover:bg-blue-700 transition-all flex items-center justify-center min-w-[140px] shadow-sm disabled:bg-blue-300">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : '동태정보 저장'}
              </button>
              <button type="button" onClick={onCancel} className="bg-white border border-gray-300 text-gray-700 font-bold px-8 h-10 rounded-sm hover:bg-gray-50 transition-all">취소</button>
            </>
          ) : (
            <div className="flex items-center gap-4 mr-auto bg-red-50 p-2 rounded-md border border-red-100 animate-in fade-in slide-in-from-left-4">
              <span className="text-red-700 font-bold text-[14px] ml-4">정말로 이 기록을 삭제하시겠습니까?</span>
              <button 
                type="button" 
                onClick={handleConfirmDelete} 
                disabled={isSaving}
                className="bg-red-600 text-white font-bold px-6 h-10 rounded-sm hover:bg-red-700 transition-all flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : '네, 삭제합니다'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)} 
                disabled={isSaving}
                className="bg-white border border-gray-300 text-gray-700 font-bold px-6 h-10 rounded-sm hover:bg-gray-50 transition-all"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
