import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Loader2, X, Calendar, Smartphone, ShieldAlert, Award, ArrowLeft, Check } from 'lucide-react';
import { portalLogin, portalFindPwSendSms, portalFindPwVerifySms, portalFindPwReset, portalGetNiceAuthUrl, portalNiceFindPwVerify } from '../services/portalService';


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
  const [step, setStep] = useState(1); // 1: 본인 정보 입력 및 SMS 인증, 2: 새 비밀번호 입력
  const [formData, setFormData] = useState({ name: '', hp: '', birth: '', new_pw: '' });
  const [foundId, setFoundId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 📱 본인인증 방식 선택 ('sms' | 'ipin')
  const [authMethod, setAuthMethod] = useState<'sms' | 'ipin'>('sms');

  // 📱 SMS 인증 관련 상태
  const [smsCode, setSmsCode] = useState('');
  const [isSmsSent, setIsSmsSent] = useState(false);
  const [smsTimer, setSmsTimer] = useState(0);

  useEffect(() => {
    if (smsTimer > 0) {
      const t = setTimeout(() => setSmsTimer(smsTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [smsTimer]);

  // 📱 NICE 아이핀 팝업 성공 postMessage 수신 리스너
  useEffect(() => {
    const handlePostMessage = async (e: MessageEvent) => {
      if (e.data && e.data.type === 'NICE_AUTH_SUCCESS') {
        const { web_transaction_id } = e.data;
        setIsLoading(true);
        setError('');
        try {
          const res = await portalNiceFindPwVerify(web_transaction_id);
          if (res.success) {
            setFormData(prev => ({
              ...prev,
              name: res.name || prev.name,
              hp: res.hp || prev.hp,
              birth: res.birth || prev.birth
            }));
            setFoundId(res.id);
            setStep(2);
            alert(`아이핀 인증 성공: 회원님의 아이디는 [${res.id}] 입니다.`);
          } else {
            setError(res.error || '아이핀 인증 결과 확인 실패');
          }
        } catch (err: any) {
          setError(err.message || '아이핀 인증 처리 중 오류');
        }
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handlePostMessage);
    return () => window.removeEventListener('message', handlePostMessage);
  }, []);

  const handleIpinAuth = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await portalGetNiceAuthUrl();
      if (res.success && res.data && res.data.auth_url) {
        const width = 480;
        const height = 812;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          res.data.auth_url,
          'niceAuth',
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
        );
      } else {
        setError(res.error || '아이핀 인증 요청 실패');
      }
    } catch (err: any) {
      setError(err.message || '아이핀 인증 요청 오류');
    }
    setIsLoading(false);
  };

  // 1. 인증번호 받기
  const handleSendSms = async () => {
    if (!formData.name || !formData.hp || !formData.birth) {
      return setError('이름, 생년월일, 휴대폰 번호를 모두 입력해주세요.');
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await portalFindPwSendSms({
        name: formData.name,
        hp: formData.hp,
        birth: formData.birth
      });
      if (res.success) {
        setIsSmsSent(true);
        setSmsTimer(180);
        alert(res.message || '인증번호가 발송되었습니다.');
      } else {
        setError(res.error || '본인 확인 실패');
      }
    } catch (err: any) {
      setError(err.message || '인증번호 발송 오류');
    }
    setIsLoading(false);
  };

  // 2. 인증번호 확인 후 Step 2로 이동
  const handleVerifySms = async () => {
    if (!smsCode) return setError('인증번호를 입력해주세요.');
    setIsLoading(true);
    setError('');
    try {
      const res = await portalFindPwVerifySms({
        name: formData.name,
        hp: formData.hp,
        birth: formData.birth,
        code: smsCode
      });
      if (res.success) {
        setFoundId(res.id);
        setStep(2);
      } else {
        setError(res.error || '인증번호가 올바르지 않습니다.');
      }
    } catch (err: any) {
      setError(err.message || '인증 오류');
    }
    setIsLoading(false);
  };

  // 3. 새 비밀번호 설정 완료
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.new_pw) return setError('새 비밀번호를 입력해주세요.');
    setIsLoading(true);
    setError('');
    try {
      const res = await portalFindPwReset({
        name: formData.name,
        hp: formData.hp,
        birth: formData.birth,
        new_pw: formData.new_pw
      });
      if (res.success) {
        alert('비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.');
        onClose();
      } else {
        setError(res.error || '비밀번호 변경 실패');
      }
    } catch (err: any) {
      setError(err.message || '비밀번호 변경 중 에러');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-[420px] shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-8 pb-4 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isLegacyMode ? "기존 회원 비밀번호 재설정" : "비밀번호 찾기 / 재설정"}
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <X size={20} />
            </button>
        </div>

        <div className="px-8 pb-8">
            <div className={`p-5 rounded-2xl border mb-6 ${isLegacyMode ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
               <p className={`text-xs font-bold leading-relaxed ${isLegacyMode ? 'text-orange-600' : 'text-blue-600'}`}>
                  {isLegacyMode && step === 1 ? (
                    "사단법인 한국애견협회 회원님, 반갑습니다! 30만 원본 데이터와 연동됩니다. 이름, 생년월일, 연락처를 입력해 인증번호를 받으신 뒤, 새로운 비밀번호를 설정할 수 있습니다."
                  ) : step === 1 ? (
                    "가입 시 등록한 이름, 생년월일, 연락처를 입력해 주세요. 일치할 경우 휴대폰으로 전송된 인증번호를 통해 새로운 비밀번호를 재설정할 수 있습니다."
                  ) : (
                    `본인 인증에 성공하였습니다! 회원님의 아이디는 [${foundId}] 입니다. 사용할 새로운 비밀번호를 입력해 주세요.`
                  )}
               </p>
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">인증 방식 선택</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('sms')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all border ${authMethod === 'sms' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      휴대폰 간편 인증
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('ipin')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all border ${authMethod === 'ipin' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      아이핀(i-PIN) 인증
                    </button>
                  </div>
                </div>

                {authMethod === 'sms' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">이름</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          type="text" 
                          required
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all text-sm"
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
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all text-sm"
                          placeholder="예: 19900101"
                          value={formData.birth}
                          onChange={(e) => setFormData({...formData, birth: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">휴대폰 번호</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="text" 
                            required
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all text-sm"
                            placeholder="숫자만 입력"
                            value={formData.hp}
                            onChange={(e) => setFormData({...formData, hp: e.target.value})}
                          />
                        </div>
                        <button 
                          type="button"
                          disabled={isLoading}
                          onClick={handleSendSms}
                          className="px-4 py-2 bg-slate-900 !text-white text-xs font-black rounded-2xl hover:bg-black active:scale-95 transition-all shrink-0"
                        >
                          {isSmsSent ? '재발송' : '인증번호 발송'}
                        </button>
                      </div>
                    </div>

                    {isSmsSent && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">인증번호 입력</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text" 
                              required
                              maxLength={6}
                              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all text-center tracking-[0.2em] text-sm"
                              placeholder="6자리 인증번호"
                              value={smsCode}
                              onChange={(e) => setSmsCode(e.target.value)}
                            />
                            {smsTimer > 0 && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">
                                {Math.floor(smsTimer / 60)}:{(smsTimer % 60).toString().padStart(2, '0')}
                              </div>
                            )}
                          </div>
                          <button 
                            type="button"
                            disabled={isLoading}
                            onClick={handleVerifySms}
                            className="px-4 py-2 bg-blue-600 !text-white text-xs font-black rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shrink-0"
                          >
                            인증 확인
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-500 font-medium mb-4">
                      아이핀 인증 버튼을 누르면 본인 확인용 팝업 창이 열립니다.
                    </p>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleIpinAuth}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 !text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : '아이핀 인증하기'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">새로운 비밀번호</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="password" 
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-900 transition-all text-sm"
                      placeholder="4자 이상 입력해 주세요"
                      value={formData.new_pw}
                      onChange={(e) => setFormData({...formData, new_pw: e.target.value})}
                      autoFocus
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 ${isLegacyMode ? 'bg-orange-600 shadow-orange-200' : 'bg-slate-900 shadow-slate-200'}`}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      비밀번호 설정 완료
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 mt-4 animate-shake">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <span className="text-[11px] font-bold leading-tight">{error}</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
