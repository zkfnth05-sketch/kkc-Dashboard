import React, { useState, useEffect } from 'react';
import { fetchMembers } from '../services/memberService';
import { fetchExportMembers } from '../services/exportService';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Activity, FileSpreadsheet, Plus, Trash2, X } from 'lucide-react';

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

export const SKILL_CONFIG: Record<string, string> = {
  '업체-사료,용품': 'com',
  '가정견심사위원': 'CD',
  '경연심사위원': 'GJU',
  '공인자격반려견스타일리스트1급': 'PS1',
  '공인자격반려견스타일리스트2급': 'PS2',
  '공인자격반려견스타일리스트3급': 'PS3',
  '관공서': 'dkf',
  '광주/전남 동물병원/샵': 'ALJ',
  '구조견이사': 'RDD',
  '구조견훈련사': 'RED',
  '국제심사위원': 'txl',
  '기타견보조심사위원': 'OJO',
  '기타견부심사위원': 'OJS',
  '기타견정심사위원': 'OJJ',
  '노비스도그쇼': 'ND1',
  '대구 애견샵 (449406)': 'TEA',
  '대구/경북 동물병원/샵': 'ale',
  '대기업_마케팅팀': 'BMA',
  '대사관,위촉(자문위원,홍보대사)': 'eot',
  '대의원': 'AC000',
  '대전/충남 동물병원/샵 (449406)': 'dae',
  '도그피트니스': 'DPS',
  '도서관': 'SSS',
  '동물매개치료교육이수자': 'DDD',
  '동물매개활동관리사': 'ANG',
  '동반견심사위원': 'BH',
  '디스크독심사위원': 'DISC',
  '리트리버심사위원': 'RJJ',
  '미용강사': 'jmj',
  '미용경연': 'gro',
  '미용교사': 'kjk',
  '미용사1급': 'GR1',
  '미용사2급': 'GR2',
  '미용사3급': 'GR3',
  '미용사범': 'GRM',
  '미용심사위원': 'GRJ',
  '미용학원': 'GSC',
  '박람회': 'DOG',
  '반려견심사위원': 'KJA',
  '반려견아카데미수강생': 'KAD',
  '반려견행동상담사1급': 'CBC',
  '반려견행동상담사2급': 'CBB',
  '반려견행동상담사3급': 'CBA',
  '반려동물관리사': 'LPM',
  '반려동물관리사1급': 'DSS',
  '반려동물목욕관리사': 'LPB',
  '방송국': 'qkd',
  '번식장': 'sbd',
  '보조심사위원': 'bbo',
  '부산/경남 동물병원/샵 (449406)': 'ALF',
  '부산경남_유초중고': 'SAB',
  '부심심사위원': 'aab',
  '부장심사위원': 'BBA',
  '분과위원장': 'CMM',
  '사체탐지견훈련사': 'KSCD',
  '서울/경기 동물병원/샵 (449406)': 'hoa',
  '서울경기_유초중고': 'SAA',
  '서울동물병원': 'sph',
  '세퍼드 도그쇼': 'DS2',
  '셰퍼드보조심사위원': 'SJO',
  '셰퍼드부심사위원': 'SJS',
  '셰퍼드소유자': 'III',
  '셰퍼드정심사위원': 'SJJ',
  '시체탐지견핸들러자격증': 'RDH',
  '시체탐지견훈련사자격증': 'RDT',
  '심사위원': 'aaa',
  '아로마스페셜리스트': 'ARS',
  '아로마스페셜리스트 강사': 'ARM',
  '아로마스페셜리스트 심사위원': 'ARJ',
  '어질리티심사위원': 'AGI',
  '애견_관련_교수': 'uni',
  '애견관련학과장': 'as3',
  '애견관련학교학장님': 'RTY',
  '애견동반펜션': 'PEN',
  '애견브리더': 'PB',
  '애견용품디자이너': 'DES',
  '애견종합관리사': 'BBB',
  '애완동물학과': 'ALM',
  '연구보조': 'JSO',
  '연구부심': 'JSS',
  '연구정심': 'JSJ',
  '외국단체': 'dhl',
  '외국심사위원': 'LIM',
  '이사': 'DRT',
  '인명구조견심사위원자격증(A.B)': 'RDJ',
  '일반': 'MEM',
  '자원봉사,체험': 'JJ',
  '전견종 도그쇼': 'DS1',
  '전람회 책자발송': 'SDFW',
  '전주/전북 동물병원/샵 (449406)': 'ALI',
  '정심심사위원': 'aae',
  '제주 동물병원/샵': 'ALK',
  '지방동물병원': 'eph',
  '지정미용학원': 'TTT',
  '지정번식장': 'AMN',
  '지회장': 'BRN',
  '진도 도그쇼': 'DS3',
  '챔피언견소유자': 'QQQ',
  '청주/충북 동물병원/샵 (449406)': 'ALH',
  '축견': 'KDU',
  '춘천/강원 동물병원/샵 (449406)': 'ALG',
  '치료견': 'THD',
  '치와와스페셜티문자': 'CI',
  '클럽회장': 'CLB',
  '클리커심사위원': 'CLK',
  '클리커전문가자격증': 'LKJ',
  '킨더독튜터': 'KT',
  '타미용학원': 'TSS',
  '타협회': 'xkg',
  '토이견보조심사위원': 'TJO',
  '토이견부심사위원': 'TJS',
  '토이견정심사위원': 'TJJ',
  '펫그루머': 'PGM',
  '펫그루머A급': 'PGMA',
  '펫그루머B급': 'PGMB',
  '펫그루머C급': 'PGMC',
  '펫베이킹전문가1급': 'PBK',
  '펫베이킹전문가2급': 'PBK2',
  '펫살롱프로페셔널': 'PSP',
  '펫시터': 'PS',
  '펫시터 강사': 'PSI',
  '펫케이크': 'PK',
  '펫푸드스타일리스트1급': 'PFS1',
  '펫푸드스타일리스트2급': 'PFS',
  '포스터 발송': 'PST',
  '하나은행 DB': 'KEB',
  '한국견보조심사위원': 'JJO',
  '한국견부심사위원': 'JJS',
  '한국견정심사위원': 'JJJ',
  '할인혜택': 'DCD',
  '핸들러 심사위원': 'HS',
  '핸들러1급': '33B',
  '핸들러2급': '33A',
  '핸들러3급': 'ABA',
  '핸들러강사': '33D',
  '핸들러교사': '33C',
  '핸들러사범': '33E',
  '헬퍼1등': 'HP1',
  '헬퍼2등': 'HP2',
  '헬퍼3등': 'HP3',
  '협력기관': 'AS4',
  '훈련': 'MS',
  '훈련교사': 'ALL',
  '훈련사사범': 'TMS',
  '훈련사1등': 'TR1',
  '훈련사2등': 'TR2',
  '훈련사3등': 'TR3',
  '훈련소': 'TR5',
  '훈련심사위원': 'aad',
  'FCI 소속': 'oiop'
};

