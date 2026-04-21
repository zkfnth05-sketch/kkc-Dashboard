
import React from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

export interface FeeOption {
  id?: number;
  label: string;
  price: number;
  is_required: boolean;
}

interface Props {
  options: FeeOption[];
  onUpdate: (options: FeeOption[]) => void;
}

const FeeOptionEditor: React.FC<Props> = ({ options, onUpdate }) => {
  const addRow = () => {
    onUpdate([...options, { label: '', price: 0, is_required: false }]);
  };

  const removeRow = (index: number) => {
    onUpdate(options.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, key: keyof FeeOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [key]: value };
    onUpdate(newOptions);
  };

  return (
    <div className="mt-8 mb-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">참가비 및 부스 옵션 설정</h3>
          <p className="text-[12px] text-gray-500 mt-1">대회 신청 시 사용자가 선택할 수 있는 금액들을 설정합니다.</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
        >
          <Plus size={16} /> 항목 추가
        </button>
      </div>

      <div className="space-y-3">
        {options.map((opt, idx) => (
          <div key={idx} className="flex gap-3 items-center animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex-1">
              <input
                type="text"
                placeholder="내용 (예: 베이비 참가비, 실내 1부스 등)"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-[14px] outline-none focus:border-blue-500 transition-colors"
                value={opt.label}
                onChange={(e) => updateRow(idx, 'label', e.target.value)}
              />
            </div>
            <div className="w-48 relative">
              <input
                type="number"
                placeholder="0"
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-[14px] text-right outline-none focus:border-blue-500 transition-colors"
                value={opt.price}
                onChange={(e) => updateRow(idx, 'price', parseInt(e.target.value) || 0)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 font-bold">원</span>
            </div>
            <label className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={opt.is_required}
                onChange={(e) => updateRow(idx, 'is_required', e.target.checked)}
              />
              <span className="text-[12px] font-bold text-gray-600 whitespace-nowrap">필수입력</span>
            </label>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {options.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-gray-400 text-[13px]">등록된 금액 옵션이 없습니다.</p>
            <button
              type="button"
              onClick={addRow}
              className="mt-2 text-blue-600 text-[13px] font-bold hover:underline"
            >
              지금 첫 번째 옵션을 추가해보세요
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-start gap-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
        <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} />
        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
          설정된 항목들은 사용자 신청 폼에 자동으로 노출되며, 사용자가 선택한 내역에 따라 최종 금액이 자동 계산됩니다.
        </p>
      </div>
    </div>
  );
};

export default FeeOptionEditor;
