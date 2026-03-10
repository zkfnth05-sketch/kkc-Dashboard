/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { Database, Upload, Server, Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, Terminal as TerminalIcon, FileText, Activity, Loader2, Gauge, Clock, Zap } from 'lucide-react';
import { runSqlBatch } from '../services/memberService';

interface MigrationLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const DataIntegrationPage: React.FC = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedBytes, setProcessedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchSize, setBatchSize] = useState(500);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [qps, setQps] = useState(0);
  const [eta, setEta] = useState<string>('--:--:--');

  const logEndRef = useRef<HTMLDivElement>(null);
  const migrationRef = useRef<{
    offset: number;
    isRunning: boolean;
    isPaused: boolean;
    totalQueries: number;
    startTime: number;
  }>({ offset: 0, isRunning: false, isPaused: false, totalQueries: 0, startTime: 0 });

  const addLog = (message: string, type: MigrationLog['type'] = 'info') => {
    const newLog: MigrationLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev.slice(-100), newLog]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTotalBytes(file.size);
      addLog(`파일 준비됨: ${file.name} (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB)`, 'success');
      migrationRef.current.offset = 0;
      setProgress(0);
      setProcessedBytes(0);
      setQps(0);
      setEta('--:--:--');
    }
  };

  const calculateStats = (currentProcessed: number, total: number) => {
    if (!migrationRef.current.startTime) return;
    const elapsed = (Date.now() - migrationRef.current.startTime) / 1000;
    if (elapsed <= 0) return;

    const currentQps = migrationRef.current.totalQueries / elapsed;
    setQps(Math.round(currentQps));

    if (currentProcessed > 0) {
      const remainingBytes = total - currentProcessed;
      const bytesPerSecond = currentProcessed / elapsed;
      const remainingSeconds = remainingBytes / bytesPerSecond;

      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const s = Math.floor(remainingSeconds % 60);
      setEta(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
  };

  const startMigration = async () => {
    if (!selectedFile) return;

    setIsMigrating(true);
    setIsPaused(false);
    migrationRef.current.isRunning = true;
    migrationRef.current.isPaused = false;
    migrationRef.current.startTime = Date.now();
    migrationRef.current.totalQueries = 0;
    setStartTime(Date.now());

    addLog(`마이그레이션 엔진 가동... 스트리밍 시작`, 'warning');

    const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB 단위로 읽기
    let leftover = "";

    while (migrationRef.current.offset < selectedFile.size && migrationRef.current.isRunning) {
      if (migrationRef.current.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      try {
        const slice = selectedFile.slice(migrationRef.current.offset, migrationRef.current.offset + CHUNK_SIZE);
        const text = await slice.text();
        const combined = leftover + text;

        // 정교한 SQL 분할 (세미콜론 기준, 따옴표 안의 세미콜론은 무시하는 간단한 로직)
        const queries: string[] = [];
        let currentQuery = "";
        let inQuote = false;
        let quoteChar = "";

        for (let i = 0; i < combined.length; i++) {
          const char = combined[i];
          if ((char === "'" || char === '"') && combined[i - 1] !== '\\') {
            if (!inQuote) {
              inQuote = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuote = false;
            }
          }

          if (char === ';' && !inQuote) {
            queries.push(currentQuery.trim() + ";");
            currentQuery = "";
          } else {
            currentQuery += char;
          }
        }
        leftover = currentQuery;

        if (queries.length > 0) {
          for (let i = 0; i < queries.length; i += batchSize) {
            if (!migrationRef.current.isRunning) break;
            const batch = queries.slice(i, i + batchSize);

            const res = await runSqlBatch(batch);
            migrationRef.current.totalQueries += batch.length;

            if (Math.random() > 0.95) {
              addLog(`배치 실행 성공: ${batch.length}개 쿼리 반영됨`, 'info');
            }

            calculateStats(migrationRef.current.offset, selectedFile.size);
          }
        }

        migrationRef.current.offset += CHUNK_SIZE;
        const currentProgress = (migrationRef.current.offset / selectedFile.size) * 100;
        setProgress(Math.min(currentProgress, 100));
        setProcessedBytes(Math.min(migrationRef.current.offset, selectedFile.size));

      } catch (e: any) {
        addLog(`중명 오류: ${e.message}`, 'error');
        migrationRef.current.isRunning = false;
        break;
      }
    }

    if (migrationRef.current.offset >= selectedFile.size) {
      addLog("마이그레이션이 성공적으로 완료되었습니다!", "success");
      setIsMigrating(false);
      migrationRef.current.isRunning = false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-8 space-y-8 overflow-y-auto">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Database className="text-blue-600 w-8 h-8" /> SQL Migration Studio
          </h2>
          <p className="text-slate-500 font-medium">대용량 SQL 파일을 실시간 스트리밍 방식으로 워드프레스 DB에 통합합니다.</p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`w-3 h-3 rounded-full ${isMigrating && !isPaused ? 'bg-green-500 animate-ping' : 'bg-slate-300'}`} />
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              System: {isMigrating && !isPaused ? 'Active' : isPaused ? 'Paused' : 'Idle'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-widest border-b pb-4">
              <Zap className="text-amber-500" size={18} /> Configuration
            </div>

            <div className="space-y-5">
              <div
                className={`group border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${selectedFile ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'}`}
                onClick={() => !isMigrating && document.getElementById('sql-file-input')?.click()}
              >
                <div className={`p-4 rounded-2xl ${selectedFile ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'} transition-colors group-hover:scale-110 duration-300`}>
                  <FileText size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-800">{selectedFile ? selectedFile.name : 'SQL 파일 선택'}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-tight">
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : 'MAX 4GB SUPPORTED'}
                  </p>
                </div>
                <input id="sql-file-input" type="file" accept=".sql" className="hidden" onChange={handleFileChange} disabled={isMigrating} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Performance</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  disabled={isMigrating}
                >
                  <option value="100">Safe (100 Quries)</option>
                  <option value="500">Standard (500 Quries)</option>
                  <option value="1000">Turbo (1,000 Quries)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                  <AlertTriangle size={14} /> Safety Guard
                </div>
                <p className="text-[11px] leading-relaxed opacity-80">
                  트랜잭션 배치가 활성화되었습니다. 오류 발생 시 해당 배치는 자동 롤백됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dashboard Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Gauge size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Processing Speed</p>
                <p className="text-2xl font-black text-slate-900 font-mono">{qps.toLocaleString()} <span className="text-sm text-slate-400">QPS</span></p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Time</p>
                <p className="text-2xl font-black text-slate-900 font-mono">{eta}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Progress</p>
                <p className="text-2xl font-black text-slate-900 font-mono">{progress.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Byte Stream Progress</span>
                  <div className="text-3xl font-black text-slate-900">{(processedBytes / 1024 / 1024).toFixed(1)} MB <span className="text-slate-300 font-medium">/ {(totalBytes / 1024 / 1024).toFixed(1)} MB</span></div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-blue-600 font-mono">{progress.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-8 rounded-2xl overflow-hidden border border-slate-200 relative p-1 shadow-inner">
                <div
                  className={`h-full transition-all duration-500 ease-out rounded-xl shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-indigo-600`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]" />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {!isMigrating ? (
                <button
                  onClick={startMigration}
                  disabled={!selectedFile}
                  className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xl flex items-center gap-4 shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <Play size={24} fill="currentColor" /> MIGRATION START
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsPaused(!isPaused);
                      migrationRef.current.isPaused = !migrationRef.current.isPaused;
                    }}
                    className="flex-1 bg-amber-500 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all"
                  >
                    {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </button>
                  <button
                    onClick={() => {
                      migrationRef.current.isRunning = false;
                      setIsMigrating(false);
                    }}
                    className="flex-1 bg-slate-800 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-slate-800/20 hover:bg-slate-900 transition-all"
                  >
                    <RotateCcw size={24} /> STOP
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl flex flex-col min-h-[400px]">
        <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
              <TerminalIcon size={14} /> Migration Execution Logs
            </span>
          </div>
          <button onClick={() => setLogs([])} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase">Clear Console</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.1),transparent)]">
          {logs.length === 0 && (
            <div className="text-slate-600 italic">No logs recorded. System waiting for input...</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-slate-600 shrink-0 tabular-nums">[{log.timestamp}]</span>
              <span className={`
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'error' ? 'text-rose-400 font-bold' : ''}
                    ${log.type === 'warning' ? 'text-amber-400' : ''}
                    ${log.type === 'info' ? 'text-blue-400' : 'text-slate-300'}
                  `}>
                <span className="mr-2">{log.type === 'success' ? '✔' : log.type === 'error' ? '✖' : log.type === 'warning' ? '⚠' : 'ℹ'}</span>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
        <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800/50 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="text-[10px] text-slate-500 font-bold">SQL_ENGINE: V2.0_STREAM</span>
            <span className="text-[10px] text-slate-500 font-bold">MODE: TRANSACTION_BATCH</span>
          </div>
          <span className="text-[10px] text-blue-500 font-black">MEM_LIMIT: 1024MB</span>
        </div>
      </div>

      <style>{`
        @keyframes progress-bar-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};