import React, { useState } from 'react';
import { PersonSearchResult } from '../types';
import { PersonSearchModal } from './MemberSearchModal';
import { X, Loader2, Search } from 'lucide-react';

interface OwnerChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    ok_date: string; 
    poss_id: string; 
    poss_name: string; 
    poss_name_eng: string; 
    poss_addr: string; 
    poss_phone: string;
  }) => Promise<void>;
  memberTableName?: string; // 추가
}

export const OwnerChangeModal: React.FC<OwnerChangeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  memberTableName = 'memTab'
}) => {
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [ownerId, setOwnerId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerNameEng, setOwnerNameEng] = useState('');
  const [ownerAddr, setOwnerAddr] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  
  const [isPersonSearchModalOpen, setIsPersonSearchModalOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectPerson = (person: PersonSearchResult) => {
    setOwnerId(person.data.id);
    setOwnerName(person.data.name);
    setOwnerNameEng(person.data.nameEng || '');
    setOwnerAddr(person.data.address);
    setOwnerPhone(person.data.phone);
    setIsPersonSearchModalOpen(false);
  };

  const openSearch = (type: 'id' | 'name') => {
    const query = type === 'id' ? ownerId : ownerName;
    setSearchInitialQuery(query);
    setIsPersonSearchModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDate || !ownerName) {
      setError('변경일자와 소유자 이름은 필수 항목입니다.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await onSave({
        ok_date: changeDate,
        poss_id: ownerId,
        poss_name: ownerName,
        poss_name_eng: ownerNameEng,
        poss_addr: ownerAddr,
        poss_phone: ownerPhone,
      });
      // 성공 시 초기화는 부모 컴포넌트에서 모달을 닫으며 처리됨
    } catch (e: any) {
      setError(e.message || '저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[101] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Search size={20} className="text-blue-600" />
              소유자 변경 추가
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{error}</div>}
            
            <div className="grid grid-cols-[110px_1fr] items-center gap-x-4">
              <label className="text-sm font-bold text-gray-600">변경일자 <span className="text-red-500">*</span></label>
              <input type="date" value={changeDate} onChange={(e) => setChangeDate(e.target.value)} required className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm h-9 outline-none focus:border-blue-500"/>
            </div>
            
            <div className="grid grid-cols-[110px_1fr] items-center gap-x-4">
              <label className="text-sm font-bold text-gray-600">소유자 ID</label>
              <div className="flex gap-1">
                <input 
                  type="text" 
                  value={ownerId} 
                  onChange={(e) => setOwnerId(e.target.value)} 
                  placeholder="소유자 ID 입력" 
                  className="flex-1 border border-gray-300 rounded-sm px-3 py-1.5 text-sm h-9 outline-none focus:border-blue-500"
                />
                <button type="button" onClick={() => openSearch('id')} className="bg-gray-800 text-white px-4 h-9 rounded-sm text-xs font-bold hover:bg-black transition-colors shrink-0">회원 검색</button>
              </div>
            </div>

            <div className="grid grid-cols-[110px_1fr] items-center gap-x-4">
              <label className="text-sm font-bold text-gray-600">소유자 이름 <span className="text-red-500">*</span></label>
              <div className="flex gap-1">
                <input 
                  type="text" 
                  value={ownerName} 
                  onChange={(e) => setOwnerName(e.target.value)} 
                  required 
                  placeholder="소유자 성함 입력" 
                  className="flex-1 border border-gray-300 rounded-sm px-3 py-1.5 text-sm h-9 outline-none focus:border-blue-500 font-bold"
                />
                <button type="button" onClick={() => openSearch('name')} className="bg-gray-800 text-white px-4 h-9 rounded-sm text-xs font-bold hover:bg-black transition-colors shrink-0">회원 검색</button>
              </div>
            </div>

            <div className="grid grid-cols-[110px_1fr] items-center gap-x-4">
              <label className="text-sm font-bold text-gray-600">소유자 영문명</label>
              <input type="text" value={ownerNameEng} onChange={(e) => setOwnerNameEng(e.target.value)} placeholder="English Name" className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm h-9 outline-none focus:border-blue-500 uppercase"/>
            </div>

            <div className="grid grid-cols-[110px_1fr] items-center gap-x-4">
              <label className="text-sm font-bold text-gray-600">소유자 연락처</label>
              <input type="text" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="010-0000-0000" className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm h-9 outline-none focus:border-blue-500"/>
            </div>

            <div className="grid grid-cols-[110px_1fr] items-center gap-x-4">
              <label className="text-sm font-bold text-gray-600">소유자 주소</label>
              <input type="text" value={ownerAddr} onChange={(e) => setOwnerAddr(e.target.value)} placeholder="주소 입력" className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm h-9 outline-none focus:border-blue-500"/>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 -m-6 mt-6">
              <button type="button" onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-black px-10 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center min-w-[120px] shadow-lg shadow-blue-100 transition-all active:scale-95">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : '변경사항 이력 저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <PersonSearchModal
          isOpen={isPersonSearchModalOpen}
          onClose={() => setIsPersonSearchModalOpen(false)}
          onSelectPerson={handleSelectPerson}
          title="회원 데이터베이스 검색"
          initialQuery={searchInitialQuery}
          tableName={memberTableName}
      />
    </>
  );
};