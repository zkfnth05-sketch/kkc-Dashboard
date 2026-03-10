import React from 'react';
import { Check } from 'lucide-react';
import { BaseTab, Competition } from './BaseTab';

interface StylistTabProps {
    subTabs: string[];
    onSelectComp: (c: Competition) => void;
    onApplyComp: (c: Competition, tabName: string) => void;
}

export const StylistTab: React.FC<StylistTabProps> = ({ subTabs, onSelectComp, onApplyComp }) => {
    const renderHeader = (activeSubTab: string, setActiveSubTab: (t: string) => void) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl">
            {subTabs.map((tab) => {
                const isIntl = tab.includes('국제');
                const isSelected = activeSubTab === tab;
                return (
                    <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`group relative flex-1 p-8 rounded-[32px] border-2 transition-all duration-500 text-center flex flex-col items-center gap-4 overflow-hidden ${isSelected
                            ? 'bg-emerald-50/30 border-teal-500 shadow-xl shadow-teal-500/10'
                            : 'bg-white border-slate-100 hover:border-teal-200 hover:bg-slate-50/50'
                            }`}
                    >
                        <div className="text-5xl transition-transform duration-500 group-hover:scale-110">
                            {isIntl ? '🌍' : '🏆'}
                        </div>
                        <div className="space-y-1 relative z-10">
                            <h3 className={`text-xl font-black transition-colors ${isSelected ? 'text-teal-600' : 'text-slate-800'}`}>
                                {isIntl ? '국제 반려견스타일리스트 경연대회' : '일반 반려견스타일리스트 경연대회'}
                            </h3>
                            <p className={`text-[13px] font-bold transition-colors ${isSelected ? 'text-teal-600/60' : 'text-slate-400'}`}>
                                {isIntl ? '국제 규격에 따른 반려견스타일리스트 경연대회' : '국내 반려견스타일리스트 경연대회'}
                            </p>
                        </div>
                        {isSelected && (
                            <div className="absolute top-4 right-6">
                                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20">
                                    <Check size={18} className="text-white" strokeWidth={3} />
                                </div>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );

    return (
        <BaseTab
            subTabs={subTabs}
            onSelectComp={onSelectComp}
            onApplyComp={onApplyComp}
            customRenderHeader={renderHeader}
        />
    );
};
