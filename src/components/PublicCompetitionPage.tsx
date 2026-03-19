import React, { useState, Suspense, lazy } from 'react';
import {
    ChevronLeft, ChevronRight, MapPin, Calendar,
    ArrowRight, X, Dog, Building2, Clock, Trophy,
    Info, Sparkles, LayoutGrid, List, Loader2, Globe, Check, Search
} from 'lucide-react';

// 🚀 [SPEED OPTIMIZATION: MODULAR ARCHITECTURE]
// 디자인은 그대로 유지하되, 데이터 처리 부하를 줄이기 위해 카테고리별 탭만 지연 로딩합니다.
const BaseTab = lazy(() => import('./public/tabs/BaseTab').then(m => ({ default: m.BaseTab })));
const StylistTab = lazy(() => import('./public/tabs/StylistTab').then(m => ({ default: m.StylistTab })));
const PublicApplicantForm = lazy(() => import('./PublicApplicantForm').then(m => ({ default: m.PublicApplicantForm })));

// --- Types ---
interface Competition {
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

interface MainCategory {
    id: string;
    name: string;
    subTabs: string[];
    icon: React.ReactNode;
}

const CATEGORIES: MainCategory[] = [
    { id: 'dogshow', name: '도그쇼', subTabs: ['도그쇼', '셰퍼드 전람회', '진도견 선발대회'], icon: <Trophy size={18} /> },
    { id: 'stylist', name: '반려견 스타일리스트', subTabs: ['반려견 스타일리스트 경연대회', '반려견 스타일리스트 경연대회(국제)'], icon: <Sparkles size={18} /> },
    { id: 'sports', name: '독스포츠', subTabs: ['훈련 경기대회', '어질리티', '디스크독', '플라이볼'], icon: <LayoutGrid size={18} /> },
    { id: 'seminar', name: '세미나 및 교육', subTabs: ['세미나'], icon: <Info size={18} /> },
    { id: 'breed_exam', name: '종견인정검사', subTabs: ['종견인정검사'], icon: <Dog size={18} /> },
];

export const PublicCompetitionPage: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('cat');
    const subParam = params.get('sub') || '';

    const [activeMainCat, setActiveMainCat] = useState<MainCategory>(() => {
        const found = CATEGORIES.find(c => c.id === catParam);
        return found || CATEGORIES[0];
    });

    const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
    const [applyingComp, setApplyingComp] = useState<Competition | null>(null);
    const [applyTabHint, setApplyTabHint] = useState<string>('');
    const [alert, setAlert] = useState<{ title: string, message: string } | null>(null);

    const showAlert = (title: string, message: string) => {
        setAlert({ title, message });
    };

