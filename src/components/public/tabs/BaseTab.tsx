import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, MapPin, ArrowRight, User, Trophy, Search, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { fetchDogShows } from '../../../services/eventService';

export interface Competition {
    id: string | number;
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    content: string;
    thumbnail_url?: string;
    category?: string;
    venue?: string;
    judges?: string;
    subtitle?: string;
    reg_start_date?: string;
    reg_end_date?: string;
    reg_start_h?: string;
    reg_start_m?: string;
    reg_end_h?: string;
    reg_end_m?: string;
    organizer?: string;
    applicant_count?: number;
}

interface BaseTabProps {
    subTabs: string[];
    onSelectComp: (c: Competition) => void;
    onApplyComp: (c: Competition, tabName: string) => void;
    customRenderHeader?: (activeSubTab: string, setActiveSubTab: (t: string) => void) => React.ReactNode;
    initialSubTab?: string;
}

export const BaseTab: React.FC<BaseTabProps> = ({ subTabs, onSelectComp, onApplyComp, customRenderHeader, initialSubTab }) => {
    const [activeSubTab, setActiveSubTab] = useState(initialSubTab && subTabs.includes(initialSubTab) ? initialSubTab : subTabs[0]);
    const [data, setData] = useState<Competition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const cache = useRef<Record<string, { data: Competition[], total: number }>>({});

    const loadData = useCallback(async (page: number = 1, cat: string = activeSubTab) => {
        const cacheKey = `${cat}-${page}`;
        if (cache.current[cacheKey]) {
            const cached = cache.current[cacheKey];
            setData(cached.data);
            setTotal(cached.total);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const pageSize = 20;
            const res = await fetchDogShows(page, '', pageSize, cat);
            const allItems = res.data || [];

            // 🛡️ [SAFETY] 서버가 limit을 무시하고 전체 데이터를 다 보내주는 경우를 대비한 클라이언트 사이드 슬라이싱
            // 서버에서 이미 페이징을 해서 보냈다면 allItems.length는 20 이하일 것입니다.
            // 만약 20보다 많다면 서버가 페이징을 무시한 것이므로 프론트에서 해당 페이지 분량만 자릅니다.
            let paginatedData = allItems;
            if (allItems.length > pageSize) {
                const startIndex = (page - 1) * pageSize;
                paginatedData = allItems.slice(startIndex, startIndex + pageSize);
            }

            const sanitized = paginatedData.map((item: any) => {
                const sDt = item.actual_start_dt || item.startDate || '';
                const sParts = sDt.split(' ');
                const startDate = sParts[0] || '';
                const startTime = (item.startTime && item.startTime !== '00:00:00') ? item.startTime.substring(0, 5) : (sParts[1] ? sParts[1].substring(0, 5) : '10:00');

                const eDt = item.actual_end_dt || item.endDate || '';
                const eParts = eDt.split(' ');
                const endDate = eParts[0] || '';
                const endTime = (item.endTime && item.endTime !== '00:00:00') ? item.endTime.substring(0, 5) : (eParts[1] ? eParts[1].substring(0, 5) : '18:00');

                return {
                    ...item,
                    startDate,
                    startTime,
                    endDate: endDate || startDate,
                    endTime,
                    venue: item.venue || item.venue_name || item.event_venue || '장소 추후 공지',
                    organizer: item.organizer || item.organizer_name || '(사)한국애견협회',
                    category: item.category || item.type_names || '기타'
                };
            });

            const totalCount = parseInt(res.total) || allItems.length;
            cache.current[cacheKey] = { data: sanitized, total: totalCount };
            setData(sanitized);
            setTotal(totalCount);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [activeSubTab]);

    useEffect(() => { loadData(currentPage, activeSubTab); }, [currentPage, activeSubTab]);

    const getStatus = (comp: Competition) => {
        const now = new Date();
        const regStart = comp.reg_start_date ? new Date(`${comp.reg_start_date} ${comp.reg_start_h || '00'}:${comp.reg_start_m || '00'}:00`) : null;
        const regEnd = comp.reg_end_date ? new Date(`${comp.reg_end_date} ${comp.reg_end_h || '23'}:${comp.reg_end_m || '59'}:00`) : null;

        if (regStart && now < regStart) return { text: '접수예정', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        if (regEnd && now > regEnd) return { text: '접수 종료', color: 'bg-slate-100 text-slate-500 border-slate-200' };
        return { text: '접수중', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    };

    return (
        <div className="space-y-12">
            <header className="flex flex-col items-center justify-center gap-10 w-full overflow-hidden">
                {customRenderHeader ? (
                    customRenderHeader(activeSubTab, (t) => { setActiveSubTab(t); setCurrentPage(1); })
                ) : (
                    <div className="inline-flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-[20px] shadow-inner border border-white/50">
                        {subTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveSubTab(tab); setCurrentPage(1); }}
                                className={`px-8 py-3.5 rounded-[15px] text-[13px] font-bold transition-all duration-500 ${activeSubTab === tab
                                    ? 'bg-white text-teal-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            <div className="flex-1 relative">
                <div className="bg-white rounded-[40px] shadow-[0_20px_80px_rgb(0,0,0,0.04)] border border-slate-100/50 overflow-hidden flex flex-col relative transition-all min-h-[400px] w-full max-w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                    {/* 🚀 [NEW: LOADING OVERLAY] */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 transition-all duration-300">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                                <Loader2 className="animate-spin text-teal-500" size={32} />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">데이터를 불러오는 중입니다</p>
                        </div>
                    )}

                    {/* 🖥️ 1. DESKTOP TABLE VIEW (Visible on lg and above) */}
                    <div className="overflow-x-auto w-full max-w-full desktop-only" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="w-full text-left min-w-[1100px] border-separate border-spacing-0" style={{ maxWidth: '100%' }}>
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="py-8 px-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">대회 리스트</th>
                                    <th className="py-8 px-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">장소 및 정보</th>
                                    <th className="py-8 px-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">접수기간</th>
                                    <th className="py-8 px-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">대회 일정</th>
                                    <th className="py-8 px-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">진행상태</th>
                                    <th className="py-8 px-10 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">신청하기</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={`skeleton-${i}`} className="animate-pulse">
                                            <td colSpan={6} className="py-9 px-10">
                                                <div className="h-20 bg-slate-50 rounded-2xl" />
                                            </td>
                                        </tr>
                                    ))
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <Search size={48} />
                                                <p className="font-black text-sm uppercase tracking-widest text-slate-400">데이터가 없습니다.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, index) => {
                                        const status = getStatus(item);
                                        return (
                                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-all duration-500">
                                                <td className="py-9 px-10">
                                                    <div className="flex items-start gap-6">
                                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden group-hover:shadow-lg transition-all duration-500">
                                                            {item.thumbnail_url ? (
                                                                <img src={item.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" loading="lazy" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Calendar size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5 pt-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest px-2 py-0.5 bg-teal-50 rounded-md">Event</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{extractNumericId(item.id)}</span>
                                                            </div>
                                                            <h3 className="text-base font-black text-slate-800 leading-tight group-hover:text-teal-600 transition-colors cursor-pointer" onClick={() => onSelectComp(item)}>{item.title}</h3>
                                                            <p className="text-xs font-bold text-slate-400 line-clamp-1">{item.organizer}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-9 px-6">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2.5 group/info">
                                                            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 group-hover/info:bg-teal-600 group-hover/info:text-white transition-all"><MapPin size={12} strokeWidth={3} /></div>
                                                            <span className="text-[13px] font-bold text-slate-600 truncate max-w-[180px]">{item.venue}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 group/info">
                                                            <div className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 group-hover/info:bg-slate-800 group-hover/info:text-white transition-all"><Trophy size={12} strokeWidth={3} /></div>
                                                            <span className="text-[13px] font-bold text-slate-500 truncate max-w-[180px]">{item.judges || '심사위원 추후 공지'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-9 px-6 whitespace-nowrap">
                                                    <div className="space-y-2">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-8 text-[9px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded text-center">시작</span>
                                                                <span className="text-[13px] font-[900] text-slate-700 tabular-nums">
                                                                    {item.reg_start_date ? `${item.reg_start_date} ${item.reg_start_h || '00'}:${item.reg_start_m || '00'}` : '미정'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-8 text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-center">종료</span>
                                                                <span className="text-[13px] font-[900] text-slate-700 tabular-nums">
                                                                    {item.reg_end_date ? `${item.reg_end_date} ${item.reg_end_h || '23'}:${item.reg_end_m || '59'}` : '미정'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-9 px-6 whitespace-nowrap">
                                                    <div className="space-y-2">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-8 text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-center">시작</span>
                                                                <span className="text-[13px] font-black text-slate-800 tabular-nums">{item.startDate} {item.startTime}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-8 text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-center">종료</span>
                                                                <span className="text-[13px] font-black text-slate-800 tabular-nums">{item.endDate} {item.endTime}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-400 pl-0.5">최종 진행 일정</p>
                                                    </div>
                                                </td>
                                                <td className="py-9 px-6 whitespace-nowrap">
                                                    <div className="flex justify-center items-center">
                                                        <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest shadow-sm whitespace-nowrap ${status.color}`}>
                                                            {status.text}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-9 px-10">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => onSelectComp(item)}
                                                            className="px-5 py-3 border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all uppercase tracking-widest active:scale-95 whitespace-nowrap"
                                                        >
                                                            상세보기
                                                        </button>
                                                        <button
                                                            onClick={() => onApplyComp(item, activeSubTab)}
                                                            disabled={status.text === '접수 종료'}
                                                            className={`px-8 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 whitespace-nowrap ${status.text === '접수 종료'
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale'
                                                                : 'bg-slate-900 !text-white hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/30'
                                                                }`}
                                                            style={status.text !== '접수 종료' ? { color: 'white' } : {}}
                                                        >
                                                            신청하기
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 📱 2. MOBILE CARD VIEW (Visible below lg) */}
                    <div className="flex flex-col gap-5 p-5 bg-slate-50/30 mobile-only">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={`mobile-skeleton-${i}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4 animate-pulse">
                                    <div className="h-14 bg-slate-50 rounded-2xl w-full" />
                                    <div className="h-20 bg-slate-50 rounded-2xl w-full" />
                                    <div className="h-12 bg-slate-50 rounded-2xl w-full mt-2" />
                                </div>
                            ))
                        ) : data.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-100">
                                <Search size={40} className="text-slate-200 mb-4" />
                                <p className="font-black text-xs uppercase tracking-widest text-slate-400">데이터가 없습니다.</p>
                            </div>
                        ) : (
                            data.map((item) => {
                                const status = getStatus(item);
                                return (
                                    <div key={`mobile-${item.id}`} className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex flex-col gap-5 relative overflow-hidden">
                                        {/* Status Badge Positioned at Top Right */}
                                        <div className="absolute top-6 right-6 flex items-center gap-2">
                                            <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${status.color}`}>
                                                {status.text}
                                            </div>
                                        </div>

                                        {/* 1. Header & Title */}
                                        <div className="flex gap-4 pr-20">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 mt-1 shadow-inner">
                                                {item.thumbnail_url ? (
                                                    <img src={item.thumbnail_url} className="w-full h-full object-cover" loading="lazy" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Calendar size={20} /></div>
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest px-1.5 py-0.5 bg-teal-50 rounded">Event</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{extractNumericId(item.id)}</span>
                                                </div>
                                                <h3 
                                                    className="font-[900] text-slate-800 tracking-tighter line-clamp-2"
                                                    style={{ 
                                                        fontSize: 'clamp(12px, 1.25vw, 15px)',
                                                        lineHeight: '1.2'
                                                    }}
                                                >
                                                    {item.title}
                                                </h3>
                                                <p className="text-[11px] font-bold text-slate-400 mt-1 line-clamp-1">{item.organizer}</p>
                                            </div>
                                        </div>

                                        {/* 2. Key Info (Venue & Judges) */}
                                        <div className="flex flex-col gap-2.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-md bg-white text-teal-600 shadow-sm"><MapPin size={12} strokeWidth={2.5} /></div>
                                                <span className="text-xs font-bold text-slate-600 truncate">{item.venue || '장소 미정'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-md bg-white text-slate-400 shadow-sm"><Trophy size={12} strokeWidth={2.5} /></div>
                                                <span className="text-xs font-bold text-slate-500 truncate">{item.judges || '심사위원 추후 공지'}</span>
                                            </div>
                                        </div>

                                        {/* 3. Dates (Registration & Event) */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">접수기간</p>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[11px] font-[900] text-slate-700 tracking-tight">
                                                        <span className="text-teal-500 mr-1">시</span> {item.reg_start_date ? `${item.reg_start_date} ${item.reg_start_h || '00'}:${item.reg_start_m || '00'}` : '미정'}
                                                    </p>
                                                    <p className="text-[11px] font-[900] text-slate-700 tracking-tight">
                                                        <span className="text-rose-500 mr-1">종</span> {item.reg_end_date ? `${item.reg_end_date} ${item.reg_end_h || '23'}:${item.reg_end_m || '59'}` : '미정'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대회일정</p>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[11px] font-[900] text-slate-700 tracking-tight">
                                                        <span className="text-indigo-500 mr-1">시</span> {item.startDate} {item.startTime}
                                                    </p>
                                                    <p className="text-[11px] font-[900] text-slate-700 tracking-tight">
                                                        <span className="text-indigo-500 mr-1">종</span> {item.endDate} {item.endTime}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Action Buttons */}
                                        <div className="flex items-center gap-3 w-full mt-2">
                                            <button
                                                onClick={() => onSelectComp(item)}
                                                className="flex-1 py-3.5 border border-slate-200 bg-white text-slate-600 rounded-2xl text-[12px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
                                            >
                                                상세보기
                                            </button>
                                            <button
                                                onClick={() => onApplyComp(item, activeSubTab)}
                                                disabled={status.text === '접수 종료'}
                                                className={`flex-[1.5] py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${status.text === '접수 종료'
                                                    ? 'bg-slate-100 text-slate-400'
                                                    : 'bg-slate-900 !text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20'
                                                    }`}
                                                style={status.text !== '접수 종료' ? { color: 'white' } : {}}
                                            >
                                                신청하기
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 🏁 Pagination Styling (Grouped by 10) */}
                    {!isLoading && total > 20 && (() => {
                        const totalPages = Math.ceil(total / 20);
                        const pageGroupSize = 10;
                        const currentGroup = Math.ceil(currentPage / pageGroupSize);
                        const startPage = (currentGroup - 1) * pageGroupSize + 1;
                        const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

                        return (
                            <div className="p-10 bg-slate-50/30 flex justify-center items-center border-t border-slate-100 w-full" style={{ position: 'relative', zIndex: 50 }}>
                                <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-4xl mx-auto">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, startPage - 1))}
                                        disabled={currentGroup === 1}
                                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl disabled:opacity-20 transition-all font-bold"
                                        style={{ color: '#94a3b8' }}
                                    >
                                        <ChevronsLeft size={18} />
                                    </button>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl disabled:opacity-20 transition-all font-bold"
                                        style={{ color: '#94a3b8' }}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                                            const pageNum = startPage + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 rounded-xl text-[13px] font-black transition-all ${currentPage === pageNum
                                                        ? 'bg-teal-500 shadow-xl shadow-teal-500/20 scale-110 z-10'
                                                        : 'bg-white border border-slate-100 hover:bg-slate-50'
                                                        }`}
                                                    style={currentPage === pageNum ? { color: '#ffffff', backgroundColor: '#14b8a6' } : { color: '#94a3b8', backgroundColor: '#ffffff' }}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl disabled:opacity-20 transition-all font-bold"
                                        style={{ color: '#94a3b8' }}
                                    >
                                        <ChevronRight size={18} />
                                    </button>

                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, endPage + 1))}
                                        disabled={endPage >= totalPages}
                                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl disabled:opacity-20 transition-all font-bold text-[13px]"
                                        style={{ color: '#94a3b8' }}
                                    >
                                        <ChevronsRight size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

// Utils
const extractNumericId = (idStr: string | number) => {
    if (typeof idStr === 'number') return idStr;
    const match = String(idStr).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[1]}/${parts[2]}`;
};
