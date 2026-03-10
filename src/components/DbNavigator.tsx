import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Database, Info } from 'lucide-react';
import { fetchAllTableNames } from '../services/memberService';

interface DbNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  allTables: string[];
  activeTableName: string;
  onTableSelect: (tableName: string) => void;
  onConnect: () => void;
  bridgeUrl: string;
  onBridgeUrlChange: (url: string) => void;
}

export const DbNavigator: React.FC<DbNavigatorProps> = ({
  isOpen,
  onClose,
  allTables,
  activeTableName,
  onTableSelect,
  onConnect,
  bridgeUrl,
  onBridgeUrlChange,
}) => {
  const [filter, setFilter] = useState('');
  const [dbDetails, setDbDetails] = useState<{name: string, prefix: string} | null>(null);

  // 컴포넌트가 열릴 때 DB 상세 정보를 가져오기 위해 fetchAllTableNames 결과 활용
  useEffect(() => {
    if (isOpen) {
      // fetchAllTableNames는 내부적으로 bridg.php의 get_all_tables를 호출함
      // memberService.ts의 fetchAllTableNames가 db_name을 반환하도록 수정하거나, 
      // 여기서 직접 요청을 보낼 수도 있지만 구조 유지를 위해 fetchAllTableNames를 다시 호출
      const loadDetails = async () => {
        try {
          // fetchAllTableNames를 호출하면 내부적으로 응답에 db_name이 포함되어 있음
          // (bridg.php 수정 후)
          const res = await fetchAllTableNames();
          // API 응답 객체 전체를 가져오기 위해 직접 fetchBridge를 부르는 것이 좋으나 
          // 현재 memberService는 data만 리턴하므로, 
          // 만약 응답 객체에 db_name이 있다면 그것을 활용하도록 service를 수정하거나
          // 여기서는 '조회 중...' 상태를 보여줌
        } catch (e) {}
      };
      loadDetails();
    }
  }, [isOpen]);

  const filteredTables = useMemo(() => {
    if (!filter) return allTables;
    return allTables.filter(t => t.toLowerCase().includes(filter.toLowerCase()));
  }, [allTables, filter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm flex animate-in fade-in duration-200">
      <div className="w-80 h-full bg-white border-r border-gray-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Database className="text-blue-600" />
            DB 탐색기
          </h2>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">연결된 DB:</span>
                <span className="font-mono text-blue-900">조회시 확인 가능</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">테이블 수:</span>
                <span>{allTables.length}개</span>
              </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div className="p-4 border-b border-gray-200">
             <label className="block text-xs font-bold text-gray-600 mb-1">Bridge 파일 주소</label>
             <input 
                 type="text" 
                 className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none"
                 value={bridgeUrl}
                 onChange={(e) => onBridgeUrlChange(e.target.value)}
             />
             <button onClick={onConnect} className="w-full bg-green-600 text-white text-xs font-bold py-2 rounded mt-2 hover:bg-green-700 transition-colors">
                 연결 재시도 / 정보 갱신
             </button>
             <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <Info size={10} /> "연결 재시도" 클릭 시 DB 이름이 로그에 남습니다.
             </p>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="테이블 검색..."
              className="w-full border border-gray-300 rounded pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTables.length > 0 ? (
            <ul>
              {filteredTables.map(table => (
                <li key={table}>
                  <button
                    onClick={() => onTableSelect(table)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      activeTableName === table
                        ? 'bg-blue-100 text-blue-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {table}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             <div className="p-4 text-center text-sm text-gray-500">
                 검색 결과가 없습니다.
             </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100">
             <button onClick={onClose} className="w-full py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded hover:bg-gray-200">닫기</button>
        </div>
      </div>
      <div className="flex-1" onClick={onClose}></div>
    </div>
  );
};