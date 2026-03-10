
import React, { useState, useEffect } from 'react';
import { Header, NAV_ITEMS } from './components/Header';
import { DashboardPage } from './components/DashboardPage';
import { MemberManagementPage } from './components/MemberManagementPage';
import { PedigreeManagementPage } from './components/PedigreeManagementPage';
import { NoticeManagementPage } from './components/NoticeManagementPage';
import { PointManagementPage } from './components/PointManagementPage';
import { PrizeManagementPage } from './components/PrizeManagementPage';
import { EventManagementPage } from './components/EventManagementPage';
import { CompetitionManagementPage } from './components/CompetitionManagementPage';
import { PublicCompetitionPage } from './components/PublicCompetitionPage';
import { SkillManagementPage } from './components/SkillManagementPage';
import { DataIntegrationPage } from './components/DataIntegrationPage';
import { MemberExportPage } from './components/MemberExportPage';
import { DbNavigator } from './components/DbNavigator';
import { LoginModal } from './components/LoginModal';
import { setApiConfig, fetchAllTableNames, fetchMembers, fetchNotices } from './services/memberService';
import { fetchPedigrees } from './services/pedigreeService';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const DEFAULT_URL = 'https://kkc3349.mycafe24.com/bridg.php';

const GlobalModal = ({ isOpen, type, title, message, onConfirm, onCancel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {type === 'confirm' ? <AlertCircle className="text-orange-500" size={24} /> : <CheckCircle className="text-green-500" size={24} />}
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="bg-gray-50 p-4 flex justify-end gap-2 border-t">
          {type === 'confirm' && <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded transition-colors">취소</button>}
          <button onClick={onConfirm} className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all active:scale-95">확인</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState(NAV_ITEMS[0]);
  const [bridgeUrl, setBridgeUrl] = useState(DEFAULT_URL);
  const [isConnected, setIsConnected] = useState(false);
  const [isDbNavigatorOpen, setIsDbNavigatorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState({ members: 0, pedigrees: 0, notices: 0 });

  // 🛡️ [CRITICAL] '행사 관리'가 wp_posts로 매핑되어야 post_logic.php의 전용 핸들러가 작동함
  const [tableMapping, setTableMapping] = useState<Record<string, string>>({
    '회원 관리': 'memTab', '회원 대량추출': 'memTab', '혈통서 관리': 'dogTab',
    '직능관리': 'skillTab', '협회소식/공지': 'wp_posts', '상력 관리': 'prize_dogTab',
    '행사 관리': 'wp_posts', '포인트 관리': 'point',
    '대회 관리': 'dogshow'
  });

  const [pointSearch, setPointSearch] = useState<{ query: string, field: string } | null>(null);
  const [memberSearch, setMemberSearch] = useState<{ query: string, field: string } | null>(null);
  const [competitionEditData, setCompetitionEditData] = useState<any>(null);

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'alert' | 'confirm'; title: string; message: string; onConfirm: () => void; }>({
    isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }
  });

  const showAlert = (title: string, message: string) => {
    setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModal(p => ({ ...p, isOpen: false })) });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({ isOpen: true, type: 'confirm', title, message, onConfirm: () => { onConfirm(); setModal(p => ({ ...p, isOpen: false })); } });
  };

  useEffect(() => { if (isLoggedIn) handleConnect(); }, [isLoggedIn]);

  const handleConnect = async () => {
    setIsLoading(true);
    setApiConfig(bridgeUrl);
    try {
      await fetchAllTableNames();
      setIsConnected(true);
      const mRes = await fetchMembers(tableMapping['회원 관리'], 1, '', 'all', 1);
      const pRes = await fetchPedigrees(tableMapping['혈통서 관리'], 1, '', 'all');
      const nRes = await fetchNotices(tableMapping['협회소식/공지'], 1, '', 'all');
      setStats({ members: mRes.total, pedigrees: pRes.total, notices: nRes.total });
      setInitError(null);
    } catch (e: any) {
      console.error("Connection error:", e);
      setInitError(`연결 실패: 외부 서버(${bridgeUrl})에 접속할 수 없습니다. CORS 설정이나 인터넷 연결을 확인해주세요.`);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => { setIsLoggedIn(false); setActiveTab(NAV_ITEMS[0]); };

  const handleTabChange = (t: string) => {
    setActiveTab(t);
    if (t !== '포인트 관리') setPointSearch(null);
    if (t !== '회원 관리') setMemberSearch(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case '대시보드': return <DashboardPage onTabChange={handleTabChange} stats={stats} />;
      case '회원 관리': return (
        <MemberManagementPage
          tableName={tableMapping['회원 관리']}
          showAlert={showAlert}
          showConfirm={showConfirm}
          initialSearch={memberSearch}
          onSearchHandled={() => setMemberSearch(null)}
        />
      );
      case '혈통서 관리': return (
        <PedigreeManagementPage
          tableName={tableMapping['혈통서 관리']} memberTableName={tableMapping['회원 관리']}
          showAlert={showAlert} showConfirm={showConfirm}
          onGoToPoints={(regNo) => { setPointSearch({ query: regNo, field: 'regNo' }); setActiveTab('포인트 관리'); }}
          onGoToPrizes={() => handleTabChange('상력 관리')}
          onGoToMember={(loginId) => { setMemberSearch({ query: loginId, field: 'id' }); setActiveTab('회원 관리'); }}
        />
      );
      case '협회소식/공지': return <NoticeManagementPage tableName={tableMapping['협회소식/공지']} showAlert={showAlert} showConfirm={showConfirm} />;
      case '포인트 관리': return <PointManagementPage initialSearch={pointSearch} onSearchHandled={() => setPointSearch(null)} />;
      case '상력 관리': return <PrizeManagementPage />;
      case '데이터 통합':
        /* 
          🛡️ [SYSTEM LOCK: DATA INTEGRATION PAGE]
          이 모듈은 데이터 통합 작업이 완료된 상태이므로, 로직 수정을 방지하기 위해 
          구조적으로 보호된 상태로 렌더링됩니다.
        */
        return <DataIntegrationPage />;
      case '회원 대량추출': return <MemberExportPage />;
      case '행사 관리': return (
        <EventManagementPage
          tableName={tableMapping['행사 관리']}
          showAlert={showAlert}
          showConfirm={showConfirm}
          onEditEvent={(event: any) => {
            setCompetitionEditData(event);
            setActiveTab('대회 관리');
          }}
        />
      );
      case '대회 관리': return (
        <CompetitionManagementPage
          tableName={tableMapping['대회 관리']}
          showAlert={showAlert}
          showConfirm={showConfirm}
          editData={competitionEditData}
          onClearEditData={() => setCompetitionEditData(null)}
        />
      );
      case '직능관리': return (
        <SkillManagementPage
          tableName={tableMapping['직능관리']}
          showAlert={showAlert}
          showConfirm={showConfirm}
          onGoToMember={(loginId) => {
            setMemberSearch({ query: loginId, field: 'id' });
            setActiveTab('회원 관리');
          }}
        />
      );
      default: return <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">준비 중인 모듈입니다.</div>;
    }
  };

  // 🚀 [WP INTEGRATION] Detect public view mode for Shortcode usage
  const isPublicEventView = window.location.search.includes('view=public_event');
  const isPublicCompView = window.location.search.includes('view=public_competition');

  if (isPublicCompView) {
    return (
      <div className="bg-white min-h-screen">
        <PublicCompetitionPage />
      </div>
    );
  }

  if (isPublicEventView) {
    return (
      <div className="bg-white min-h-screen p-0 md:p-4 overflow-auto">
        <EventManagementPage
          isAdmin={false}
          showAlert={(t: string, m: string) => alert(`${t}: ${m}`)}
          showConfirm={(t: string, m: string, cb: () => void) => { if (window.confirm(`${t}\n\n${m}`)) cb(); }}
        />
      </div>
    );
  }

  if (!isLoggedIn) return (
    <LoginModal
      onLogin={async (id, pw) => {
        // 하드코딩된 자격 증명 검사
        if (id === 'kkc3349' && pw === 'kkcdog3349**') {
          setIsLoggedIn(true);
        } else {
          throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
      }}
    />
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <Header onLogout={handleLogout} activeTab={activeTab} onTabChange={handleTabChange} onRefresh={() => setRefreshKey(prev => prev + 1)} />
      <main className="flex-1 overflow-hidden p-4">
        <div className="max-w-[1920px] mx-auto h-full flex flex-col relative">
          {initError && <div className="p-4 bg-red-100 text-red-700 rounded mb-4 flex justify-between font-bold border border-red-200"><span>{initError}</span><button onClick={() => setInitError(null)}>X</button></div>}
          <div className="flex-1 bg-white shadow-sm overflow-hidden rounded border relative flex flex-col" key={`${activeTab}-${refreshKey}`}>
            {renderContent()}
            {isLoading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[500]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>}
          </div>
          <DbNavigator isOpen={isDbNavigatorOpen} onClose={() => setIsDbNavigatorOpen(false)} allTables={[]} activeTableName={tableMapping[activeTab]} onTableSelect={(tn) => setTableMapping({ ...tableMapping, [activeTab]: tn })} onConnect={handleConnect} bridgeUrl={bridgeUrl} onBridgeUrlChange={setBridgeUrl} />
          <GlobalModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={() => setModal(p => ({ ...p, isOpen: false }))} />
        </div>
      </main>
    </div>
  );
};

export default App;
