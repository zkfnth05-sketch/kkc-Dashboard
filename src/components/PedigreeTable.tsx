
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Loader2 } from 'lucide-react';
import { Pedigree } from '../types';

interface PedigreeTableProps {
    data: Pedigree[];
    totalCount: number;
    currentPage: number;
    isLoading: boolean;
    onSearch: (field: string, query: string) => void;
    onPageChange: (page: number) => void;
    onRowClick: (pedigree: Pedigree) => void;
    onNewRegistration?: () => void;
    dogClasses: any[];
}

const SEARCH_OPTIONS = [
    { label: '🔍 전체', value: 'all' },
    { label: '등록번호', value: 'reg_no' },
    { label: '마이크로칩 번호', value: 'micro' },
    { label: '외국타단체 번호', value: 'foreign_no' },
    { label: '견명', value: 'name' },
    { label: '소유자명', value: 'poss_name' },
    { label: '모견 등록번호', value: 'mo_regno' },
    { label: '부견 등록번호', value: 'fa_regno' },
    { label: '동태 번호', value: 'dongtae_no' },
    { label: '생년월일', value: 'birth' },
    { label: '견사호', value: 'saho_eng' },
];

/**
 * 🛡️ [UI/UX CONSTITUTION - PEDIGREE HEADER SECTION]
 * 이 컴포넌트의 헤더 영역(타이틀, 보유 견수, 안내 문구)은 
 * 관리자의 핵심 지표이므로 향후 업데이트 시 절대 수정하거나 누락하지 마십시오.
 */
