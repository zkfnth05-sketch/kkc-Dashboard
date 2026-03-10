
/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Users, Calendar, Filter, FileSpreadsheet, Loader2, MapPin, FileCheck, Info, Activity, X, ArrowRight, Search, RefreshCw, RotateCcw } from 'lucide-react';
import { fetchExportMembers } from '../services/exportService';
import { formatMemberRank, MEMBER_RANK_MAP } from '../types';
import { downloadCsv } from '../lib/downloadUtils';

export const MemberExportPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exportStep, setExportStep] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalMatchCount, setTotalMatchCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  // 🛡️ 필터 상태 관리
  const [filters, setFilters] = useState({
    rank: 'all',
    joinDateStart: '',
    joinDateEnd: '',
    searchQuery: '',
    region: ''
  });

  const handleFilterChange = (field: string, value: string) => {
    setTotalMatchCount(null); // 값 변경 즉시 카운트 초기화하여 사용자에게 시각적 피드백 제공
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setTotalMatchCount(null);
    setFilters({ rank: 'all', joinDateStart: '', joinDateEnd: '', searchQuery: '', region: '' });
  };

  /**
   * 🛡️ 필터 카운트 조회 (격리된 서비스 호출)
   */
  const getMatchCount = useCallback(async () => {
    setIsLoadingCount(true);
    try {
      const res = await fetchExportMembers(
        1,
        1,
        filters.searchQuery,
        'all', // 🎯 field (새로 추가됨)
        filters.rank,
        filters.region,
        filters.joinDateStart,
        filters.joinDateEnd
      );
      setTotalMatchCount(res.total);
    } catch (e) {
      console.error("Count Fetch Error:", e);
      setTotalMatchCount(0);
    } finally {
      setIsLoadingCount(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getMatchCount();
    }, 500); // 500ms 디바운스
    return () => clearTimeout(timer);
  }, [filters, getMatchCount]);

  const handleStartRequest = () => {
    if (isLoadingCount || totalMatchCount === null) return;
    if (totalMatchCount === 0) {
      alert('추출할 데이터가 없습니다. 검색 조건을 확인해 주세요.');
      return;
    }
    setShowConfirmModal(true);
  };

  /**
   * 🛡️ 대량 데이터 추출 실행 (격리된 서비스 스트리밍)
   */
  const executeExport = async () => {
    setShowConfirmModal(false);
    setErrorLog(null);
    setIsExporting(true);
    setProcessedCount(0);
    setExportStep('내보내기 엔진 최적화 중...');

    // 🚀 [STABILITY FIX] 카페24 저사양 호스팅 호환성을 위해 청크 사이즈 하향 (1000 -> 400)
    const CHUNK_SIZE = 400;
    let allCsvRows: string[] = [];
    const headers = ['회원번호', '아이디', '이름', '연락처', '휴대전화', '주소', '상세주소', 'DM주소', 'DM상세주소', '가입일', '등급'];

    try {
      let currentPage = 1;
      const finalTargetCount = totalMatchCount || 0;
      const totalPages = Math.ceil(finalTargetCount / CHUNK_SIZE);

      while (currentPage <= totalPages) {
        setExportStep(`데이터 스트리밍 중: ${currentPage.toLocaleString()} / ${totalPages.toLocaleString()} 블록...`);

        const res = await fetchExportMembers(
          currentPage,
          CHUNK_SIZE,
          filters.searchQuery,
          'all', // 🎯 field (새로 추가됨)
          filters.rank,
          filters.region,
          filters.joinDateStart,
          filters.joinDateEnd
        );

        if (!res.data || res.data.length === 0) break;

        const rows = res.data.map((m: any) => [
          `"${m.mem_no || ''}"`,
          `"${m.loginId || ''}"`,
          `"${m.name || ''}"`,
          `"${m.tel || ''}"`,
          `"${m.hp || ''}"`,
          `"${(m.addr || '').replace(/\r?\n|\r/g, " ").trim()}"`,
          `"${(m.addr1 || '').replace(/\r?\n|\r/g, " ").trim()}"`,
          `"${(m.addr_dm || '').replace(/\r?\n|\r/g, " ").trim()}"`,
          `"${(m.addr1_dm || '').replace(/\r?\n|\r/g, " ").trim()}"`,
          `"${m.joinDate || ''}"`,
          `"${formatMemberRank(m.rank) || ''}"`
        ].join(','));

        allCsvRows = allCsvRows.concat(rows);
        setProcessedCount(allCsvRows.length);
        currentPage++;
      }

      if (allCsvRows.length === 0) {
        throw new Error("추출된 데이터가 없습니다.");
      }

      setExportStep('CSV 인코딩 생성 중...');
      const csvContent = headers.join(',') + '\n' + allCsvRows.join('\n');

      const success = downloadCsv(csvContent, `KKC_Members_${new Date().toISOString().split('T')[0]}.csv`);

      if (!success) {
        throw new Error("다운로드 트리거 실패 (브라우저 설정을 확인해주세요)");
      }

      setExportStep('내보내기 완료');
      setTimeout(() => setIsExporting(false), 1000);
    } catch (e: any) {
      console.error("Export Error:", e);
      setErrorLog(e.message);
      setExportStep('추출 오류 발생');
    }

  };

  const progressPercent = totalMatchCount ? Math.min(100, Math.floor((processedCount / totalMatchCount) * 100)) : 0;

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] p-8 lg:p-12 overflow-y-auto relative font-sans">

      {showConfirmModal && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Download size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">추출 준비 완료</h3>
                  <p className="text-sm text-blue-600 font-bold">총 {totalMatchCount?.toLocaleString()}명 대상</p>
                </div>
              </div>
              <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
                선택하신 필터 조건에 따라 데이터베이스로부터 <span className="font-bold text-slate-900">CSV 파일</span>을 생성합니다. 대량 데이터의 경우 인코딩 시간이 수 초 소요될 수 있습니다.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">취소</button>
                <button onClick={executeExport} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95">내보내기 시작</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl p-12 max-w-xl w-full text-center space-y-8">
            <div className="relative mx-auto w-24 h-24">
              <Activity size={64} className="text-blue-600 animate-pulse absolute inset-0 m-auto" />
              <div className="absolute inset-0 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{exportStep}</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Processing {processedCount.toLocaleString()} / {totalMatchCount?.toLocaleString()} records</p>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_12px_rgba(37,99,235,0.4)]" style={{ width: `${progressPercent}%` }}></div>
            </div>
            {errorLog && <p className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">{errorLog}</p>}
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <FileSpreadsheet className="text-blue-600" size={32} /> 회원 데이터 대량 추출
          </h2>
          <p className="text-slate-500 font-medium mt-1">지역, 등급, 가입 기간 등 다양한 조건으로 데이터를 필터링하여 내보냅니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetFilters} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RotateCcw size={16} /> 조건 초기화
          </button>
          <button onClick={getMatchCount} className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-100 transition-all shadow-sm">
            <RefreshCw size={16} className={isLoadingCount ? 'animate-spin' : ''} /> 조회 갱신
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-8 lg:p-10 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Filter size={200} />
            </div>

            <div className="flex items-center gap-2 font-black text-slate-400 text-[11px] uppercase tracking-[0.2em] border-b border-slate-100 pb-6 mb-10">
              <Filter size={14} className="text-blue-500" /> Filter Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="md:col-span-2 space-y-4">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2 tracking-tight">
                  <MapPin size={16} className="text-blue-500" /> 지역별 검색 (주소/상세주소 포함)
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="예: 부산, 서울 강남구, 경기 수원 등 지역명 입력"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] pl-14 pr-6 py-5 text-[15px] font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
                  {filters.region && (
                    <button onClick={() => handleFilterChange('region', '')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"><X size={20} /></button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium pl-2">특정 시, 도, 구 단위로 필터링이 가능합니다. (상세주소 및 DM주소 포함)</p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2 tracking-tight">
                  <Calendar size={16} className="text-blue-500" /> 가입 기간 범위 설정
                </label>
                <div className="flex items-center gap-3">
                  <input type="date" className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" value={filters.joinDateStart} onChange={e => handleFilterChange('joinDateStart', e.target.value)} />
                  <span className="text-slate-300 font-black">~</span>
                  <input type="date" className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" value={filters.joinDateEnd} onChange={e => handleFilterChange('joinDateEnd', e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2 tracking-tight">
                  <Users size={16} className="text-blue-500" /> 회원 등급 구분
                </label>
                <div className="relative">
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none transition-all cursor-pointer" value={filters.rank} onChange={e => handleFilterChange('rank', e.target.value)}>
                    <option value="all">전체 등급 (All Members)</option>
                    {Object.entries(MEMBER_RANK_MAP).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ArrowRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2 tracking-tight">
                  <Search size={16} className="text-blue-500" /> 통합 키워드 검색 (아이디, 성명, 휴대폰번호)
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  placeholder="검색할 키워드를 입력하세요 (공백 시 전체 조건 검색)..."
                  value={filters.searchQuery}
                  onChange={e => handleFilterChange('searchQuery', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 flex items-center gap-6 text-white shadow-2xl shadow-slate-200">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <Info className="text-blue-400" size={32} />
            </div>
            <div>
              <p className="text-[15px] leading-relaxed font-bold">데이터 추출 안내</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                격리된 전용 추출 모드(export_members)를 사용하여 2GB 이상의 대용량 데이터도 안정적으로 처리합니다.<br />
                지역 검색 시 <span className="text-blue-400 font-bold">기본 주소, 상세 주소, DM 주소</span> 전체를 필터링합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden group">
            {isLoadingCount && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={56} />
              </div>
            )}

            <div className="w-28 h-28 bg-blue-50 text-blue-600 rounded-[36px] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Users size={56} />
            </div>

            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Filtering Results</h3>

            <div className="text-7xl font-black text-slate-950 mb-3 tracking-tighter tabular-nums">
              {totalMatchCount === null ? '...' : totalMatchCount.toLocaleString()}
            </div>
            <p className="text-sm font-bold text-blue-600 bg-blue-50 px-5 py-2 rounded-full border border-blue-100">내보내기 가능 인원</p>

            <div className="w-full h-px bg-slate-100 my-10"></div>

            <button
              onClick={handleStartRequest}
              disabled={isExporting || isLoadingCount || totalMatchCount === 0 || totalMatchCount === null}
              className={`w-full py-6 rounded-[24px] font-black text-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-2xl ${totalMatchCount === 0 || totalMatchCount === null || isExporting || isLoadingCount
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200 shadow-none'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1'
                }`}
            >
              CSV 추출 시작
              <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Generate Member List</span>
            </button>
          </div>

          <div className="bg-white p-8 rounded-[28px] border border-slate-200">
            <div className="flex items-center gap-2 font-black text-slate-800 mb-6 border-b border-slate-50 pb-5 uppercase text-[11px] tracking-widest">
              <FileCheck size={18} className="text-emerald-500" /> Export Metadata
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['회원번호', '아이디', '이름', '연락처', '가입일', '등급', '주소', 'DM주소'].map(col => (
                <div key={col} className="bg-slate-50 text-slate-500 py-3 rounded-xl text-[11px] font-bold text-center border border-slate-100">{col}</div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-6 text-center font-medium">최종 필터가 적용된 {totalMatchCount?.toLocaleString() || 0}개의 레코드가 반영됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
