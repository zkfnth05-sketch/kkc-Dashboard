import React, { useState, useEffect } from 'react';
import { fetchMembers, fetchProClasses, createProClass, deleteProClass, updateProClass } from '../services/memberService';
import { fetchExportMembers } from '../services/exportService';
import { ProClass } from '../types';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Activity, FileSpreadsheet, Plus, Trash2, X, RefreshCw, Edit } from 'lucide-react';

interface SkillMember {
  id: string;
  loginId?: string;
  memberName?: string;
  name?: string;
  tel?: string;
  hp?: string;
  email?: string;
  memo?: string;
  [key: string]: any;
}

interface SkillManagementPageProps {
  tableName: string;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToMember?: (loginId: string) => void;
}

/**
 * 🎯 pro_class 코드를 한글 직능명으로 변환하는 헬퍼 함수
 * @param proClassStr "com-TR5" 형태의 하이픈 구분 문자열
 * @param allSkills DB에서 불러온 직능 목록 { [code]: name }
 */
export const formatSkillNames = (proClassStr: string | undefined, allSkillsMap: Record<string, string> = {}): string[] => {
  if (!proClassStr || proClassStr.trim() === '') return [];

  // 구버전 코드 호환성 매핑
  const legacyMap: Record<string, string> = {
    'DGS': '대구 애견샵 (449406)', 'RDR': '사체탐지견훈련사', 'FOR': '외국단체',
    'JEM': '제주 동물병원/샵', 'TTB': '지정번식장', 'CTD': '축견', 'HBD': '하나은행 DB'
  };

  return proClassStr.split('-')
    .filter(code => code.trim() !== '')
    .map(code => allSkillsMap[code] || legacyMap[code] || code);
};

