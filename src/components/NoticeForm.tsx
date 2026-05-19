import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PostCategory, Notice } from '../types';
import { createPost, updatePost, uploadImage, uploadFile, BRIDGE_URL, SECRET_KEY } from '../services/memberService';
import { Loader2, CheckCircle2, Type, AlertTriangle, Zap, Eye, X, Paperclip, Trash2, FileText, Plus } from 'lucide-react';
import { CustomEditor } from './EventManagementPage';

interface NoticeFormProps {
  initialData?: Notice | null;
  categories: PostCategory[];
  tableName: string;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface AttachmentFile {
  name: string;
  url: string;
}

const parseAttachments = (html: string): { cleanContent: string, files: AttachmentFile[] } => {
  const startTag = '<!-- kkc-attachments-start -->';
  const endTag = '<!-- kkc-attachments-end -->';
  const startIndex = html.indexOf(startTag);
  const endIndex = html.indexOf(endTag);
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const cleanContent = html.substring(0, startIndex).trim();
    const attachmentPart = html.substring(startIndex + startTag.length, endIndex);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(attachmentPart, 'text/html');
    const links = doc.querySelectorAll('a');
    const files: AttachmentFile[] = [];
    links.forEach(link => {
      const url = link.getAttribute('href') || '';
      const name = link.getAttribute('data-name') || link.textContent?.trim() || '첨부파일';
      if (url) {
        files.push({ name, url });
      }
    });
    
    return { cleanContent, files };
  }
  
  return { cleanContent: html, files: [] };
};

const generateAttachmentsHtml = (files: AttachmentFile[]): string => {
  if (files.length === 0) return '';
  
  const listItems = files.map(file => {
    return `    <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
      <span style="color: #6b7280; font-size: 14px;">📄</span>
      <a href="${file.url}" download="${file.name}" data-name="${file.name}" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 14px;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
        ${file.name}
      </a>
    </li>`;
  }).join('\n');

  return `\n<!-- kkc-attachments-start -->
<div class="kkc-attachments" style="margin-top: 30px; padding: 16px 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb; font-family: sans-serif;">
  <div style="font-weight: 700; font-size: 14px; margin-bottom: 12px; color: #374151; display: flex; align-items: center; gap: 6px;">
    <span>📁</span> 첨부파일 (${files.length})
  </div>
  <ul style="list-style: none; padding-left: 0; margin: 0;">
${listItems}
  </ul>
</div>
<!-- kkc-attachments-end -->`;
};

export const NoticeForm: React.FC<NoticeFormProps> = ({ initialData, categories, tableName, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('publish');
  const [thumbnailId, setThumbnailId] = useState<number | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      const { cleanContent, files } = parseAttachments(initialData.content || '');
      setContent(cleanContent);
      setAttachments(files);
      setStatus(initialData.status || 'publish');
    } else {
      setTitle('');
      setContent('');
      setAttachments([]);
      setStatus('publish');
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

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');
    try {
      const newAttachments: AttachmentFile[] = [...attachments];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadFile(file);
        if (res && res.success) {
          newAttachments.push({
            name: file.name,
            url: res.url
          });
        } else {
          setError(`"${file.name}" 업로드에 실패했습니다.`);
        }
      }
      setAttachments(newAttachments);
    } catch (err: any) {
      setError(err.message || '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
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

      // 첨부파일 HTML 생성 및 본문 결합
      const finalContent = content + generateAttachmentsHtml(attachments);

      const postData: any = {
        title,
        content: finalContent,
        status,
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

        {/* 📁 첨부파일 섹션 */}
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Paperclip size={18} className="text-blue-600" />
              첨부파일 목록 ({attachments.length})
            </h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} /> 파일 추가
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAttachmentUpload}
              multiple
              className="hidden"
            />
          </div>

          {attachments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg bg-white">
              첨부된 파일이 없습니다. (PDF, HWP, Word, Excel, ZIP 등 업로드 가능)
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 text-sm">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText size={18} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700 truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-bold"
                    >
                      다운로드
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              
              {/* 첨부파일 미리보기 */}
              {attachments.length > 0 && (
                <div className="kkc-attachments" style={{ marginTop: '30px', padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📁</span> 첨부파일 ({attachments.length})
                  </div>
                  <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                    {attachments.map((file, idx) => (
                      <li key={idx} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#6b7280', fontSize: 14 }}>📄</span>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
