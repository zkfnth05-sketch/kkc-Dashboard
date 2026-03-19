/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { Database, Upload, Download, Server, Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, Terminal as TerminalIcon, FileText, Activity, Loader2, Gauge, Clock, Zap, HardDrive, Table2 } from 'lucide-react';
import { runSqlBatch, fetchTableBatch, fetchAllTableNames } from '../services/memberService';

interface MigrationLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

type ActiveTab = 'upload' | 'download';

export const DataIntegrationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');

  // ──────────────────────────────
  // UPLOAD STATE
  // ──────────────────────────────
  const [isMigrating, setIsMigrating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedBytes, setProcessedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchSize, setBatchSize] = useState(500);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [qps, setQps] = useState(0);
  const [eta, setEta] = useState<string>('--:--:--');

  // ──────────────────────────────
  // DOWNLOAD STATE
  // ──────────────────────────────
  const [tableList, setTableList] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [dlBatchSize, setDlBatchSize] = useState(500);
  const [isExporting, setIsExporting] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlTotal, setDlTotal] = useState(0);
  const [dlFetched, setDlFetched] = useState(0);
  const [dlQps, setDlQps] = useState(0);
  const [dlEta, setDlEta] = useState('--:--:--');
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  // 전체 DB 내보내기 전용 state
  const [exportMode, setExportMode] = useState<'single' | 'all'>('single');
  const [dbTableProgress, setDbTableProgress] = useState(0);   // 완료된 테이블 수
  const [dbTableTotal, setDbTableTotal] = useState(0);          // 전체 테이블 수
  const [dbCurrentTable, setDbCurrentTable] = useState('');     // 현재 처리 중 테이블

  // ──────────────────────────────
  // SHARED: LOGS
  // ──────────────────────────────
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // UPLOAD ref
  const migrationRef = useRef<{
    offset: number;
    isRunning: boolean;
    isPaused: boolean;
    totalQueries: number;
    startTime: number;
  }>({ offset: 0, isRunning: false, isPaused: false, totalQueries: 0, startTime: 0 });

  // DOWNLOAD ref
  const exportRef = useRef<{
    isRunning: boolean;
    startTime: number;
    totalFetched: number;
  }>({ isRunning: false, startTime: 0, totalFetched: 0 });

  // WritableStreamDefaultWriter ref (showSaveFilePicker)
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);

  const addLog = (message: string, type: MigrationLog['type'] = 'info') => {
    const newLog: MigrationLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev.slice(-150), newLog]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 탭 전환 시 테이블 목록 로드
  useEffect(() => {
    if (activeTab === 'download' && tableList.length === 0) {
      loadTableList();
    }
  }, [activeTab]);

  const loadTableList = async () => {
    setIsLoadingTables(true);
    try {
      const tables = await fetchAllTableNames();
      setTableList(tables as string[]);
      if (tables.length > 0) setSelectedTable(tables[0] as string);
      addLog(`서버에서 테이블 목록 로드 완료: ${tables.length}개`, 'success');
    } catch (e: any) {
      addLog(`테이블 목록 로드 실패: ${e.message}`, 'error');
    } finally {
      setIsLoadingTables(false);
    }
  };

  // ──────────────────────────────
  // UPLOAD LOGIC
  // ──────────────────────────────
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

  const calculateUploadStats = (currentProcessed: number, total: number) => {
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
    const CHUNK_SIZE = 1024 * 1024 * 2;
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
        const queries: string[] = [];
        let currentQuery = "";
        let inQuote = false;
        let quoteChar = "";
        for (let i = 0; i < combined.length; i++) {
          const char = combined[i];
          if ((char === "'" || char === '"') && combined[i - 1] !== '\\') {
            if (!inQuote) { inQuote = true; quoteChar = char; }
            else if (char === quoteChar) { inQuote = false; }
          }
          if (char === ';' && !inQuote) {
            queries.push(currentQuery.trim() + ";");
            currentQuery = "";
          } else { currentQuery += char; }
        }
        leftover = currentQuery;
        if (queries.length > 0) {
          for (let i = 0; i < queries.length; i += batchSize) {
            if (!migrationRef.current.isRunning) break;
            const batch = queries.slice(i, i + batchSize);
            await runSqlBatch(batch);
            migrationRef.current.totalQueries += batch.length;
            if (Math.random() > 0.95) {
              addLog(`배치 실행 성공: ${batch.length}개 쿼리 반영됨`, 'info');
            }
            calculateUploadStats(migrationRef.current.offset, selectedFile.size);
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

  // ──────────────────────────────
  // DOWNLOAD LOGIC
  // ──────────────────────────────
  const calculateDlStats = (fetched: number, total: number, startedAt: number) => {
    const elapsed = (Date.now() - startedAt) / 1000;
    if (elapsed <= 0 || fetched <= 0) return;
    const rowsPerSec = fetched / elapsed;
    setDlQps(Math.round(rowsPerSec));
    const remaining = total - fetched;
    const remainSec = remaining / rowsPerSec;
    const h = Math.floor(remainSec / 3600);
    const m = Math.floor((remainSec % 3600) / 60);
    const s = Math.floor(remainSec % 60);
    setDlEta(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  };

  // ──────────────────────────────────────────────────────
  // 단일 테이블 내보내기 (writer 또는 chunks 로 저장)
  // ──────────────────────────────────────────────────────
  const exportSingleTable = async (
    table: string,
    writer: WritableStreamDefaultWriter<string> | null,
    chunks: string[],
    isFirstTable: boolean
  ): Promise<boolean> => {
    let offset = 0;
    let totalRows = 0;
    let isFirstBatch = true;

    addLog(`[EXPORT] '${table}' 내보내기 시작...`, 'warning');

    while (exportRef.current.isRunning) {
      try {
        const res = await fetchTableBatch(table, offset, dlBatchSize, isFirstBatch);

        if (!res.success) {
          addLog(`서버 오류 (${table}): ${(res as any).error}`, 'error');
          return false;
        }

        if (isFirstBatch) {
          totalRows = res.total;
          // 전체 DB 모드에선 dlTotal을 누적하지 않고 현재 테이블 진행만 표시
          if (exportMode === 'single') {
            setDlTotal(totalRows);
            addLog(`전체 ${totalRows.toLocaleString()}행 확인됨. 내보내기 진행 중...`, 'info');
          }
          isFirstBatch = false;
        }

        if (res.sql) {
          if (writer) await writer.write(res.sql);
          else chunks.push(res.sql);
        }

        exportRef.current.totalFetched += res.fetched;
        setDlFetched(exportRef.current.totalFetched);

        if (exportMode === 'single') {
          const pct = totalRows > 0 ? (exportRef.current.totalFetched / totalRows) * 100 : 0;
          setDlProgress(Math.min(pct, 100));
          calculateDlStats(exportRef.current.totalFetched, totalRows, exportRef.current.startTime);
        } else {
          // 전체 DB 모드: 현재 테이블 내 진행률을 dlProgress로 표시
          const pct = totalRows > 0 ? ((exportRef.current.totalFetched % (totalRows || 1)) / totalRows) * 100 : 0;
          const rowPct = totalRows > 0 ? (res.next_offset / totalRows) * 100 : 100;
          setDlProgress(Math.min(rowPct, 100));
        }

        if (Math.random() > 0.75) {
          addLog(`[${table}] ${res.next_offset.toLocaleString()} / ${totalRows.toLocaleString()} 행`, 'info');
        }

        if (res.is_done) {
          addLog(`[${table}] ✔ 완료 (${totalRows.toLocaleString()}행)`, 'success');
          return true;
        }

        offset = res.next_offset;
      } catch (e: any) {
        addLog(`오류 (${table}): ${e.message}`, 'error');
        return false;
      }
    }
    return false; // 중단됨
  };

  // ──────────────────────────────────────────────────────
  // 메인 내보내기 진입점 (단일 / 전체 DB 공통)
  // ──────────────────────────────────────────────────────
  const startExport = async () => {
    const isAllMode = exportMode === 'all';
    if (!isAllMode && !selectedTable) return;

    const targetTables = isAllMode ? [...tableList] : [selectedTable];
    if (targetTables.length === 0) {
      addLog('내보낼 테이블이 없습니다. 먼저 테이블 목록을 새로고침하세요.', 'error');
      return;
    }

    const supportsFilePicker = typeof (window as any).showSaveFilePicker === 'function';
    let writer: WritableStreamDefaultWriter<string> | null = null;
    let chunks: string[] = [];

    const filename = isAllMode
      ? `kkc_full_db_export_${new Date().toISOString().slice(0, 10)}.sql`
      : `${selectedTable}_export_${new Date().toISOString().slice(0, 10)}.sql`;

    if (supportsFilePicker) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'SQL File', accept: { 'text/plain': ['.sql'] } }],
        });
        const writable = await fileHandle.createWritable();
        writer = writable.getWriter();
        writerRef.current = writer;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        addLog(`저장 대화상자 오류: ${e.message}`, 'error');
        return;
      }
    }

    setIsExporting(true);
    exportRef.current = { isRunning: true, startTime: Date.now(), totalFetched: 0 };
    setDlProgress(0);
    setDlFetched(0);
    setDlTotal(0);
    setDlQps(0);
    setDlEta('--:--:--');
    setDbTableProgress(0);
    setDbTableTotal(isAllMode ? targetTables.length : 0);
    setDbCurrentTable('');

    if (isAllMode) {
      addLog(`[FULL DB EXPORT] 총 ${targetTables.length}개 테이블 내보내기 시작`, 'warning');
      // 파일 헤더
      const header = `-- KKC Full DB Export\n-- Tables: ${targetTables.length}\n-- Generated: ${new Date().toISOString()}\n-- ============================================================\n\nSET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n`;
      if (writer) await writer.write(header);
      else chunks.push(header);
    } else {
      addLog(`[EXPORT] '${selectedTable}' 테이블 내보내기 시작 (배치: ${dlBatchSize}행)`, 'warning');
    }

    let doneCount = 0;
    for (const table of targetTables) {
      if (!exportRef.current.isRunning) break;
      setDbCurrentTable(table);
      const ok = await exportSingleTable(table, writer, chunks, doneCount === 0);
      doneCount++;
      setDbTableProgress(doneCount);
      // 전체 DB 모드: 테이블 간 구분선
      if (isAllMode && writer) await writer.write(`\n-- ============================================================\n\n`);
      if (isAllMode) calculateDlStats(doneCount, targetTables.length, exportRef.current.startTime);
    }

    if (isAllMode) {
      const footer = `\nSET FOREIGN_KEY_CHECKS=1;\n-- Export finished: ${new Date().toISOString()}\n`;
      if (writer) await writer.write(footer);
      else chunks.push(footer);
    }

    // 파일 저장 마무리
    if (writer) {
      await writer.close();
      writerRef.current = null;
      addLog(`✔ 파일이 선택한 위치에 저장되었습니다.`, 'success');
    } else if (chunks.length > 0) {
      const blob = new Blob(chunks, { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      addLog(`✔ 다운로드가 시작되었습니다.`, 'success');
    }

    setIsExporting(false);
    exportRef.current.isRunning = false;
    setDbCurrentTable('');
    setDlProgress(100);
  };

  const stopExport = async () => {
    exportRef.current.isRunning = false;
    setIsExporting(false);
    if (writerRef.current) {
      try { await writerRef.current.close(); } catch (_) {}
      writerRef.current = null;
    }
    addLog('[EXPORT] 내보내기가 중단되었습니다.', 'warning');
  };

  // ──────────────────────────────
  // RENDER
  // ──────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Database className="text-blue-600 w-8 h-8" /> SQL Migration Studio
          </h2>
          <p className="text-slate-500 font-medium">대용량 SQL 파일을 실시간 스트리밍 방식으로 워드프레스 DB에 통합하거나 내보냅니다.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${(isMigrating && !isPaused) || isExporting ? 'bg-green-500 animate-ping' : 'bg-slate-300'}`} />
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            System: {isMigrating && !isPaused ? 'Uploading' : isExporting ? 'Exporting' : isPaused ? 'Paused' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Upload size={16} /> DB 업로드 (SQL → 서버)
        </button>
        <button
          onClick={() => setActiveTab('download')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'download' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Download size={16} /> DB 다운로드 (서버 → SQL)
        </button>
      </div>

      {/* =========================================
           UPLOAD TAB
         ========================================= */}
      {activeTab === 'upload' && (
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
                    <option value="100">Safe (100 Queries)</option>
                    <option value="500">Standard (500 Queries)</option>
                    <option value="1000">Turbo (1,000 Queries)</option>
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

          {/* Right Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Gauge size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Processing Speed</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">{qps.toLocaleString()} <span className="text-sm text-slate-400">QPS</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Clock size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Time</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">{eta}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><CheckCircle2 size={28} /></div>
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
                    className="h-full transition-all duration-500 ease-out rounded-xl shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-indigo-600"
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
                      onClick={() => { setIsPaused(!isPaused); migrationRef.current.isPaused = !migrationRef.current.isPaused; }}
                      className="flex-1 bg-amber-500 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all"
                    >
                      {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                      {isPaused ? 'RESUME' : 'PAUSE'}
                    </button>
                    <button
                      onClick={() => { migrationRef.current.isRunning = false; setIsMigrating(false); }}
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
      )}

      {/* =========================================
           DOWNLOAD TAB
         ========================================= */}
      {activeTab === 'download' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-widest border-b pb-4">
                <HardDrive className="text-emerald-500" size={18} /> Export Config
              </div>
              <div className="space-y-5">

                {/* 내보내기 모드 선택 */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Export Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setExportMode('single')}
                      disabled={isExporting}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1.5 border-2 ${
                        exportMode === 'single'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <Table2 size={16} />
                      단일 테이블
                    </button>
                    <button
                      onClick={() => setExportMode('all')}
                      disabled={isExporting}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1.5 border-2 ${
                        exportMode === 'all'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      <Database size={16} />
                      전체 DB
                    </button>
                  </div>
                </div>

                {/* 테이블 선택 (단일 모드에서만) */}
                {exportMode === 'single' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Table</label>
                    <button
                      onClick={loadTableList}
                      disabled={isLoadingTables || isExporting}
                      className="text-[10px] font-black text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1"
                    >
                      {isLoadingTables ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />} 새로고침
                    </button>
                  </div>
                  {isLoadingTables ? (
                    <div className="flex items-center justify-center h-12 bg-slate-50 rounded-xl border border-slate-200">
                      <Loader2 size={18} className="animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      disabled={isExporting}
                    >
                      {tableList.length === 0 && <option value="">-- 연결 후 로드 --</option>}
                      {tableList.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
                )}

                {/* 전체 DB 모드: 테이블 수 표시 */}
                {exportMode === 'all' && (
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-violet-700 font-black text-[11px] uppercase tracking-widest">
                    <Database size={13} /> Full DB Mode
                  </div>
                  {tableList.length === 0 ? (
                    <button onClick={loadTableList} disabled={isLoadingTables} className="w-full text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 justify-center">
                      {isLoadingTables ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} 테이블 목록 로드
                    </button>
                  ) : (
                    <p className="text-[12px] text-violet-700 font-bold">
                      총 <span className="text-xl font-black">{tableList.length}</span>개 테이블을 하나의 SQL 파일로 내보냅니다.
                    </p>
                  )}
                </div>
                )}

                {/* 배치 크기 */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Size (rows)</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={dlBatchSize}
                    onChange={(e) => setDlBatchSize(Number(e.target.value))}
                    disabled={isExporting}
                  >
                    <option value="100">Safe (100 rows)</option>
                    <option value="500">Standard (500 rows)</option>
                    <option value="1000">Turbo (1,000 rows)</option>
                  </select>
                </div>

                {/* 안내 */}
                <div className="p-4 bg-slate-900 rounded-2xl text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                    <Download size={14} /> Stream Save
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    Chrome/Edge에서는 저장 위치를 직접 선택하며 2GB+ 파일도 메모리 없이 스트리밍 저장됩니다. 기타 브라우저는 완료 후 일괄 다운로드됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Gauge size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rows / sec</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">{dlQps.toLocaleString()} <span className="text-sm text-slate-400">RPS</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600"><Clock size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Time</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">{dlEta}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Table2 size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rows Exported</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {dlFetched.toLocaleString()} <span className="text-sm text-slate-400">/ {dlTotal.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">

              {/* 전체 DB 모드: 테이블 단위 프로그레스 */}
              {exportMode === 'all' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-violet-400 uppercase tracking-widest">Table Progress</span>
                      <div className="text-2xl font-black text-slate-900">
                        {dbTableProgress} <span className="text-slate-300 font-medium">/ {dbTableTotal} tables</span>
                        {dbCurrentTable && (
                          <span className="ml-3 text-sm font-bold text-violet-500 bg-violet-50 px-3 py-1 rounded-lg">
                            현재: {dbCurrentTable}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-3xl font-black text-violet-600 font-mono">
                      {dbTableTotal > 0 ? ((dbTableProgress / dbTableTotal) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-5 rounded-xl overflow-hidden border border-slate-200 p-0.5 shadow-inner">
                    <div
                      className="h-full transition-all duration-700 ease-out rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20"
                      style={{ width: `${dbTableTotal > 0 ? (dbTableProgress / dbTableTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 행 단위 프로그레스 */}
              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      {exportMode === 'all' ? 'Current Table Rows' : 'Row Stream Progress'}
                    </span>
                    <div className="text-3xl font-black text-slate-900">
                      {dlFetched.toLocaleString()} rows{' '}
                      <span className="text-slate-300 font-medium">/ {exportMode === 'single' ? dlTotal.toLocaleString() : '...'} rows</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-emerald-600 font-mono">{dlProgress.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-8 rounded-2xl overflow-hidden border border-slate-200 relative p-1 shadow-inner">
                  <div
                    className="h-full transition-all duration-500 ease-out rounded-xl shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${dlProgress}%` }}
                  >
                    <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                {!isExporting ? (
                  <button
                    onClick={startExport}
                    disabled={exportMode === 'single' ? !selectedTable : tableList.length === 0}
                    className={`text-white px-12 py-5 rounded-2xl font-black text-xl flex items-center gap-4 shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${
                      exportMode === 'all'
                        ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    }`}
                  >
                    <Download size={24} />
                    {exportMode === 'all' ? 'FULL DB EXPORT' : 'EXPORT START'}
                  </button>
                ) : (
                  <button
                    onClick={stopExport}
                    className="flex-1 bg-slate-800 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-slate-800/20 hover:bg-slate-900 transition-all"
                  >
                    <RotateCcw size={24} /> STOP EXPORT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Log Console (공통) */}
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
            <span className="text-[10px] text-slate-500 font-bold">MODE: {activeTab === 'upload' ? 'TRANSACTION_BATCH' : 'EXPORT_STREAM'}</span>
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