    const TabLoading = (
        <div className="flex flex-col items-center justify-center p-40 gap-6 opacity-40">
            <Loader2 className="animate-spin text-teal-500" size={48} />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">로딩 중...</p>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row flex-nowrap bg-[#F8FAFB] text-slate-900 font-sans selection:bg-teal-100 items-start">
            {/* 🏛️ Premium Sidebar (Dark Design Reverted) */}
            <div className="w-full lg:w-[320px] bg-[#0F172A] flex-shrink-0 flex flex-col pt-16 pb-10 border-r border-slate-800 relative shadow-none z-0 rounded-l-[16px]">
                <div className="px-10 mb-20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Sparkles className="text-white" size={22} />
                        </div>
                        <span className="text-[10px] font-black text-teal-400 tracking-[0.3em] uppercase">Registration</span>
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight tracking-tighter" style={{ color: 'white' }}>
                        대회 <br /> 안내 및 신청
                    </h2>
                </div>

                <nav className="flex-1 space-y-1 px-4">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveMainCat(cat)}
                            className={`w-full px-6 py-4 rounded-2xl flex items-center justify-between transition-all duration-300 group ${activeMainCat.id === cat.id
                                ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/20'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`transition-colors ${activeMainCat.id === cat.id ? 'text-white' : 'text-slate-500 group-hover:text-teal-400'}`}>
                                    {cat.icon}
                                </div>
                                <span className="text-[15px] font-bold tracking-tight !text-white">{cat.name}</span>
                            </div>
                            {activeMainCat.id === cat.id && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-10 mt-10 opacity-30">
                    <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">© KKC Dog Show Service</p>
                </div>
            </div>

            {/* 🖼️ Main Content Area (Original Design Restored) */}
            <div className="flex-1 min-w-0 flex flex-col p-8 lg:p-16 max-w-full lg:max-w-[1600px] mx-auto w-full relative z-20 overflow-hidden bg-[#F8FAFB]">
                <header className="mb-12 w-full">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[2px] w-8 bg-teal-500 rounded-full" />
                        <span className="text-[11px] font-black text-teal-600 uppercase tracking-widest">{activeMainCat.name}</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-10">
                        {activeMainCat.name}
                    </h1>

                    <div className="w-full">
                        <Suspense fallback={TabLoading}>
                            {activeMainCat.id === 'stylist' ? (
                                <StylistTab
                                    key={activeMainCat.id}
                                    subTabs={activeMainCat.subTabs}
                                    onSelectComp={setSelectedComp}
                                    onApplyComp={(c, tab) => { setApplyingComp(c); setApplyTabHint(tab); }}
                                    initialSubTab={subParam}
                                />
                            ) : (
                                <BaseTab
                                    key={activeMainCat.id}
                                    subTabs={activeMainCat.subTabs}
                                    onSelectComp={setSelectedComp}
                                    onApplyComp={(c, tab) => { setApplyingComp(c); setApplyTabHint(tab); }}
                                    initialSubTab={subParam}
                                />
                            )}
                        </Suspense>
                    </div>
                </header>
            </div>

            {/* 📋 Competition Detail Modal (Original Style Restored) */}
            {selectedComp && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 lg:p-12">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setSelectedComp(null)} />
                    <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[50px] shadow-[0_40px_120px_rgb(0,0,0,0.3)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedComp.category}</span>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">대회 인사이트</h3>
                            </div>
                            <button
                                onClick={() => setSelectedComp(null)}
                                className="w-12 h-12 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-all flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 lg:p-20">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                                <div className="lg:col-span-5 space-y-12">
                                    {selectedComp.thumbnail_url && (
                                        <div className="aspect-square rounded-[40px] overflow-hidden bg-slate-100 border-8 border-slate-50 shadow-2xl relative group">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-transparent mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            <img src={selectedComp.thumbnail_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={selectedComp.title} />
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <div className="p-8 bg-slate-50/50 rounded-[40px] border border-slate-100 space-y-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-indigo-500">
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">대회 일시</p>
                                                    <p className="text-[15px] font-black text-slate-800 leading-tight">
                                                        {selectedComp.startDate} ({selectedComp.startTime})
                                                        <br />
                                                        <span className="text-slate-300 mx-auto block my-1">~</span>
                                                        {selectedComp.endDate} ({selectedComp.endTime})
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 border-t border-slate-100/50 pt-8">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-teal-500">
                                                    <Clock size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">접수 기간</p>
                                                    <p className="text-[15px] font-black text-slate-800 leading-tight">
                                                        {selectedComp.reg_start_date || '미정'} ~
                                                        <br />
                                                        {selectedComp.reg_end_date || '미정'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 border-t border-slate-100/50 pt-8">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-rose-500">
                                                    <MapPin size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">장소</p>
                                                    <p className="text-[15px] font-black text-slate-800">{selectedComp.venue}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 border-t border-slate-100/50 pt-8">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-amber-500">
                                                    <Trophy size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">심사의원</p>
                                                    <p className="text-[15px] font-black text-slate-800">{selectedComp.judges || '심사위원 추후 공지'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-7">
                                    <div className="flex flex-col h-full bg-white rounded-[40px] border-2 border-slate-100 p-12 overflow-hidden relative">
                                        <div className="absolute top-0 right-10 -translate-y-1/2">
                                            <div className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/40">Overview</div>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">{selectedComp.title}</h2>
                                        {selectedComp.subtitle && <p className="text-lg font-bold text-slate-400 mb-10">{selectedComp.subtitle}</p>}

                                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                            <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedComp.content }} />
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Organized By</p>
                                                <p className="text-[14px] font-[900] text-slate-900">{selectedComp.organizer}</p>
                                            </div>
                                            <button
                                                onClick={() => { setApplyingComp(selectedComp); setApplyTabHint(selectedComp.category || ''); setSelectedComp(null); }}
                                                className="px-10 py-5 bg-teal-500 text-white rounded-[24px] text-[13px] font-[900] uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/30 hover:bg-teal-600 transition-all flex items-center gap-4 group"
                                            >
                                                신청하기
                                                <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 📝 Application Form Modal (Lazy loaded wrapper) */}
            <Suspense fallback={<div className="fixed inset-0 z-[700] bg-slate-950/20 backdrop-blur-md flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" /></div>}>
                {applyingComp && (
                    <PublicApplicantForm
                        competition={applyingComp}
                        onClose={() => { setApplyingComp(null); setApplyTabHint(''); }}
                        showAlert={showAlert}
                        categoryHint={applyTabHint}
                    />
                )}
            </Suspense>

            {/* 🔔 Custom Alert Modal */}
            {alert && (
                <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in" onClick={() => setAlert(null)} />
                    <div className="relative bg-white p-12 rounded-[40px] shadow-2xl max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                            <Sparkles size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-[900] text-slate-900 tracking-tight mb-3">{alert.title}</h3>
                            <p className="text-[15px] font-bold text-slate-500 leading-relaxed">{alert.message}</p>
                        </div>
                        <button onClick={() => setAlert(null)} className="w-full py-5 bg-slate-900 !text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/10">확인하였습니다</button>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                /* 🚀 [STYLE FIX] Force white text for premium buttons to override theme defaults */
                #root .text-white, 
                #root .!text-white,
                #root button.text-white,
                #root button.bg-slate-900,
                #root button.bg-slate-800,
                #root button.bg-teal-500 {
                    color: white !important;
                }
            `}</style>
        </div>
    );
};
