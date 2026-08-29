import React, { useState, useEffect } from 'react';
import { Search, Award, ShieldCheck, FileText, Calendar, Trash2, Edit, RefreshCw, Printer, Download, Eye, Check, X, Image as ImageIcon, Info, Sparkles, Loader2 } from 'lucide-react';
import { niceAdminFetchPedigrees, niceAdminPedigreeAction, niceAdminDeletePedigree, niceAdminFetchBreedColors, niceAdminGenerateRegNo, niceAdminLookupPedigreeTree } from '../services/portalService';
import { fetchHairs, fetchDogClasses, checkRegNoExists, fetchLastRegNo } from '../services/pedigreeService';
import { runSqlBatch } from '../services/memberService';
import { SearchableColorSelect } from './SearchableColorSelect';

interface NicePedigree {
  uid: number;
  order_no?: string;
  reg_no: string;
  dog_name?: string;
  name?: string;
  breed_name?: string;
  dog_clasTab_name?: string;
  gender?: string;
  sex?: string;
  micro?: string;
  owner_name?: string;
  owner_id?: string;
  sire_name?: string;
  dam_name?: string;
  registered_at?: string;
  status: 'P' | 'Y' | 'N' | 'R';
  admin_memo?: string;
  image1_path?: string;
  image2_path?: string;
  image3_path?: string;
  image4_path?: string;
  poss_ci?: string;
  req_mobile?: string;

  // NICE Petpin 데이터베이스 명세 기준 상세 필드
  saho_eng?: string;
  saho?: string;
  hair?: string;
  breeder_name?: string;
  breed_name_person?: string;
  breeder_addr?: string;
  breed_addr?: string;
  poss_name?: string;
  poss_addr?: string;
  birth?: string;
  birth_m?: number;
  birth_M?: number;
  birth_f?: number;
  birth_F?: number;
  reg_count_m?: number;
  reg_count_M?: number;
  reg_count_f?: number;
  reg_count_F?: number;
  reg_date?: string;

  // 부견 정보
  sire_reg_no?: string;
  fa_name?: string;
  father_name?: string;
  Father_name?: string;
  fa_regno?: string;
  father_reg_no?: string;
  fa_saho?: string;
  father_saho?: string;

  // 모견 정보
  dam_reg_no?: string;
  mo_name?: string;
  mother_name?: string;
  mo_regno?: string;
  mother_reg_no?: string;
  mo_saho?: string;
  mother_saho?: string;

  // 조상견 정보
  anc_name?: string;
  anc_saho?: string;
  anc_type?: string;
  ancient?: Array<{ type?: string; name?: string; saho?: string }>;
}

import { PedigreeManagementPage } from './PedigreeManagementPage';

interface NicePedigreeManagementProps {
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToPoints: (regNo: string) => void;
  onGoToPrizes: () => void;
  onGoToMember: (loginId: string) => void;
  initialSearch?: { query: string; field: string } | null;
  onSearchHandled?: () => void;
}