export const SkillManagementPage: React.FC<SkillManagementPageProps> = ({ tableName, showAlert, showConfirm, onGoToMember }) => {
  const [data, setData] = useState<SkillMember[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [readyFile, setReadyFile] = useState<{ url: string, name: string } | null>(null);

  // 🚀 DB에서 불러온 직능 목록
  const [proClasses, setProClasses] = useState<ProClass[]>([]);
  
  // Filters State
  const [selectedSkill, setSelectedSkill] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Filters (Applied after pressing search)
  const [activeSkill, setActiveSkill] = useState('');
  const [activeSearchField, setActiveSearchField] = useState('name');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  // 🚀 직능 추가 모달 상태
  const [isAddingNewSkill, setIsAddingNewSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCode, setNewSkillCode] = useState('');
  const [newSkillType, setNewSkillType] = useState<number>(1); // 1: 직능, 0: 자격증
  const [codeCheckResult, setCodeCheckResult] = useState<{ checked: boolean, available: boolean, message: string }>({
    checked: false,
    available: false,
    message: ''
  });
  
  // 🚀 직능 수정 모달 상태
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [editingSkillUid, setEditingSkillUid] = useState('');
  const [editingSkillName, setEditingSkillName] = useState('');
  const [editingSkillCode, setEditingSkillCode] = useState('');
  const [editingSkillType, setEditingSkillType] = useState<number>(1);

  const limit = 10;

  /* 🛡️ [SYSTEM LOCK: PAGE UI & LOGIC PRESERVATION] */
  /* 이 구간의 모든 로직과 디자인은 사용자가 최종 확정한 상태입니다. 인가 없이 수정하지 마세요. */
  const loadProClasses = async () => {
    try {
      const classes = await fetchProClasses();
      setProClasses(classes);
      // 초기 선택값 설정 (목록이 있을 경우 첫 번째꺼)
      if (classes.length > 0 && !selectedSkill) {
        const first = classes[0];
        setSelectedSkill(first.name);
        setActiveSkill(first.name);
        loadData(1, first.name, '', 'name', first.keyy);
      }
    } catch (e: any) {
      showAlert('직능 목록 로드 실패', e.message);
    }
  };

  useEffect(() => {
    loadProClasses();
    loadData(1);
  }, [tableName]);

  const loadData = async (
    page: number = 1, 
    skill: string = activeSkill, 
    query: string = activeSearchQuery, 
    field: string = activeSearchField,
    forceProClassCode?: string
  ) => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const targetTable = 'memTab';
      
      // keyy 값을 찾아서 필터링 (전달받은 코드가 있으면 그것을 쓰고, 없으면 상태값에서 찾음)
      const proClassFilter = forceProClassCode !== undefined 
        ? forceProClassCode 
        : (proClasses.find(p => p.name === skill)?.keyy || '');
      
      const res = await fetchMembers(targetTable, page, query, field, limit, '', '', 'all', '', '', '', proClassFilter);

      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      showAlert('로드 실패', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setActiveSkill(selectedSkill);
    setActiveSearchField(searchField);
    setActiveSearchQuery(searchQuery);
    loadData(1, selectedSkill, searchQuery, searchField);
  };

  const checkCodeDuplicate = () => {
    const code = newSkillCode.trim();
    if (!code) {
      setCodeCheckResult({ checked: true, available: false, message: '코드를 입력해주세요.' });
      return;
    }
    
    const isDuplicate = proClasses.some(p => p.keyy === code);
    if (isDuplicate) {
      setCodeCheckResult({ checked: true, available: false, message: '이미 사용 중인 코드입니다.' });
    } else {
      setCodeCheckResult({ checked: true, available: true, message: '사용 가능한 코드입니다.' });
    }
  };

  /**
   * 🎯 직능 추가 로직
   */
  /**
   * 🎯 직능 추가 로직 (DB 연동)
   */
  const handleAddNewSkill = async () => {
    if (!newSkillName.trim() || !newSkillCode.trim()) {
      showAlert('오류', '직능명과 코드를 모두 입력해주세요.');
      return;
    }

    const existingCodes = proClasses.map(p => p.keyy);
    if (existingCodes.includes(newSkillCode.trim())) {
      setCodeCheckResult({ checked: true, available: false, message: '이미 사용 중인 코드입니다.' });
      showAlert('오류', '이 직능코드는 현재 사용 중인 코드입니다.');
      return;
    }

    if (!codeCheckResult.available || !codeCheckResult.checked) {
      showAlert('오류', '직능 코드 중복 확인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    try {
      await createProClass({ keyy: newSkillCode.trim(), name: newSkillName.trim(), type: newSkillType });
      await loadProClasses(); // 목롭 업데이트
      setIsAddingNewSkill(false);
      setNewSkillName('');
      setNewSkillCode('');
      setCodeCheckResult({ checked: false, available: false, message: '' });
      showAlert('성공', '신규 직능이 DB에 성공적으로 추가되었습니다.');
    } catch (e: any) {
      showAlert('추가 실패', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🎯 직능 수정 모달 열기
   */
  const handleEditSkillClick = () => {
    if (!selectedSkill) {
      showAlert('알림', '수정할 직능을 상단 목록에서 먼저 선택해주세요.');
      return;
    }
    const found = proClasses.find(p => p.name === selectedSkill);
    if (found) {
      setEditingSkillUid(found.uid);
      setEditingSkillName(found.name);
      setEditingSkillCode(found.keyy);
      setEditingSkillType(found.type);
      setIsEditingSkill(true);
    }
  };

  /**
   * 🎯 직능 수정 실행
   */
  const handleSaveEditedSkill = async () => {
    if (!editingSkillName.trim() || !editingSkillCode.trim()) {
      showAlert('오류', '직능명과 코드를 모두 입력해주세요.');
      return;
    }

    // 자기 자신을 제외한 다른 직능과 코드가 중복되는지 확인
    const isDuplicate = proClasses.some(p => p.keyy === editingSkillCode.trim() && p.uid !== editingSkillUid);
    if (isDuplicate) {
      showAlert('오류', '이미 다른 직능에서 사용 중인 코드입니다.');
      return;
    }

    setIsLoading(true);
    try {
      await updateProClass({ 
        uid: editingSkillUid, 
        keyy: editingSkillCode.trim(), 
        name: editingSkillName.trim(), 
        type: editingSkillType 
      });
      await loadProClasses(); // 목록 업데이트
      
      // 현재 선택된 스킬명이 바뀌었을 수 있으므로 업데이트
      setSelectedSkill(editingSkillName.trim());
      setActiveSkill(editingSkillName.trim());
      
      setIsEditingSkill(false);
      showAlert('성공', '직능 정보가 성공적으로 수정되었습니다.');
    } catch (e: any) {
      showAlert('수정 실패', e.message);
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * 🎯 직능 삭제 로직 (DB 연동)
   */
  const handleDeleteSkill = () => {
    if (!selectedSkill) return;
    const found = proClasses.find(p => p.name === selectedSkill);
    if (!found) return;

    showConfirm('직능 삭제', `"${selectedSkill}" 직능을 DB에서 영구 삭제하시겠습니까?`, async () => {
      setIsLoading(true);
      try {
        await deleteProClass(found.uid);
        await loadProClasses();
        setSelectedSkill('');
        setActiveSkill('');
        setData([]);
        setTotal(0);
        showAlert('알림', 'DB에서 삭제되었습니다.');
      } catch (e: any) {
        showAlert('삭제 실패', e.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const calculateNumber = (index: number) => {
    return (currentPage - 1) * limit + index + 1;
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const getPages = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const handleExport = async (isAll: boolean = false) => {
    if (total === 0) {
      showAlert('알림', '다운로드할 데이터가 없습니다.');
      return;
    }

    setIsExporting(true);
    setProcessedCount(0);
    setExportStep('내보내기 엔진 준비 중...');

    const CHUNK_SIZE = 400;
    let allCsvRows: string[] = [];
    const headers = ['아이디', '번호', '성명', '연락처', '휴대폰', '이메일', '메모']; // 🎯 아이디를 맨 앞으로 이동

    try {
      const found = proClasses.find(p => p.name === activeSkill);
      const skillFilter = found ? found.keyy : '';
      const finalQuery = isAll ? '' : activeSearchQuery;
      const finalField = isAll ? 'all' : activeSearchField;

      let page = 1;
      let hasMore = true;
      let totalRecords = 0;

      while (hasMore) {
        console.log(`Export Loop: [${activeSkill}] Page ${page}`);
        setExportStep(`데이터 분석 중: ${allCsvRows.length.toLocaleString()}명 완료...`);

        const res = await fetchExportMembers(
          page,
          CHUNK_SIZE,
          finalQuery,
          finalField, // 🎯 field 전달 (중요!)
          'all',
          '',
          '',
          '',
          skillFilter
        );

        if (!res.data || res.data.length === 0) {
          console.log('No more data received.');
          hasMore = false;
          break;
        }

        // 🎯 서버 응답의 total을 우선시하여 동기화 오류 방지
        if (page === 1) {
          totalRecords = res.total || 0;
          console.log('Target Total Records Sync:', totalRecords);
        }

        const rows = res.data.map((m: any, idx: number) => {
          // 🛡️ CSV 이스케이프: 따옴표 내부에 따옴표가 있을 경우 보정
          const escape = (val: any) => `"${(val || '').toString().replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`;
          return [
            escape(m.loginId), // 🎯 아이디 (첫 번째로 이동)
            (page - 1) * CHUNK_SIZE + idx + 1,
            escape(m.name),
            escape(m.tel),
            escape(m.hp),
            escape(m.email),
            escape(m.memo)
          ].join(',');
        });

        allCsvRows = allCsvRows.concat(rows);
        setProcessedCount(allCsvRows.length);

        console.log(`Current Rows: ${allCsvRows.length} / ${totalRecords}`);

        if (allCsvRows.length >= totalRecords) {
          hasMore = false;
        } else {
          page++;
        }

        // 안정성을 위해 루프 간 아주 짧은 지연 (UI 프리징 방지)
        await new Promise(r => setTimeout(r, 10));
      }

      if (allCsvRows.length === 0) {
        throw new Error('조회된 데이터가 없어 파일을 생성할 수 없습니다.');
      }

      setExportStep('저장 준비 완료');
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `KKC_MEMBERS_${dateStr}.csv`;

      const BOM = '\uFEFF';
      const csvContent = BOM + headers.join(',') + '\n' + allCsvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // 🚀 자동 다운로드 대신 사용자가 클릭할 수 있는 상태로 변경 (보안 차단 회피)
      setReadyFile({ url, name: fileName });

    } catch (e: any) {
      console.error('EXPORT_ERROR:', e);
      showAlert('다운로드 실패', `데이터 처리 중 오류가 발생했습니다: ${e.message}`);
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-y-auto">
      {isExporting && (
        <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl p-10 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
            {!readyFile ? (
              <>
                <div className="relative mx-auto w-16 h-16">
                  <Activity size={40} className="text-blue-600 animate-pulse absolute inset-0 m-auto" />
                  <div className="absolute inset-0 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">{exportStep}</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Processing {processedCount.toLocaleString()} records</p>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${Math.min(100, (processedCount / (total || 1)) * 100)}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="space-y-6 py-4">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Download size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">준비 완료!</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    데이터 추출이 모두 끝났습니다.<br />
                    아래 버튼을 눌러 파일을 저장해 주세요.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <a
                    href={readyFile.url}
                    download={readyFile.name}
                    onClick={() => {
                      setTimeout(() => {
                        setIsExporting(false);
                        setReadyFile(null);
                      }, 1000);
                    }}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
                  >
                    <Download size={24} /> 파일 저장하기
                  </a>
                  <button
                    onClick={() => {
                      setIsExporting(false);
                      setReadyFile(null);
                    }}
                    className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Header section matches the screenshot */}
      <div className="px-10 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[26px] font-bold text-gray-800">직능 및 자격증 회원관리</h2>
          <div className="flex gap-2">
            <button
              onClick={handleEditSkillClick}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedSkill}
            >
              <Edit size={18} /> 직능 수정
            </button>
            <button
              onClick={() => setIsAddingNewSkill(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} /> 직능 추가
            </button>
            <button
              onClick={handleDeleteSkill}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-md font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedSkill}
            >
              <Trash2 size={18} /> 직능 삭제
            </button>
          </div>
        </div>

        {/* Search Controls */}
        <div className="flex items-center gap-3 mb-10 text-[14px]">
          <span className="text-gray-600 font-bold whitespace-nowrap mr-2">직능 선택</span>
          <div className="flex items-center gap-1 group">
            <select
              className="border border-gray-300 rounded-sm px-3 py-2 w-48 outline-none focus:border-blue-500 text-gray-700 bg-white"
              value={selectedSkill}
              onChange={(e) => {
                const newSkillName = e.target.value;
                const found = proClasses.find(p => p.name === newSkillName);
                
                setSelectedSkill(newSkillName);
                setActiveSkill(newSkillName);
                
                // 🚀 직능 선택 시 기존 검색어 초기화 (사용자 편의성)
                setSearchQuery('');
                setActiveSearchQuery('');
                
                // 즉시 로드
                loadData(1, newSkillName, '', searchField, found?.keyy);
              }}
            >
              <option value="">직능을 선택하세요</option>
              {proClasses.map((pc) => (
                <option key={pc.uid} value={pc.name}>{pc.name}</option>
              ))}
            </select>
          </div>

          <select
            className="border border-gray-300 rounded-sm px-3 py-2 w-32 outline-none focus:border-blue-500 text-gray-700 bg-white ml-2"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="name">이름</option>
            <option value="phone">연락처</option>
            <option value="hp">휴대폰</option>
            <option value="email">이메일</option>
            <option value="id">아이디</option>
          </select>

          <input
            type="text"
            className="border border-gray-300 rounded-sm px-4 py-2 w-64 outline-none focus:border-blue-500 placeholder:text-gray-400"
            placeholder={`${searchField === 'name' ? '이름' : searchField === 'phone' ? '연락처' : searchField === 'hp' ? '휴대폰' : searchField === 'email' ? '이메일' : '아이디'}으로 검색`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />

          <button
            onClick={handleSearch}
            className="bg-[#4a89dc] hover:bg-[#3b75c3] text-white px-6 py-2 rounded-sm font-bold text-sm transition-colors active:scale-95 ml-1 flex items-center gap-2"
          >
            검색
          </button>
          
          <button
            onClick={() => loadData(1)}
            type="button"
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
            title="새로고침"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Subheader and Action buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-[16px] font-bold text-gray-800">
            "{activeSkill}" 회원 목록 <span className="text-gray-500 text-sm font-medium">(총 {total.toLocaleString()}명)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport(false)}
              className="bg-[#658abb] hover:bg-[#5274a2] text-white px-4 py-2 rounded-sm text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <Download size={14} /> 검색결과 다운로드
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border-t-2 border-slate-300 relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          )}
          <table className="w-full text-[14px] text-center">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold h-12">
              <tr>
                <th className="font-bold w-[8%]">번호</th>
                <th className="font-bold w-[15%]">이름</th>
                <th className="font-bold w-[15%]">연락처</th>
                <th className="font-bold w-[15%]">HP</th>
                <th className="font-bold w-[15%]">이메일</th>
                <th className="font-bold w-[22%]">메모</th>
                <th className="font-bold w-[10%]">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-blue-50/20 transition-colors h-14">
                  <td className="text-gray-600 font-medium">
                    {calculateNumber(index)}
                  </td>
                  <td className="text-gray-800 font-bold">
                    {item.name || item.memberName || '-'}
                  </td>
                  <td className="text-gray-600">
                    {item.tel || '-'}
                  </td>
                  <td className="text-gray-600">
                    {item.hp || '-'}
                  </td>
                  <td className="text-gray-600">
                    {item.email || '-'}
                  </td>
                  <td className="text-gray-500 truncate max-w-[200px]">
                    {item.memo || '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        if (item.loginId && onGoToMember) {
                          onGoToMember(item.loginId);
                        } else {
                          showAlert('알림', '회원 ID 정보를 찾을 수 없습니다.');
                        }
                      }}
                      className="bg-[#4a89dc] hover:bg-[#3b75c3] text-white px-3 py-1.5 rounded-sm text-[12px] font-bold transition-colors shadow-sm active:scale-95"
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-20 text-gray-400">조회된 데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center mt-8 gap-1">
          <button
            onClick={() => loadData(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 rounded-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => loadData(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 rounded-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>

          {getPages().map(p => (
            <button
              key={p}
              onClick={() => loadData(p)}
              className={`w-8 h-8 flex items-center justify-center border rounded-sm text-[13px] font-bold transition-colors ${currentPage === p
                ? 'bg-[#4a89dc] text-white border-[#4a89dc]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => loadData(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 rounded-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => loadData(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 rounded-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
      {/* 🚀 직능 추가 모달 */}
      {isAddingNewSkill && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 leading-none">신규 직능 추가</h3>
              <button onClick={() => setIsAddingNewSkill(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">직능 명칭</label>
                <input
                  type="text"
                  placeholder="예: 특수훈련심사위원"
                  className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">직능 코드</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="예: SPEC-1"
                    className={`flex-1 border rounded px-3 py-2 outline-none transition-all font-mono ${
                      codeCheckResult.checked 
                        ? (codeCheckResult.available ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={newSkillCode}
                    onChange={(e) => {
                      setNewSkillCode(e.target.value);
                      setCodeCheckResult({ checked: false, available: false, message: '' });
                    }}
                  />
                  <button 
                    onClick={checkCodeDuplicate}
                    className="bg-gray-800 text-white px-4 py-2 rounded text-xs font-bold hover:bg-black transition-colors whitespace-nowrap"
                  >
                    중복 확인
                  </button>
                </div>
                {codeCheckResult.checked && (
                  <p className={`text-[11px] font-bold ${codeCheckResult.available ? 'text-green-600' : 'text-red-500'}`}>
                    {codeCheckResult.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">분류 선택</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSkillType(1)}
                    className={`flex-1 py-2 px-3 rounded border text-xs font-bold transition-all ${
                      newSkillType === 1 ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    직능 (Skill)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSkillType(0)}
                    className={`flex-1 py-2 px-3 rounded border text-xs font-bold transition-all ${
                      newSkillType === 0 ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    자격증 (License)
                  </button>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded text-[11px] text-blue-600 leading-relaxed">
                ※ 추가된 직능은 회원 상세 정보의 '직능 선택' 목록에도 나타납니다. 코드는 중복되지 않도록 주의하세요.
              </div>
            </div>
            <div className="p-5 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setIsAddingNewSkill(false)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleAddNewSkill}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 shadow-sm transition-all active:scale-95"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 직능 수정 모달 */}
      {isEditingSkill && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 leading-none">직능 정보 수정</h3>
              <button onClick={() => setIsEditingSkill(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">직능 명칭</label>
                <input
                  type="text"
                  placeholder="예: 특수훈련심사위원"
                  className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  value={editingSkillName}
                  onChange={(e) => setEditingSkillName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">직능 코드</label>
                <input
                  type="text"
                  placeholder="예: SPEC-1"
                  className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-mono"
                  value={editingSkillCode}
                  onChange={(e) => setEditingSkillCode(e.target.value)}
                />
                <p className="text-[11px] text-gray-400">※ 코드를 변경하면 기존에 해당 코드를 가졌던 회원의 데이터 연결이 끊어질 수 있으니 주의하세요.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">분류 선택</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSkillType(1)}
                    className={`flex-1 py-2 px-3 rounded border text-xs font-bold transition-all ${
                      editingSkillType === 1 ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    직능 (Skill)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSkillType(0)}
                    className={`flex-1 py-2 px-3 rounded border text-xs font-bold transition-all ${
                      editingSkillType === 0 ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    자격증 (License)
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setIsEditingSkill(false)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleSaveEditedSkill}
                className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 shadow-sm transition-all active:scale-95"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
