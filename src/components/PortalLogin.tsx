import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, X, Calendar, Smartphone, ShieldAlert, Award, ArrowLeft } from 'lucide-react';
import { portalLogin, portalFindPw } from '../services/portalService';

interface PortalLoginProps {
  onLoginSuccess: (userData: any) => void;
  onSwitchToRegister: () => void;
  onBack?: () => void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({ onLoginSuccess, onSwitchToRegister, onBack }) => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFindPwModalOpen, setIsFindPwModalOpen] = useState(false);
  const [isLegacyMode, setIsLegacyMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pw) return setError('아이디와 비밀번호를 입력해주세요.');
    
    setIsLoading(true);
    setError('');
    
    const res = await portalLogin(id, pw);
    if (res.success) {
      onLoginSuccess(res.data);
    } else {
      setError(res.error || '로그인 실패');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-sans">
      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute -top-12 left-0 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            대회 신청으로 돌아가기
          </button>
        )}
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <User className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">KKC 통합 회원 센터</h1>
          <p className="text-slate-500 font-medium">(사)한국애견협회 공식 포털</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[28px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <form onSubmit={handleLogin} className="p-10 pb-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">아이디</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-slate-900 font-medium"
                    placeholder="아이디를 입력하세요"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                   <label className="block text-sm font-bold text-slate-700">비밀번호</label>
                   <button 
                    type="button" 
                    onClick={() => { setIsLegacyMode(false); setIsFindPwModalOpen(true); }}
                    className="text-[11px] font-bold text-blue-500 hover:text-blue-700 hover:underline"
                   >
                     비밀번호를 잊으셨나요?
                   </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-slate-900 font-medium"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 animate-pulse">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    로그인 하기
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 🌟 기존 회원 전용 안내 버튼 */}
          <div className="px-10 pb-8">
            <button 
              onClick={() => { setIsLegacyMode(true); setIsFindPwModalOpen(true); }}
              className="w-full flex items-center justify-between p-5 bg-orange-50 border border-orange-200 rounded-3xl hover:bg-orange-100 transition-all group overflow-hidden relative shadow-lg shadow-orange-100/50"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
                  <Award size={24} />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Existing Member Welcome</div>
                  <div className="text-base font-black text-slate-800 tracking-tight leading-none">[기존 회원 비밀번호 재입력/재설정]</div>
                </div>
              </div>
              <ArrowRight size={20} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <button 
            onClick={onSwitchToRegister}
            className="w-full p-6 text-slate-500 hover:text-blue-600 font-bold text-sm bg-slate-50/50 hover:bg-slate-50 transition-all border-t border-slate-100"
          >
            아직 계정이 없으신가요? <span className="text-blue-600 underline underline-offset-4 ml-1">회원가입</span>
          </button>
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                Security by KKC Data Center
            </p>
        </div>
      </div>

      {isFindPwModalOpen && (
        <FindPwModal 
          isLegacyMode={isLegacyMode}
          onClose={() => setIsFindPwModalOpen(false)} 
        />
      )}
    </div>
  );
};

const FindPwModal = ({ isLegacyMode, onClose }: { isLegacyMode: boolean, onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', hp: '', birth: '', new_pw: '' });
  const [foundId, setFoundId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (step === 1) {
      const res = await portalFindPw({ name: formData.name, hp: formData.hp, birth: formData.birth });
      if (res.success) {
        setFoundId(res.id);
        setStep(2);
      } else {
        setError(res.error);
      }
    } else {
      const res = await portalFindPw({ ...formData });
      if (res.success) {
        alert('비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.');
        onClose();
      } else {
        setError(res.error);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-[420px] shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-8 pb-4 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isLegacyMode ? "기존 회원 환영 및 비밀번호 설정" : "비밀번호 찾기 / 재설정"}
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <X size={20} />
            </button>
        </div>

        <div className="px-8 pb-8">
            <div className={`p-5 rounded-2xl border mb-8 ${isLegacyMode ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
               <p className={`text-xs font-bold leading-relaxed ${isLegacyMode ? 'text-orange-600' : 'text-blue-600'}`}>
                  {isLegacyMode && step === 1 ? (
                    "사단법인 한국애견협회 회원님, 반갑습니다! 30만 원본 데이터와 연동됩니다. 가입 시 성함, 연락처, 생년월일을 입력해 주시면 즉시 본인 확인 후 새로운 비밀번호 설정을 도와드립니다."
                  ) : step === 1 ? (
                    "가입 시 등록한 이름, 생년월일, 연락처를 입력해 주세요. 일치할 경우 새로운 비밀번호를 설정할 수 있습니다."
                  ) : (
                    `본인 인증에 성공하였습니다! 회원님의 아이디는 [${foundId}] 입니다. 포털에서 사용할 새로운 비밀번호를 입력해 주세요.`
                  )}
               </p>
            </div>

            <form onSubmit={handleApply} className="space-y-5">
              {step === 1 ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">이름</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all"
                        placeholder="실명을 입력하세요"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">생년월일 (8자리)</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all"
                        placeholder="예: 19900101"
                        value={formData.birth}
                        onChange={(e) => setFormData({...formData, birth: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">휴대폰 번호</label>
                    <div className="relative">
                      <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all"
                        placeholder="숫자만 입력해 주세요"
                        value={formData.hp}
                        onChange={(e) => setFormData({...formData, hp: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">새로운 비밀번호</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="password" 
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all"
                      placeholder="4자 이상 입력해 주세요"
                      value={formData.new_pw}
                      onChange={(e) => setFormData({...formData, new_pw: e.target.value})}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <span className="text-[11px] font-bold leading-tight">{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 ${isLegacyMode ? 'bg-orange-600 shadow-orange-200' : 'bg-slate-900 shadow-slate-200'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    {step === 1 ? "본인 정보 확인하기" : "비밀번호 설정 완료"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};
