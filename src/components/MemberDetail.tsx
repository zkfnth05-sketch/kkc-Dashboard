import React, { useState, useEffect } from 'react';
import { Member, MEMBER_RANK_MAP } from '../types';
import { CheckpointBar } from './CheckpointBar';
import { RotateCcw, Save, Search, Plus, X, Loader2, Check } from 'lucide-react';
import { formatSkillNames, SKILL_CONFIG, getAllSkills } from './SkillManagementPage';
import { fetchPedigrees } from '../services/pedigreeService';

interface MemberDetailProps {
  member: Member | null;
  onSave: (updatedMember: Member) => void;
  checkpoints?: any[];
  onRestore?: (checkpoint: any) => void;
}

const Label = ({ children, required }: React.PropsWithChildren<{ required?: boolean }>) => (
  <div className="bg-gray-50 border-r border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 flex items-center min-h-[36px]">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

const InputWrapper = ({ children }: React.PropsWithChildren<{}>) => (
  <div className="px-3 py-1 flex items-center gap-2 min-h-[36px]">
    {children}
  </div>
);

const SkillSelectionModal = ({
  isOpen,
  onClose,
  initialSelectedCodes,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedCodes: string[];
  onSave: (selectedCodes: string[]) => void;
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedCodes));

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(initialSelectedCodes));
    }
  }, [isOpen, initialSelectedCodes]);

  if (!isOpen) return null;

  const toggleSelection = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelected(next);
  };

  const handleSave = () => {
    onSave(Array.from(selected));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
          <h2 className="text-[20px] font-bold text-gray-900 leading-none">직능 선택</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(getAllSkills()).map(([name, code]) => {
              const isSelected = selected.has(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleSelection(code)}
                  className={`flex items-center justify-between px-4 py-3 rounded border text-left transition-colors font-medium text-[13px] ${isSelected
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                >
                  <span className="truncate pr-2">{name}</span>
                  {isSelected && <Check size={18} className="text-blue-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white flex justify-center items-center gap-6">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-2.5 bg-[#4285f4] hover:bg-[#3b75c3] text-white text-[14px] font-bold rounded shadow-md transition-colors active:scale-95"
          >
            저장 ({selected.size}개 선택됨)
          </button>
        </div>
      </div>
    </div>
  );
};

export const MemberDetail: React.FC<MemberDetailProps> = ({ member, onSave, checkpoints = [], onRestore }) => {
  const [formData, setFormData] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // 부모로부터 member가 바뀔 때(저장 성공 포함) 내부 폼 데이터를 동기화
  useEffect(() => {
    if (member) {
      setFormData({ ...member });
      // 소유한 애견 목록 가져오기
      fetchPedigrees('dogTab', 1, member.loginId, 'poss_id').then(res => {
        setFormData(prev => prev ? ({ ...prev, dogs: res.data }) : null);
      });
    } else {
      setFormData(null);
    }
  }, [member]);

  const handleChange = (field: keyof Member, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyAddressToDm = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      zipcode_dm: formData.zipcode,
      addr_dm: formData.addr,
      addr1_dm: formData.addr1
    });
  };

  if (!formData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
        <h3 className="text-lg font-medium text-gray-500">목록에서 회원을 선택해 주세요.</h3>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-l border-gray-200 shadow-inner">
      <CheckpointBar
        checkpoints={checkpoints}
        onRestore={onRestore || (() => { })}
        onViewDiff={() => { }}
      />

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {/* Header Title */}
        <div className="flex justify-between items-end border-b-2 border-gray-800 pb-3 mb-6">
          <h3 className="text-2xl font-black text-gray-900">{formData.name} 님 상세 정보</h3>
        </div>

        {/* Info Grid Table */}
        <div className="border border-gray-200 rounded-sm mb-8">
          <div className="grid grid-cols-[140px_1fr]">
            {/* Row: 회원번호 */}
            <Label>회원번호</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none" value={formData.mem_no || ''} onChange={(e) => handleChange('mem_no', e.target.value)} />
            </InputWrapper>

            {/* Row: 아이디 */}
            <Label>아이디</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm bg-gray-50 text-gray-500 font-mono" value={formData.loginId || ''} readOnly />
            </InputWrapper>

            {/* Row: 비밀번호 */}
            <Label>비밀번호</Label>
            <InputWrapper>
              <input type="password" placeholder="변경 시에만 입력" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none" value={formData.loginId || ''} readOnly />
            </InputWrapper>

            {/* Row: 이름 */}
            <Label required>이름</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm font-bold focus:border-blue-500 outline-none" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            </InputWrapper>

            {/* Row: 이름(영문) */}
            <Label>이름(영문)</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none uppercase" value={formData.name_eng || ''} onChange={(e) => handleChange('name_eng', e.target.value)} />
            </InputWrapper>

            {/* Row: 연락처 */}
            <Label>연락처</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none" value={formData.tel || ''} onChange={(e) => handleChange('tel', e.target.value)} />
            </InputWrapper>

            {/* Row: 휴대전화 */}
            <Label>휴대전화</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm font-bold focus:border-blue-500 outline-none" value={formData.hp || ''} onChange={(e) => handleChange('hp', e.target.value)} />
            </InputWrapper>

            {/* Row: 주소 */}
            <Label>주소</Label>
            <div className="px-3 py-2 space-y-1">
              <div className="flex gap-1">
                <input type="text" className="w-24 h-8 px-2 border border-gray-300 rounded-sm text-sm" value={formData.zipcode || ''} onChange={(e) => handleChange('zipcode', e.target.value)} />
                <button className="bg-green-600 text-white text-[11px] font-bold px-3 rounded hover:bg-green-700 transition-colors">주소 찾기</button>
              </div>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm" placeholder="기본 주소 (addr)" value={formData.addr || ''} onChange={(e) => handleChange('addr', e.target.value)} />
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm" placeholder="상세 주소 (addr1)" value={formData.addr1 || ''} onChange={(e) => handleChange('addr1', e.target.value)} />
            </div>

            {/* Row: DM주소 */}
            <Label>DM주소</Label>
            <div className="px-3 py-2 space-y-1">
              <div className="flex gap-1">
                <input type="text" className="w-24 h-8 px-2 border border-gray-300 rounded-sm text-sm" value={formData.zipcode_dm || ''} onChange={(e) => handleChange('zipcode_dm', e.target.value)} />
                <button className="bg-green-600 text-white text-[11px] font-bold px-3 rounded hover:bg-green-700 transition-colors">주소 찾기</button>
                <button onClick={copyAddressToDm} className="bg-green-600 text-white text-[11px] font-bold px-3 rounded hover:bg-green-700 transition-colors">기본 주소와 동일</button>
              </div>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm" placeholder="DM 기본 주소 (addr_dm)" value={formData.addr_dm || ''} onChange={(e) => handleChange('addr_dm', e.target.value)} />
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm" placeholder="DM 상세 주소 (addr1_dm)" value={formData.addr1_dm || ''} onChange={(e) => handleChange('addr1_dm', e.target.value)} />
            </div>

            {/* Row: 이메일 */}
            <Label>이메일</Label>
            <InputWrapper>
              <input type="email" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
            </InputWrapper>

            {/* Row: 생년월일 */}
            <Label>생년월일</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none" value={formData.birth || ''} onChange={(e) => handleChange('birth', e.target.value)} />
            </InputWrapper>

            {/* Row: 견사호 */}
            <Label>견사호</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none" value={formData.saho || ''} onChange={(e) => handleChange('saho', e.target.value)} />
            </InputWrapper>

            {/* Row: 견사호(영문) */}
            <Label>견사호(영문)</Label>
            <InputWrapper>
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none uppercase" value={formData.saho_eng || ''} onChange={(e) => handleChange('saho_eng', e.target.value)} />
            </InputWrapper>

            {/* Row: 메모 */}
            <Label>메모</Label>
            <div className="px-3 py-2">
              <textarea
                className="w-full h-40 px-2 py-2 border border-gray-300 rounded-sm text-sm resize-none focus:border-blue-500 outline-none leading-relaxed"
                value={formData.memo || ''}
                onChange={(e) => handleChange('memo', e.target.value)}
              />
            </div>

            {/* Row: 회원등급 */}
            <Label>회원등급</Label>
            <InputWrapper>
              <select className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm focus:border-blue-500 outline-none" value={formData.rank || ''} onChange={(e) => handleChange('rank', e.target.value)}>
                {Object.entries(MEMBER_RANK_MAP).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
                {!Object.keys(MEMBER_RANK_MAP).includes(formData.rank || '') && formData.rank && (
                  <option value={formData.rank}>{formData.rank}</option>
                )}
              </select>
            </InputWrapper>

            {/* Row: 유효일 */}
            <Label>유효일</Label>
            <div className="px-3 py-2 space-y-1">
              <input type="text" className="w-full h-8 px-2 border border-gray-300 rounded-sm text-sm text-gray-400" placeholder="YYYY-MM-DD" value={formData.expiryDate || ''} onChange={(e) => handleChange('expiryDate', e.target.value)} />
              <p className="text-[11px] text-gray-400">기존 유효일: {formData.expiryDate || '-'}</p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mb-10">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#d1d5db] hover:bg-gray-400 text-gray-800 px-8 py-2 rounded-sm font-bold text-sm transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}
            변경사항 저장
          </button>
        </div>

        {/* Skill Section */}
        <div className="mb-10">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">보유 직능</h4>
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-md flex flex-wrap gap-2 items-center">
            {(() => {
              const currentCodes = (formData.proClass || '').split('-').filter(c => c.trim() !== '');

              const handleRemoveSkill = (codeToRemove: string) => {
                const newCodes = currentCodes.filter(c => c !== codeToRemove);
                handleChange('proClass', newCodes.join('-'));
              };

              // 🎯 SkillManagementPage에서 제공하는 강력한 이름 변환 함수 활용
              const skillNames = formatSkillNames(formData.proClass);

              return currentCodes.length > 0 ? (
                currentCodes.map((code, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1">
                    {skillNames[idx]} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveSkill(code)} />
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">보유한 직능이 없습니다.</span>
              );
            })()}

            <button
              type="button"
              className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 font-medium ml-2 border border-gray-200 px-3 py-1.5 rounded bg-white transition-colors"
              onClick={() => setIsAddingSkill(true)}
            >
              + 직능 추가
            </button>
          </div>
        </div>

        {/* 직능 선택 모달 */}
        <SkillSelectionModal
          isOpen={isAddingSkill}
          onClose={() => setIsAddingSkill(false)}
          initialSelectedCodes={(formData.proClass || '').split('-').filter(c => c.trim() !== '')}
          onSave={(selectedCodes) => {
            handleChange('proClass', selectedCodes.join('-'));
          }}
        />

        {/* Owned Dogs Table */}
        <div className="mb-10">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">소유한 애견 목록</h4>
          <div className="border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2 border-r border-gray-200 w-16">사진</th>
                  <th className="py-2 border-r border-gray-200">등록번호</th>
                  <th className="py-2 border-r border-gray-200">애견이름</th>
                  <th className="py-2">생년월일</th>
                </tr>
              </thead>
              <tbody>
                {formData.dogs && formData.dogs.length > 0 ? (
                  formData.dogs.map((dog: any, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 border-r border-gray-200">
                        {dog.photo ? (
                          <img
                            src={`https://kkc3349.mycafe24.com/data/dog/${dog.photo}`}
                            alt={dog.name}
                            className="w-10 h-10 object-cover mx-auto rounded-sm border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=No+Img';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 mx-auto rounded-sm border border-gray-200">No Photo</div>
                        )}
                      </td>
                      <td className="py-2 border-r border-gray-200 font-mono">{dog.regNo}</td>
                      <td className="py-2 border-r border-gray-200 font-bold text-blue-700">{dog.name}</td>
                      <td className="py-2">{dog.birthDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-gray-400 text-center italic">등록된 애견이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};