/**
 * 🚀 모든 직능 목록(기본 + 커스텀)을 반환하는 헬퍼
 */
export const getAllSkills = (): Record<string, string> => {
  const saved = localStorage.getItem('CUSTOM_SKILL_CONFIG');
  if (saved) {
    try {
      return { ...SKILL_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      return SKILL_CONFIG;
    }
  }
  return SKILL_CONFIG;
};

/**
 * 🎯 pro_class 코드를 한글 직능명으로 변환하는 헬퍼 함수
 * @param proClassStr "com-TR5" 형태의 하이픈 구분 문자열
 */
export const formatSkillNames = (proClassStr: string | undefined): string[] => {
  if (!proClassStr || proClassStr.trim() === '') return [];

  const reverseMap: Record<string, string> = {};

  // 구버전 코드 호환성 매핑
  const legacyMap: Record<string, string> = {
    'DGS': '대구 애견샵 (449406)', 'RDR': '사체탐지견훈련사', 'FOR': '외국단체',
    'JEM': '제주 동물병원/샵', 'TTB': '지정번식장', 'CTD': '축견', 'HBD': '하나은행 DB'
  };

  const all = getAllSkills();
  Object.entries(all).forEach(([name, code]) => {
    reverseMap[code] = name;
  });

  return proClassStr.split('-')
    .filter(code => code.trim() !== '')
    .map(code => reverseMap[code] || legacyMap[code] || code);
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

  // 🚀 직능 목록 가변 상태 관리 (기본값은 SKILL_CONFIG)
  const [activeSkills, setActiveSkills] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('CUSTOM_SKILL_CONFIG');
    if (saved) {
      try { return { ...SKILL_CONFIG, ...JSON.parse(saved) }; } catch (e) { return SKILL_CONFIG; }
    }
    return SKILL_CONFIG;
  });

  // Filters State
  const [selectedSkill, setSelectedSkill] = useState('가정견심사위원');
  const [searchField, setSearchField] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Filters (Applied after pressing search)
  const [activeSkill, setActiveSkill] = useState('가정견심사위원');
  const [activeSearchField, setActiveSearchField] = useState('name');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  // 🚀 직능 추가 모달 상태
  const [isAddingNewSkill, setIsAddingNewSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCode, setNewSkillCode] = useState('');

  const limit = 10;

  /* 🛡️ [SYSTEM LOCK: PAGE UI & LOGIC PRESERVATION] */
  /* 이 구간의 모든 로직과 디자인은 사용자가 최종 확정한 상태입니다. 인가 없이 수정하지 마세요. */
  const loadData = async (page: number = 1, skill: string = activeSkill, query: string = activeSearchQuery, field: string = activeSearchField) => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const targetTable = 'memTab';
      const proClassFilter = SKILL_CONFIG[skill] || '';
      const finalQuery = query || '';
      const finalField = field || 'name';

      const res = await fetchMembers(targetTable, page, finalQuery, finalField, limit, '', '', 'all', '', '', '', proClassFilter);

      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      showAlert('로드 실패', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(1); }, [tableName]);

  const handleSearch = () => {
    setActiveSkill(selectedSkill);
    setActiveSearchField(searchField);
    setActiveSearchQuery(searchQuery);
    loadData(1, selectedSkill, searchQuery, searchField);
  };

  /**
   * 🎯 직능 추가 로직
   */
  const handleAddNewSkill = () => {
    if (!newSkillName.trim() || !newSkillCode.trim()) {
      showAlert('오류', '직능명과 코드를 모두 입력해주세요.');
      return;
    }

    // 🚀 코드 중복 체크 추가
    const existingCodes = Object.values(activeSkills);
    if (existingCodes.includes(newSkillCode.trim())) {
      showAlert('오류', '이 직능코드는 현재 있는 코드입니다.');
      return;
    }

    const updated = { ...activeSkills, [newSkillName]: newSkillCode.trim() };
    setActiveSkills(updated);
    // 로컬 스토리지에 커스텀 직능만 별도 저장 (영구 저장은 추후 DB 권장)
    const customOnly = { ...updated };
    Object.keys(SKILL_CONFIG).forEach(k => delete (customOnly as any)[k]);
    localStorage.setItem('CUSTOM_SKILL_CONFIG', JSON.stringify(customOnly));

    setIsAddingNewSkill(false);
    setNewSkillName('');
    setNewSkillCode('');
    showAlert('알림', '신규 직능이 추가되었습니다.');
  };

  /**
   * 🎯 직능 삭제 로직
   */
  const handleDeleteSkill = () => {
    if (!selectedSkill) return;
    showConfirm('직능 삭제', `"${selectedSkill}" 직능을 목록에서 삭제하시겠습니까?\n(실제 회원 데이터가 삭제되지는 않지만, 목록에서 사라집니다.)`, () => {
      const updated = { ...activeSkills };
      delete updated[selectedSkill];
      setActiveSkills(updated);

      const customOnly = { ...updated };
      Object.keys(SKILL_CONFIG).forEach(k => delete (customOnly as any)[k]);
      localStorage.setItem('CUSTOM_SKILL_CONFIG', JSON.stringify(customOnly));

      setSelectedSkill('');
      setActiveSkill('');
      setData([]);
      setTotal(0);
      showAlert('알림', '삭제되었습니다.');
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
      const skillFilter = SKILL_CONFIG[activeSkill] || '';
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
          <h2 className="text-[26px] font-bold text-gray-800">직능별 회원 관리</h2>
          <div className="flex gap-2">
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
                const newSkill = e.target.value;
                setSelectedSkill(newSkill);
                setActiveSkill(newSkill);
                loadData(1, newSkill, searchQuery, searchField);
              }}
            >
              <option value="">직능을 선택하세요</option>
              {Object.keys(activeSkills).map((skillName) => (
                <option key={skillName} value={skillName}>{skillName}</option>
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
            <option value="loginId">아이디</option>
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
            className="bg-[#4a89dc] hover:bg-[#3b75c3] text-white px-6 py-2 rounded-sm font-bold text-sm transition-colors active:scale-95 ml-1"
          >
            검색
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
                <input
                  type="text"
                  placeholder="예: SPEC-1"
                  className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-mono"
                  value={newSkillCode}
                  onChange={(e) => setNewSkillCode(e.target.value)}
                />
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
    </div>
  );
};
