
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
import { Pedigree, Evaluation } from '../types';
import { fetchDogsByRegNos, createRecord } from '../services/memberService';
import { fetchPedigrees, updatePedigree } from '../services/pedigreeService'; // 👈 분리된 서비스 참조

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
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [filters, setFilters] = useState({ field: 'all', query: '' });

  const addCheckpoint = (targetId: string, data: any, label: string) => {
    const newCp: Checkpoint = { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toLocaleTimeString(), data: JSON.parse(JSON.stringify(data)), label, targetId };
    setCheckpoints(prev => [...prev, newCp]);
  };

  const loadData = async (page: number = 1, q: string = '', f: string = 'all') => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const res = await fetchPedigrees(tableName, page, q, f);
      setPedigrees(res.data);
      setTotalPedigrees(res.total);
    } catch (error: any) {
      showAlert('로드 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(1); }, [tableName]);

  const handleSavePedigree = async (p: Pedigree) => {
    setIsLoading(true);
    try {
      const res = await updatePedigree(tableName, p);
      if (res.success) {
        setPedigrees(prev => prev.map(item => item.id === p.id ? { ...item, ...p } : item));
        if (selectedPedigree?.id === p.id) setSelectedPedigree({ ...p });
        showAlert('저장 성공', '혈통서 정보가 수정되었습니다.');
        setEditingPedigree(null);
        loadData(currentPage, filters.query, filters.field);
      }
    } catch (e: any) { showAlert('저장 실패', e.message); }
    finally { setIsLoading(false); }
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
        loadData(currentPage, filters.query, filters.field);
      }
    } catch (e: any) { showAlert("저장 실패", e.message); }
    finally { setIsLoading(false); }
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
        />
      ) : (
        <PedigreeTable
          data={pedigrees}
          totalCount={totalPedigrees}
          currentPage={currentPage}
          isLoading={isLoading}
          onSearch={(f, q) => { setFilters({ field: f, query: q }); loadData(1, q, f); }}
          onPageChange={(p) => loadData(p, filters.query, filters.field)}
          onRowClick={(p) => {
            const existing = checkpoints.find(cp => cp.targetId === p.id);
            if (!existing) addCheckpoint(p.id, p, 'Initial Load');
            setSelectedPedigree({ ...p });
          }}
        />
      )}

      {selectedPedigree && (
        <PedigreeDetailModal
          pedigree={selectedPedigree}
          onClose={() => setSelectedPedigree(null)}
          onEdit={(p) => { setSelectedPedigree(null); setEditingPedigree(p); }}
          onOpenDongtaeForm={(no) => { setTargetDongtaeNo(no); setDongtaeNoFormOpen(true); }}
          onEditOwner={(ownerId) => onGoToMember(ownerId)}
          onEditEvaluation={setEditingEvaluation}
          onManagePoints={onGoToPoints}
          tableName={tableName}
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
          onSave={() => { setDongtaeNoFormOpen(false); showAlert('저장 성공', '동태 정보가 저장되었습니다.'); }}
          onCancel={() => setDongtaeNoFormOpen(false)}
        />
      )}
    </div>
  );
};
