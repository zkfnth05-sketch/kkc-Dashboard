
import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Calendar, MapPin, Loader2, Trophy,
    Edit2, Trash2, ChevronLeft, ChevronRight, X,
    CheckCircle2, Download, Users, Settings2, Filter,
    ArrowLeft, Check, Upload, Image as ImageIcon,
    Clock, Building2, Save
} from 'lucide-react';
import { fetchBridge, SECRET_KEY, BRIDGE_URL } from '../services/memberService';
import { fetchDogShows, createDogShow, updateDogShow, deleteDogShow, fetchApplicants } from '../services/eventService';
import { CustomEditor } from './EventManagementPage';
import { CompetitionApplicantManagement } from './CompetitionApplicantManagement';
import Papa from 'papaparse';

interface Competition {
    id: string | number;
    title: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    content: string;
    thumbnail_url?: string;
    thumbnail_id?: string;
    category?: string;
    venue?: string;
    judges?: string;
    subtitle?: string;
    reg_start_date?: string;
    reg_start_h?: string;
    reg_start_m?: string;
    reg_end_date?: string;
    reg_end_h?: string;
    reg_end_m?: string;
    is_multi_day?: boolean;
    ds_etc?: string;
    applicant_count?: number;
    organizer?: string;
}

const CompetitionCreateForm: React.FC<{
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData: Competition | null;
}> = ({ onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        category: '종견 인정 평가',
        title: '',
        subtitle: '',
        venue: '',
        startDate: '',
        startTime: '10:00',
        endDate: '',
        endTime: '18:00',
        reg_start_date: '',
        reg_start_h: '09',
        reg_start_m: '00',
        reg_end_date: '',
        reg_end_h: '17',
        reg_end_m: '00',
        is_multi_day: false,
        content: '',
        judges: '',
        thumbnail_url: '',
        thumbnail_id: '',
        organizer: '(사)한국애견협회'
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                category: initialData.category || '종견 인정 평가',
                title: initialData.title || '',
                subtitle: initialData.subtitle || '',
                venue: initialData.venue || '',
                startDate: initialData.startDate || '',
                startTime: (initialData.startTime && initialData.startTime.substring(0, 5) !== '00:00') ? initialData.startTime.substring(0, 5) : '10:00',
                endDate: initialData.endDate || '',
                endTime: (initialData.endTime && initialData.endTime.substring(0, 5) !== '00:00') ? initialData.endTime.substring(0, 5) : '18:00',
                reg_start_date: initialData.reg_start_date || '',
                reg_start_h: initialData.reg_start_h || '09',
                reg_start_m: initialData.reg_start_m || '00',
                reg_end_date: initialData.reg_end_date || '',
                reg_end_h: initialData.reg_end_h || '17',
                reg_end_m: initialData.reg_end_m || '00',
                is_multi_day: initialData.is_multi_day || false,
                content: initialData.content || '',
                judges: initialData.judges || '',
                thumbnail_url: initialData.thumbnail_url || '',
                thumbnail_id: initialData.thumbnail_id || '',
                organizer: initialData.organizer || '(사)한국애견협회'
            });
        }
    }, [initialData]);

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            const fd = new FormData();
            fd.append('mode', 'upload_image');
            fd.append('image_file', file);
            try {
                const response = await fetch(BRIDGE_URL, {
                    method: 'POST',
                    headers: { 'X-Auth-Token': SECRET_KEY },
                    body: fd
                });
                const res = await response.json();
                if (res.success) {
                    setFormData(prev => ({ ...prev, thumbnail_url: res.url, thumbnail_id: res.id.toString() }));
                }
            } catch (err) { }
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) return alert('평가 제목을 입력해주세요.');
        setIsLoading(true);
        try {
            const payload = {
                ID: initialData?.id || '',
                post_title: formData.title,
                post_content: formData.content,
                startDate: formData.startDate,
                startTime: formData.startTime,
                endDate: formData.endDate || formData.startDate,
                endTime: formData.endTime,
                event_start_datetime: `${formData.startDate} ${formData.startTime}:00`,
                event_end_datetime: `${formData.endDate || formData.startDate} ${formData.endTime}:00`,
                event_venue: formData.venue || '',
                event_organizer: formData.organizer || '',
                type_names: formData.category,
                thumbnail_url: formData.thumbnail_url,
                thumbnail_id: formData.thumbnail_id,
                subtitle: formData.subtitle,
                ds_subtitle: formData.subtitle,
                reg_start_date: formData.reg_start_date,
                reg_start_h: formData.reg_start_h,
                reg_start_m: formData.reg_start_m,
                reg_end_date: formData.reg_end_date,
                reg_end_h: formData.reg_end_h,
                reg_end_m: formData.reg_end_m,
                is_multi_day: formData.is_multi_day,
                judges: formData.judges,
            };
            await onSave(payload);
            onClose();
        } catch (e: any) { alert(e.message); }
        finally { setIsLoading(false); }
    };

    const internalImageUpload = async (file: File) => {
        const fd = new FormData();
        fd.append('mode', 'upload_image');
        fd.append('image_file', file);
        try {
            const response = await fetch(BRIDGE_URL, {
                method: 'POST',
                headers: { 'X-Auth-Token': SECRET_KEY },
                body: fd
            });
            if (!response.ok) return null;
            const res = await response.json();
            return res.success ? { url: res.url, id: res.id } : null;
        } catch (err) { return null; }
    };

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '10', '20', '30', '40', '50'];

    return (
        <div className="bg-white min-h-screen pb-32 animate-in fade-in duration-300 overflow-y-auto">
            <div className="max-w-[800px] mx-auto pt-14 px-4">
                <h2 className="text-[28px] font-bold text-gray-900 text-center mb-12">종견 인정 평가 등록/수정</h2>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[13px] font-bold text-gray-600">대표 이미지 (썸네일)</label>
                        <div className="relative group w-full aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all">
                            {formData.thumbnail_url ? (
                                <img src={formData.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Thumbnail" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-300">
                                    <Upload size={32} strokeWidth={1.5} />
                                    <span className="text-[12px] font-bold uppercase">이미지 업로드</span>
                                </div>
                            )}
                            <input type="file" onChange={handleThumbnailUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600">평가 제목</label>
                        <input type="text" placeholder="평가 제목을 입력하세요" className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600">평가 부제목</label>
                        <input type="text" placeholder="부제목을 입력하세요" className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600">장소</label>
                        <input type="text" placeholder="장소를 입력하세요" className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600">주최자</label>
                        <input type="text" className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm" value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600">심사위원</label>
                        <input type="text" className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm" value={formData.judges} onChange={e => setFormData({ ...formData, judges: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-600">접수 시작일</label>
                            <input type="date" className="w-full border border-gray-300 rounded-sm px-4 py-2.5 outline-none focus:border-blue-500 shadow-sm" value={formData.reg_start_date} onChange={e => setFormData({ ...formData, reg_start_date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-600">접수 마감일</label>
                            <input type="date" className="w-full border border-gray-300 rounded-sm px-4 py-2.5 outline-none focus:border-blue-500 shadow-sm" value={formData.reg_end_date} onChange={e => setFormData({ ...formData, reg_end_date: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600">행사 일정</label>
                        <div className="flex gap-2">
                            <input type="date" className="flex-1 border border-gray-300 rounded-sm px-4 py-2 outline-none focus:border-blue-500 shadow-sm" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            <span className="flex items-center text-gray-400">~</span>
                            <input type="date" className="flex-1 border border-gray-300 rounded-sm px-4 py-2 outline-none focus:border-blue-500 shadow-sm" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600">행사 상세 설명 (에디터)</label>
                        <div className="min-h-[400px]">
                            <CustomEditor
                                value={formData.content}
                                onChange={val => setFormData({ ...formData, content: val })}
                                onImageUpload={internalImageUpload}
                            />
                        </div>
                    </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 bg-[#f8f9fa] border-t border-gray-200 py-4 px-10 flex justify-end gap-3 z-[100]">
                    <button onClick={onClose} className="px-7 py-2.5 bg-gray-400 text-white rounded-md font-bold text-[14px] hover:bg-gray-500 shadow-md">취소</button>
                    <button onClick={handleSave} disabled={isLoading} className="px-10 py-2.5 bg-blue-600 text-white rounded-md font-bold text-[14px] hover:bg-blue-700 shadow-lg flex items-center gap-2">
                        {isLoading && <Loader2 className="animate-spin" size={16} />} 저장
                    </button>
                </div>
            </div>
        </div>
    );
};

export const BreedExamManagementPage: React.FC = () => {
    const [data, setData] = useState<Competition[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'applicants'>('list');
    const [selectedComp, setSelectedComp] = useState<Competition | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await fetchDogShows(1, '', 100, '종견 인정 평가');
            setData(res.data || []);
            setTotal(res.total || 0);
        } catch (e) { }
        finally { setIsLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (payload: any) => {
        try {
            const res = await (payload.ID ? updateDogShow(payload) : createDogShow(payload));
            if (!res.success) throw new Error(res.error || '저장에 실패했습니다.');
            setViewMode('list');
            loadData();
        } catch (e: any) { alert(e.message); }
    };

    const handleDelete = (item: Competition) => {
        if (window.confirm(`'${item.title}' 정보를 삭제하시겠습니까?`)) {
            deleteDogShow(item.id).then(() => loadData());
        }
    };

    const handleDownloadApplicants = async (comp: Competition) => {
        try {
            const idMatch = String(comp.id).match(/\d+/);
            const pid = idMatch ? idMatch[0] : 0;
            const res = await fetchApplicants(pid, 'breed_exam_applicant');
            if (res.data?.length === 0) return alert('신청자가 없습니다.');
            const csvData = res.data.map((a: any) => ({
                '이름': a.name, '연락처': a.contact, '혈통서번호': a.pedigree_number, '입금상태': a.payment_status, '신청일': a.created_at
            }));
            const csvStr = Papa.unparse(csvData);
            const blob = new Blob(["\uFEFF" + csvStr], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${comp.title}_신청자.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) { }
    };

    if (viewMode === 'form') return <CompetitionCreateForm onClose={() => setViewMode('list')} onSave={handleSave} initialData={selectedComp} />;
    if (viewMode === 'applicants' && selectedComp) {
        return (
            <CompetitionApplicantManagement
                competitionId={selectedComp.id}
                competitionTitle={selectedComp.title}
                onClose={() => { setViewMode('list'); loadData(); }}
                applicantTable="breed_exam_applicant"
                showAlert={(title, msg) => alert(title + ': ' + msg)}
                showConfirm={(title, msg, cb) => { if (window.confirm(title + '\n\n' + msg)) cb(); }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-white p-6 font-sans">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[24px] font-black tracking-tight text-gray-900">종견 인정 평가 대회 관리</h2>
                <button onClick={() => { setSelectedComp(null); setViewMode('form'); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 shadow-md">
                    <Plus size={16} strokeWidth={3} /> 평가 추가
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-[13px] border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                            <th className="py-4 px-4 text-left">대회명</th>
                            <th className="py-4 px-4 text-left">장소</th>
                            <th className="py-4 px-4 text-left">일자</th>
                            <th className="py-4 px-4 text-center">신청자</th>
                            <th className="py-4 px-4 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : data.map(item => (
                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-4 px-4 font-bold text-gray-900">{item.title}</td>
                                <td className="py-4 px-4 text-gray-600">{item.venue}</td>
                                <td className="py-4 px-4 text-gray-600 font-medium">{item.startDate} {item.endDate && `~ ${item.endDate}`}</td>
                                <td className="py-4 px-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setSelectedComp(item); setViewMode('applicants'); }} className="px-3 py-1.5 bg-gray-100 border rounded text-[11px] font-bold">신청자 관리 ({item.applicant_count})</button>
                                        <button onClick={() => handleDownloadApplicants(item)} className="p-1.5 text-gray-400 hover:text-blue-500"><Download size={16} /></button>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setSelectedComp(item); setViewMode('form'); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
