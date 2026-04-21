import React, { useState } from 'react';
import { UserPlus, User, Lock, Phone, Mail, ArrowLeft, Loader2, CheckCircle2, MapPin, Calendar, Smartphone, Globe } from 'lucide-react';
import { portalRegister, portalCheckId } from '../services/portalService';

interface PortalRegisterProps {
  onBackToLogin: () => void;
}

export const PortalRegister: React.FC<PortalRegisterProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({ 
    id: '', passwd: '', confirmPasswd: '', name: '', name_eng: '', 
    birth: '', hp: '', phone: '', email: '', 
    zipcode: '', addr: '', addr_1: '',
    zipcode2: '', addr2: '', addr2_1: '' 
  });
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCheckId = async () => {
    if (!formData.id) return setError('아이디를 입력해주세요.');
    setIsLoading(true);
    const res = await portalCheckId(formData.id);
    if (res.success && res.available) {
      setIsIdChecked(true);
      alert(res.message);
    } else {
      setError(res.error || res.message);
    }
    setIsLoading(false);
  };

  const handleAddressSearch = (type: 'main' | 'dm') => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        if (type === 'main') {
          setFormData({ ...formData, zipcode: data.zonecode, addr: data.address });
        } else {
          setFormData({ ...formData, zipcode2: data.zonecode, addr2: data.address });
        }
      }
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.passwd || !formData.name || !formData.birth || !formData.zipcode || !formData.addr || !formData.hp) {
      return setError('필수 항목(*)을 모두 입력해주세요.');
    }
    if (!isIdChecked) return setError('아이디 중복 확인이 필요합니다.');
    if (formData.passwd !== formData.confirmPasswd) return setError('비밀번호가 일치하지 않습니다.');
    
    setIsLoading(true);
    setError('');
    
    const res = await portalRegister(formData);
    if (res.success) {
      setIsSuccess(true);
    } else {
      setError(res.error || '가입 실패');
    }
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 md:p-6 font-sans">
        <div className="w-full max-w-[500px] bg-white rounded-[40px] p-10 md:p-14 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="inline-flex items-center justify-center p-6 bg-blue-50 text-blue-600 rounded-full mb-8">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">환영합니다!</h2>
          <p className="text-slate-500 font-medium mb-12 leading-relaxed text-lg">
            KKC 한국애견협회의 정식 회원이 되셨습니다.<br />
            이제 반려동물 전문가로서의 여정을 시작해 보세요.
          </p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            로그인 화면으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:px-6 font-sans flex flex-col items-center">
      <div className="w-full max-w-[700px]">
        {/* 상단 네비게이션 */}
        <div className="flex justify-between items-center mb-10">
          <button 
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            돌아가기
          </button>
          <div className="text-xs font-black text-slate-300 tracking-widest uppercase">Member Registration</div>
        </div>

        {/* 헤더 섹션 */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4 flex items-center justify-center md:justify-start gap-3">
            <span className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><UserPlus size={28} /></span>
            신규 회원가입
          </h1>
          <p className="text-slate-500 font-medium text-lg">KKC (사)한국애견협회의 소중한 가족이 되어주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          {/* 1. 계정 정보 섹션 */}
          <Section icon={<Lock size={20}/>} title="계정 정보">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <InputLabel label="아이디 *" />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text" required
                      value={formData.id}
                      onChange={(e) => {
                        setFormData({ ...formData, id: e.target.value });
                        setIsIdChecked(false);
                      }}
                      className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 ${isIdChecked ? 'border-green-500 bg-green-50' : 'border-transparent focus:border-blue-500 focus:bg-white'}`}
                      placeholder="6~20자 영문, 숫자 조합"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleCheckId}
                    className={`px-8 rounded-2xl font-black transition-all shadow-sm ${isIdChecked ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
                  >
                    {isIdChecked ? '사용 가능' : '중복 확인'}
                  </button>
                </div>
              </div>

              <div>
                <InputLabel label="비밀번호 *" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password" required
                    value={formData.passwd}
                    onChange={(e) => setFormData({ ...formData, passwd: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-sm placeholder:text-slate-300"
                    placeholder="8자 이상 영문/숫자 혼합"
                  />
                </div>
              </div>
              
              <div>
                <InputLabel label="비밀번호 확인 *" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password" required
                    value={formData.confirmPasswd}
                    onChange={(e) => setFormData({ ...formData, confirmPasswd: e.target.value })}
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl transition-all outline-none font-bold text-sm placeholder:text-slate-300 ${formData.confirmPasswd && formData.passwd === formData.confirmPasswd ? 'border-green-500 bg-green-50' : 'border-transparent focus:border-blue-500 focus:bg-white'}`}
                    placeholder="비밀번호 재입력"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* 2. 인적 사항 섹션 */}
          <Section icon={<User size={20}/>} title="인적 사항">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <InputLabel label="성함 (실명) *" />
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                  placeholder="예: 홍길동"
                />
              </div>
              <div>
                <InputLabel label="생년월일 *" />
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text" required
                    value={formData.birth}
                    onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                    placeholder="YYMMDD (6자리)"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <InputLabel label="이름 (영문)" />
                <input
                  type="text"
                  value={formData.name_eng}
                  onChange={(e) => setFormData({ ...formData, name_eng: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                  placeholder="English Name (예: HONG GILDONG)"
                />
              </div>
            </div>
          </Section>

          {/* 3. 연락처 정보 섹션 */}
          <Section icon={<Smartphone size={20}/>} title="연락처 정보">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <InputLabel label="휴대폰 번호 *" />
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="tel" required
                    value={formData.hp}
                    onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div>
                <InputLabel label="일반 전화 (선택)" />
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                    placeholder="02-000-0000"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <InputLabel label="이메일 주소" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* 4. 주소 정보 섹션 */}
          <Section icon={<MapPin size={20}/>} title="거주지 주소">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text" required readOnly
                  value={formData.zipcode}
                  className="w-[120px] px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-600 cursor-not-allowed"
                  placeholder="우편번호"
                />
                <button 
                  type="button" 
                  onClick={() => handleAddressSearch('main')}
                  className="px-6 py-2 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm hover:bg-blue-100 transition-all border border-blue-100 shadow-sm active:scale-95"
                >
                  주소 검색
                </button>
              </div>
              <input
                type="text" required readOnly
                value={formData.addr}
                className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-600 mb-2 cursor-not-allowed"
                placeholder="검색 버튼을 눌러주세요"
              />
              <input
                type="text"
                value={formData.addr_1}
                onChange={(e) => setFormData({ ...formData, addr_1: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 shadow-inner"
                placeholder="상세 주소를 입력하세요"
              />
            </div>
          </Section>

          {/* 5. DM 주소 정보 섹션 */}
          <Section icon={<Globe size={20}/>} title="DM 주소 (우편물 수령지)" optional>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text" readOnly
                  value={formData.zipcode2}
                  className="w-[120px] px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-600 cursor-not-allowed"
                  placeholder="우편번호"
                />
                <button 
                  type="button" 
                  onClick={() => handleAddressSearch('dm')}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-2xl font-black text-sm transition-all shadow-sm active:scale-95"
                >
                  수령지 검색
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    zipcode2: formData.zipcode, 
                    addr2: formData.addr, 
                    addr2_1: formData.addr_1 
                  })}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  거주지와 동일
                </button>
              </div>
              <input
                type="text" readOnly
                value={formData.addr2}
                className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-600 cursor-not-allowed"
                placeholder="우편물을 받으실 주소를 검색해 주세요"
              />
              <input
                type="text"
                value={formData.addr2_1}
                onChange={(e) => setFormData({ ...formData, addr2_1: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 shadow-inner"
                placeholder="상세 주소"
              />
            </div>
          </Section>

          {error && (
            <div className="p-6 bg-red-50 text-red-600 rounded-[24px] font-black border border-red-100 flex items-center gap-3 animate-shake">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              {error}
            </div>
          )}

          <div className="pt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[24px] shadow-2xl shadow-blue-200 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none text-xl relative overflow-hidden group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto" size={24} />
              ) : (
                <>
                  <span className="relative z-10">회원가입 완료하기</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
                </>
              )}
            </button>
            <p className="text-center mt-6 text-slate-400 text-sm font-medium italic">
              * 별표가 표시된 항목은 필수 입력 사항입니다.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// 🛡️ 보조 컴포넌트: 섹션 레이아웃
const Section: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, optional?: boolean }> = ({ icon, title, children, optional }) => (
  <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-100 border border-slate-100 hover:border-blue-100 transition-colors">
    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
      <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">{icon}</div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">
        {title}
        {optional && <span className="ml-2 text-xs font-bold text-slate-300">(선택 사항)</span>}
      </h3>
    </div>
    {children}
  </div>
);

// 🏷️ 보조 컴포넌트: 입력 라벨
const InputLabel: React.FC<{ label: string }> = ({ label }) => (
  <label className="block text-sm font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">{label}</label>
);
