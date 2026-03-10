/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { NoticePage } from './NoticePage';
import { NoticeForm } from './NoticeForm';
import { Notice, PostCategory } from '../types';
import { fetchCategories } from '../services/memberService';
import {
  fetchAssociationNotices,
  deleteAssociationNotice,
  createAssociationNotice,
  updateAssociationNotice
} from '../services/noticeService';

interface NoticeManagementPageProps {
  tableName: string;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

/**
 * 🛡️ 협회소식/공지 관리 페이지 (격리됨)
 * 전용 noticeService를 통해 WP 데이터와 통신합니다.
 */
export const NoticeManagementPage: React.FC<NoticeManagementPageProps> = ({ tableName, showAlert, showConfirm }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [totalNotices, setTotalNotices] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [filters, setFilters] = useState({ query: '' });

  const loadData = async (page: number = 1, q: string = '') => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const res = await fetchAssociationNotices(page, 10, q);
      setNotices(res.data);
      setTotalNotices(res.total);

      const cats = await fetchCategories();
      setCategories(cats);
    } catch (error: any) {
      console.error("Notice Load Error:", error);
      showAlert('로드 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(1); }, [tableName]);

  const handleDeleteNotice = async (id: number) => {
    showConfirm(
      '게시물 삭제',
      `ID: ${id} 게시물을 영구 삭제하시겠습니까?`,
      async () => {
        setIsLoading(true);
        try {
          const res = await deleteAssociationNotice(id);
          if (res.success) {
            loadData(currentPage, filters.query);
            showAlert('삭제 성공', '게시물이 삭제되었습니다.');
          }
        } catch (e: any) {
          showAlert('삭제 실패', e.message);
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleSave = async (data: any) => {
    setIsLoading(true);
    try {
      let res;
      if (editingNotice) {
        res = await updateAssociationNotice({ ...data, ID: editingNotice.id });
      } else {
        res = await createAssociationNotice(data);
      }
      if (res.success) {
        setIsCreatingNotice(false);
        setEditingNotice(null);
        loadData(1);
      }
    } catch (e: any) {
      showAlert('저장 실패', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCreatingNotice || editingNotice) {
    return (
      <NoticeForm
        initialData={editingNotice}
        categories={categories}
        tableName={tableName}
        onSave={handleSave}
        onCancel={() => { setIsCreatingNotice(false); setEditingNotice(null); }}
      />
    );
  }

  return (
    <NoticePage
      notices={notices} totalCount={totalNotices} currentPage={currentPage} isLoading={isLoading}
      onSearch={(_, q) => { setFilters({ query: q }); loadData(1, q); }}
      onPageChange={(p) => loadData(p, filters.query)}
      onDelete={handleDeleteNotice} onEdit={setEditingNotice} onCreate={() => setIsCreatingNotice(true)}
      siteUrl="https://kkc3349.mycafe24.com" tableName={tableName} categories={categories}
    />
  );
};
