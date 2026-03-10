import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, Search, MapPin, Clock, Building2,
    Loader2, Settings, Edit2, Trash2,
    Image as ImageIcon, X, Save, Palette, Check,
    Upload, Type, Bold, Italic, Trophy,
    AlignLeft, AlignCenter, AlignRight,
    ImageIcon as PhotoIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { fetchDogShows, createDogShow, updateDogShow, deleteDogShow } from '../services/eventService';
import { fetchBridge, SECRET_KEY, BRIDGE_URL, uploadFile, compressImage } from '../services/memberService';



// --- Shared Custom Editor Component (DOM-based to avoid findDOMNode errors) ---
export const CustomEditor = ({ value, onChange, onImageUpload }: {
    value: string,
    onChange: (val: string) => void,
    onImageUpload: (file: File) => Promise<string | { url: string; id: any }>
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== value) {
            contentRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (contentRef.current) onChange(contentRef.current.innerHTML);
    };

    const execCmd = (cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        handleInput();
    };

    const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const compressed = await compressImage(file);
            const result = await onImageUpload(compressed);
            const url = typeof result === 'string' ? result : result?.url;
            const id = typeof result === 'string' ? '' : result?.id;
            if (url) {
                const imgHtml = `<img src="${url}" ${id ? `data-attachment-id="${id}"` : ''} />`;
                execCmd('insertHTML', imgHtml);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col border border-slate-200 rounded-[32px] overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all bg-white h-full min-h-[500px] shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap gap-2 sticky top-0 z-10">
                <div className="flex bg-white rounded-xl border border-slate-100 shadow-sm p-1">
                    <button type="button" onClick={() => execCmd('bold')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600" title="Bold"><Bold size={16} /></button>
                    <button type="button" onClick={() => execCmd('italic')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600" title="Italic"><Italic size={16} /></button>
                </div>
                <div className="flex bg-white rounded-xl border border-slate-100 shadow-sm p-1">
                    <button type="button" onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><AlignLeft size={16} /></button>
                    <button type="button" onClick={() => execCmd('justifyCenter')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><AlignCenter size={16} /></button>
                    <button type="button" onClick={() => execCmd('justifyRight')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><AlignRight size={16} /></button>
                </div>
                <div className="flex bg-white rounded-xl border border-slate-100 shadow-sm p-1 gap-1">
                    <select
                        onChange={(e) => execCmd('fontSize', e.target.value)}
                        className="text-[11px] font-black bg-transparent outline-none px-2 cursor-pointer"
                    >
                        <option value="3">보통</option>
                        <option value="4">조금 크게</option>
                        <option value="5">크게</option>
                        <option value="6">매우 크게</option>
                        <option value="7">최대</option>
                    </select>
                    <div className="w-px h-4 bg-slate-200 self-center" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 hover:bg-slate-50 rounded-lg text-indigo-600 flex items-center gap-1.5"
                    >
                        <PhotoIcon size={16} /> <span className="text-[10px] font-black uppercase">이미지</span>
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleInsertImage} />
                </div>
                <button type="button" onClick={() => {
                    const url = prompt('URL을 입력하세요:');
                    if (url) execCmd('createLink', url);
                }} className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-600 text-[10px] font-black px-4 uppercase tracking-widest">Link</button>
            </div>
            <div
                ref={contentRef}
                contentEditable
                onInput={handleInput}
                className="flex-1 p-10 lg:p-14 outline-none prose prose-indigo max-w-none overflow-y-auto bg-white"
                style={{ minHeight: '400px' }}
            />
        </div>
    );
};

// --- Types ---
interface EventItem {
    id: string | number;
    title: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    dateStr: string;
    content: string;
    thumbnail_url?: string;
    thumbnail_id?: string;
    category?: string;
    organizer?: string;
    venue?: string;
    status?: string;
    ds_etc?: string; // 상세 정보 JSON
    subtitle?: string;
    judges?: string;
    reg_start_date?: string;
    reg_end_date?: string;
    reg_start_h?: string;
    reg_start_m?: string;
    reg_end_h?: string;
    reg_end_m?: string;
    is_multi_day?: boolean;
    is_federation_only?: boolean;
    type_names?: string;
}

interface Category {
    id: string;
    name: string;
    color: string;
}

const COLOR_PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
const WEEK_DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: '세미나', color: '#10b981' },
    { id: '2', name: '도그쇼', color: '#3b82f6' },
    { id: '3', name: '반려견 스타일리스트 경연대회', color: '#f59e0b' },
    { id: '4', name: '독스포츠', color: '#ef4444' },
    { id: '5', name: '종견인정검사', color: '#8b5cf6' }
];

export const EventManagementPage: React.FC<any> = ({ isAdmin = true, showAlert, showConfirm, onEditEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<EventItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [viewEvent, setViewEvent] = useState<EventItem | null>(null); // New state for viewing
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 1024 ? 10 : 8);

    const [formData, setFormData] = useState({
        ID: '',
        post_title: '',
        post_content: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '18:00',
        venue: '',
        organizer: '', // 🚀 [FIX] 기본값 완전 제거
        category: '',
        thumbnail_url: '',
        thumbnail_id: '',
        // 🚀 [SYNC FIX] Competition Fields
        subtitle: '',
        reg_start_date: '',
        reg_start_h: '09',
        reg_start_m: '00',
        reg_end_date: '',
        reg_end_h: '17',
        reg_end_m: '00',
        is_federation_only: false
    });

    const [newCatName, setNewCatName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);

    // 📅 [UTIL] Real-time Day of Week Calculator
    const getDayName = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
        } catch (e) { return ''; }
    };

    const loadCategories = () => {
        const saved = localStorage.getItem('kkf_custom_categories');
        let cats: Category[] = saved ? JSON.parse(saved) : [...DEFAULT_CATEGORIES];

        // 🚀 [MIGRATION] Rename or ensure group names exist
        let changed = false;
        cats = cats.map(c => {
            if (c.name === '훈련대회') { c.name = '훈련 대회'; changed = true; }
            if (c.name === '교육 및 테스트' || c.name === '교육 및 세미나' || c.name === '세미나 및 교육') { c.name = '세미나'; changed = true; }
            if (c.name === '도그쇼' && !c.color) { c.color = '#3b82f6'; changed = true; }
            if (c.name.includes('종견') || c.name.includes('인성평가') || c.name.includes('인정검사')) {
                if (c.name !== '종견인정검사') {
                    c.name = '종견인정검사';
                    changed = true;
                }
            }
            if (c.name === '훈련 / 어질리티 / 디스크독 / 플라이볼' || c.name === '독스포츠') { c.name = '독스포츠'; changed = true; }
            return c;
        });

        if (!cats.find(c => c.name === '독스포츠')) {
            cats.push({ id: 'group_sports', name: '독스포츠', color: '#ef4444' });
            changed = true;
        }
        if (!cats.find(c => c.name === '세미나')) {
            cats.push({ id: 'group_edu', name: '세미나', color: '#10b981' });
            changed = true;
        }
        if (!cats.find(c => c.name === '종견인정검사')) {
            cats.push({ id: 'group_be', name: '종견인정검사', color: '#8b5cf6' });
            changed = true;
        }

        // 🚀 [CLEANUP] Remove duplicates and invalid labels
        const uniqueCats: Category[] = [];
        const seenNames = new Set<string>();
        cats.forEach(c => {
            if (!seenNames.has(c.name)) {
                seenNames.add(c.name);
                uniqueCats.push(c);
            } else {
                changed = true; // Duplicate found, should persist cleanup
            }
        });
        cats = uniqueCats;

        if (changed || !saved) {
            localStorage.setItem('kkf_custom_categories', JSON.stringify(cats));
        }
        setCategories(cats);
    };

    const handleAddCategory = () => {
        if (!isAdmin) return; // 🛡️ [SECURITY] Block non-admin
        if (!newCatName.trim()) return;
        const updated = [...categories, { id: Date.now().toString(), name: newCatName, color: selectedColor }];
        setCategories(updated);
        localStorage.setItem('kkf_custom_categories', JSON.stringify(updated));
        setNewCatName('');
    };

    const handleDeleteCategory = (id: string) => {
        if (!isAdmin) return; // 🛡️ [SECURITY] Block non-admin
        showConfirm('유형 삭제', '이 유형을 삭제하시겠습니까?', () => {
            const updated = categories.filter(c => c.id !== id);
            setCategories(updated);
            localStorage.setItem('kkf_custom_categories', JSON.stringify(updated));
        });
    };

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetchDogShows(1, '', 500);
            setEvents((res.data || []).map((item: any) => {
                // [고도화] 서버 풀 데이터를 기반으로 정밀 날짜/시간 추출
                const sDt = item.actual_start_dt || item.startDate || '';
                const eDt = item.actual_end_dt || item.endDate || '';

                const sParts = sDt.split(' ');
                const eParts = eDt.split(' ');

                const normalizeTime = (t: string) => {
                    if (!t || t.trim() === '' || t.substring(0, 5) === '00:00') return '';
                    return t.substring(0, 5);
                };

                const startDate = sParts[0] || '';
                const startTime = normalizeTime(item.startTime || (sParts[1] || ''));

                const endDate = (eParts[0] && eParts[0] !== '-') ? eParts[0] : startDate;
                const endTime = normalizeTime(item.endTime || (eParts[1] || ''));

                const categoryRaw = item.category || item.type_names || '';
                const category = (categoryRaw === '유형 미지정' || !categoryRaw) ? '기타' : categoryRaw;

                const organizerRaw = item.organizer || item.organizer_name || item.event_organizer || '';
                // 🚀 KKC 명칭 노출 차단 (그 외는 허용)
                const organizer = (organizerRaw &&
                    !organizerRaw.includes('미지정') &&
                    !organizerRaw.includes('KKC')) ? organizerRaw : '(사)한국애견협회';

                const venue = item.venue || item.venue_name || item.event_venue || item.location || '';

                // 🚀 [FIX] 시작날짜와 종료날짜가 반대로 된 경우 자동 보정
                const sTimeVal = startDate + ' ' + (startTime || '00:00');
                const eTimeVal = endDate + ' ' + (endTime || '00:00');

                const finalStartDate = (sTimeVal > eTimeVal) ? endDate : startDate;
                const finalStartTime = (sTimeVal > eTimeVal) ? endTime : startTime;
                const finalEndDate = (sTimeVal > eTimeVal) ? startDate : endDate;
                const finalEndTime = (sTimeVal > eTimeVal) ? startTime : endTime;

                return {
                    ...item,
                    id: item.id,
                    title: item.title || item.post_title,
                    startDate: finalStartDate,
                    endDate: finalEndDate,
                    startTime: finalStartTime,
                    endTime: finalEndTime,
                    dateStr: `${finalStartDate} (${finalStartTime}) ~ ${finalEndDate} (${finalEndTime})`,
                    content: item.content || item.post_content || '',
                    thumbnail_url: item.thumbnail_url ? item.thumbnail_url.replace(/-(\d+)x(\d+)\.(jpg|jpeg|png|gif|webp)$/i, '.$3') : '',
                    thumbnail_id: item.thumbnail_id || '',
                    category,
                    organizer,
                    venue,
                    status: item.status,
                    ds_etc: item.ds_etc || '',
                    subtitle: item.subtitle || item.ds_subtitle || '',
                    judges: item.judges || '',
                    reg_start_date: item.reg_start_date || '',
                    reg_end_date: item.reg_end_date || '',
                    reg_start_h: item.reg_start_h || '09',
                    reg_start_m: item.reg_start_m || '00',
                    reg_end_h: item.reg_end_h || '17',
                    reg_end_m: item.reg_end_m || '00',
                    is_multi_day: item.is_multi_day || false,
                    is_federation_only: item.is_federation_only || false
                };
            }));
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { loadEvents(); loadCategories(); }, []);

    useEffect(() => {
        const handleResize = () => {
            setItemsPerPage(window.innerWidth < 1024 ? 10 : 8);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory]);

    // 🚀 [ULTIMATE FIX] Direct Multipart Upload to avoid JSON/fetchBridge issues
    const internalImageUpload = async (file: File) => {
        try {
            const res = await uploadFile(file);
            // Return both URL for preview and ID for DB saving
            return res && res.success ? { url: res.url, id: res.id } : null;
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsSaving(true);
            const result = await internalImageUpload(file);
            if (result) {
                setFormData({
                    ...formData,
                    thumbnail_url: result.url,
                    thumbnail_id: result.id.toString()
                });
            }
            setIsSaving(false);
        }
    };

    const handleSaveEvent = async () => {
        if (!formData.post_title.trim()) return showAlert('필수 입력', '행사 제목을 입력해주세요.');
        setIsSaving(true);
        let finalThumbnailUrl = formData.thumbnail_url;
        let finalThumbnailId = formData.thumbnail_id;
        if (!finalThumbnailUrl && formData.post_content) {
            const div = document.createElement('div');
            div.innerHTML = formData.post_content;
            const firstImg = div.querySelector('img');
            if (firstImg) {
                finalThumbnailUrl = firstImg.src;
                // 🚀 [FIX] More robust ID extraction from editor content
                const attrId = firstImg.getAttribute('data-attachment-id');
                if (attrId) finalThumbnailId = attrId;
            }
        }

        try {
            const payload = {
                ...formData,
                thumbnail_url: finalThumbnailUrl,
                thumbnail_id: finalThumbnailId,
                event_start_datetime: `${formData.startDate} ${formData.startTime}:00`,
                event_end_datetime: `${formData.endDate} ${formData.endTime}:00`,
                event_venue: formData.venue,
                event_organizer: formData.organizer,
                type_names: formData.category,
                // 🚀 Send flat fields for legacy handler compatibility
                ds_subtitle: formData.subtitle,
                judges: formData.judges,
                reg_start_date: formData.reg_start_date,
                reg_start_h: formData.reg_start_h,
                reg_start_m: formData.reg_start_m,
                reg_end_date: formData.reg_end_date,
                reg_end_h: formData.reg_end_h,
                reg_end_m: formData.reg_end_m,
                is_multi_day: formData.is_multi_day,
                is_federation_only: formData.is_federation_only,
                // fallback JSON for wp_posts format
                ds_etc: JSON.stringify({
                    subtitle: formData.subtitle,
                    reg_start_date: formData.reg_start_date,
                    reg_start_h: formData.reg_start_h,
                    reg_start_m: formData.reg_start_m,
                    reg_end_date: formData.reg_end_date,
                    reg_end_h: formData.reg_end_h,
                    reg_end_m: formData.reg_end_m,
                    is_federation_only: formData.is_federation_only
                })
            };
            const res = formData.ID ? await updateDogShow(payload) : await createDogShow(payload);
            if (res.success) {
                setIsEditorOpen(false);
                loadEvents();
                showAlert('성공', '행사가 정상적으로 저장되었습니다.');
            }
        } catch (e) { showAlert('오류', '저장 중 문제가 발생했습니다.'); }
        finally { setIsSaving(false); }
    };

    const getCatColor = (name: string, originalName?: string) => {
        // 1. Try original name first (for specific colors if saved)
        if (originalName) {
            const foundOrig = categories.find(c => originalName.includes(c.name));
            if (foundOrig) return foundOrig.color;
        }
        // 2. Try display name
        return categories.find(c => name.includes(c.name))?.color || '#cbd5e1';
    };

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        const days = [];
        const prevLast = new Date(year, month, 0).getDate();
        for (let i = offset - 1; i >= 0; i--) days.push(new Date(year, month - 1, prevLast - i));
        const last = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= last; i++) days.push(new Date(year, month, i));
        while (days.length < 42) days.push(new Date(year, month + 1, days.length - offset - last + 1));
        return days;
    }, [currentDate]);

    const filteredEvents = useMemo(() => {
        if (activeCategory === 'all') return [...events].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

        const filtered = events.filter(e => {
            const cat = e.category || '';
            const tname = e.type_names || '';
            // 🚀 [GROUP FILTER] 도그쇼를 선택하면 관련 유형(셰퍼드, 진도견)도 모두 포함
            if (activeCategory === '도그쇼') {
                return cat.includes('도그쇼') || ['셰퍼드 전람회', '진도견 선발대회'].includes(tname);
            }
            // 🚀 [GROUP FILTER] 스타일리스트 관련 통합
            if (activeCategory === '반려견 스타일리스트 경연대회') {
                return cat.includes('반려견 스타일리스트 경연대회') || tname.includes('반려견 스타일리스트 경연대회');
            }
            // 🚀 [GROUP FILTER] 스포츠/훈련 관련 통합
            if (activeCategory === '독스포츠') {
                return cat.includes('독스포츠') || ['훈련 경기대회', '어질리티', '디스크독', '플라이볼'].includes(tname) || tname.includes('독스포츠');
            }
            // 🚀 [GROUP FILTER] 세미나 관련 통합
            if (activeCategory === '세미나') {
                return cat.includes('세미나') || ['세미나', '교육 및 테스트', '교육'].includes(tname) || tname.includes('세미나');
            }
            // 🚀 [GROUP FILTER] 종견인정검사 관련 통합
            if (activeCategory === '종견인정검사') {
                return cat.includes('종견인정검사') || ['종견 인정 평가', '종견 인정 검사', '종견', '인성평가', '인정검사'].includes(tname) || tname.includes('종견') || tname.includes('인성평가');
            }
            return cat.includes(activeCategory) || (tname && tname.includes(activeCategory));
        });

        return [...filtered].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    }, [events, activeCategory]);

    const listEvents = useMemo(() => {
        // 🚀 [SMART FILTER] 리스트에는 지난달 1일 이후의 내용만 표시
        const now = new Date();
        const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        return filteredEvents.filter(e => {
            if (!e.startDate) return true; // 날짜 없는 특수 케이스는 일단 유지
            const eventEnd = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
            // 종료일 또는 시작일이 지난달 1일보다 크거나 같으면 표시
            return eventEnd >= firstDayPrevMonth;
        });
    }, [filteredEvents]);

    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return listEvents.slice(startIndex, startIndex + itemsPerPage);
    }, [listEvents, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(listEvents.length / itemsPerPage);

    return (
        <div className="flex-1 bg-white font-sans flex flex-col h-full overflow-hidden relative">
            {/* Header - 🛡️ [SMART VISIBILITY] Completely hidden in Public mode for seamless WP integration */}
            {isAdmin && (
                <div className="shrink-0 p-8 flex justify-between items-end border-b border-slate-50">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">협회 일정 관리</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">KKF FULLSCREEN MASTER v4.5</p>
                    </div>
                    <div className="flex gap-2">
                        {/* 🚀 [RESTRICTED] Add button removed as per user request to use CompetitionManagement for data entry */}
                        <button
                            onClick={async () => {
                                await loadEvents();
                                showAlert('데이터 새로고침', '서버에서 최신 일정을 성공적으로 불러왔습니다.');
                            }}
                            className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm active:scale-95 transition-all"
                            title="일정 새로고침"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8 md:py-12 space-y-8 md:space-y-12 bg-[#FBFDFF]">
                {/* Calendar Section */}
                <div className="max-w-[1600px] mx-auto bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 md:px-10 md:py-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 md:gap-4 order-2 sm:order-1">
                            <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden h-9 md:h-10">
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 365))} className="p-2 md:p-2.5 hover:bg-slate-50 border-r border-slate-200 text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft size={14} /><ChevronLeft size={14} className="-ml-2" /></button>
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 md:p-2.5 hover:bg-slate-50 border-r border-slate-200 text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft size={14} /></button>
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 md:p-2.5 hover:bg-slate-50 border-r border-slate-200 text-slate-400 hover:text-slate-900 transition-colors"><ChevronRight size={14} /></button>
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 365))} className="p-2 md:p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"><ChevronRight size={14} /><ChevronRight size={14} className="-ml-2" /></button>
                            </div>
                            <button onClick={() => setCurrentDate(new Date())} className="h-9 md:h-10 px-3 md:px-5 border border-slate-200 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">오늘</button>
                        </div>

                        <h2 className="text-sm md:text-lg font-black text-slate-900 order-1 sm:order-2">
                            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                        </h2>

                        <div className="hidden sm:flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden h-10 order-3">
                            <button className="px-5 h-full text-xs font-bold text-slate-400 hover:text-slate-900 border-r border-slate-200 transition-colors">주</button>
                            <button className="px-5 h-full text-xs font-bold text-slate-900 bg-slate-50 border-r border-slate-200">일</button>
                            <button className="px-5 h-full text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">아젠다</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7">
                        {WEEK_DAYS.map((d, i) => (
                            <div key={i} className={`py-4 md:py-6 text-center text-[10px] md:text-xs font-black border-b border-slate-100 ${i === 6 ? 'text-rose-500' : 'text-slate-800'}`}>
                                <span className="hidden md:inline">{d}</span>
                                <span className="md:hidden">{d.charAt(0)}</span>
                            </div>
                        ))}
                        {daysInMonth.map((date, idx) => {
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isCurrent = date.getMonth() === currentDate.getMonth();
                            const dayEvs = filteredEvents.filter(e => {
                                if (!e.startDate || !e.endDate) return false;
                                const start = new Date(e.startDate);
                                const end = new Date(e.endDate);
                                const current = new Date(date);
                                start.setHours(0, 0, 0, 0);
                                end.setHours(0, 0, 0, 0);
                                current.setHours(0, 0, 0, 0);
                                return current >= start && current <= end;
                            });
                            return (
                                <div key={idx} className={`min-h-[60px] md:min-h-[120px] p-2 md:p-4 border-r border-b border-slate-100 transition-all ${!isCurrent ? 'bg-slate-50/30' : 'bg-white'}`}>
                                    <div className={`text-[10px] md:text-xs font-bold mb-2 md:mb-4 ${isToday ? 'text-indigo-600' : idx % 7 === 6 ? 'text-rose-500' : isCurrent ? 'text-slate-800' : 'text-slate-300'}`}>
                                        {date.getDate()}
                                    </div>
                                    <div className="space-y-1.5">
                                        {dayEvs.map(e => (
                                            <div
                                                key={e.id}
                                                className="text-[7px] md:text-[9px] font-black p-1 md:p-2 rounded-md md:rounded-lg bg-white border border-slate-100 shadow-sm flex items-center gap-1 md:gap-2 truncate hover:bg-slate-50 transition-colors"
                                                title={e.title}
                                            >
                                                {/* Calendar Dot: Specific sub-type color priority */}
                                                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full shrink-0" style={{ backgroundColor: getCatColor(e.category || '', e.type_names || '') }} />
                                                <span className="truncate">{e.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>


                {/* Categories Bar */}
                <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-6 py-2">
                    {categories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setActiveCategory(activeCategory === c.name ? 'all' : c.name)}
                            className={`flex items-center gap-2 group transition-all ${activeCategory === c.name ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <span className="text-xs font-bold text-slate-700">{c.name}</span>
                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: c.color }} />
                        </button>
                    ))}
                    {isAdmin && (
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="ml-auto p-2 text-slate-300 hover:text-indigo-600 transition-all cursor-pointer"
                            title="유형 관리"
                        >
                            <Settings size={18} />
                        </button>
                    )}
                </div>


                {/* List View */}
                <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pb-20 px-4 md:px-0">
                    {paginatedEvents.map((e, idx) => {
                        let extra: any = {
                            subtitle: e.subtitle,
                            judges: e.judges,
                            reg_start_date: e.reg_start_date,
                            reg_end_date: e.reg_end_date,
                            reg_start_h: e.reg_start_h,
                            reg_start_m: e.reg_start_m,
                            reg_end_h: e.reg_end_h,
                            reg_end_m: e.reg_end_m,
                            is_multi_day: e.is_multi_day,
                            is_federation_only: e.is_federation_only
                        };
                        try {
                            if (e.ds_etc) {
                                const parsed = JSON.parse(e.ds_etc);
                                extra = { ...extra, ...parsed };
                            }
                        } catch (err) { }

                        return (
                            <div
                                key={e.id}
                                onClick={() => setViewEvent(e)}
                                className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group cursor-pointer"
                            >
                                {/* Top Image Section */}
                                <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-50">
                                    {e.thumbnail_url ? (
                                        <img
                                            src={e.thumbnail_url}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-[1.03] contrast-[1.05]"
                                            style={{ imageRendering: '-webkit-optimize-contrast' }}
                                            alt={e.title}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Content Section */}
                                <div className="flex-1 p-3 md:p-5 lg:p-6 flex flex-col min-w-0 relative">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-2 mb-2 md:mb-3">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-tight text-slate-800">
                                                / <span style={{ color: getCatColor(e.category || '', e.type_names || '') }}>{e.type_names || e.category}</span>
                                            </span>
                                        </div>

                                        <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full">
                                            <div className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md mb-1">
                                                <span className="text-[8px] md:text-[9px] font-black text-indigo-700 uppercase tracking-tighter">
                                                    {getDayName(e.startDate)}
                                                </span>
                                            </div>
                                            <div className="text-[9px] md:text-[10px] font-black leading-tight">
                                                <div className="flex flex-col sm:items-end gap-0">
                                                    <span className="text-slate-700">{e.startDate}</span>
                                                    <span className="text-slate-400 text-[8px] sm:text-[9px] font-medium opacity-80 leading-none">- {e.endDate}</span>
                                                    <div className="mt-0.5 text-slate-500/70 text-[8px] leading-none font-medium">
                                                        {e.startTime ? `(${e.startTime})` : ''} ~ {e.endTime ? `(${e.endTime})` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3
                                            className="font-black text-[#020617] tracking-tighter leading-tight line-clamp-2"
                                            style={{
                                                fontSize: 'clamp(12px, 1.2vw, 15px)',
                                                lineHeight: '1.2'
                                            }}
                                        >
                                            {e.title}
                                        </h3>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500">
                                                    <MapPin size={12} strokeWidth={3} />
                                                </div>
                                                <span className="text-[11px] md:text-[12px] font-black text-slate-600 truncate">
                                                    {e.venue && !e.venue.includes('미지정') ? e.venue : '장소 추후 공지'}
                                                </span>
                                            </div>
                                            {e.organizer && (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500">
                                                        <Building2 size={12} strokeWidth={3} />
                                                    </div>
                                                    <span className="text-[10px] md:text-[11px] font-black text-slate-400 truncate">
                                                        {e.organizer}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 md:pt-6 lg:pt-8 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {isAdmin && (
                                                <div className="absolute top-2 right-2 flex gap-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                                    <button
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            onEditEvent?.(e);
                                                        }}
                                                        className="p-1.5 md:p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        <Edit2 size={12} className="md:w-4 md:h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                setViewEvent(e);
                                            }}
                                            className="w-full md:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-slate-900 hover:bg-black text-white !text-white text-[10px] md:text-[11px] font-black rounded-lg transition-all shadow-sm active:scale-95 border-none outline-none appearance-none"
                                        >
                                            상세보기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pb-40">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex gap-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl text-sm font-black transition-all appearance-none ${currentPage === i + 1
                                        ? 'bg-slate-900 !text-white shadow-lg scale-110'
                                        : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100'
                                        }`}
                                    style={{ color: currentPage === i + 1 ? '#ffffff' : undefined }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

            </div>

            {/* 🚀 FULLSCREEN Master Event Editor Modal */}
            {
                isEditorOpen && (
                    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-300">
                        <div className="w-full h-full bg-white flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden relative">
                            {/* Top Controls */}
                            <div className="shrink-0 p-8 border-b flex justify-between items-center bg-slate-50/50 relative z-20">
                                <div className="flex items-center gap-8">
                                    <button onClick={() => setIsEditorOpen(false)} className="p-4 bg-white hover:shadow-xl rounded-[24px] transition-all border border-slate-100 group">
                                        <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">고성능 행사 에디터 <div className="px-3 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold tracking-widest">FULLSCREEN MODE</div></h2>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">Maximum creative space for association events</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsEditorOpen(false)} className="px-8 py-4 text-xs font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest">작성 취소</button>
                                    <button
                                        onClick={handleSaveEvent}
                                        disabled={isSaving}
                                        className="bg-slate-900 text-white px-16 py-6 rounded-[28px] font-black text-[16px] shadow-xl flex items-center gap-4 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                        최종 데이터 서버 업로드
                                    </button>
                                </div>
                            </div>

                            {/* Main Grid */}
                            <div className="flex-1 overflow-y-auto w-full">
                                <div className="max-w-[2000px] mx-auto p-12 lg:p-16 grid grid-cols-1 xl:grid-cols-12 gap-16">
                                    {/* Left: Editor */}
                                    <div className="xl:col-span-8 flex flex-col gap-12">
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3"><Type size={14} /> 메인 콘텐츠 및 홍보 타이틀</label>
                                            <input
                                                type="text"
                                                value={formData.post_title}
                                                onChange={e => setFormData({ ...formData, post_title: e.target.value })}
                                                placeholder="강렬하고 선명한 제목을 입력하세요..."
                                                className="w-full text-6xl font-black text-slate-900 border-none outline-none focus:ring-0 tracking-tighter placeholder:text-slate-100 py-4 leading-tight"
                                            />
                                            <input
                                                type="text"
                                                value={formData.subtitle}
                                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                                placeholder="대회 부제목을 입력하세요 (예: 2024 KKF Championship)"
                                                className="w-full text-xl font-bold text-indigo-400 border-none outline-none focus:ring-0 tracking-tight placeholder:text-slate-100 pb-4"
                                            />
                                        </div>
                                        <div className="flex flex-col min-h-[700px]">
                                            <label className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><ImageIcon size={14} /> 상세 홍보 내용 및 사진 삽입</label>
                                            <CustomEditor
                                                value={formData.post_content}
                                                onChange={(val) => setFormData({ ...formData, post_content: val })}
                                                onImageUpload={async (file) => {
                                                    const result = await internalImageUpload(file);
                                                    if (result && !formData.thumbnail_url) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            thumbnail_url: result.url,
                                                            thumbnail_id: result.id.toString()
                                                        }));
                                                    }
                                                    return result;
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {/* Right: Settings */}
                                    <div className="xl:col-span-4 space-y-12">
                                        <div className="space-y-6">
                                            <label className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3"><ImageIcon size={14} /> 대표 썸네일 (최적화 모드)</label>
                                            <div className="relative group w-full aspect-video rounded-[48px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 transition-all shadow-inner group">
                                                {formData.thumbnail_url ? (
                                                    <img src={formData.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-6 text-slate-300">
                                                        <div className="p-8 bg-white rounded-full shadow-sm border border-slate-50"><Upload size={48} strokeWidth={1} /></div>
                                                        <span className="text-[12px] font-black tracking-widest uppercase">Select Cover</span>
                                                    </div>
                                                )}
                                                <input type="file" onChange={handleThumbnailUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-10 rounded-[48px] border border-slate-100 space-y-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">행사 기간 (시작/종료)</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-5 bg-white border border-slate-100 rounded-2xl text-xs font-black shadow-sm" />
                                                        <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full p-5 bg-white border border-slate-100 rounded-2xl text-xs font-black shadow-sm" />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full p-5 bg-white border border-slate-100 rounded-2xl text-xs font-black shadow-sm" />
                                                        <input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full p-5 bg-white border border-slate-100 rounded-2xl text-xs font-black shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">개최 위치 및 주최자 정보</label>
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <MapPin className="absolute left-5 top-5 text-rose-400" size={18} />
                                                        <input
                                                            type="text"
                                                            placeholder="정확한 장소 정보를 입력하세요"
                                                            value={formData.venue}
                                                            onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                                            className="w-full p-5 pl-14 bg-white border border-slate-100 rounded-2xl text-xs font-black shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-5 top-5 text-indigo-400" size={18} />
                                                        <input
                                                            type="text"
                                                            placeholder="주최자(단체명)를 입력하세요"
                                                            value={formData.organizer}
                                                            onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                                                            className="w-full p-5 pl-14 bg-white border border-slate-100 rounded-2xl text-xs font-black shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4 border-t border-slate-200 pt-8 mt-4">
                                                <label className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] ml-2">접수 기간 설정</label>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">접수 시작</span>
                                                        <div className="flex gap-2">
                                                            <input type="date" value={formData.reg_start_date} onChange={e => setFormData({ ...formData, reg_start_date: e.target.value })} className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-[11px] font-black" />
                                                            <input type="text" value={formData.reg_start_h} onChange={e => setFormData({ ...formData, reg_start_h: e.target.value })} className="w-12 p-3 bg-slate-50 border-none rounded-xl text-[11px] font-black text-center" placeholder="시" />
                                                            <input type="text" value={formData.reg_start_m} onChange={e => setFormData({ ...formData, reg_start_m: e.target.value })} className="w-12 p-3 bg-slate-50 border-none rounded-xl text-[11px] font-black text-center" placeholder="분" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">접수 마감</span>
                                                        <div className="flex gap-2">
                                                            <input type="date" value={formData.reg_end_date} onChange={e => setFormData({ ...formData, reg_end_date: e.target.value })} className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-[11px] font-black" />
                                                            <input type="text" value={formData.reg_end_h} onChange={e => setFormData({ ...formData, reg_end_h: e.target.value })} className="w-12 p-3 bg-slate-50 border-none rounded-xl text-[11px] font-black text-center" placeholder="시" />
                                                            <input type="text" value={formData.reg_end_m} onChange={e => setFormData({ ...formData, reg_end_m: e.target.value })} className="w-12 p-3 bg-slate-50 border-none rounded-xl text-[11px] font-black text-center" placeholder="분" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">카테고리 & 옵션</label>
                                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-5 bg-white border border-slate-100 rounded-2xl text-xs font-black appearance-none cursor-pointer outline-none shadow-sm mb-4">
                                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>

                                                <label className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${formData.is_federation_only ? 'bg-indigo-600 shadow-indigo-200 shadow-lg' : 'bg-slate-100'}`}>
                                                        {formData.is_federation_only && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={formData.is_federation_only} onChange={e => setFormData({ ...formData, is_federation_only: e.target.checked })} />
                                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">여러 일동안 진행되는 대회</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 🚀 Detail View Modal */}
            {
                viewEvent && (() => {
                    let extra: any = {};
                    try { extra = viewEvent.ds_etc ? JSON.parse(viewEvent.ds_etc) : {}; } catch (err) { }
                    return (
                        <div className="fixed inset-0 z-[450] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
                            <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
                                {/* Detail Header */}
                                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <span
                                            className="px-4 py-1.5 text-white rounded-xl text-[10px] font-black tracking-widest uppercase"
                                            style={{ backgroundColor: getCatColor(viewEvent.category || '', viewEvent.type_names || '') }}
                                        >
                                            {viewEvent.type_names || viewEvent.category}
                                        </span>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">행사 상세 정보</h3>
                                    </div>
                                    <button
                                        onClick={() => setViewEvent(null)}
                                        className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all text-slate-400 hover:text-slate-900"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Detail Content */}
                                <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                        {/* Info Sidebar */}
                                        <div className="lg:col-span-4 space-y-8">
                                            <div className="rounded-3xl overflow-hidden shadow-xl aspect-square bg-slate-100 relative group">
                                                {viewEvent.thumbnail_url ? (
                                                    <img src={viewEvent.thumbnail_url} className="w-full h-full object-cover" alt={viewEvent.title} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                        <ImageIcon size={64} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-6">
                                                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-4 bg-indigo-50 rounded-2xl shadow-sm text-indigo-600"><Clock size={22} strokeWidth={2.5} /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">행사 일시</p>
                                                            <p className="text-sm font-black text-slate-800 leading-tight">
                                                                {viewEvent.startDate} {viewEvent.startTime ? `(${viewEvent.startTime})` : ''}
                                                                <br />
                                                                <span className="text-slate-300 mx-auto block my-1">~</span>
                                                                {viewEvent.endDate || viewEvent.startDate} {viewEvent.endTime ? `(${viewEvent.endTime})` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {(viewEvent.reg_start_date || extra.reg_start_date || viewEvent.reg_end_date || extra.reg_end_date) && (
                                                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                                                            <div className="p-3 bg-white rounded-xl shadow-sm text-rose-500"><Save size={18} /></div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">접수 기간</p>
                                                                <p className="text-[11px] font-black text-slate-700">
                                                                    {viewEvent.reg_start_date || extra.reg_start_date} {viewEvent.reg_start_h || extra.reg_start_h ? `(${viewEvent.reg_start_h || extra.reg_start_h}:${viewEvent.reg_start_m || extra.reg_start_m})` : ''} ~
                                                                    <br />
                                                                    {viewEvent.reg_end_date || extra.reg_end_date} {viewEvent.reg_end_h || extra.reg_end_h ? `(${viewEvent.reg_end_h || extra.reg_end_h}:${viewEvent.reg_end_m || extra.reg_end_m})` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                                                        <div className="p-3 bg-white rounded-xl shadow-sm text-rose-400"><MapPin size={18} /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">장소</p>
                                                            <p className="text-xs font-black text-slate-800">{viewEvent.venue || ' '}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                                                        <div className="p-3 bg-white rounded-xl shadow-sm text-blue-400"><Building2 size={18} /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주최</p>
                                                            <p className="text-xs font-black text-slate-800">{viewEvent.organizer || '(사)한국애견협회'}</p>
                                                        </div>
                                                    </div>

                                                    {(viewEvent.judges || extra.judges) && (
                                                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                                                            <div className="p-3 bg-white rounded-xl shadow-sm text-amber-500"><Trophy size={18} /></div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">심사위원</p>
                                                                <p className="text-xs font-black text-slate-800">{viewEvent.judges || extra.judges}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {extra.is_federation_only && (
                                                        <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                                                            <Check size={16} className="text-indigo-600" />
                                                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">여러 일동안 진행되는 대회</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Body */}
                                        <div className="lg:col-span-8 space-y-8">
                                            <div className="space-y-4">
                                                {extra.subtitle && (
                                                    <p className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em]">{extra.subtitle}</p>
                                                )}
                                                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                                                    {viewEvent.title}
                                                </h2>
                                            </div>
                                            <div
                                                className="prose prose-indigo max-w-none text-slate-600 border-t border-slate-50 pt-8"
                                                dangerouslySetInnerHTML={{ __html: viewEvent.content }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-3">
                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                setViewEvent(null);
                                                onEditEvent?.(viewEvent);
                                            }}
                                            className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
                                        >
                                            수정하기
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setViewEvent(null)}
                                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-black transition-all shadow-xl uppercase tracking-widest"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

            {/* Category Modal - 🛡️ Admin Only */}
            {
                isAdmin && isCategoryModalOpen && (
                    <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
                        <div className="bg-white rounded-[56px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-2xl font-black tracking-tight flex items-center gap-4"><Palette className="text-indigo-600" /> 유형 마스터</h3>
                                <button onClick={() => setIsCategoryModalOpen(false)} className="p-3 bg-white hover:shadow-lg rounded-[20px] transition-all"><X /></button>
                            </div>
                            <div className="p-10 space-y-10">
                                <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 space-y-8">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">새 유형 추가</label>
                                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="유형 이름을 입력하세요..." className="w-full p-6 rounded-3xl border-none font-bold text-sm shadow-sm outline-none" />
                                    <div className="flex flex-wrap gap-3">
                                        {COLOR_PALETTE.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`w-10 h-10 rounded-2xl transition-all ${selectedColor === c ? 'ring-4 ring-indigo-500/10 scale-110 shadow-md' : ''}`} style={{ backgroundColor: c }}>{selectedColor === c && <Check size={18} className="mx-auto text-white" />}</button>)}
                                    </div>
                                    <button onClick={handleAddCategory} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs shadow-xl active:scale-95 transition-all">새로운 유형 생성</button>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">현재 등록된 유형</label>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {categories.map(c => (
                                            <div key={c.id} className="flex justify-between items-center bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-5 h-5 rounded-lg" style={{ backgroundColor: c.color }} />
                                                    <span className="text-sm font-black text-slate-700">{c.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCategory(c.id)}
                                                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* 🔄 Local Loading Overlay */}
            {
                isLoading && (
                    <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100">
                            <Loader2 className="animate-spin text-indigo-600" size={40} />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">데이터 로딩 중...</span>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
