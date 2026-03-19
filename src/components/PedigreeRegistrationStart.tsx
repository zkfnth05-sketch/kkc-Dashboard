
import React, { useState, useEffect } from 'react';
import { ChevronRight, Info, Loader2 } from 'lucide-react';
import { fetchDogClasses } from '../services/pedigreeService';

const REG_TYPES = [
  { label: '자견', value: 'D' },
  { label: '수입견', value: 'I' },
  { label: '타단체견', value: 'E' },
  { label: '단독견', value: 'S' },
  { label: '국내 관계견', value: 'DR' },
  { label: '외국 관계견', value: 'FR' },
  { label: 'NR', value: 'N' },
];

interface PedigreeRegistrationStartProps {
  onNext: (data: any) => void;
  onCancel: () => void;
}

export const PedigreeRegistrationStart: React.FC<PedigreeRegistrationStartProps> = ({ onNext, onCancel }) => {
  const [selectedType, setSelectedType] = useState('D');
  const [group, setGroup] = useState('');
  const [breed, setBreed] = useState('');
  const [count, setCount] = useState(1);
  const [dogClasses, setDogClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchDogClasses();
        setDogClasses(data);
      } catch (e) {
        console.error("Failed to fetch dog classes:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadClasses();
  }, []);

  const groups = Array.from(new Set(dogClasses.map(d => d.group))).filter(Boolean).sort();
  const breeds = dogClasses.filter(d => !group || d.group === group).map(d => d.breed).sort();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20">
        <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">견종 목록을 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50/50 p-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 ml-1">혈통서 등록 옵션 선택</h2>
        
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-10 space-y-10">
            {/* 등록 타입 */}
            <div className="flex items-start">
              <label className="w-32 pt-2 text-sm font-bold text-slate-500">등록 타입</label>
              <div className="flex-1 flex flex-wrap gap-3">
                {REG_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-200 border ${
                      selectedType === type.value
                        ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-sm shadow-blue-100'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* 견종 그룹 */}
            <div className="flex items-center">
              <label className="w-32 text-sm font-bold text-slate-500">견종 그룹</label>
              <select 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg h-12 px-4 text-sm outline-none focus:border-blue-400 transition-colors cursor-pointer appearance-none"
                value={group}
                onChange={(e) => {
                  setGroup(e.target.value);
                  setBreed('');
                }}
              >
                <option value="">선택</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* 견종 */}
            <div className="flex items-center">
              <label className="w-32 text-sm font-bold text-slate-500">견종</label>
              <select 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg h-12 px-4 text-sm outline-none focus:border-blue-400 transition-colors cursor-pointer appearance-none"
                value={breed}
                onChange={(e) => {
                  setBreed(e.target.value);
                  const found = dogClasses.find(d => d.breed === e.target.value);
                  if (found && !group) setGroup(found.group);
                }}
              >
                <option value="">선택</option>
                {breeds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* 등록 마리 수 */}
            <div className="flex items-center">
              <label className="w-32 text-sm font-bold text-slate-500">등록 마리 수</label>
              <input 
                type="number"
                min="1"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg h-12 px-4 text-sm outline-none focus:border-blue-400 transition-colors"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <button 
                onClick={onCancel}
                className="px-8 py-3 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => onNext({ selectedType, group, breed, count, dogClasses })}
                className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-3 rounded-lg text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
              >
                다음 단계 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3 text-blue-600/70">
           <Info size={18} className="shrink-0 mt-0.5" />
           <p className="text-[12px] leading-relaxed">
             신규 등록의 첫 번째 단계입니다. 등록 타입에 따라 하단의 입력 항목이 달라질 수 있습니다.<br/>
             정확한 정보 입력을 위해 등록 옵션을 먼저 선택해주시기 바랍니다.
           </p>
        </div>
      </div>
    </div>
  );
};
