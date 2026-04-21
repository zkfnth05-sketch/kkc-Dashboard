import React, { useState } from 'react';
import { Member, formatMemberRank } from '../types';
import { Search, Loader2, ChevronLeft, ChevronRight, Calendar, ArrowRight, MapPin, Download, Upload } from 'lucide-react';
import { MemberAddForm } from './MemberAddForm';
import { MemberExcelUploadPage } from './MemberExcelUploadPage';
import { MemberProClassUploadPage } from './MemberProClassUploadPage';

interface MemberTableProps {
  members: Member[];
  totalCount: number;
  stats?: Record<string, number>;
  currentPage: number;
  selectedId: string | null;
  onSelectMember: (member: Member) => void;
  isLoading: boolean;
  onSearch: (query: string, field: string, dateStart: string, dateEnd: string, region: string) => void;
  onPageChange: (page: number) => void;
  onCreateMember?: (member: Partial<Member>) => void;
  onDeleteSelected?: (ids: string[]) => void;
  onExcelUpload?: (members: Partial<Member>[]) => void;
  onProClassUpload?: (members: any[], selectedSkill: string, isSkillDisabled: boolean) => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  totalCount,
  stats,
  currentPage,
  selectedId,
  onSelectMember,
  isLoading,
  onSearch,
  onPageChange,
  onCreateMember,
  onDeleteSelected,
  onExcelUpload,
  onProClassUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [regionQuery, setRegionQuery] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);
  const [isProClassUploadOpen, setIsProClassUploadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 [CRITICAL LOG] 이 로그가 찍히는지 반드시 확인하세요!
    console.log("%c🔍 SEARCH TRIGGERED", "background: #2563eb; color: white; padding: 4px 8px; font-weight: bold; border-radius: 4px;", {
      keyword: searchQuery,
      field: searchField,
      region: regionQuery,
      period: `${dateStart} ~ ${dateEnd}`
    });

    onSearch(searchQuery, searchField, dateStart, dateEnd, regionQuery);
  };

  const totalPages = Math.ceil(totalCount / 50);
  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(members.map(m => m.id as string));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.length === 0) {
      alert("삭제할 회원을 선택해주세요.");
      return;
    }
    if (onDeleteSelected) {
      onDeleteSelected(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="w-[45%] flex flex-col h-full shrink-0 bg-white border-r">
      <div className="p-5 pb-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">회원 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteClick}
              className="bg-gray-400 text-white px-3 py-1.5 text-xs font-medium rounded hover:bg-gray-500 transition-colors"
            >
              선택 삭제
            </button>
            <button
              onClick={() => setIsExcelUploadOpen(true)}
              className="bg-green-600 text-white px-3 py-1.5 text-xs font-medium rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Upload size={14} /> 엑셀 대량 가입
            </button>
            <button
              onClick={() => setIsProClassUploadOpen(true)}
              className="bg-blue-600 text-white px-3 py-1.5 text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Upload size={14} /> 엑셀 직능 대량 업데이트
            </button>
          </div>
        </div>

        <div className="flex border border-gray-200 rounded mb-4 bg-gray-50">
          <div className="flex items-center px-4 py-3 border-r border-gray-200 gap-2">
            <span className="w-1 h-4 bg-gray-600 block"></span>
            <span className="text-sm font-bold text-gray-700">회원 통계</span>
          </div>
          <div className="flex-1 flex items-center px-4 py-2 flex-wrap gap-x-5 gap-y-2">
            <div className="text-sm font-bold text-slate-700">
              전체회원: <span className="text-blue-600">{totalCount.toLocaleString()}</span><span className="text-xs text-slate-500 font-medium ml-0.5">명</span>
            </div>
            <div className="text-sm font-bold text-slate-700">
              특별회원: <span className="text-blue-600">{stats?.['C0']?.toLocaleString() || 0}</span><span className="text-xs text-slate-500 font-medium ml-0.5">명</span>
            </div>
            <div className="text-sm font-bold text-slate-700">
              정회원3년: <span className="text-blue-600">{stats?.['A3']?.toLocaleString() || 0}</span><span className="text-xs text-slate-500 font-medium ml-0.5">명</span>
            </div>
            <div className="text-sm font-bold text-slate-700">
              정회원2년: <span className="text-blue-600">{stats?.['A2']?.toLocaleString() || 0}</span><span className="text-xs text-slate-500 font-medium ml-0.5">명</span>
            </div>
            <div className="text-sm font-bold text-slate-700">
              정회원1년: <span className="text-blue-600">{stats?.['A1']?.toLocaleString() || 0}</span><span className="text-xs text-slate-500 font-medium ml-0.5">명</span>
            </div>
            <div className="text-sm font-bold text-slate-700">
              준회원: <span className="text-blue-600">{stats?.['B0']?.toLocaleString() || 0}</span><span className="text-xs text-slate-500 font-medium ml-0.5">명</span>
            </div>
          </div>
        </div>

        {/* 🛡️ 검색 폼 영역 */}
        <form onSubmit={handleSearchSubmit} className="space-y-3 mb-2 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0 w-20">
                <Calendar size={14} className="text-blue-500" /> 가입기간
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="date"
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs h-9 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
                <ArrowRight size={14} className="text-gray-300" />
                <input
                  type="date"
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs h-9 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0 w-20">
                <MapPin size={14} className="text-red-500" /> 지역검색
              </div>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs h-9 outline-none focus:ring-1 focus:ring-blue-500 bg-white font-bold"
                placeholder="예: 부산 해운대, 서울 강남 등"
                value={regionQuery}
                onChange={(e) => setRegionQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-2"></div>

          <div className="flex gap-1 w-full">
            <select
              className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 bg-white font-bold"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="all">전체검색</option>
              <option value="name">이름</option>
              <option value="id">아이디</option>
              <option value="hp">연락처</option>
            </select>
            <input
              type="text"
              className="flex-1 border border-blue-400 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="검색어를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-sm text-xs font-bold transition-colors shadow-sm active:scale-95"
            >
              검색
            </button>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-sm text-xs font-bold transition-colors shadow-sm active:scale-95"
              onClick={() => setIsAddFormOpen(true)}
            >
              회원 추가
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-auto px-5">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="p-2 border-y border-gray-200 text-center w-10">
                <input
                  type="checkbox"
                  checked={members.length > 0 && selectedIds.length === members.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-2 border-y border-gray-200 font-medium w-20">회원번호</th>
              <th className="p-2 border-y border-gray-200 font-medium w-24">아이디</th>
              <th className="p-2 border-y border-gray-200 font-medium w-24">이름</th>
              <th className="p-2 border-y border-gray-200 font-medium w-28">견사호</th>
              <th className="p-2 border-y border-gray-200 font-medium">가입일</th>
              <th className="p-2 border-y border-gray-200 font-medium w-24">유효일</th>
              <th className="p-2 border-y border-gray-200 font-medium w-20">등급</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-gray-500">
                  <Loader2 className="animate-spin inline mr-2 text-blue-500" /> 데이터를 불러오는 중입니다...
                </td>
              </tr>
            ) : members.length > 0 ? (
              members.map((member) => (
                <tr
                  key={member.mid || member.id}
                  onClick={() => onSelectMember(member)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === member.id ? 'bg-blue-50' : ''
                    }`}
                >
                  <td className="p-2 border-b border-gray-100 text-center">
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      checked={selectedIds.includes(member.id as string)}
                      onChange={(e) => handleSelectOne(e, member.id as string)}
                    />
                  </td>
                  <td className="p-2 border-b border-gray-100 text-gray-600 font-mono text-xs">{member.mem_no}</td>
                  <td className="p-2 border-b border-gray-100 text-gray-600 text-xs">{member.loginId}</td>
                  <td className={`p-2 border-b border-gray-100 font-bold ${selectedId === member.id ? 'text-blue-600' : 'text-gray-800'}`}>{member.name}</td>
                  <td className="p-2 border-b border-gray-100 text-gray-600 text-xs font-medium truncate max-w-[100px]" title={member.saho}>{member.saho || '-'}</td>
                  <td className="p-2 border-b border-gray-100 text-gray-400 text-xs">{member.joinDate}</td>
                  <td className="p-2 border-b border-gray-100 text-gray-400 text-xs">{member.expiryDate}</td>
                  <td className="p-2 border-b border-gray-100 text-gray-600 text-xs font-bold">{formatMemberRank(member.rank)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-20 text-gray-400 font-bold italic">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-center items-center bg-white shrink-0">
        <div className="flex gap-1">
          <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={14} /></button>
          {getPageNumbers().map(pageNum => (
            <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{pageNum}</button>
          ))}
          <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={14} /></button>
        </div>
      </div>
      {
        isAddFormOpen && <MemberAddForm
          onClose={() => setIsAddFormOpen(false)}
          onSave={(m) => {
            if (onCreateMember) onCreateMember(m);
            setIsAddFormOpen(false);
          }}
        />
      }
      {isExcelUploadOpen && (
        <MemberExcelUploadPage
          onClose={() => setIsExcelUploadOpen(false)}
          onUpload={(members) => {
            setIsExcelUploadOpen(false);
            if (onExcelUpload) onExcelUpload(members);
          }}
        />
      )}
      {isProClassUploadOpen && (
        <MemberProClassUploadPage
          onClose={() => setIsProClassUploadOpen(false)}
          onUpload={(members, skill, disabled) => {
            setIsProClassUploadOpen(false);
            if (onProClassUpload) onProClassUpload(members, skill, disabled);
          }}
        />
      )}
    </div >
  );
};