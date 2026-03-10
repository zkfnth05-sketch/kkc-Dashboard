/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React from 'react';
import {
  Users,
  FileText,
  Trophy,
  Database,
  Download,
  Bell,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Server,
  Zap,
  Globe
} from 'lucide-react';

interface DashboardPageProps {
  onTabChange: (tab: string) => void;
  stats: {
    members: number;
    pedigrees: number;
    notices: number;
  };
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onTabChange, stats }) => {
  const cards = [
    {
      title: '데이터 통합 센터',
      desc: '2GB+ 대용량 SQL 데이터를 워드프레스 DB로 고속 스트리밍 마이그레이션합니다.',
      icon: <Database className="text-white" size={24} />,
      tab: '데이터 통합',
      color: 'bg-blue-600',
      highlight: true
    },
    {
      title: '회원 관리',
      desc: '협회 회원 명부를 통합 관리하고 상세 정보를 안전하게 수정합니다.',
      icon: <Users className="text-indigo-600" size={24} />,
      tab: '회원 관리',
      color: 'bg-indigo-50'
    },
    {
      title: '혈통서 관리',
      desc: '애견 혈통 정보를 체계적으로 관리하고 소유권 변경 이력을 기록합니다.',
      icon: <FileText className="text-emerald-600" size={24} />,
      tab: '혈통서 관리',
      color: 'bg-emerald-50'
    },
    {
      title: '회원 대량추출',
      desc: '조건별 맞춤 데이터를 CSV 파일로 신속하게 생성 및 내보냅니다.',
      icon: <Download className="text-rose-600" size={24} />,
      tab: '회원 대량추출',
      color: 'bg-rose-50'
    },
    {
      title: '포인트 및 상력',
      desc: '도그쇼 입상 실적과 누적 포인트를 회원 정보와 자동 연동합니다.',
      icon: <Trophy className="text-amber-600" size={24} />,
      tab: '포인트 관리',
      color: 'bg-amber-50'
    },
    {
      title: '협회 소식/공지',
      desc: '워드프레스 기반의 협회 소식과 공지사항을 실시간으로 관리합니다.',
      icon: <Bell className="text-purple-600" size={24} />,
      tab: '협회소식/공지',
      color: 'bg-purple-50'
    }
  ];

  return (
    <div className="flex-1 h-full w-full overflow-y-auto bg-[#f8fafc] custom-scrollbar touch-auto">
      <div className="max-w-7xl mx-auto p-10 space-y-12 pb-24">

        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-12 text-white shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Server size={320} />
          </div>

          <div className="relative z-10 max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-black uppercase tracking-widest border border-blue-500/20">
              <Zap size={14} className="fill-blue-400" /> System Integrity Verified
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
                한국애견협회 (KKC)<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">통합 데이터 인프라</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                2GB 이상의 대용량 레거시 데이터를 워드프레스 환경으로 안전하게 전환하고, 협회의 모든 운영 정보를 중앙 집중식으로 제어합니다.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => onTabChange('데이터 통합')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
              >
                마이그레이션 도구 실행 <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button
                onClick={() => onTabChange('회원 관리')}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95"
              >
                전체 명부 조회
              </button>
            </div>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatItem icon={<Users size={22} />} label="총 회원수" value={stats.members.toLocaleString()} suffix="명" color="blue" />
          <StatItem icon={<FileText size={22} />} label="등록 혈통서" value={stats.pedigrees.toLocaleString()} suffix="건" color="indigo" />
          <StatItem icon={<Globe size={22} />} label="DB 도메인" value="Cafe24 WP" suffix="" color="emerald" />
          <StatItem icon={<Activity size={22} />} label="엔진 상태" value="OPTIMIZED" suffix="" color="amber" isPulse />
        </div>

        {/* Navigation Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <TrendingUp size={24} className="text-blue-600" /> 워크스페이스 모듈
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card) => (
              <div
                key={card.title}
                onClick={() => onTabChange(card.tab)}
                className={`group cursor-pointer bg-white p-8 rounded-[28px] border-2 ${card.highlight ? 'border-blue-100 ring-4 ring-blue-500/5' : 'border-transparent'} shadow-sm hover:shadow-2xl hover:shadow-blue-600/10 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full`}
              >
                <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {card.icon}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3 flex items-center justify-between">
                  {card.title}
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ArrowUpRight size={16} />
                  </div>
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
                  {card.desc}
                </p>
                {card.highlight && (
                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Zap size={12} className="fill-blue-600" /> High Velocity Connector
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Information Bar */}
        <div className="bg-slate-900 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SSL SECURE CONNECTED</span>
            <span className="text-slate-700">|</span>
            <span>LAST SYNC: {new Date().toLocaleString()}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KKC Data Portal v2.5.0-LTS</span>
          </div>
        </div>

        {/* Extra spacer to ensure the above info bar is never cut off */}
        <div className="h-4 shrink-0" />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

const StatItem = ({ icon, label, value, suffix, color, isPulse = false }: any) => (
  <div className="bg-white p-7 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
    <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center
      ${color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
      ${color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : ''}
      ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : ''}
      ${color === 'amber' ? 'bg-amber-50 text-amber-600' : ''}
    `}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
        {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
        {isPulse && <Activity size={16} className="text-emerald-500 animate-pulse ml-1" />}
      </div>
    </div>
  </div>
);