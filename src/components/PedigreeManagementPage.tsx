
/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { PedigreeTable } from './PedigreeTable';
import { PedigreeDetailModal } from './PedigreeDetailModal';
import { PedigreeEditForm } from './PedigreeEditForm';
import { DongtaeEditForm } from './DongtaeEditForm';
import { EvaluationModal } from './EvaluationPage';
import { PedigreeRegistrationStart } from './PedigreeRegistrationStart';
import { PedigreeRegistrationForm } from './PedigreeRegistrationForm';
import { Pedigree, Evaluation } from '../types';
import { fetchDogsByRegNos, createRecord } from '../services/memberService';
import { fetchPedigrees, updatePedigree, createPedigree, fetchDogClasses, deletePedigree } from '../services/pedigreeService'; 
import { generateDongtaeNo, saveDongtaeInfo } from '../services/dongtaeService'; // 👈 동태 서비스 추가

interface Checkpoint { id: string; timestamp: string; data: any; label: string; targetId: string; }

interface PedigreeManagementPageProps {
  tableName: string;
  memberTableName: string;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToPoints: (regNo: string) => void;
  onGoToPrizes: () => void;
  onGoToMember: (loginId: string) => void;
}

export const PedigreeManagementPage: React.FC<PedigreeManagementPageProps> = ({
  tableName, memberTableName, showAlert, showConfirm, onGoToPoints, onGoToPrizes, onGoToMember
}) => {
  const [pedigrees, setPedigrees] = useState<Pedigree[]>([]);
  const [totalPedigrees, setTotalPedigrees] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPedigree, setSelectedPedigree] = useState<Pedigree | null>(null);
  const [editingPedigree, setEditingPedigree] = useState<Pedigree | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [dongtaeNoFormOpen, setDongtaeNoFormOpen] = useState(false);
  const [targetDongtaeNo, setTargetDongtaeNo] = useState<string | null>(null);
  const [targetDogId, setTargetDogId] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [filters, setFilters] = useState({ field: 'all', query: '', rank: 'all' });
  const [isRegistrationMode, setIsRegistrationMode] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [regInitialData, setRegInitialData] = useState<any>(null);
  const [dogClasses, setDogClasses] = useState<any[]>([]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchDogClasses();
        setDogClasses(data);
      } catch (e) {
        console.error("Failed to fetch dog classes:", e);
      }
    };
    loadClasses();
  }, []);

  const addCheckpoint = (targetId: string, data: any, label: string) => {
    const newCp: Checkpoint = { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toLocaleTimeString(), data: JSON.parse(JSON.stringify(data)), label, targetId };
    setCheckpoints(prev => [...prev, newCp]);
  };

  const loadData = async (page: number = 1, q: string = '', f: string = 'all', r: string = 'all') => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const res = await fetchPedigrees(tableName, page, q, f, r);
      setPedigrees(res.data);
      setTotalPedigrees(res.total);
    } catch (error: any) {
      showAlert('로드 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(1, filters.query, filters.field, filters.rank); }, [tableName]);

  const handleSavePedigree = async (p: Pedigree) => {
    setIsLoading(true);
    try {
      const res = await updatePedigree(tableName, p);
      if (res.success) {
        setPedigrees(prev => prev.map(item => item.id === p.id ? { ...item, ...p } : item));
        if (selectedPedigree?.id === p.id) setSelectedPedigree({ ...p });
        showAlert('저장 성공', '혈통서 정보가 수정되었습니다.');
        setEditingPedigree(null);
        loadData(currentPage, filters.query, filters.field, filters.rank);
      }
    } catch (e: any) { showAlert('저장 실패', e.message); }
    finally { setIsLoading(false); }
  };

  const handleDeletePedigree = async (id: string) => {
    showConfirm(
      '혈통서 삭제',
      '정말로 이 혈통서 데이터를 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.',
      async () => {
        setIsLoading(true);
        try {
          const res = await deletePedigree(tableName, id);
          if (res.success) {
            showAlert('삭제 성공', '혈통서 정보가 삭제되었습니다.');
            setSelectedPedigree(null);
            loadData(currentPage, filters.query, filters.field, filters.rank);
          }
        } catch (e: any) {
          showAlert('삭제 실패', e.message);
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  // ... (다른 핸들러 로직 동일)

  const handleSaveEvaluationDirect = async (updated: Evaluation) => {
    setIsLoading(true);
    try {
      const dbMappedData: any = {
        reg_no: updated.regNo, dog_name: updated.name, dog_class: updated.breed,
        referee: updated.judge, start_date: updated.startDate, end_date: updated.endDate, comment: updated.memo
      };
      let res;
      if (updated.id) {
        dbMappedData.uid = updated.id;
        res = await updatePedigree('breed_dogTab', dbMappedData);
      } else {
        dbMappedData.signdate = Math.floor(Date.now() / 1000);
        res = await createRecord('breed_dogTab', dbMappedData);
      }
      if (res.success && updated.regNo) {
        const dogs = await fetchDogsByRegNos([updated.regNo], 'dogTab');
        const dog = Object.values(dogs)[0];
        if (dog && (dog as any).uid) {
          await updatePedigree('dogTab', { uid: (dog as any).uid, okDate: updated.startDate } as any);
        }
      }
      if (res.success) {
        setEditingEvaluation(null);
        showAlert('저장 성공', '종견 인정 평가 내역이 성공적으로 반영되었습니다.');
        if (selectedPedigree) setSelectedPedigree({ ...selectedPedigree, okStat: 'Y', okDate: updated.startDate });
        loadData(currentPage, filters.query, filters.field, filters.rank);
      }
    } catch (e: any) { showAlert("저장 실패", e.message); }
    finally { setIsLoading(false); }
  };

  const handleSaveRegistration = async (data: { commonData: any, dogsData: any[] }) => {
    setIsLoading(true);
    try {
      const { commonData, dogsData } = data;
      
      // 1️⃣ [수정] 자견(D) 등록일 경우에만 동태 번호 자동 생성
      const isLitter = regInitialData.selectedType === 'D';
      const newDongtaeNo = isLitter ? await generateDongtaeNo() : '';
      
      const registeredRegNos: string[] = [];
      const mCount = dogsData.filter(d => (d.gender || 'M').toUpperCase() === 'M').length;
      const fCount = dogsData.filter(d => (d.gender || 'M').toUpperCase() === 'F').length;

      // 2️⃣ 개별 애견 정보 등록
      for (const dog of dogsData) {
        const registrationData = {
          regType: regInitialData.selectedType || '',
          regNo: dog.regNo || '',
          name: dog.name || '',
          fullName: dog.fullName || '',
          group: commonData.group || '',
          breed: commonData.breed || '',
          kennel: commonData.kennel || '',
          kennelNameEng: commonData.kennelEng || '',
          
          ownerId: commonData.ownerId || '',
          owner: commonData.owner || '',
          ownerPhone: commonData.ownerPhone || '',
          ownerAddr: commonData.ownerAddr || '',
          ownerEng: commonData.ownerEng || '',
          
          breeder: commonData.breeder || '',
          breederPhone: commonData.breederPhone || '',
          breederAddr: commonData.breederAddr || '',
          
          gender: dog.gender || 'M',
          color: dog.color || '',
          coatType: dog.coatType || '',
          birthDate: commonData.birthDate || '0000-00-00',
          damRegNo: commonData.damUid || '0', 
          sireRegNo: commonData.sireUid || '0',
          registrationDate: commonData.registrationDate || new Date().toISOString().split('T')[0],
          dongtaeNo: newDongtaeNo, // 👈 자견일 때만 번호가 들어가고, 아니면 빈 문자열
          
          microchip: dog.microchip || '',
          otherOrg: dog.otherOrg || '',
          foreignNo: dog.foreignNo || '',
          foreignNo2: dog.foreignNo2 || '',
          hairIndex: dog.hairIndex || '',
          hipBone: dog.hipBone || '',
          dnaTest: dog.dnaTest || '',
          training: dog.training || '',
          highestAward: dog.highestAward || '',
          inbreeding: dog.inbreeding || '',
          breedApproval: dog.breedApproval || '',
          highestAward2: dog.highestAward2 || '',
          memo: dog.memo || '',
        };
        
        const res = await createPedigree(tableName, registrationData);
        if (!res.success) {
          throw new Error(`${dog.regNo} 등록 중 오류 발생: ${res.message}`);
        }
        if (dog.regNo) registeredRegNos.push(dog.regNo);
      }

      // 3️⃣ [수정] 동태 정보 테이블(dongtaeTab) 저장은 자견 등록일 때만 수행
      if (isLitter && newDongtaeNo) {
        const sortedRegNos = [...registeredRegNos].sort();
        const r_start = sortedRegNos.length > 0 ? sortedRegNos[0] : '';
        const r_end = sortedRegNos.length > 1 ? sortedRegNos[sortedRegNos.length - 1] : '';

        const dongtaeData: any = {
          dongtae_no: newDongtaeNo,
          birth_M: String(mCount),
          birth_F: String(fCount),
          reg_count_M: String(mCount),
          reg_count_F: String(fCount),
          regno_start: r_start,
          regno_end: r_end,
          fa_reg_no: commonData.sireUid || '0',
          mo_reg_no: commonData.damUid || '0',
          breeder: commonData.breeder || '',
          reg_date: commonData.registrationDate || new Date().toISOString().split('T')[0],
          sign_date: commonData.registrationDate || new Date().toISOString().split('T')[0]
        };

        // 동태 이름(형제들) 매핑 (최대 14마리)
        dogsData.forEach((dog, idx) => {
          if (idx < 14) {
            const key = idx === 0 ? 'dongtae_name' : `dongtae_name${idx + 1}`;
            dongtaeData[key] = dog.name;
          }
        });

        await saveDongtaeInfo(dongtaeData);
        showAlert('등록 성공', `${dogsData.length}마리의 혈통서가 등록되었으며, 동태 정보(${newDongtaeNo})가 자동 생성되었습니다.`);
      } else {
        showAlert('등록 성공', `${dogsData.length}마리의 혈통서가 등록되었습니다.`);
      }
      
      setIsRegistrationMode(false);
      setRegistrationStep(1);
      loadData(1);
    } catch (e: any) {
      showAlert('등록 실패', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOtherDog = async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await fetchPedigrees(tableName, 1, uid, 'uid');
      if (res.data && res.data.length > 0) { setEditingPedigree(res.data[0]); }
      else { showAlert('조회 실패', '해당 UID의 애견 정보를 찾을 수 없습니다.'); }
    } catch (e: any) { showAlert('오류', e.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="h-full relative overflow-hidden">
      {editingPedigree ? (
        <PedigreeEditForm
          pedigree={editingPedigree}
          onSave={handleSavePedigree}
          onCancel={() => setEditingPedigree(null)}
          onGoToPoints={() => onGoToPoints(editingPedigree.regNo)}
          onGoToPrizes={onGoToPrizes}
          onOpenDongtaeForm={(no) => { setTargetDongtaeNo(no); setDongtaeNoFormOpen(true); }}
          onEditOtherDog={handleEditOtherDog}
          tableName={tableName}
          memberTableName={memberTableName}
          checkpoints={checkpoints.filter(cp => cp.targetId === editingPedigree.id)}
          onRestore={(cp) => {
            showConfirm('데이터 복구', `'${cp.label} (${cp.timestamp})' 시점으로 되돌리시겠습니까?`, () => {
              setEditingPedigree({ ...cp.data });
            });
          }}
          dogClasses={dogClasses}
        />
      ) : isRegistrationMode ? (
        registrationStep === 1 ? (
          <PedigreeRegistrationStart 
            onNext={(data) => {
              setRegInitialData(data);
              setRegistrationStep(2);
            }}
            onCancel={() => setIsRegistrationMode(false)}
          />
        ) : (
          <PedigreeRegistrationForm 
            initialData={regInitialData}
            onSave={handleSaveRegistration}
            onCancel={() => setRegistrationStep(1)}
          />
        )
      ) : (
        <PedigreeTable
          data={pedigrees}
          totalCount={totalPedigrees}
          currentPage={currentPage}
          isLoading={isLoading}
          onSearch={(f, q, r) => { setFilters({ field: f, query: q, rank: r }); loadData(1, q, f, r); }}
          onPageChange={(p) => loadData(p, filters.query, filters.field, filters.rank)}
          onRowClick={(p) => {
            const existing = checkpoints.find(cp => cp.targetId === p.id);
            if (!existing) addCheckpoint(p.id, p, 'Initial Load');
            setSelectedPedigree({ ...p });
          }}
          onNewRegistration={() => setIsRegistrationMode(true)}
          dogClasses={dogClasses}
        />
      )}

      {selectedPedigree && (
        <PedigreeDetailModal
          pedigree={selectedPedigree}
          onClose={() => setSelectedPedigree(null)}
          onEdit={(p) => { setSelectedPedigree(null); setEditingPedigree(p); }}
          onOpenDongtaeForm={(no, dogId) => { setTargetDongtaeNo(no); setTargetDogId(dogId || null); setDongtaeNoFormOpen(true); }}
          onEditOwner={(ownerId) => onGoToMember(ownerId)}
          onEditEvaluation={setEditingEvaluation}
          onManagePoints={onGoToPoints}
          onDelete={handleDeletePedigree}
          onViewPedigreeByUid={async (uid) => {
            setIsLoading(true);
            try {
              const res = await fetchPedigrees(tableName, 1, uid, 'uid');
              if (res.data && res.data.length > 0) { 
                  setSelectedPedigree(res.data[0]); 
              } else { 
                  showAlert('조회 실패', '해당 UID의 애견 정보를 찾을 수 없습니다.'); 
              }
            } catch (e: any) { 
              showAlert('오류', e.message); 
            } finally { 
              setIsLoading(false); 
            }
          }}
          tableName={tableName}
          dogClasses={dogClasses}
        />
      )}

      {editingEvaluation && (
        <EvaluationModal
          mode={editingEvaluation.id ? "edit" : "add"}
          initialData={editingEvaluation}
          onClose={() => setEditingEvaluation(null)}
          onSave={handleSaveEvaluationDirect}
        />
      )}

      {dongtaeNoFormOpen && (
        <DongtaeEditForm
          initialDongtaeNo={targetDongtaeNo}
          linkedDogId={targetDogId} 
          onSave={() => { setDongtaeNoFormOpen(false); setTargetDogId(null); showAlert('처리 완료', '동태 정보가 업데이트되었습니다.'); loadData(currentPage, filters.query, filters.field); }}
          onCancel={() => { setDongtaeNoFormOpen(false); setTargetDogId(null); }}
        />
      )}
    </div>
  );
};
