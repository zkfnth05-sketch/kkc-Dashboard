import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ExternalLink, Download, FileText, Loader2, Edit2, CheckCircle, Pin } from 'lucide-react';
import { fetchDownloads, deleteDownload, createDownload, updateDownload, pinDownload } from '../services/downloadService';
import { uploadFile } from '../services/memberService'; 

interface DownloadManagementPageProps {
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const DownloadManagementPage: React.FC<DownloadManagementPageProps> = ({
  showAlert,
  showConfirm
}) => {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [newDownload, setNewDownload] = useState({ title: '', file: null as File | null });
  const [editingItem, setEditingItem] = useState({ id: '', title: '', file: null as File | null, originalFileUrl: '' });
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async (p: number = 1, q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetchDownloads(p, q);
      setDownloads(res.data);
      setTotal(res.total);
    } catch (e: any) {
      showAlert('로드 실패', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData(1, search);
  };

  const handleDelete = (id: string) => {
    showConfirm('다운로드 삭제', '정말로 이 항목을 삭제하시겠습니까?', async () => {
      setIsLoading(true);
      try {
        await deleteDownload(id);
        showAlert('성공', '삭제되었습니다.');
        loadData(page, search);
      } catch (e: any) {
        showAlert('실패', e.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await pinDownload(id, !currentPinned);
      if (res.success) {
        loadData(page, search);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      showAlert('오류', e.message);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem({
      id: item.id,
      title: item.title,
      file: null,
      originalFileUrl: item.fileUrl
    });
    setIsEditingMode(true);
  };

  const handleAddDownload = async () => {
    if (!newDownload.title.trim() || !newDownload.file) {
      showAlert('오류', '제목과 파일을 모두 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const uploadRes = await uploadFile(newDownload.file);
      if (!uploadRes.success) throw new Error(uploadRes.error);

      const res = await createDownload({
        title: newDownload.title,
        fileUrl: uploadRes.url,
        filename: newDownload.file.name
      });

      if (res.success) {
        showAlert('등록 성공', '서식 자료가 성공적으로 등록 되었습니다.');
        setIsAddingMode(false);
        setNewDownload({ title: '', file: null });
        loadData(1);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      showAlert('등록 실패', e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateDownload = async () => {
    if (!editingItem.title.trim()) {
      showAlert('오류', '제목을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = undefined;
      if (editingItem.file) {
        const uploadRes = await uploadFile(editingItem.file);
        if (!uploadRes.success) throw new Error(uploadRes.error);
        fileUrl = uploadRes.url;
      }

      const res = await updateDownload({
        id: editingItem.id,
        title: editingItem.title,
        fileUrl: fileUrl
      });

      if (res.success) {
        showAlert('수정 성공', '서식 자료가 수정되었습니다.');
        setIsEditingMode(false);
        loadData(page, search);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      showAlert('수정 실패', e.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header Area */}
      <div className="p-6 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">서식 자료실</h2>
            <p className="text-sm text-slate-500 font-medium">Download Manager 연동 파일 관리</p>
          </div>
          <button 
            onClick={() => setIsAddingMode(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} /> 새 서식 등록
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="자료 제목 검색..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-all"
              >
                검색
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">자체 제목 / 파일</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">쇼트코드</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">작성일</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">다운로드 수</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span className="text-sm font-bold text-slate-400">데이터를 불러오는 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : downloads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold">등록된 서식이 없습니다.</td>
                  </tr>
                ) : (
                  downloads.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-400">#{item.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.is_pinned ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {item.is_pinned ? <Pin size={20} /> : <FileText size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {item.is_pinned && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded uppercase tracking-tighter">pinned</span>}
                              <div className="text-sm font-black text-slate-800">{item.title}</div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium truncate max-w-[300px]">{item.fileUrl}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-slate-100 px-2 py-1 rounded text-[11px] font-bold text-slate-600 border border-slate-200">{item.shortcode}</code>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.date?.split(' ')[0]}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-blue-600 font-black text-sm">
                          <Download size={14} />
                          {item.downloadCount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleTogglePin(item.id, item.is_pinned)}
                            className={`p-2 rounded-lg transition-all ${item.is_pinned ? 'text-amber-600 bg-amber-50 shadow-sm border border-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                            title={item.is_pinned ? "고정 해제" : "상단 고정"}
                          >
                            <Pin size={18} fill={item.is_pinned ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="수정"
                          >
                            <Edit2 size={18} />
                          </button>
                          <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="원본 파일 보기"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Adding Modal */}
      {isAddingMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">새 서식 등록</h3>
              <button onClick={() => setIsAddingMode(false)} className="text-slate-400 hover:text-slate-600 transition-colors">닫기</button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2 block">자료 제목</label>
                <input 
                  type="text" 
                  value={newDownload.title}
                  onChange={e => setNewDownload({...newDownload, title: e.target.value})}
                  placeholder="예: 2026 반려견 스타일리스트 신청서"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2 block">파일 첨부 (PDF, HWP, DOCX 등)</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${newDownload.file ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setNewDownload({...newDownload, file});
                    }}
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${newDownload.file ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {newDownload.file ? <CheckCircle size={24} /> : <Download size={24} />}
                  </div>
                  <div className="text-sm font-black text-slate-700">{newDownload.file ? newDownload.file.name : '파일 선택'}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">{newDownload.file ? `${(newDownload.file.size / 1024 / 1024).toFixed(2)} MB` : '이곳을 클릭하여 파일을 선택하세요'}</div>
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-xs font-bold font-mono tracking-tight animate-pulse">파일 업로드 중...</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setIsAddingMode(false)} 
                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 border border-transparent hover:bg-slate-100 rounded-lg transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleAddDownload}
                disabled={isUploading}
                className="px-8 py-2 text-sm font-black bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal */}
      {isEditingMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">서식 자료 수정</h3>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">ID #{editingItem.id}</span>
              </div>
              <button onClick={() => setIsEditingMode(false)} className="text-slate-400 hover:text-slate-600 transition-colors">닫기</button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2 block">자료 제목</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  placeholder="제목 입력"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2 block">파일 교체 (선택사항)</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${editingItem.file ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                  onClick={() => document.getElementById('file-edit')?.click()}
                >
                  <input 
                    type="file" 
                    id="file-edit" 
                    className="hidden" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setEditingItem({...editingItem, file});
                    }}
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${editingItem.file ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {editingItem.file ? <CheckCircle size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="text-xs font-black text-slate-700">{editingItem.file ? editingItem.file.name : '파일을 변경하려면 클릭하세요'}</div>
                  {!editingItem.file && <div className="text-[10px] text-slate-400 mt-1">기존 파일: {editingItem.originalFileUrl.split('/').pop()}</div>}
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-xs font-bold animate-pulse">수정 사항 반영 중...</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setIsEditingMode(false)} 
                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 rounded-lg transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleUpdateDownload}
                disabled={isUploading}
                className="px-8 py-2 text-sm font-black bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-xl shadow-slate-200 transition-all disabled:opacity-50"
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
