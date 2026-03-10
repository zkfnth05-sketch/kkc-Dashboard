import React from 'react';
import { Flag, RotateCcw, ChevronRight } from 'lucide-react';

interface Checkpoint {
  id: string;
  timestamp: string;
  data: any;
  label: string;
}

interface CheckpointBarProps {
  checkpoints: Checkpoint[];
  onRestore: (checkpoint: Checkpoint) => void;
  onViewDiff: (checkpoint: Checkpoint) => void;
}

export const CheckpointBar: React.FC<CheckpointBarProps> = ({ checkpoints, onRestore, onViewDiff }) => {
  if (checkpoints.length === 0) return null;

  // 가장 최근 체크포인트 표시
  const latest = checkpoints[checkpoints.length - 1];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between sticky top-0 z-40 shadow-sm animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Flag size={16} className="text-gray-400" />
          <span className="text-sm font-medium">Checkpoint</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">
            {latest.label} ({latest.timestamp})
          </span>
        </div>
        
        <button 
          onClick={() => onViewDiff(latest)}
          className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          View diff
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-1 mr-2">
           {checkpoints.slice(-3).map((cp, i) => (
             <div key={cp.id} className="w-2 h-2 rounded-full bg-blue-400 border border-white" title={cp.label} />
           ))}
        </div>
        
        <button 
          onClick={() => onRestore(latest)}
          className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw size={14} />
          Restore
        </button>
      </div>
    </div>
  );
};