export const NicePedigreeManagement: React.FC<NicePedigreeManagementProps> = ({
  showAlert,
  showConfirm,
  onGoToPoints,
  onGoToPrizes,
  onGoToMember,
  initialSearch,
  onSearchHandled
}) => {
  const [pedigrees, setPedigrees] = useState<NicePedigree[]>([]);
  const [selectedPedigree, setSelectedPedigree] = useState<NicePedigree | null>(null);
  const [breedColors, setBreedColors] = useState<{ color_cd: string; color_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'reg_no' | 'dog_name' | 'owner_name' | 'micro'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'P' | 'Y' | 'N' | 'R'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | ''>('');

  const [masterHairs, setMasterHairs] = useState<{ uid?: string; name: string }[]>([]);
  const [dogClasses, setDogClasses] = useState<{ uid?: string; keyy: string; breed: string; group?: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    fetchHairs().then((res) => {
      if (Array.isArray(res)) {
        setMasterHairs(res);
      }
    }).catch((err) => console.error('hairTab fetch error:', err));

    fetchDogClasses().then((res) => {
      if (Array.isArray(res)) {
        setDogClasses(res);
      }
    }).catch((err) => console.error('dog_classTab fetch error:', err));
  }, []);

  const maskCi = (ci?: string) => {
    if (!ci) return '-';
    if (ci.length <= 16) return ci;
    const start = ci.slice(0, 8);
    const end = ci.slice(-6);
    return `${start}****************************************${end}`;
  };

  const allColorOptions = React.useMemo(() => {
    const map = new Map<string, { uid?: string; name: string }>();
    masterHairs.forEach((h) => {
      if (h.name) map.set(h.name, h);
    });
    breedColors.forEach((c) => {
      if (c.color_name && !map.has(c.color_name)) {
        map.set(c.color_name, { name: c.color_name });
      }
    });
    return Array.from(map.values());
  }, [masterHairs, breedColors]);

  // 견종 그룹 목록 계산
  const breedGroups = React.useMemo(() => {
    return Array.from(new Set(dogClasses.map(d => d.group))).filter(Boolean).sort();
  }, [dogClasses]);

  // 선택된 그룹에 따른 견종 목록 계산
  const availableBreeds = React.useMemo(() => {
    if (!selectedGroup) return dogClasses.map(d => d.breed).sort();
    return dogClasses.filter(d => d.group === selectedGroup).map(d => d.breed).sort();
  }, [dogClasses, selectedGroup]);

  useEffect(() => {
    if (selectedPedigree?.breed_name) {
      niceAdminFetchBreedColors(selectedPedigree.breed_name).then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          setBreedColors(res.data);
        } else {
          setBreedColors([]);
        }
      }).catch(() => setBreedColors([]));
    } else {
      setBreedColors([]);
    }
  }, [selectedPedigree]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'dogtab'>('requests');

  // 관리자 직접 지정/수정용 모색, 견종, 등록번호 State
  const [editHair, setEditHair] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [isAssigningRegNo, setIsAssigningRegNo] = useState(false);
  const [isCheckingRegNo, setIsCheckingRegNo] = useState(false);

  // 관리자 직접 지정/수정용 견명, 성별, 칩번호, 생년월일, 번식자/소유자 정보 State
  const [editDogName, setEditDogName] = useState('');
  const [editSex, setEditSex] = useState<'M' | 'F'>('M');
  const [editMicro, setEditMicro] = useState('');
  const [editBirth, setEditBirth] = useState('');
  const [editRegDate, setEditRegDate] = useState('');
  const [editBirthM, setEditBirthM] = useState<number | string>('');
  const [editBirthF, setEditBirthF] = useState<number | string>('');
  const [editRegCountM, setEditRegCountM] = useState<number | string>('');
  const [editRegCountF, setEditRegCountF] = useState<number | string>('');
  const [editSaho, setEditSaho] = useState('');
  const [editSahoEng, setEditSahoEng] = useState('');
  const [editBreederName, setEditBreederName] = useState('');
  const [editBreederAddr, setEditBreederAddr] = useState('');
  const [editPossName, setEditPossName] = useState('');
  const [editPossAddr, setEditPossAddr] = useState('');

  // 관리자 직접 지정/수정용 부모견 및 족보 State
  const [editFaName, setEditFaName] = useState('');
  const [editFaReg, setEditFaReg] = useState('');
  const [editFaSaho, setEditFaSaho] = useState('');
  const [editMoName, setEditMoName] = useState('');
  const [editMoReg, setEditMoReg] = useState('');
  const [editMoSaho, setEditMoSaho] = useState('');
  const [treeAncestors, setTreeAncestors] = useState<Array<{ type: string; name: string; saho: string; reg_no?: string }>>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  // 실시간 3대 가계도 조회 헬퍼 (등록번호 + 이름 + UID 통합)
  const handleLookupTree = async (
    faRegParam?: string,
    moRegParam?: string,
    dogRegParam?: string,
    faNameParam?: string,
    moNameParam?: string
  ) => {
    const fReg = (faRegParam !== undefined ? faRegParam : editFaReg).trim();
    const mReg = (moRegParam !== undefined ? moRegParam : editMoReg).trim();
    const dReg = (dogRegParam !== undefined ? dogRegParam : editRegNo).trim();
    const fName = (faNameParam !== undefined ? faNameParam : editFaName).trim();
    const mName = (moNameParam !== undefined ? moNameParam : editMoName).trim();

    if (!fReg && !mReg && !dReg) {
      showAlert('조회 정보 필요', '부모견의 등록번호를 입력해 주세요.');
      return;
    }

    setIsLoadingTree(true);
    try {
      const res = await niceAdminLookupPedigreeTree(fReg, mReg, dReg);
      if (res && res.success) {
        let foundFa = false;
        let foundMo = false;
        if (res.father) {
          if (res.father.name) { setEditFaName(res.father.name); foundFa = true; }
          if (res.father.saho) { setEditFaSaho(res.father.saho); foundFa = true; }
          if (res.father.reg_no) { setEditFaReg(res.father.reg_no); foundFa = true; }
        }
        if (res.mother) {
          if (res.mother.name) { setEditMoName(res.mother.name); foundMo = true; }
          if (res.mother.saho) { setEditMoSaho(res.mother.saho); foundMo = true; }
          if (res.mother.reg_no) { setEditMoReg(res.mother.reg_no); foundMo = true; }
        }
        const ancCount = Array.isArray(res.ancestors) ? res.ancestors.length : 0;
        if (Array.isArray(res.ancestors)) {
          setTreeAncestors(res.ancestors);
        }

        if (ancCount > 0 || foundFa || foundMo) {
          showAlert('3대 가계도 조회 완료', `일치하는 개체 정보를 불러왔습니다. (조회된 조상견: ${ancCount}마리)`);
        } else {
          showAlert('조회 결과 없음', '입력하신 등록번호와 일치하는 나이스 혈통서 개체가 없습니다. (조회된 조상견: 0마리)');
        }
      } else {
        showAlert('조회 실패', res?.error || '가계도 조회 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('가계도 조회 오류:', err);
      showAlert('조회 오류', '가계도 조회 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingTree(false);
    }
  };

  useEffect(() => {
    if (selectedPedigree) {
      setEditDogName(selectedPedigree.dog_name || selectedPedigree.name || '');
      setEditSex(selectedPedigree.gender === 'F' || selectedPedigree.sex === 'F' ? 'F' : 'M');
      setEditMicro(selectedPedigree.micro === '-' ? '' : (selectedPedigree.micro || ''));
      
      let birthVal = (selectedPedigree.birth || '').trim();
      if (birthVal.includes('.')) birthVal = birthVal.replace(/\./g, '-');
      setEditBirth(birthVal === '-' ? '' : birthVal);

      let regDateVal = (selectedPedigree.reg_date || '').trim();
      if (regDateVal.includes('.')) regDateVal = regDateVal.replace(/\./g, '-');
      setEditRegDate(regDateVal === '-' ? '' : regDateVal);

      const bM = selectedPedigree.birth_m ?? selectedPedigree.birth_M;
      setEditBirthM(bM !== null && bM !== undefined && bM !== 0 ? bM : '');

      const bF = selectedPedigree.birth_f ?? selectedPedigree.birth_F;
      setEditBirthF(bF !== null && bF !== undefined && bF !== 0 ? bF : '');

      const rM = selectedPedigree.reg_count_m ?? selectedPedigree.reg_count_M;
      setEditRegCountM(rM !== null && rM !== undefined && rM !== 0 ? rM : '');

      const rF = selectedPedigree.reg_count_f ?? selectedPedigree.reg_count_F;
      setEditRegCountF(rF !== null && rF !== undefined && rF !== 0 ? rF : '');

      const sEng = (selectedPedigree.saho_eng || '').trim();
      setEditSahoEng(sEng === '-' ? '' : sEng);

      const sKor = (selectedPedigree.saho || '').trim();
      setEditSaho(sKor === '-' ? '' : sKor);

      const bNamePerson = (selectedPedigree.breeder_name || selectedPedigree.breed_name_person || '').trim();
      setEditBreederName(bNamePerson === '-' ? '' : bNamePerson);

      const bAddr = (selectedPedigree.breeder_addr || selectedPedigree.breed_addr || '').trim();
      setEditBreederAddr(bAddr === '-' ? '' : bAddr);

      const pName = (selectedPedigree.poss_name || selectedPedigree.owner_name || '').trim();
      setEditPossName(pName === '-' ? '' : pName);

      const pAddr = (selectedPedigree.poss_addr || '').trim();
      setEditPossAddr(pAddr === '-' ? '' : pAddr);

      setEditHair(selectedPedigree.hair || '');
      const bName = selectedPedigree.breed_name || '';
      setEditBreed(bName);
      setEditRegNo(selectedPedigree.reg_no || '');

      const rawFa = (selectedPedigree.fa_name || selectedPedigree.father_name || selectedPedigree.Father_name || selectedPedigree.sire_name || '').trim();
      setEditFaName(rawFa.toLowerCase() === 'null' || rawFa === '-' ? '' : rawFa);

      const rawMo = (selectedPedigree.mo_name || selectedPedigree.mother_name || selectedPedigree.dam_name || '').trim();
      setEditMoName(rawMo.toLowerCase() === 'null' || rawMo === '-' ? '' : rawMo);

      const initFaReg = (selectedPedigree.fa_regno || selectedPedigree.father_reg_no || selectedPedigree.sire_reg_no || '').trim();
      setEditFaReg(initFaReg === '-' ? '' : initFaReg);

      const initFaSaho = (selectedPedigree.fa_saho || selectedPedigree.father_saho || '').trim();
      setEditFaSaho(initFaSaho === '-' ? '' : initFaSaho);

      const initMoReg = (selectedPedigree.mo_regno || selectedPedigree.mother_reg_no || selectedPedigree.dam_reg_no || '').trim();
      setEditMoReg(initMoReg === '-' ? '' : initMoReg);

      const initMoSaho = (selectedPedigree.mo_saho || selectedPedigree.mother_saho || '').trim();
      setEditMoSaho(initMoSaho === '-' ? '' : initMoSaho);

      // 기존 저장된 조상견 목록이 있으면 표시
      if (Array.isArray(selectedPedigree.ancient) && selectedPedigree.ancient.length > 0) {
        setTreeAncestors(selectedPedigree.ancient);
      } else {
        setTreeAncestors([]);
      }

      // 견종 그룹 자동 맞춤
      if (bName && dogClasses.length > 0) {
        const found = dogClasses.find(d => d.breed === bName);
        if (found && found.group) {
          setSelectedGroup(found.group);
        }
      }
    } else {
      setEditDogName('');
      setEditSex('M');
      setEditMicro('');
      setEditBirth('');
      setEditRegDate('');
      setEditBirthM('');
      setEditBirthF('');
      setEditRegCountM('');
      setEditRegCountF('');
      setEditSaho('');
      setEditSahoEng('');
      setEditBreederName('');
      setEditBreederAddr('');
      setEditPossName('');
      setEditPossAddr('');
      setEditHair('');
      setEditBreed('');
      setEditRegNo('');
      setEditFaName('');
      setEditFaReg('');
      setEditFaSaho('');
      setEditMoName('');
      setEditMoReg('');
      setEditMoSaho('');
      setTreeAncestors([]);
      setSelectedGroup('');
    }
  }, [selectedPedigree, dogClasses]);

  // 심사 처리 피드백 입력란
  const [actionMemo, setActionMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentStatusFilter = activeSubTab === 'dogtab' ? 'Y' : statusFilter;
      const res = await niceAdminFetchPedigrees(currentPage, searchQuery, searchField, currentStatusFilter);
      if (res && res.success) {
        setPedigrees(res.data || []);
        setTotalCount(res.total || 0);
        // 선택 항목 동기화
        if (selectedPedigree) {
          const currentSelected = res.data.find((p: any) => p.uid === selectedPedigree.uid);
          setSelectedPedigree(currentSelected || null);
        } else {
          setSelectedPedigree(null);
        }
      } else {
        showAlert('오류', res.error || '데이터 로딩 실패');
      }
    } catch (e) {
      console.error(e);
      showAlert('오류', '네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, activeSubTab]);

  // 외부 연동 검색 파라미터 유도
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch.query);
      setSearchField(initialSearch.field as any);
      if (onSearchHandled) onSearchHandled();
    }
  }, [initialSearch]);

  // 검색 디바운싱 트리거
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (currentPage === 1) {
        loadData();
      } else {
        setCurrentPage(1);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchField]);

  const handleDelete = (pedigree: NicePedigree) => {
    showConfirm(
      'NICE 모바일 혈통서 신청 삭제',
      `정말로 [${pedigree.dog_name}] 개체의 모바일 혈통서 심사 신청 내역을 완전히 삭제하시겠습니까?`,
      async () => {
        setIsLoading(true);
        try {
          const res = await niceAdminDeletePedigree(pedigree.uid);
          if (res && res.success) {
            showAlert('삭제 완료', '신청 내역이 데이터베이스에서 완전히 삭제되었습니다.');
            loadData();
          } else {
            showAlert('삭제 실패', res.error || '삭제 처리 중 오류가 발생했습니다.');
          }
        } catch (e) {
          console.error(e);
          showAlert('오류', '통신 중 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleAutoAssignRegNo = async () => {
    if (!editBreed) {
      showAlert('견종 선택 필요', '등록번호를 자동 부여하기 전에 견종을 먼저 선택해 주세요.');
      return;
    }
    setIsAssigningRegNo(true);
    try {
      const breedInfo = dogClasses.find(d => d.breed === editBreed);
      const keyy = breedInfo?.keyy ? breedInfo.keyy.trim() : '';

      const res = await niceAdminGenerateRegNo(editBreed, keyy);
      if (res && res.success && res.reg_no) {
        setEditRegNo(res.reg_no);
        showAlert(
          '등록번호 자동 부여 완료',
          `✔ [${editBreed}] 견종의 5000번대 모바일 전용 등록번호가 자동 채번되었습니다:\n\n👉 ${res.reg_no}`
        );
      } else {
        showAlert('채번 오류', res?.error || '등록번호를 생성할 수 없습니다.');
      }
    } catch (e) {
      console.error(e);
      showAlert('오류', '등록번호 자동 채번 중 통신 오류가 발생했습니다.');
    } finally {
      setIsAssigningRegNo(false);
    }
  };

  const handleCheckRegNo = async () => {
    if (!editRegNo || !editRegNo.trim()) {
      showAlert('조회 오류', '조회할 등록번호를 입력해 주세요.');
      return;
    }
    setIsCheckingRegNo(true);
    try {
      const existing = await checkRegNoExists(editRegNo);
      if (existing) {
        showAlert(
          '등록번호 중복 발견',
          `⚠️ 등록번호 [${editRegNo}]은(는) 이미 데이터베이스에 존재하는 번호입니다.\n\n` +
          `• 등록 개체명: ${existing.fullname || existing.name || '-'}\n` +
          `• 소유자: ${existing.poss_name || '-'}\n` +
          `• 견종: ${existing.dog_class || '-'}`
        );
      } else {
        showAlert(
          '사용 가능 번호',
          `✔ 등록번호 [${editRegNo}]은(는) 기존 DB에 중복되지 않는 사용 가능한 번호입니다.`
        );
      }
    } catch (e) {
      console.error(e);
      showAlert('오류', '등록번호 조회 도중 오류가 발생했습니다.');
    } finally {
      setIsCheckingRegNo(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedPedigree) return;

    if (action === 'approve') {
      if (!selectedGroup || !selectedGroup.trim()) {
        showAlert('견종 그룹 선택 필요', '견종 그룹을 먼저 선택해 주세요.');
        return;
      }
      if (!editBreed || !editBreed.trim()) {
        showAlert('견종 선택 필요', '견종을 선택해 주세요.');
        return;
      }
      if (!editHair || !editHair.trim()) {
        showAlert('모색 입력 필요', '모색(털 색상)을 선택하거나 입력해 주세요.');
        return;
      }
      if (!editRegNo || !editRegNo.trim()) {
        showAlert('등록번호 입력 필요', '등록번호를 자동 부여하거나 직접 입력해 주세요.');
        return;
      }
    }

    if (action === 'reject' && !actionMemo.trim()) {
      showAlert('반려 사유 누락', '반려 사유(의견)를 작성한 후에 반려 처리를 진행해 주세요.');
      return;
    }

    const isRefundReq = selectedPedigree.status === 'R';
    const actionText = isRefundReq
      ? (action === 'reject' ? '환불 승인(반려 확정)' : '환불 거절(정상 발급)')
      : (action === 'approve' ? '발급 승인' : '심사 반려');

    showConfirm(
      `${actionText} 처리`,
      `[${selectedPedigree.dog_name}] 개체의 ${actionText} 처리를 진행하시겠습니까?`,
      async () => {
        setCurrentAction(action);
        setIsSubmitting(true);
        try {
          // 1. 사전 동기화: nice_pedigree_requests에 관리자가 수정한 부모견 영문명 + 견사호 저장
          if (editFaName || editMoName || editFaSaho || editMoSaho) {
            try {
              const safeFa = editFaName.replace(/'/g, "\\'");
              const safeMo = editMoName.replace(/'/g, "\\'");
              const safeFaSaho = editFaSaho.replace(/'/g, "\\'");
              const safeMoSaho = editMoSaho.replace(/'/g, "\\'");
              await runSqlBatch([
                `UPDATE nice_pedigree_requests SET fa_name = '${safeFa}', father_name = '${safeFa}', mo_name = '${safeMo}', mother_name = '${safeMo}', fa_saho = '${safeFaSaho}', mo_saho = '${safeMoSaho}' WHERE uid = ${selectedPedigree.uid}`
              ]);
            } catch (preErr) {
              console.error('사전 부모견 영문명/견사호 동기화:', preErr);
            }
          }

          // 2. 관리자 액션 (승인/반려) 및 나이스 통보 실행 (수정된 전체 데이터 전송)
          const res = await niceAdminPedigreeAction(selectedPedigree.uid, action, actionMemo, {
            hair: editHair,
            breed_name: editBreed,
            dog_classTab_name: editBreed,
            reg_no: editRegNo,
            dog_name: editDogName,
            name: editDogName,
            sex: editSex,
            micro: editMicro,
            birth: editBirth,
            saho: editSaho,
            saho_eng: editSahoEng,
            breeder_name: editBreederName,
            breeder_addr: editBreederAddr,
            poss_name: editPossName,
            poss_addr: editPossAddr,
            birth_m: editBirthM === '' ? 0 : Number(editBirthM),
            birth_f: editBirthF === '' ? 0 : Number(editBirthF),
            reg_count_m: editRegCountM === '' ? 0 : Number(editRegCountM),
            reg_count_f: editRegCountF === '' ? 0 : Number(editRegCountF),
            reg_date: editRegDate,
            fa_name: editFaName,
            fa_regno: editFaReg,
            fa_saho: editFaSaho,
            mo_name: editMoName,
            mo_regno: editMoReg,
            mo_saho: editMoSaho
          });

          if (res && res.success) {
            // 3. 사후 동기화: nice_dogTab에 발급된 혈통서에도 부모견 영문명 + 견사호 확실히 저장
            if (action === 'approve' && (editFaName || editMoName || editFaSaho || editMoSaho)) {
              try {
                const safeFa = editFaName.replace(/'/g, "\\'");
                const safeMo = editMoName.replace(/'/g, "\\'");
                const safeFaSaho = editFaSaho.replace(/'/g, "\\'");
                const safeMoSaho = editMoSaho.replace(/'/g, "\\'");
                const targetRegNo = editRegNo.replace(/'/g, "\\'");
                await runSqlBatch([
                  `UPDATE nice_dogTab SET fa_name = '${safeFa}', mo_name = '${safeMo}', fa_saho = '${safeFaSaho}', mo_saho = '${safeMoSaho}' WHERE reg_no = '${targetRegNo}'`
                ]);
              } catch (postErr) {
                console.error('사후 nice_dogTab 부모견 동기화:', postErr);
              }
            }

            const isWarning = res.is_nice_success === false || (typeof res.message === 'string' && res.message.includes('⚠'));
            const popupTitle = isWarning
              ? (action === 'approve' ? '⚠️ 발급 완료 (나이스 통보 확인 필요)' : '⚠️ 반려 완료 (나이스 통보 확인 필요)')
              : (action === 'approve' ? '🎉 발급 승인 완료' : '❌ 반려 처리 완료');

            showAlert(popupTitle, res.message || `${actionText} 처리가 완료되었습니다.`);
            setActionMemo('');
            setSelectedPedigree(null); // 상세 보기 모달 창을 닫아 데이터 갱신을 즉시 체감할 수 있도록 함
            loadData();
          } else {
            showAlert('❌ [KKC 내부 DB 오류] 처리 실패', res?.error || '서버 오류가 발생했습니다.');
          }
        } catch (e) {
          console.error(e);
          showAlert('오류', '통신 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'P':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black">심사대기</span>;
      case 'R':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-black">환불요청</span>;
      case 'Y':
      case 'S':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black">발급완료</span>;
      case 'N':
      case 'F':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black">반려</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-xs font-black">{status || '심사대기'}</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 font-sans">
      {/* 서브 탭 전환기 */}
      <div className="flex border-b border-slate-200 bg-white px-8 py-3 gap-2 shadow-sm">
        <button
          onClick={() => {
            setActiveSubTab('requests');
            setStatusFilter('all');
          }}
          className={`px-5 py-2 text-sm font-black rounded-xl transition-all ${activeSubTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
        >
          📄 모바일 발급 심사 신청 목록
        </button>
        <button
          onClick={() => {
            setActiveSubTab('dogtab');
            setStatusFilter('Y');
          }}
          className={`px-5 py-2 text-sm font-black rounded-xl transition-all ${activeSubTab === 'dogtab'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
        >
          🐕 발급 완료 혈통서 관리 (nice_dogTab)
        </button>
      </div>
      {/* 1. 상단 타이틀 바 */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Award size={22} />
            </span>
            {activeSubTab === 'dogtab' ? 'NICE 모바일 발급 완료 혈통서 관리' : 'NICE 모바일 혈통서 심사관리'}
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
              NICE PetPin 연동 DB
            </span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            {activeSubTab === 'dogtab'
              ? '발급 완료(승인) 처리된 NICE 모바일 혈통서 목록 및 제출된 증빙 사진/상세 내역입니다.'
              : 'NICE 본인인증을 통과한 소유주가 PetPin 모바일 앱을 통해 신청한 모바일 혈통서 심사 목록입니다.'}
          </p>
        </div>

        {/* 통계 요약 */}
        <div className="flex gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-2.5 text-center min-w-[90px]">
            <div className="text-xs font-bold text-slate-400">대기 건수</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {pedigrees.filter(p => p.status === 'P').length}건
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-2.5 text-center min-w-[90px]">
            <div className="text-xs font-bold text-slate-400">전체 요청</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalCount}건</div>
          </div>
        </div>
      </div>

      {/* 안내 및 도움말 카드 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mx-8 mt-4 rounded-r-xl shadow-sm">
        <button
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="flex items-center justify-between w-full text-left font-bold text-blue-800 text-xs hover:text-blue-900 outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>NICE 모바일 혈통서 심사 처리 안내 {isHelpOpen ? '(접기)' : '(클릭하여 도움말 보기)'}</span>
          </div>
          <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-black">
            {isHelpOpen ? '닫기' : '열기'}
          </span>
        </button>

        {isHelpOpen && (
          <p className="text-xs text-blue-700 font-bold mt-2 leading-relaxed border-t border-blue-200/60 pt-2 transition-all">
            • <strong>심사 승인 (발급 완료)</strong>:<br />
            <span className="pl-4 block mt-1">• <strong>나이스핀(CI) 일치 시</strong>: 기존 협회 등록번호 끝에 -NP가 붙어 발급되며, 기존 정보에 8가지 신규 메타데이터(출산 수, 등록 수 등)가 함께 동기화됩니다.</span>
            <span className="pl-4 block mt-1">• <strong>나이스핀(CI) 불일치 (신규) 시</strong>: 펫핀 채번 규정(<code>[견종코드]-[기간코드_십][기간코드_일][4자리 순번]-NP</code>, 예: 2026년 진돗개 1번째 ➔ <code>KJ-C60000-NP</code>)에 따라 중복 없는 고유 번호가 자동 생성되어 발급됩니다.</span><br />
            • <strong>심사 반려</strong>: 사유(의견)를 필수로 입력해야 반려가 처리되며, 미입력 시 안내 메시지가 표시됩니다.<br />
            • <strong>오류 진단 안내</strong>: 승인/반려 시 모바일 앱(PetPin) 서버 통신이 실패하더라도 어드민 내부 데이터베이스(DB) 처리는 온전히 완료됩니다. 통신 실패나 DB 처리 오류 발생 시 팝업 창에 상세한 SQL 및 curl 원인 코드가 출력됩니다.
          </p>
        )}
      </div>

      {/* 2. 필터 컨트롤 바 */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-3 flex-1 min-w-[300px] max-w-[700px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border-2 border-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
          >
            <option value="all">모든 상태</option>
            <option value="P">심사대기 (신규 신청)</option>
            <option value="R">환불요청 (취소/환불)</option>
            <option value="Y">발급완료 (Approved)</option>
            <option value="N">반려됨 (Rejected)</option>
          </select>

          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as any)}
            className="bg-slate-50 border-2 border-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
          >
            <option value="all">전체 검색</option>
            <option value="reg_no">등록 번호</option>
            <option value="dog_name">견명 (공식명칭)</option>
            <option value="owner_name">신청자 실명</option>
            <option value="micro">마이크로칩 번호</option>
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="심사 정보 검색... (실시간 검색)"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none font-bold text-sm placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            동기화
          </button>
        </div>
      </div>

      {/* 3. 콘텐츠 레이아웃 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 리스트 테이블 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <RefreshCw className="animate-spin text-indigo-500" size={32} />
              <div className="font-bold">심사 데이터 조회 중...</div>
            </div>
          ) : pedigrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <FileText size={48} className="text-slate-300" />
              <div className="font-bold text-lg">해당 조건의 심사 신청 건이 존재하지 않습니다.</div>
            </div>
          ) : (
            <table className="w-full border-collapse text-left bg-white">
              <thead>
                <tr className="bg-slate-100/70 text-slate-500 border-b border-slate-200 text-xs font-black tracking-wider uppercase sticky top-0 z-10">
                  <th className="py-4 px-6">신청 일시</th>
                  <th className="py-4 px-6">등록 번호</th>
                  <th className="py-4 px-6">견명 (Dog Name)</th>
                  <th className="py-4 px-6">견종 / 성별</th>
                  <th className="py-4 px-6">마이크로칩 번호</th>
                  <th className="py-4 px-6">신청인 (실명)</th>
                  <th className="py-4 px-6">상태</th>
                  <th className="py-4 px-6 text-center">심사</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {pedigrees.map((p) => (
                  <tr
                    key={p.uid}
                    onClick={() => { setSelectedPedigree(p); setActionMemo(p.admin_memo || ''); }}
                    className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedPedigree?.uid === p.uid ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="py-4 px-6">
                      <div className="text-slate-400 font-medium text-xs">{p.registered_at}</div>
                      {p.order_no && (
                        <div className="text-[10px] font-mono text-indigo-500 font-bold tracking-tight truncate max-w-[140px]" title={`결제주문번호: ${p.order_no}`}>
                          주문: {p.order_no}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-900 font-extrabold">{p.reg_no}</td>
                    <td className="py-4 px-6 text-indigo-600 font-black tracking-tight">{p.dog_name}</td>
                    <td className="py-4 px-6 text-slate-800">
                      <div>{p.breed_name}</div>
                      <div className="text-[10px] text-slate-400">{p.gender === 'M' ? '수컷 (Male)' : '암컷 (Female)'}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{p.micro || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="text-slate-900 font-black">{p.owner_name}</div>
                      <div className="text-slate-400 text-[10px] font-bold">ID: {p.owner_id}</div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(p.status)}</td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => { setSelectedPedigree(p); setActionMemo(p.admin_memo || ''); }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all"
                          title="상세 보기 / 심사"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. 페이지네이션 */}
      <div className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="text-slate-400 text-xs font-bold">
          검색 결과: <span className="text-slate-700">{totalCount}</span>건 중 {totalCount > 0 ? (currentPage - 1) * 50 + 1 : 0}~{Math.min(currentPage * 50, totalCount)} 표시
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg font-bold text-xs transition-all"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-slate-700 font-bold text-xs">
            {currentPage} / {Math.ceil(totalCount / 50) || 1}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / 50), prev + 1))}
            disabled={currentPage >= Math.ceil(totalCount / 50) || isLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg font-bold text-xs transition-all"
          >
            다음
          </button>
        </div>
      </div>

      {/* 5. 상세 심사 모달 다이얼로그 */}
      {selectedPedigree && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-200 relative">

            {/* 🚀 실시간 나이스 서버 통신 중 밝고 투명한 맞춤형 로딩 오버레이 */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-150">
                <div className="bg-white/95 border-2 border-indigo-100 p-7 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center space-y-3.5">
                  <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <Loader2 className="w-7 h-7 text-indigo-600 animate-spin absolute" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800">
                      {selectedPedigree.status === 'R'
                        ? (currentAction === 'reject' ? 'NICE 환불 승인(반려) 처리 중...' : 'NICE 환불 거절(정상발급) 처리 중...')
                        : (currentAction === 'approve' ? 'NICE 발급 승인 통보 중...' : 'NICE 심사 반려 통보 중...')}
                    </h4>
                    <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                      {selectedPedigree.status === 'R'
                        ? (currentAction === 'reject'
                          ? '나이스 금융 전산망에 반려 및 자동 결제 취소(환불) 데이터를 전송하고 있습니다.'
                          : '환불을 거절하고 고유 혈통서 번호(-NP)를 부여하여 정상 발급 승인 중입니다.')
                        : (currentAction === 'approve'
                          ? '고유 혈통서 번호(-NP)를 부여하고 나이스 전산망에 발급 승인 데이터를 전송 중입니다.'
                          : '심사 반려 사유와 함께 나이스 전산망에 반려 통보 데이터를 전송하고 있습니다.')}
                    </p>
                  </div>
                  <div className="px-3.5 py-1.5 bg-indigo-50/80 rounded-lg border border-indigo-100 text-[11px] text-indigo-700 font-black flex items-center gap-1.5">
                    <RefreshCw size={12} className="animate-spin text-indigo-500" />
                    네트워크 통신 중 (잠시만 기다려 주세요)
                  </div>
                </div>
              </div>
            )}

            {/* 헤더 */}
            <div className="bg-indigo-900 text-white px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={24} className="text-indigo-300 shrink-0" />
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <span>{selectedPedigree.dog_name}</span>
                    {selectedPedigree.order_no && (
                      <span className="text-[11px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-mono font-normal">
                        주문: {selectedPedigree.order_no}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium flex items-center gap-2">
                    <span>모바일 혈통서 심사 신청서 상세 (UID: {selectedPedigree.uid})</span>
                    {selectedPedigree.registered_at && (
                      <span className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-[11px]">
                        신청일시: {selectedPedigree.registered_at}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPedigree(null)}
                className="text-indigo-200 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* 본문 (스크롤 영역) */}
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-8">
              {/* 왼쪽: 기본 및 매핑 정보 */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h4 className="text-sm font-black text-slate-800">개체 기본 정보</h4>
                    <button
                      type="button"
                      onClick={handleAutoAssignRegNo}
                      disabled={isAssigningRegNo}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                      title="선택한 견종 기반 5000번대 모바일 등록번호 자동 생성"
                    >
                      <Sparkles size={13} className={isAssigningRegNo ? 'animate-spin' : ''} />
                      등록번호 자동 부여
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 신청일시 & 결제주문번호 통합 상단 카드 */}
                    <div className="col-span-2 grid grid-cols-2 gap-3 bg-indigo-50/90 border border-indigo-200 p-3.5 rounded-xl">
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={12} className="text-indigo-600" />
                          신청 일시 (Application Date)
                        </span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5">
                          {selectedPedigree.registered_at || '-'}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center border-l border-indigo-200 pl-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">
                            NICE 결제주문번호
                          </span>
                          {selectedPedigree.order_no && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedPedigree.order_no || '');
                                alert('결제주문번호가 복사되었습니다:\n' + selectedPedigree.order_no);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                            >
                              복사
                            </button>
                          )}
                        </div>
                        <span className="text-xs font-mono font-black text-indigo-700 select-all truncate mt-0.5" title={selectedPedigree.order_no || ''}>
                          {selectedPedigree.order_no || '미발급 / 없음'}
                        </span>
                      </div>
                    </div>

                    {/* 등록번호 (수정 & 중복 조회) */}
                    <div className="col-span-2 flex flex-col bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-black text-slate-500 mb-1 flex items-center justify-between">
                        <span>등록 번호 (수정 및 중복 검사)</span>
                        <span className="text-[10px] text-indigo-600 font-bold">NICE 5000번대 규격</span>
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editRegNo}
                          onChange={(e) => setEditRegNo(e.target.value)}
                          placeholder="등록번호 입력 또는 자동 부여 버튼 클릭"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleCheckRegNo}
                          disabled={isCheckingRegNo}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Search size={13} className={isCheckingRegNo ? 'animate-spin' : ''} />
                          조회
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">견명 (Dog Name)</span>
                      <input
                        type="text"
                        value={editDogName}
                        onChange={(e) => setEditDogName(e.target.value)}
                        placeholder="견명 입력..."
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">성별 (Sex)</span>
                      <select
                        value={editSex}
                        onChange={(e) => setEditSex(e.target.value as 'M' | 'F')}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="M">수컷 (Male - M)</option>
                        <option value="F">암컷 (Female - F)</option>
                      </select>
                    </div>

                    <div className="col-span-2 flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">마이크로칩 번호 (Microchip)</span>
                      <input
                        type="text"
                        value={editMicro}
                        onChange={(e) => setEditMicro(e.target.value)}
                        placeholder="15자리 마이크로칩 번호 입력..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* 견종 그룹 선택 */}
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-400 mb-1">견종 그룹 (선택)</span>
                      <select
                        value={selectedGroup}
                        onChange={(e) => {
                          setSelectedGroup(e.target.value);
                          setEditBreed('');
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">전체 그룹</option>
                        {breedGroups.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* 견종 선택 */}
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-400 mb-1">견종 (선택/지정)</span>
                      <select
                        value={editBreed}
                        onChange={(e) => setEditBreed(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-700 font-black focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">견종 선택...</option>
                        {availableBreeds.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
                      <div className="flex flex-col mb-2">
                        <span className="text-xs font-black text-indigo-950 mb-1">모색 (hairTab 모색 DB 및 검색/선택 - 발급 및 NICE 통보 시 반영)</span>
                        <SearchableColorSelect
                          value={editHair}
                          onChange={(val) => setEditHair(val)}
                          options={allColorOptions}
                          placeholder="모색 검색 또는 드롭다운 선택 (예: 백색, 황색, Black & Tan)..."
                        />
                      </div>

                      {breedColors.length > 0 ? (
                        <div className="pt-2 border-t border-indigo-200/80">
                          <span className="font-black text-indigo-900 text-xs block mb-1.5">
                            {selectedPedigree.breed_name} 공식 추천 모색 (클릭 시 즉시 반영):
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {breedColors.map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setEditHair(c.color_name)}
                                className="px-2 py-1 bg-white hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-200 rounded-md text-[11px] font-bold text-indigo-700 shadow-2xs cursor-pointer active:scale-95"
                              >
                                {c.color_name} <span className="opacity-70 text-[10px]">({c.color_cd})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1 italic">• 위 드롭다운에서 hairTab DB의 모색을 검색/선택하거나 직접 작성 후 승인하시면 됩니다.</p>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">생년월일 (Birth Date)</span>
                      <input
                        type="text"
                        value={editBirth}
                        onChange={(e) => setEditBirth(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">등록일 (발급일)</span>
                      <input
                        type="text"
                        value={editRegDate}
                        onChange={(e) => setEditRegDate(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">출산 수 (남 M : 여 F)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={editBirthM}
                          onChange={(e) => setEditBirthM(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0"
                        />
                        <span className="text-xs text-slate-400 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          value={editBirthF}
                          onChange={(e) => setEditBirthF(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">등록 수 (남 M : 여 F)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={editRegCountM}
                          onChange={(e) => setEditRegCountM(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0"
                        />
                        <span className="text-xs text-slate-400 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          value={editRegCountF}
                          onChange={(e) => setEditRegCountF(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">견사호 (영문)</span>
                      <input
                        type="text"
                        value={editSahoEng}
                        onChange={(e) => setEditSahoEng(e.target.value)}
                        placeholder="영문 견사호..."
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">견사호 (국문)</span>
                      <input
                        type="text"
                        value={editSaho}
                        onChange={(e) => setEditSaho(e.target.value)}
                        placeholder="국문 견사호..."
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span>👨‍👩‍👧 부모견 정보</span>
                      <span className="text-[11px] font-bold text-slate-400">(-NP 자동제거 매칭)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleLookupTree()}
                      disabled={isLoadingTree}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      {isLoadingTree ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>조회 중...</span>
                        </>
                      ) : (
                        <>
                          <span>🔍 3대 족보 불러오기</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 안내 문구 */}
                  <p className="text-xs font-black text-orange-600 mb-3 leading-relaxed">
                    💡 부모견 등록번호 입력 후 <strong>[🔍 3대 족보 불러오기]</strong>를 누르면 협회 DB 및 나이스 원부에서 3대 가계도(14마리 계보)를 즉시 자동 완성합니다.
                  </p>

                  {/* 부견 영역 */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4">
                    <div className="text-xs font-black text-indigo-700 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>부견 (SIRE / FATHER)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 mb-1">부견 등록번호</label>
                        <input
                          type="text"
                          value={editFaReg}
                          onChange={(e) => setEditFaReg(e.target.value)}
                          placeholder="부견 등록번호 (예: BF-C64001 또는 BF-C64001-NP)..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 mb-1">부견 영문/한글 이름</label>
                        <input
                          type="text"
                          value={editFaName}
                          onChange={(e) => setEditFaName(e.target.value)}
                          placeholder="부견 정식 이름 입력..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 mb-1">부견 견사호 (FATHER SAHO)</label>
                        <input
                          type="text"
                          value={editFaSaho}
                          onChange={(e) => setEditFaSaho(e.target.value)}
                          placeholder="부견 견사호 입력..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 모견 영역 */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xs font-black text-pink-700 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-600"></span>
                      <span>모견 (DAM / MOTHER)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 mb-1">모견 등록번호</label>
                        <input
                          type="text"
                          value={editMoReg}
                          onChange={(e) => setEditMoReg(e.target.value)}
                          placeholder="모견 등록번호 (예: BF-C64002 또는 BF-C64002-NP)..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 mb-1">모견 영문/한글 이름</label>
                        <input
                          type="text"
                          value={editMoName}
                          onChange={(e) => setEditMoName(e.target.value)}
                          placeholder="모견 정식 이름 입력..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 mb-1">모견 견사호 (MOTHER SAHO)</label>
                        <input
                          type="text"
                          value={editMoSaho}
                          onChange={(e) => setEditMoSaho(e.target.value)}
                          placeholder="모견 견사호 입력..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span>🌳 조상견 계보 (2·3대 가계도 {treeAncestors.length > 0 ? `총 ${treeAncestors.length}마리` : ''})</span>
                    </h4>
                    {treeAncestors.length > 0 && (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ 가계도 매칭 완료
                      </span>
                    )}
                  </div>

                  {treeAncestors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {treeAncestors.map((anc, idx) => {
                        const typeLabels: Record<string, string> = {
                          fatherFather: '친할아버지 (부의 부)',
                          fatherMother: '친할머니 (부의 모)',
                          motherFather: '외할아버지 (모의 부)',
                          motherMother: '외할머니 (모의 모)',
                          fatherFatherFather: '증조부 (부-부-부)',
                          fatherFatherMother: '증조모 (부-부-모)',
                          fatherMotherFather: '외증조부 (부-모-부)',
                          fatherMotherMother: '외증조모 (부-모-모)',
                          motherFatherFather: '외증조부 (모-부-부)',
                          motherFatherMother: '외증조모 (모-부-모)',
                          motherMotherFather: '외외증조부 (모-모-부)',
                          motherMotherMother: '외외증조모 (모-모-모)',
                        };
                        const label = typeLabels[anc.type] || anc.type || '조상견';
                        const isFatherLine = anc.type.startsWith('father');

                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                              isFatherLine
                                ? 'bg-indigo-50/60 border-indigo-200'
                                : 'bg-pink-50/60 border-pink-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-black text-[11px] px-1.5 py-0.5 rounded ${
                                isFatherLine ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'
                              }`}>
                                {label}
                              </span>
                              {anc.reg_no && (
                                <span className="font-mono text-[10px] text-slate-500 font-bold">
                                  {anc.reg_no}
                                </span>
                              )}
                            </div>
                            <div className="font-extrabold text-slate-800 text-xs truncate">
                              {anc.name || '(이름 미등록)'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-bold truncate">
                              견사호: {anc.saho || '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                      <div className="text-2xl mb-1.5">🌳</div>
                      <p className="text-xs font-black text-slate-600 mb-1">
                        조상견 가계도가 아직 로드되지 않았습니다.
                      </p>
                      <p className="text-[11px] font-bold text-slate-400">
                        위 부모견 번호 확인 후 <strong>[🔍 3대 족보 불러오기]</strong> 버튼을 누르면 가계도가 자동으로 채워집니다.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3">번식자 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">번식자 이름</span>
                      <input
                        type="text"
                        value={editBreederName}
                        onChange={(e) => setEditBreederName(e.target.value)}
                        placeholder="번식자 이름 입력..."
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>{/* 2열 격자 맞춤용 */}</div>
                    <div className="col-span-2 flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">번식자 주소</span>
                      <input
                        type="text"
                        value={editBreederAddr}
                        onChange={(e) => setEditBreederAddr(e.target.value)}
                        placeholder="번식자 전체 주소 입력..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h4 className="text-sm font-black text-slate-800 font-sans">소유자 및 신청인 정보</h4>
                    {(selectedPedigree.poss_ci || selectedPedigree.owner_name || selectedPedigree.poss_name) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onGoToMember) {
                            // 🚀 [1순위: 본인인증 고유 CI, 2순위: 신청인 무명/소유자명]
                            const searchTarget = selectedPedigree.poss_ci || selectedPedigree.owner_name || selectedPedigree.poss_name || '';
                            if (searchTarget) {
                              onGoToMember(searchTarget);
                              setSelectedPedigree(null);
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
                      >
                        <Search size={13} />
                        회원 조회 ➔
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="신청인 (앱 닉네임)" value={selectedPedigree.owner_name || selectedPedigree.poss_name || '-'} />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">소유자 실명 (수정 가능)</span>
                      <input
                        type="text"
                        value={editPossName}
                        onChange={(e) => setEditPossName(e.target.value)}
                        placeholder="소유자 실명 입력..."
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <DetailItem 
                      label="신청자 연락처 (휴대폰)" 
                      value={selectedPedigree.req_mobile ? (selectedPedigree.req_mobile.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')) : '-'} 
                    />
                    <div>{/* 2열 격자 맞춤용 */}</div>

                    <div className="col-span-2 flex flex-col">
                      <span className="text-xs font-black text-slate-500 mb-1">소유자 주소</span>
                      <input
                        type="text"
                        value={editPossAddr}
                        onChange={(e) => setEditPossAddr(e.target.value)}
                        placeholder="소유자 전체 주소 입력..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="col-span-2 flex flex-col">
                      <span className="text-xs font-black text-slate-400">소유자 CI (클릭 시 회원조회)</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onGoToMember) {
                            // 🚀 [1순위: 본인인증 고유 CI, 2순위: 신청인 무명/소유자명]
                            const target = selectedPedigree.poss_ci || selectedPedigree.owner_name || selectedPedigree.poss_name;
                            if (target) {
                              onGoToMember(target);
                              setSelectedPedigree(null);
                            }
                          }
                        }}
                        className="text-xs font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-left mt-1 bg-indigo-50/50 p-2 rounded border border-indigo-100 break-all w-full cursor-pointer transition-colors"
                      >
                        {maskCi(selectedPedigree.poss_ci)} ➔
                      </button>
                    </div>
                  </div>
                </div>

          {/* 심사 / 환불 액션 폼 */}
          {(selectedPedigree.status === 'P' || selectedPedigree.status === 'R') ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <h5 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Edit size={16} className={selectedPedigree.status === 'R' ? "text-purple-600" : "text-indigo-600"} />
                {selectedPedigree.status === 'R' ? '환불 처리 의견 기술' : '심사 의견 기술'}
              </h5>
              <textarea
                value={actionMemo}
                onChange={(e) => setActionMemo(e.target.value)}
                placeholder={selectedPedigree.status === 'R' ? "환불 승인(반려) 또는 환불 거절(정상발급) 사유를 입력하세요..." : "승인 또는 반려 사유를 입력하세요... (반려 시 필수)"}
                className="w-full h-24 p-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-sm font-bold outline-none resize-none transition-all"
              />

              {selectedPedigree.status === 'R' ? (
                /* 🟣 환불 요청 모드 전용 버튼 */
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5 transition-all"
                    title="나이스에 반려(F)를 전송하여 환불 처리를 완료합니다"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                    {isSubmitting ? '환불 통보 중...' : '환불 승인 (반려 확정)'}
                  </button>
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5 transition-all"
                    title="환불을 거절하고 혈통서 번호(-NP)를 부여하여 정상 발급합니다"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {isSubmitting ? '발급 처리 중...' : '환불 거절 (정상 발급)'}
                  </button>
                </div>
              ) : (
                /* 🟡 일반 심사 대기 모드 전용 버튼 */
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {isSubmitting ? '나이스 통보 중...' : '발급 승인'}
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                    {isSubmitting ? '반려 통보 중...' : '심사 반려'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
              <h5 className="text-sm font-black text-slate-400">심사 이력</h5>
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">처리 결과</span>
                  <span>{getStatusBadge(selectedPedigree.status)}</span>
                </div>
                <div className="text-xs">
                  <div className="text-slate-400 font-bold mb-1">관리자 메모</div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 font-bold text-slate-700">
                    {selectedPedigree.admin_memo || '남겨진 메모가 없습니다.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

              {/* 오른쪽: 제출된 이미지/문서 문서고 */}
      <div className="flex flex-col">
        <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3">
          제출된 증빙 문서 / 사진
        </h4>

        <div className="flex-1 grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
          <ImageDocCard label="문서 1 (혈통서 원본)" path={selectedPedigree.image1_path} />
          <ImageDocCard label="문서 2 (개체 전면)" path={selectedPedigree.image2_path} />
          <ImageDocCard label="문서 3 (개체 측면)" path={selectedPedigree.image3_path} />
          <ImageDocCard label="문서 4 (기타 증명)" path={selectedPedigree.image4_path} />
        </div>
      </div>
    </div>
          </div >
        </div >
      )}
    </div >
  );
};

const DetailItem: React.FC<{ label: string; value: string; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? "col-span-2" : ""}>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</div>
    <div className="text-sm font-extrabold text-slate-800 mt-0.5 break-all whitespace-pre-wrap">{value}</div>
  </div>
);

const ImageDocCard: React.FC<{ label: string; path?: string }> = ({ label, path }) => {
  const fullUrl = path
    ? (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')
      ? path
      : `https://kkc3349.mycafe24.com${path.startsWith('/') ? '' : '/'}${path}`)
    : undefined;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-48 shadow-sm">
      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[10px] font-black text-slate-500 truncate">
        {label}
      </div>
      <div className="flex-1 flex items-center justify-center p-2">
        {fullUrl ? (
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
            <img src={fullUrl} alt={label} className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity rounded-lg">
              새창에서 보기
            </div>
          </a>
        ) : (
          <div className="text-center text-slate-300">
            <ImageIcon size={32} className="mx-auto mb-1 opacity-60" />
            <span className="text-[10px] font-bold">미첨부</span>
          </div>
        )}
      </div>
    </div>
  );
};
