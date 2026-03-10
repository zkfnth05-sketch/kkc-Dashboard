
import React, { useState, useEffect } from 'react';
import { DongtaeInfo } from '../types';
import { fetchDongtaeInfo, updateDongtaeInfo, generateDongtaeNo } from '../services/dongtaeService';
import { Loader2, X } from 'lucide-react';

interface DongtaeEditFormProps {
  initialDongtaeNo: string | null;
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

const FormLabel = ({ children, required }: React.PropsWithChildren<{ required?: boolean }>) => (
  <label className="text-[14px] font-bold text-gray-800 mb-2 block">
    {children} {required && <span className="text-red-500 ml-1">*</span>}
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

export const DongtaeEditForm: React.FC<DongtaeEditFormProps> = ({ initialDongtaeNo, onSave, onCancel }) => {
  const [formData, setFormData] = useState<DongtaeInfo>(emptyDongtae);
  const [searchDongtaeNo, setSearchDongtaeNo] = useState(initialDongtaeNo || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (targetNo?: string) => {
    const noToSearch = targetNo || searchDongtaeNo;
    if (!noToSearch || noToSearch === '-' || noToSearch === '0') return;
    setIsLoading(true);
    try {
      const data = await fetchDongtaeInfo(noToSearch);
      if (data) {
        setFormData(data);
      } else {
        setFormData({ ...emptyDongtae, dongtae_no: noToSearch });
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialDongtaeNo) {
      handleSearch(initialDongtaeNo);
    }
  }, [initialDongtaeNo]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const newNo = await generateDongtaeNo();
      setSearchDongtaeNo(newNo);
      setFormData({ ...emptyDongtae, dongtae_no: newNo });
    } catch (error: any) {
      alert(`번호 생성 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDongtaeInfo(formData);
      onSave(); 
    } catch (error: any) {
      alert(`DB 저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof DongtaeInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans">
      <div className="bg-white w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden border border-gray-200 shadow-2xl">
        
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-[24px] font-bold text-gray-900">동태정보 수정</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-900 transition-colors"><X size={28} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 bg-white">
          <div className="max-w-4xl mx-auto space-y-10 pb-10">
            
            {/* Search Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-[14px] font-bold text-gray-700 w-44">동태자 코드 (dongtae_no) *</label>
                <div className="flex gap-2 flex-1 max-w-md">
                  <input 
                    type="text" 
                    className="flex-1 border border-gray-300 rounded-sm px-4 h-10 outline-none focus:border-blue-500 bg-white font-medium text-gray-800" 
                    value={searchDongtaeNo} 
                    onChange={e => setSearchDongtaeNo(e.target.value)} 
                    placeholder="동태자 코드를 입력하세요"
                  />
                  <button type="button" onClick={handleGenerate} className="bg-white border border-gray-300 text-gray-800 px-5 h-10 text-[13px] font-bold rounded-sm hover:bg-gray-50 transition-all">동태번호 생성</button>
                </div>
                {isLoading && <Loader2 className="animate-spin text-blue-500" size={20} />}
              </div>
            </div>

            {/* Names Section */}
            <div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">동태자 이름</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {Array.from({ length: 14 }, (_, i) => i + 1).map(i => (
                  <div key={i}>
                    <FormLabel>이름 {i}</FormLabel>
                    <FormInput 
                      field={i === 1 ? 'dongtae_name' : `dongtae_name${i}`} 
                      formData={formData} 
                      onChange={handleChange} 
                    />
                    <p className="text-[12px] text-gray-400 mt-1">혈통서에 표시될 동태정보:</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Info Section */}
            <div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">기타 정보</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div>
                   <FormLabel>시작 등록번호</FormLabel>
                   <FormInput field="regno_start" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>끝 등록번호</FormLabel>
                   <FormInput field="regno_end" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>근친 번식 여부</FormLabel>
                   <FormInput field="spec_relate" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>비고</FormLabel>
                   <FormInput field="memo" formData={formData} onChange={handleChange} />
                </div>
                
                <div>
                   <FormLabel>출산 수컷</FormLabel>
                   <FormInput field="birth_M" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>출산 암컷</FormLabel>
                   <FormInput field="birth_F" formData={formData} onChange={handleChange} />
                </div>

                <div>
                   <FormLabel>사산 수컷</FormLabel>
                   <FormInput field="dead_M" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>사산 암컷</FormLabel>
                   <FormInput field="dead_F" formData={formData} onChange={handleChange} />
                </div>

                <div>
                   <FormLabel>제거 수컷</FormLabel>
                   <FormInput field="cancel_M" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>제거 암컷</FormLabel>
                   <FormInput field="cancel_F" formData={formData} onChange={handleChange} />
                </div>

                <div>
                   <FormLabel>등록 전 사망 수컷</FormLabel>
                   <FormInput field="dead2_M" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>등록 전 사망 암컷</FormLabel>
                   <FormInput field="dead2_F" formData={formData} onChange={handleChange} />
                </div>

                <div>
                   <FormLabel>불명 수컷</FormLabel>
                   <FormInput field="missing_M" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>불명 암컷</FormLabel>
                   <FormInput field="missing_F" formData={formData} onChange={handleChange} />
                </div>

                <div>
                   <FormLabel>유모견 수유 수컷</FormLabel>
                   <FormInput field="bringup_M" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>유모견 수유 암컷</FormLabel>
                   <FormInput field="bringup_F" formData={formData} onChange={handleChange} />
                </div>

                <div>
                   <FormLabel>등록건 수컷</FormLabel>
                   <FormInput field="reg_count_M" formData={formData} onChange={handleChange} />
                </div>
                <div>
                   <FormLabel>등록건 암컷</FormLabel>
                   <FormInput field="reg_count_F" formData={formData} onChange={handleChange} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-6 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving || !formData.dongtae_no} 
            className="bg-blue-600 text-white font-bold px-10 h-10 rounded-sm hover:bg-blue-700 transition-all flex items-center justify-center min-w-[140px] shadow-sm active:scale-95 disabled:bg-blue-300"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : '동태정보 저장'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="bg-white border border-gray-300 text-gray-700 font-bold px-8 h-10 rounded-sm hover:bg-gray-50 transition-all"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