export const PedigreeTable: React.FC<PedigreeTableProps> = ({
    data,
    totalCount,
    currentPage,
    isLoading,
    onSearch,
    onPageChange,
    onRowClick,
    onNewRegistration,
    dogClasses
}) => {
  const [searchField, setSearchField] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(totalCount / 50);

  const handleSearch = () => {
      onSearch(searchField, searchQuery);
  };

  const handleFieldChange = (newField: string) => {
      setSearchField(newField);
      // 🎯 항목 선택 시 즉시 필터링 로직 유지 (데이터가 입력된 개체만 즉시 필터링됨)
      onSearch(newField, searchQuery);
  };

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 4);
    const endPage = Math.min(totalPages, startPage + 9);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const formatRegType = (type: string) => {
    if (!type) return '-';
    const mapping: Record<string, string> = { 'N': 'NR', 'D': '자견', 'I': '수입견', 'E': '국내타단체견', 'S': '단독견' };
    return mapping[type.trim().toUpperCase()] || type;
  };

  const getSelectedLabel = () => {
      const opt = SEARCH_OPTIONS.find(o => o.value === searchField);
      const label = opt ? opt.label.replace('🔍 ', '') : '항목';
      return label === '전체' ? '전체' : label;
  };

  return (
    <div className="flex flex-col h-full bg-white">
        {/* 🚀 [CRITICAL SECTION: DO NOT MODIFY DESIGN] */}
        <div className="p-6 pb-4 border-b border-gray-100">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        혈통서 관리
                        <span className="text-gray-300 font-light">|</span>
                        <span className="text-[18px] text-blue-600 font-black">
                            {getSelectedLabel()} 보유 견수: {totalCount.toLocaleString()}건
                        </span>
                    </h2>
                    {/* 🎯 사용자 요청 안내 문구 고정 (절대 삭제 금지) */}
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-1 h-3 bg-red-500 rounded-full"></div>
                        <p className="text-[13px] font-bold text-gray-500">
                            * 항목 선택 시 해당 데이터가 입력된 개체만 즉시 필터링됩니다.
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Current Filter</span>
                        <span className="text-[13px] font-black text-slate-700">{getSelectedLabel()} 필터 활성화 중</span>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-2">
                <div className="flex border-2 border-blue-100 rounded-md overflow-hidden bg-white h-10 shadow-sm focus-within:border-blue-500 transition-all">
                    <select 
                        className="px-4 py-1.5 text-xs text-gray-700 bg-gray-50 border-r border-gray-200 outline-none min-w-[160px] font-black cursor-pointer hover:bg-gray-100"
                        value={searchField}
                        onChange={(e) => handleFieldChange(e.target.value)}
                    >
                        {SEARCH_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <input 
                        type="text" 
                        placeholder={`${getSelectedLabel()} 검색어 입력...`}
                        className="pl-4 pr-2 py-1.5 text-sm w-96 outline-none font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button 
                    onClick={handleSearch}
                    className="bg-blue-600 text-white px-8 h-10 text-sm rounded-md hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
                >
                    조회하기
                </button>
                <button 
                  onClick={onNewRegistration}
                  className="bg-white border border-gray-300 text-gray-700 px-5 h-10 text-sm rounded-md hover:bg-gray-50 font-bold transition-colors active:scale-95 shadow-sm"
                >
                    신규 등록
                </button>
            </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 overflow-auto px-6 py-4">
            <table className="w-full text-[13px] text-center border-collapse border border-gray-200 table-fixed">
                <colgroup>
                    <col className="w-10" /><col className="w-16" /><col className="w-24" /><col className="w-32" />
                    <col className="w-auto" /><col className="w-48" /><col className="w-14" /><col className="w-24" />
                    <col className="w-24" /><col className="w-24" /><col className="w-32" /><col className="w-28" /><col className="w-28" />
                </colgroup>
                <thead className="bg-[#f9fafb] text-gray-700 font-bold sticky top-0 z-10 border-b-2 border-gray-200 shadow-sm">
                    <tr>
                        <th className="p-3 border border-gray-200"><input type="checkbox" /></th>
                        <th className="p-3 border border-gray-200">타입</th>
                        <th className="p-3 border border-gray-200 text-left pl-4">견종</th>
                        <th className="p-3 border border-gray-200">등록번호</th>
                        <th className="p-3 border border-gray-200 text-left pl-4">견명</th>
                        <th className="p-3 border border-gray-200">견사호(영문)</th>
                        <th className="p-3 border border-gray-200">성별</th>
                        <th className="p-3 border border-gray-200">번식자</th>
                        <th className="p-3 border border-gray-200">소유자</th>
                        <th className="p-3 border border-gray-200">생년월일</th>
                        <th className="p-3 border border-gray-200">마이크로칩</th>
                        <th className="p-3 border border-gray-200">부(UID)</th>
                        <th className="p-3 border border-gray-200">모(UID)</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                         <tr><td colSpan={13} className="py-32 text-center"><Loader2 className="animate-spin inline mr-2 text-blue-500" /> 로딩 중...</td></tr>
                    ) : data.length > 0 ? (
                        data.map((row) => (
                            <tr 
                                key={row.id || Math.random()} 
                                className="hover:bg-blue-50/40 transition-colors cursor-pointer border-b border-gray-100"
                                onClick={() => onRowClick(row)}
                            >
                                <td className="p-3 border-x border-gray-200" onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                                <td className="p-3 border-x border-gray-200 text-gray-500 font-bold">{formatRegType(row.regType)}</td>
                                <td className="p-3 border-x border-gray-200 text-left pl-4 truncate text-gray-600">
                                    {(() => {
                                        const found = dogClasses.find(c => c.breed === row.breed);
                                        if (found) {
                                            return (
                                                <div className="flex flex-col">
                                                    <span className="text-blue-600 font-bold text-[11px]">{found.keyy}</span>
                                                    <span className="font-medium text-slate-700">{row.breed}</span>
                                                    <span className="text-[10px] text-gray-400">({found.group})</span>
                                                </div>
                                            );
                                        }
                                        return row.breed;
                                    })()}
                                </td>
                                <td className="p-3 border-x border-gray-200 font-bold text-slate-800">{row.regNo}</td>
                                <td className="p-3 border-x border-gray-200 font-black uppercase text-left pl-4 truncate text-blue-900">{row.name}</td>
                                <td className="p-3 border-x border-gray-200 uppercase truncate text-gray-500 italic">{row.kennelNameEng || row.kennel}</td>
                                <td className="p-3 border-x border-gray-200 text-gray-600 font-bold">{row.gender === '수컷' || row.gender === 'M' ? '수컷' : '암컷'}</td>
                                <td className="p-3 border-x border-gray-200 truncate text-gray-500">{row.breeder}</td>
                                <td className="p-3 border-x border-gray-200 truncate font-medium">{row.owner}</td>
                                <td className="p-3 border-x border-gray-200 text-gray-400 font-mono text-[12px]">{row.birthDate}</td>
                                <td className={`p-3 border-x border-gray-200 font-bold ${row.microchip ? 'text-blue-600 bg-blue-50/20' : 'text-gray-300'}`}>{row.microchip || '-'}</td>
                                <td className="p-3 border-x border-gray-200 text-gray-400 text-[11px]">{row.sireRegNo}</td>
                                <td className="p-3 border-x border-gray-200 text-gray-400 text-[11px]">{row.damRegNo}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={13} className="py-40 text-center text-gray-400 font-bold italic">조회된 데이터가 없습니다.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
            <button className="bg-white border border-gray-300 text-gray-400 px-4 py-2 rounded font-bold text-xs cursor-not-allowed">선택 삭제</button>

            <div className="flex items-center gap-2">
                <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-30"><ChevronsLeft size={16}/></button>
                <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16}/></button>
                
                {getPageNumbers().map(n => (
                    <button key={n} onClick={() => onPageChange(n)} className={`w-9 h-9 border rounded font-black text-[13px] ${n === currentPage ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{n}</button>
                ))}
                
                <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16}/></button>
                <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-30"><ChevronsRight size={16}/></button>
            </div>
            
            <div className="text-[12px] font-bold text-slate-400">Page {currentPage} of {totalPages}</div>
        </div>
    </div>
  );
};
