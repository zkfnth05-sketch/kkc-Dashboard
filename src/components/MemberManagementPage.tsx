/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { MemberTable } from './MemberTable';
import { MemberDetail } from './MemberDetail';
import { MemberEditForm } from './MemberEditForm';
import { Member } from '../types';
import { fetchMembers, updateMember, fetchMemberStats, createMember, deleteMember, bulkUpdateProClass } from '../services/memberService';

interface MemberManagementPageProps {
  tableName: string;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  initialSearch?: { query: string, field: string } | null;
  onSearchHandled?: () => void;
}

export const MemberManagementPage: React.FC<MemberManagementPageProps> = ({
  tableName, showAlert, showConfirm, initialSearch, onSearchHandled
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberStats, setMemberStats] = useState<Record<string, number>>({});

  // 🛡️ 필터 상태 통합 관리
  const [filters, setFilters] = useState({
    query: '',
    field: 'all',
    dateStart: '',
    dateEnd: '',
    region: ''
  });

  const loadData = async (
    page: number = 1,
    q: string = filters.query,
    f: string = filters.field,
    ds: string = filters.dateStart,
    de: string = filters.dateEnd,
    region: string = filters.region,
    isJump: boolean = false
  ) => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      // 🎯 fetchMembers 호출 시 모든 검색 조건을 서버로 실어 보냄
      const res = await fetchMembers(tableName, page, q, f, 50, ds, de, 'all', region);
      setMembers(res.data);
      setTotalMembers(res.total);

      if (isJump && res.data && res.data.length === 1) {
        const m = res.data[0];
        setSelectedMember({ ...m });
        setEditingMember({ ...m });
      } else if (res.data && res.data.length > 0) {
        setSelectedMember({ ...res.data[0] });
      } else {
        setSelectedMember(null);
      }
    } catch (error: any) {
      showAlert('로드 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberStats(tableName).then(setMemberStats);
    if (initialSearch) {
      const newFilters = { ...filters, query: initialSearch.query, field: initialSearch.field };
      setFilters(newFilters);
      loadData(1, newFilters.query, newFilters.field, '', '', '', true);
      if (onSearchHandled) onSearchHandled();
    } else {
      loadData(1);
    }
  }, [tableName, initialSearch]);

  // 🚀 MemberTable에서 전달된 5개 인자를 받아 데이터 로드
  const handleSearchTrigger = (q: string, f: string, ds: string, de: string, region: string) => {
    setFilters({ query: q, field: f, dateStart: ds, dateEnd: de, region });
    loadData(1, q, f, ds, de, region);
  };

  const handleSaveMember = async (m: Member) => {
    setIsLoading(true);
    try {
      const res = await updateMember(tableName, m);
      if (res.success) {
        setMembers(prev => prev.map(item => (item.mid === m.mid) ? { ...item, ...m } : item));
        setSelectedMember({ ...m });
        showAlert('저장 성공', `회원 정보가 수정되었습니다.`);
        setEditingMember(null);
      }
    } catch (e: any) { showAlert('저장 실패', e.message); }
    finally { setIsLoading(false); }
  };

  const handleCreateMember = async (m: Partial<Member>) => {
    setIsLoading(true);
    try {
      const res = await createMember(tableName, m);
      if (res.success) {
        showAlert('추가 성공', `신규 회원 정보가 저장되었습니다.`);
        loadData(1);
      }
    } catch (e: any) { showAlert('저장 실패', e.message); }
    finally { setIsLoading(false); }
  };

  const handleDeleteSelected = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    showConfirm('선택 삭제', `선택한 ${ids.length}명의 회원을 정말 삭제하시겠습니까?`, async () => {
      setIsLoading(true);
      try {
        await Promise.all(ids.map(id => deleteMember(tableName, parseInt(id, 10))));
        showAlert('삭제 성공', '선택한 회원 정보가 삭제되었습니다.');
        loadData(currentPage);
      } catch (e: any) {
        showAlert('삭제 실패', e.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleExcelUpload = async (newMembers: Partial<Member>[]) => {
    if (!newMembers || newMembers.length === 0) return;
    showConfirm('엑셀 대량 가입', `총 ${newMembers.length}명의 회원을 등록하시겠습니까?`, async () => {
      setIsLoading(true);
      let successCount = 0;
      let failCount = 0;
      try {
        for (const m of newMembers) {
          try {
            const res = await createMember(tableName, m);
            if (res.success) successCount++;
            else failCount++;
          } catch (e) {
            failCount++;
          }
        }
        showAlert('일괄 등록 완료', `총 ${newMembers.length}명 중 ${successCount}명 성공, ${failCount}명 실패했습니다.`);
        loadData(1);
      } catch (e: any) {
        showAlert('등록 중 오류 발생', e.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleProClassUpload = async (membersToUpdate: any[], selectedSkill: string, isSkillDisabled: boolean) => {
    if (!membersToUpdate || membersToUpdate.length === 0) return;
    showConfirm('직능 일괄 업데이트', `총 ${membersToUpdate.length}명의 직능 정보를 업데이트하시겠습니까?`, async () => {
      setIsLoading(true);
      try {
        const result = await bulkUpdateProClass(membersToUpdate, selectedSkill, isSkillDisabled);
        showAlert('일괄 업데이트 완료', `총 ${membersToUpdate.length}명 중 ${result.successCount}명 성공, ${result.failCount}명 실패했습니다.`);
        loadData(1);
      } catch (e: any) {
        showAlert('업데이트 중 오류 발생', e.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      <MemberTable
        members={members}
        totalCount={totalMembers}
        stats={memberStats}
        currentPage={currentPage}
        selectedId={selectedMember?.id || null}
        onSelectMember={setSelectedMember}
        isLoading={isLoading}
        onSearch={handleSearchTrigger}
        onPageChange={(p) => loadData(p)}
        onCreateMember={handleCreateMember}
        onDeleteSelected={handleDeleteSelected}
        onExcelUpload={handleExcelUpload}
        onProClassUpload={handleProClassUpload}
      />

      <div className="flex-1 bg-white border-l">
        <MemberDetail
          member={selectedMember}
          onSave={(m) => setEditingMember(m)}
        />
      </div>

      {editingMember && (
        <MemberEditForm
          member={editingMember}
          onSave={handleSaveMember}
          onCancel={() => setEditingMember(null)}
        />
      )}
    </div>
  );
};