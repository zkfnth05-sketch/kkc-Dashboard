import React, { useState, useEffect } from 'react';
import { fetchProClasses } from '../services/memberService';
import { Member, ProClass, formatMemberRank } from '../types';
import { X, Loader2, Plus, Search, MapPin, Calendar, User, Check } from 'lucide-react';
import { formatSkillNames } from './SkillManagementPage';

interface MemberEditFormProps {
  member: Member;
  onSave: (m: Member) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

/**
 * 🎯 직능 선택 모달 컴포넌트
 */
const SkillSelectorModal = ({ isOpen, onClose, selectedCodes, onSave, availableSkills, typeFilter }: {
  isOpen: boolean,
  onClose: () => void,
  selectedCodes: string[],
  onSave: (codes: string[]) => void,
  availableSkills: ProClass[],
  typeFilter?: number
}) => {
  const [currentCodes, setCurrentCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setCurrentCodes([...selectedCodes]);
  }, [isOpen, selectedCodes]);

  if (!isOpen) return null;

  const toggleSkill = (code: string) => {
    setCurrentCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[600px] max-h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
          <h3 className="text-[18px] font-bold text-gray-800">
            {typeFilter === 0 ? '자격증 선택' : '직능 선택'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-2 bg-gray-50/30">
          {availableSkills
            .filter(pc => typeFilter === undefined ? true : pc.type === typeFilter)
            .map((pc) => {
              const isSelected = currentCodes.includes(pc.keyy);
              return (
                <button
                  key={pc.uid}
                  type="button"
                  onClick={() => toggleSkill(pc.keyy)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded border text-[12px] font-bold transition-all text-left group
                    ${isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/10'}`}
                >
                  <span className="truncate mr-2">{pc.name}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-blue-500 animate-in zoom-in-50 duration-200" />}
                </button>
              );
            })}
        </div>

        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-2 sticky bottom-0">
          <button type="button" onClick={onClose} className="px-5 h-10 rounded-md text-[13px] font-bold text-gray-500 hover:bg-gray-100 transition-all">취소</button>
          <button
            type="button"
            onClick={() => onSave(currentCodes)}
            className="px-8 h-10 rounded-md text-[13px] font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            저장 ({currentCodes.length}개 선택됨)
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, children, required }: React.PropsWithChildren<{ label: string; required?: boolean }>) => (
  <div className="flex border-b border-gray-200 min-h-[40px]">
    <div className="w-[160px] bg-[#f8f9fa] px-4 py-2 flex items-center text-[13px] text-gray-600 font-medium border-r border-gray-200 shrink-0">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </div>
    <div className="flex-1 px-4 py-1 flex items-center gap-2 overflow-hidden">
      {children}
    </div>
  </div>
);

const Input = ({ value, onChange, placeholder, readOnly, className = "", type = "text" }: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    readOnly={readOnly}
    className={`w-full border border-gray-200 rounded-sm px-3 h-8 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all ${readOnly ? 'bg-transparent text-gray-500 border-none px-0' : 'bg-white text-gray-800'} ${className}`}
  />
);

export const MemberEditForm: React.FC<MemberEditFormProps> = ({ member, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState<Member>({ ...member });
  const [isSaving, setIsSaving] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillModalType, setSkillModalType] = useState<number>(1);
  const [proClasses, setProClasses] = useState<ProClass[]>([]);

  useEffect(() => {
    fetchProClasses().then(setProClasses).catch(console.error);
  }, []);

  useEffect(() => { setFormData({ ...member }); }, [member]);

  const handleChange = (field: keyof Member, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 🎯 직능 개별 제거 (코드 기반으로 변경하여 정확성 확보)
   */
  const handleRemoveSkill = (codeToRemove: string) => {
    if (!codeToRemove) return;

    const currentCodes = (formData.proClass || '').split(/[- ,]+/).filter(c => c.trim() !== '');
    const newCodes = currentCodes.filter(c => c !== codeToRemove);
    // 🎯 양 끝 하이픈 없이 CODE-CODE 형식으로 저장
    handleChange('proClass', newCodes.join('-'));
  };

  /**
   * 🎯 직능 일괄 저장 (모달)
   */
  const handleUpdateSkills = (codes: string[]) => {
    const cleanCodes = codes.filter(c => c.trim() !== '');
    // 🎯 양 끝 하이픈 없이 CODE-CODE 형식으로 저장
    handleChange('proClass', cleanCodes.join('-'));
    setIsSkillModalOpen(false);
  };

  const handleSaveInternal = async () => {
    setIsSaving(true);
    try { await onSave(formData); } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="absolute inset-0 bg-white z-[160] flex flex-col overflow-hidden font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-1 overflow-y-auto bg-white px-8 py-10">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-[26px] font-bold text-gray-900 mb-8 tracking-tight">회원 정보 수정</h2>

          <div className="border border-gray-200 shadow-sm rounded-sm">
            <Row label="ID">
              <span className="text-[13px] font-bold text-gray-800 font-mono tracking-tight">{formData.loginId}</span>
            </Row>
            <Row label="회원번호">
              <Input value={formData.mem_no} onChange={(v: any) => handleChange('mem_no', v)} />
            </Row>
            <Row label="이름" required>
              <Input value={formData.name} onChange={(v: any) => handleChange('name', v)} className="font-bold underline decoration-blue-100 underline-offset-4" />
            </Row>
            <Row label="생년월일">
              <Input value={formData.birth} onChange={(v: any) => handleChange('birth', v)} placeholder="YYYY-MM-DD" />
            </Row>
            <Row label="우편번호">
              <div className="flex gap-2 w-full max-w-md">
                <Input value={formData.zipcode} onChange={(v: any) => handleChange('zipcode', v)} />
                <button type="button" className="px-5 bg-white border border-gray-300 text-[11px] font-bold rounded-sm h-8 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">우편번호 찾기</button>
              </div>
            </Row>
            <Row label="주소">
              <Input value={formData.addr} onChange={(v: any) => handleChange('addr', v)} />
            </Row>
            <Row label="상세 주소">
              <Input value={formData.addr1} onChange={(v: any) => handleChange('addr1', v)} placeholder="" />
            </Row>
            <Row label="DM우편번호">
              <div className="flex gap-2 w-full max-w-md">
                <Input value={formData.zipcode_dm} onChange={(v: any) => handleChange('zipcode_dm', v)} />
                <button type="button" className="px-5 bg-white border border-gray-300 text-[11px] font-bold rounded-sm h-8 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">우편번호 찾기</button>
              </div>
            </Row>
            <Row label="DM주소">
              <Input value={formData.addr_dm} onChange={(v: any) => handleChange('addr_dm', v)} />
            </Row>
            <Row label="DM상세주소">
              <Input value={formData.addr1_dm} onChange={(v: any) => handleChange('addr1_dm', v)} />
            </Row>
            <Row label="연락처">
              <Input value={formData.tel} onChange={(v: any) => handleChange('tel', v)} placeholder="--" />
            </Row>
            <Row label="hp">
              <Input value={formData.hp} onChange={(v: any) => handleChange('hp', v)} />
            </Row>
            <Row label="이메일">
              <Input value={formData.email} onChange={(v: any) => handleChange('email', v)} type="email" />
            </Row>
            <Row label="주민등록번호">
              <Input value={formData.jumin} onChange={(v: any) => handleChange('jumin', v)} />
            </Row>
            <Row label="회원 등급">
              <button type="button" className="bg-[#5c5fef] text-white px-6 h-7 rounded-sm text-[12px] font-bold hover:bg-[#4a4dbf] transition-all flex items-center shadow-sm">
                {formatMemberRank(formData.rank) || '특별회원'}
              </button>
            </Row>

            <div className="flex border-b border-gray-200 min-h-[140px]">
              <div className="w-[160px] bg-[#f8f9fa] px-4 py-4 text-[13px] text-gray-600 font-medium border-r border-gray-200 shrink-0">기타 메모</div>
              <div className="flex-1 px-4 py-3">
                <textarea
                  className="w-full h-32 border border-gray-200 rounded-sm p-3 text-[13px] focus:border-blue-500 outline-none resize-none leading-relaxed"
                  value={formData.memo || ''}
                  onChange={e => handleChange('memo', e.target.value)}
                />
              </div>
            </div>

            <Row label="현재 유효일">
              <span className="text-[13px] text-gray-600 font-medium">{formData.expiryDate || '0000-00-00'}</span>
            </Row>
            <Row label="유효일 변경">
              <Input value={formData.expiryDate} onChange={(v: any) => handleChange('expiryDate', v)} placeholder="YYYY-MM-DD" />
            </Row>

            <div className="bg-[#fcfcfc] px-4 py-3 border-b border-gray-200">
              <h3 className="text-[15px] font-bold text-gray-800">견사호 정보</h3>
            </div>
            <div className="">
              <Row label="이름"><Input value={formData.saho} onChange={(v: any) => handleChange('saho', v)} /></Row>
              <Row label="이름(영문)"><Input value={formData.saho_eng} onChange={(v: any) => handleChange('saho_eng', v)} className="uppercase" /></Row>
              <Row label="등록번호"><Input value={formData.saho_no} onChange={(v: any) => handleChange('saho_no', v)} /></Row>
              <Row label="등록일"><Input value={formData.saho_date} onChange={(v: any) => handleChange('saho_date', v)} placeholder="0000-00-00" /></Row>
            </div>

            <div className="bg-[#fcfcfc] px-4 py-3 border-b border-gray-200">
              <h3 className="text-[15px] font-bold text-gray-800">기술 및 자격 정보</h3>
            </div>
            <div className="p-5 space-y-8">
              {/* 1. 보유 직능 (type=1) */}
              <div>
                <h4 className="text-[13px] font-bold text-gray-700 mb-3 ml-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> 보유 직능
                </h4>
                <div className="flex flex-wrap gap-2 items-center min-h-[40px] p-3 bg-gray-50/30 rounded border border-gray-100">
                  {(() => {
                    const currentCodes = (formData.proClass || '').split(/[- ,]+/).filter(c => c.trim() !== '');
                    const skillMap: Record<string, string> = {};
                    proClasses.forEach(p => { skillMap[p.keyy] = p.name; });

                    const skillCodes = currentCodes.filter(code => {
                      const pc = proClasses.find(p => p.keyy === code);
                      return pc ? pc.type === 1 : true;
                    });

                    return skillCodes.map((code, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-blue-50/50 text-[#5c5fef] px-4 py-1.5 rounded-full border border-blue-100 text-[12px] font-bold shadow-sm group">
                        {skillMap[code] || code}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(code)}
                          className="text-blue-300 hover:text-red-500 transition-colors ml-1"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ));
                  })()}
                  <button
                    type="button"
                    onClick={() => { setSkillModalType(1); setIsSkillModalOpen(true); }}
                    className="flex items-center gap-1.5 bg-white border border-blue-200 text-blue-500 px-4 py-1.5 rounded-md text-[12px] font-bold hover:bg-blue-50 transition-all ml-2"
                  >
                    <Plus size={14} /> 직능 추가
                  </button>
                </div>
              </div>

              {/* 2. 보유 자격증 (type=0) */}
              <div>
                <h4 className="text-[13px] font-bold text-gray-700 mb-3 ml-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> 보유 자격증
                </h4>
                <div className="flex flex-wrap gap-2 items-center min-h-[40px] p-3 bg-orange-50/5 rounded border border-orange-50">
                  {(() => {
                    const currentCodes = (formData.proClass || '').split(/[- ,]+/).filter(c => c.trim() !== '');
                    const skillMap: Record<string, string> = {};
                    proClasses.forEach(p => { skillMap[p.keyy] = p.name; });

                    const licenseCodes = currentCodes.filter(code => {
                      const pc = proClasses.find(p => p.keyy === code);
                      return pc && pc.type === 0;
                    });

                    return licenseCodes.map((code, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-orange-50/50 text-orange-600 px-4 py-1.5 rounded-full border border-orange-100 text-[12px] font-bold shadow-sm group">
                        {skillMap[code] || code}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(code)}
                          className="text-orange-300 hover:text-red-500 transition-colors ml-1"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ));
                  })()}
                  <button
                    type="button"
                    onClick={() => { setSkillModalType(0); setIsSkillModalOpen(true); }}
                    className="flex items-center gap-1.5 bg-white border border-orange-200 text-orange-500 px-4 py-1.5 rounded-md text-[12px] font-bold hover:bg-orange-50 transition-all ml-2"
                  >
                    <Plus size={14} /> 자격증 추가
                  </button>
                </div>
              </div>

              {/* 🎯 직능 RAW 데이터 직접 수정 (사용자 요청) */}
              <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                <p className="text-[11px] text-gray-400 mb-2 font-medium flex items-center gap-1">
                  <Search size={12} /> 데이터 원본 (하이픈 구분 코드)
                </p>
                <input
                  type="text"
                  value={formData.proClass || ''}
                  onChange={(e) => handleChange('proClass', e.target.value)}
                  placeholder="직능/자격증 코드를 직접 입력하세요 (하이픈 구분)"
                  className="w-full border border-gray-200 rounded-sm px-3 h-9 text-[13px] font-mono text-blue-600 focus:border-blue-500 outline-none bg-white transition-all shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 py-5 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div className="flex gap-2">
          <button onClick={handleSaveInternal} disabled={isSaving} className="bg-[#5c5fef] text-white font-bold px-10 h-10 rounded-sm hover:bg-[#4a4dbf] flex items-center justify-center transition-all min-w-[140px] text-sm shadow-sm">
            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : '수정하기'}
          </button>
          <button onClick={onCancel} className="bg-[#333] text-white font-bold px-10 h-10 rounded-sm hover:bg-black transition-all text-sm shadow-sm">돌아가기</button>
        </div>
        <button onClick={() => onDelete && onDelete(formData.id)} className="bg-[#f04444] text-white font-bold px-10 h-10 rounded-sm hover:bg-[#d93a3a] transition-all text-sm shadow-sm">회원 삭제</button>
      </div>

      <div className="px-10 py-3 bg-white border-t border-gray-100 text-[11px] text-gray-400">
        마지막 수정일: {new Date().toLocaleDateString()}
      </div>

      {/* 🎯 직능 선택 모달 */}
      <SkillSelectorModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        selectedCodes={(formData.proClass || '').split(/[- ,]+/).filter(c => c.trim() !== '')}
        onSave={handleUpdateSkills}
        availableSkills={proClasses}
        typeFilter={skillModalType}
      />
    </div>
  );
};
