import React, { useState, useEffect } from 'react';
import { PersonSearchResult } from '../types';
import { searchAllPersons } from '../services/memberService';
import { X, Loader2, Search, User, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface PersonSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPerson: (person: PersonSearchResult) => void;
  title: string;
  initialQuery?: string;
  tableName?: string; // 검색 대상 테이블 추가
}

export const PersonSearchModal: React.FC<PersonSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPerson, 
  title,
  initialQuery = '',
  tableName = 'memTab'
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [message, setMessage] = useState('이름, 아이디, 또는 회원번호를 입력하여 검색하세요.');

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setDebugInfo(null);
      setShowDebug(false);
      if (initialQuery.trim()) {
        executeSearch(initialQuery);
      } else {
        setResults([]);
        setMessage('이름, 아이디, 또는 회원번호를 입력하여 검색하세요.');
      }
    }
  }, [isOpen, initialQuery]);

  const executeSearch = async (searchTerm: string) => {
    setIsLoading(true);
    setMessage('');
    setResults([]);
    setDebugInfo(null);

    try {
      const response = await searchAllPersons(searchTerm, tableName);
      setResults(response.data);
      setDebugInfo(response.debug);
      
      if (response.data.length === 0) {
        setMessage(`검색 결과가 없습니다. (테이블: ${tableName}) 아이디, 성명, 회원번호를 다시 확인해 주세요.`);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`검색 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    executeSearch(query);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
    }
  };

  const handleSelect = (person: PersonSearchResult) => {
    onSelectPerson(person);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[101] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-white border-b border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이름, 아이디, 회원번호 검색"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center min-w-[80px] transition-all"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : '조회'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-2 overflow-y-auto min-h-[350px]">
          {isLoading ? (
             <div className="flex flex-col justify-center items-center h-full text-gray-500 py-10">
                <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
                <p className="text-sm">DB에서 회원 정보를 검색 중입니다...</p>
             </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((person) => (
                <div
                  key={person.id}
                  onClick={() => handleSelect(person)}
                  className="p-3 border border-transparent hover:border-blue-200 hover:bg-blue-50 cursor-pointer rounded-sm transition-all group flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[15px]">{person.name}</span>
                        <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                           {person.context}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        <span className="font-medium">📞 {person.data.phone || '연락처 없음'}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="font-medium">📍 {person.data.address || '주소 정보 없음'}</span>
                      </div>
                  </div>
                  <div className="shrink-0 ml-4">
                    <button className="text-[11px] font-bold bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        선택하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-gray-400 py-10">
              <Search size={40} className="opacity-10 mb-3" />
              <p className="text-sm font-medium text-center px-10">{message}</p>
              
              {debugInfo && (
                <div className="mt-8 w-full max-w-md">
                    <button 
                        onClick={() => setShowDebug(!showDebug)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-[11px] font-bold text-gray-600 transition-colors"
                    >
                        <span className="flex items-center gap-2"><Terminal size={12}/> 시스템 디버그 정보</span>
                        {showDebug ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    {showDebug && (
                        <div className="mt-2 p-3 bg-gray-900 rounded text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-gray-700 shadow-inner">
                            <div className="text-gray-500 mb-1 border-b border-gray-800 pb-1 uppercase">Requested: {debugInfo.requested_table} / Found: {debugInfo.real_table}</div>
                            <div className="text-gray-500 mb-2 uppercase">SQL:</div>
                            {debugInfo.last_query}
                            <div className="mt-3 text-yellow-500 border-t border-gray-800 pt-1">
                                * 행 개수: {debugInfo.row_count}건<br/>
                                * 검색어: "{debugInfo.input_query}"
                            </div>
                        </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded text-sm font-bold hover:bg-gray-50 transition-colors">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};