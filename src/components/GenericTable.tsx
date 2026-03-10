import React, { useState } from 'react';
import { RefreshCw, Database } from 'lucide-react';

interface GenericTableProps {
  tableName: string;
  data: any[];
  columns: string[];
  isLoading: boolean;
  onSearch: (field: string, query: string) => void;
}

export const GenericTable: React.FC<GenericTableProps> = ({ 
  tableName, 
  data, 
  columns,
  isLoading,
  onSearch
}) => {
  const [searchField, setSearchField] = useState(columns[0] || '');
  const [searchQuery, setSearchQuery] = useState('');

  // HeidiSQL 스타일: 최대한 많은 컬럼 보여주기
  const displayColumns = columns.slice(0, 15); 

  const handleSearchClick = () => {
    onSearch(searchField, searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchClick();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0 h-14">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Database size={16} className="text-blue-600"/>
          {tableName || '테이블 선택 필요'} 
          <span className="text-xs font-normal text-gray-400">({data.length} rows)</span>
        </h2>

        {/* Search */}
        <div className="flex gap-1">
          <select 
            className="border border-gray-300 rounded-sm px-2 text-xs bg-white focus:outline-none h-7"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="필터..."
            className="border border-gray-300 rounded-sm pl-2 pr-2 py-1 text-xs h-7 w-40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSearchClick}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 rounded-sm text-xs h-7"
          >
            조회
          </button>
        </div>
      </div>

      {/* Table Content - Dense & Excel-like */}
      <div className="flex-1 overflow-auto bg-white relative">
        <table className="w-full text-xs text-left whitespace-nowrap border-collapse font-mono">
          <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-10 px-2 py-1 border border-gray-300 bg-gray-100 text-center">#</th>
              {displayColumns.map(col => (
                <th key={col} className="px-2 py-1 font-semibold border border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr>
                <td colSpan={displayColumns.length + 1} className="text-center py-20 text-gray-500">
                  <RefreshCw className="animate-spin inline mr-2" /> 데이터 로딩중...
                </td>
               </tr>
            ) : data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50">
                  <td className="px-2 py-0.5 border border-gray-200 text-center bg-gray-50 text-gray-400">{idx + 1}</td>
                  {displayColumns.map(col => (
                    <td key={`${idx}-${col}`} className="px-2 py-0.5 border border-gray-200 text-gray-700 max-w-[250px] overflow-hidden text-ellipsis h-6">
                      {row[col]?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={displayColumns.length + 1} className="text-center py-20 text-gray-400">
                  표시할 데이터가 없습니다.
                </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-2 py-1 bg-gray-100 border-t text-[10px] text-gray-500 flex justify-between">
        <span>Total: {data.length} records</span>
        <span>* 화면에는 최대 15개 컬럼만 표시됩니다.</span>
      </div>
    </div>
  );
};