
import { LogOut, RefreshCw } from 'lucide-react';
import React from 'react';

interface HeaderProps {
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh?: () => void;
}

export const NAV_ITEMS = [
  '대시보드',
  '회원 관리',
  '회원 대량추출',
  '혈통서 관리',
  '직능관리',
  '대회 관리',
  '행사 관리',
  '상력 관리',
  '포인트 관리',
  '서식 자료실',
  '협회소식/공지',
  '데이터 통합'
];

export const Header: React.FC<HeaderProps> = ({ onLogout, activeTab, onTabChange, onRefresh }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center min-w-[200px] cursor-pointer" onClick={() => onTabChange('대시보드')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-xs">KKC</span>
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">
            KKC 애견협회 관리자포털 (보안적용)
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden xl:flex flex-1 justify-center">
          <div className="flex space-x-6 h-16 items-center overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => onTabChange(item)}
                className={`text-sm transition-all relative py-1 whitespace-nowrap ${activeTab === item
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-500 font-medium hover:text-gray-800'
                  }`}
              >
                {item}
                {activeTab === item && (
                  <div className="absolute -bottom-5 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User / Logout */}
        <div className="flex items-center justify-end min-w-[200px] gap-4">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-gray-50 rounded-full"
              title="새로고침"
            >
              <RefreshCw size={18} />
            </button>
          )}
          <div className="h-4 w-px bg-gray-200" />
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
};
