import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SearchableColorSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { uid?: string; name: string }[];
  placeholder?: string;
  className?: string;
}

// 🎯 약자(Abbreviation) -> 정식 명칭 매핑 테이블
const ABBREVIATION_MAP: Record<string, string> = {
  'blk': 'BLACK',
  'wh': 'WHITE',
  'br': 'BRINDLE',
  'brn': 'BROWN',
  'tn': 'TAN',
  'red': 'RED',
  'yel': 'YELLOW',
  'cre': 'CREAM',
  'slv': 'SILVER',
  'grn': 'GREEN',
  'gld': 'GOLD',
  'blu': 'BLUE',
  'chc': 'CHOCOLATE'
};

export const SearchableColorSelect: React.FC<SearchableColorSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '모색 검색/선택...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with prop value when external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Outside click handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & prioritize options based on query
  const getFilteredOptions = () => {
    const qClean = query.trim().toLowerCase();
    if (!qClean) return options;

    // Check if query matches abbreviation
    const mappedWord = ABBREVIATION_MAP[qClean] ? ABBREVIATION_MAP[qClean].toLowerCase() : qClean;

    // 1순위: 정식 명칭과 정확히 일치하거나 매핑된 단어와 정확히 일치하는 모색
    const exactMatches: typeof options = [];
    // 2순위: 검색어나 매핑 단어로 시작하는 모색 (예: BLACK & BRINDLE)
    const startsWithMatches: typeof options = [];
    // 3순위: 검색어나 매핑 단어를 포함하는 모색
    const containsMatches: typeof options = [];

    const addedSet = new Set<string>();

    options.forEach(opt => {
      const nameLower = opt.name.toLowerCase();
      const shortKeyLower = (opt as any).shortKey ? (opt as any).shortKey.toLowerCase() : '';
      if (addedSet.has(opt.name)) return;

      if (
        nameLower === qClean || 
        nameLower === mappedWord || 
        (shortKeyLower && shortKeyLower === qClean)
      ) {
        exactMatches.push(opt);
        addedSet.add(opt.name);
      } else if (
        nameLower.startsWith(qClean) || 
        nameLower.startsWith(mappedWord) || 
        (shortKeyLower && shortKeyLower.startsWith(qClean))
      ) {
        startsWithMatches.push(opt);
        addedSet.add(opt.name);
      } else if (
        nameLower.includes(qClean) || 
        nameLower.includes(mappedWord) || 
        (shortKeyLower && shortKeyLower.includes(qClean))
      ) {
        containsMatches.push(opt);
        addedSet.add(opt.name);
      }
    });

    return [...exactMatches, ...startsWithMatches, ...containsMatches];
  };

  const filteredOptions = getFilteredOptions();

  const handleSelect = (optionName: string) => {
    onChange(optionName);
    setQuery(optionName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input box matching user's screenshot styling */}
      <div 
        className={`flex items-center justify-between border rounded-lg bg-white px-2.5 py-1.5 transition-all cursor-text text-[12px] ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <input 
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full outline-none bg-transparent text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-normal text-[12px]"
        />
        <div className="flex items-center gap-1 ml-1 text-slate-400 shrink-0">
          {query && (
            <button 
              type="button" 
              onClick={handleClear}
              className="p-0.5 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </div>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.name === value;
              return (
                <div
                  key={opt.uid || idx}
                  onClick={() => handleSelect(opt.name)}
                  className={`px-3 py-2 text-[12px] font-bold cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-600 font-extrabold' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>
                    {opt.name}
                    {(opt as any).shortKey && (opt as any).shortKey !== opt.name && (
                      <span className="text-slate-400 font-normal text-[10px] ml-1.5">
                        ({(opt as any).shortKey})
                      </span>
                    )}
                  </span>
                  {isSelected && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black">선택됨</span>}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-3 text-[12px] text-slate-400 italic text-center">
              검색 결과가 없습니다. (입력값 사용)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
