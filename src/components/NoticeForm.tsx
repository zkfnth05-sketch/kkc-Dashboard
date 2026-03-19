import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PostCategory, Notice } from '../types';
import { createPost, updatePost, uploadImage, uploadFile, BRIDGE_URL, SECRET_KEY } from '../services/memberService';
import { Loader2, CheckCircle2, Type, AlertTriangle, Zap, Eye, X } from 'lucide-react';
import { CustomEditor } from './EventManagementPage';

interface NoticeFormProps {
  initialData?: Notice | null;
  categories: PostCategory[];
  tableName: string;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const NoticeForm: React.FC<NoticeFormProps> = ({ initialData, categories, tableName, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('publish');
  const [thumbnailId, setThumbnailId] = useState<number | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content || '');
      setStatus(initialData.status || 'publish');
    }
  }, [initialData]);

  const internalImageUpload = async (file: File) => {
    setIsUploading(true);
    setError('');
    try {
      const res = await uploadFile(file);
      if (res && res.success) {
        if (!thumbnailId) setThumbnailId(res.id);
        return { url: res.url, id: res.id };
      }
      return '';
    } catch (err: any) {
      setError('업로드 중 오류 발생');
      return '';
    } finally {
      setIsUploading(false);
    }
  };

  const targetCategory = useMemo(() => {
    return categories.find(c => c.name.includes('협회') || c.name.includes('공지')) || (categories.length > 0 ? categories[0] : null);
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 입력해주세요.'); return; }

    setIsSaving(true);
    setError('');
    try {
      let finalThumbnailId = thumbnailId;
      if (!finalThumbnailId && content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        const firstImg = div.querySelector('img');
        if (firstImg) {
          const attrId = firstImg.getAttribute('data-attachment-id');
          if (attrId) finalThumbnailId = parseInt(attrId);
        }
      }

      const postData: any = {
        title, content, status,
        category_id: targetCategory?.id || 0,
        thumbnail_id: finalThumbnailId
      };

      await onSave(postData);
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col">
      <div className="shrink-0 flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Type size={20} className="text-blue-600" />
          {initialData ? '게시글 수정' : '협회 소식/공지 작성'}
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowPreviewModal(true)} className="px-4 py-2 bg-white border border-gray-300 text-green-600 text-sm font-bold rounded hover:bg-green-50 flex items-center gap-2 transition-colors">
            <Eye size={18} /> 내용 미리보기
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-50">취소</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-start gap-2 animate-pulse"><AlertTriangle size={18} className="mt-0.5 shrink-0" /> <span className="font-bold">{error}</span></div>}

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle2 size={18} className="text-blue-600" />
            <span className="text-sm font-medium">카테고리: <span className="font-bold underline">{targetCategory?.name || '기본'}</span></span>
          </div>
          <div className="text-xs text-blue-600 bg-white px-2 py-1 rounded border border-blue-200 font-bold flex items-center gap-1">
            <Zap size={14} fill="currentColor" /> 초경량 압축 모드 활성화됨 (보안 필터 최적화)
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
          <input type="text" className="w-full border border-gray-300 rounded px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
        </div>

        <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
          {[{ id: 'publish', label: '즉시 공개' }, { id: 'draft', label: '임시 저장' }].map(s => (
            <button key={s.id} type="button" onClick={() => setStatus(s.id)} className={`px-5 py-1.5 text-xs font-bold rounded-md transition-all ${status === s.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s.label}</button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-[500px] relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">본문 내용</label>
          <CustomEditor
            value={content}
            onChange={setContent}
            onImageUpload={internalImageUpload}
          />
        </div>

        <div className="flex justify-end pt-6 space-x-3 border-t border-gray-100 mb-10">
          <button type="submit" disabled={isSaving || isUploading} className="px-14 py-3 bg-blue-600 text-white text-sm font-black rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center shadow-xl transition-all active:scale-95">
            {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : (initialData ? '수정 완료' : '작성 완료')}
          </button>
        </div>
      </form>

      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">게시글 내용 미리보기</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-white">
              <h1 className="text-3xl font-black text-gray-900 mb-6 border-b-2 border-gray-100 pb-4">{title || '제목 없음'}</h1>
              <div className="prose prose-blue max-w-none prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setShowPreviewModal(false)} className="px-6 py-2 bg-gray-800 text-white font-bold rounded text-sm">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
