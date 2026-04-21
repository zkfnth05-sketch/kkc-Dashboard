
import React, { useEffect, useState } from 'react';
import { User, Dog, Award, History, LogOut, ChevronRight, Star, Calendar, CreditCard, Phone, Mail, MapPin, ShieldCheck, Smartphone, X, Save, Loader2, Settings, Gem, Banknote, CheckCircle, Info, Check, Lock, Globe, ArrowLeft, Trophy } from 'lucide-react';
import { portalGetMyData, portalUpdateMyData, portalApplyMembership } from '../services/portalService';
import { formatMemberRank } from '../types';

interface MemberPortalProps {
  userData: any;
  onLogout: () => void;
  onBackToCompetition?: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({ userData, onLogout, onBackToCompetition }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDog, setSelectedDog] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await portalGetMyData(userData.mid);
      if (res.success) {
        setData(res.data);
        if (res.data.profile) {
          sessionStorage.setItem('kkf_portal_user', JSON.stringify(res.data.profile));
        }
      }
    } catch (e) {
      console.error("Fetch Data Error:", e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userData.mid]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold">내 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const profile = data?.profile || userData || {};
  const dogs = data?.dogs || [];
  const proClassesMaster = data?.proClasses || [];
  const pendingApp = data?.pendingApplication;
  const recentApplications = data?.recentApplications || [];
  const totalPages = Math.ceil(recentApplications.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedApps = recentApplications.slice(startIndex, startIndex + pageSize);

  const safeName = profile.name ? String(profile.name) : '회원';

  const getCategorizedProClasses = () => {
    if (!profile.pro_class || typeof profile.pro_class !== 'string') return { skills: [], licenses: [] };
    const codes = profile.pro_class.split(/[- ,]+/).map((c: string) => c.trim()).filter((c: string) => c !== '');
    const skills: string[] = [];
    const licenses: string[] = [];
    const legacyMap: Record<string, string> = { 'DGS': '대구 애견샵', 'RDR': '사체탐지견훈련사', 'FOR': '외국단체', 'TTB': '지정번식장' };

    codes.forEach((code: string) => {
      const master = proClassesMaster.find((p: any) => (p.keyy || '').trim().toLowerCase() === code.toLowerCase());
      const name = master ? master.name : (legacyMap[code.toUpperCase()] || code);
      const type = master ? parseInt(master.type) : 1;
      if (type === 0) licenses.push(name); else skills.push(name);
    });
    return { skills, licenses };
  };

  const { skills, licenses } = getCategorizedProClasses();

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <nav className="bg-white border-b border-slate-100 flex items-center justify-between px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl"><User size={24} /></div>
          <span className="text-xl font-black text-slate-900 tracking-tight">KKC MY PORTAL</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = "https://kkc3349.mycafe24.com"} 
            className="flex items-center gap-2 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl font-bold transition-all border border-slate-200 shadow-sm"
          >
            <Globe size={18} /> 홈페이지
          </button>
          {onBackToCompetition && (
            <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("view", "public_competition");
                window.history.pushState(null, "", url.href);
                // App.tsx에서 refreshKey를 통해 다시 랜더링하도록 유도하기 위해 
                // 강제 페이지 이동(Vercel 내부)을 수행합니다.
                window.location.href = url.href; 
              }} 
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 group"
            >
              <Trophy size={18} className="group-hover:rotate-12 transition-transform" /> 대회 신청하기
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold ml-2 transition-colors">
            <LogOut size={20} /> 로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-[1000px] mx-auto p-6 md:p-10">
        <div className="bg-white rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 mb-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/40 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-blue-200 overflow-hidden border-4 border-white">
                {profile.mem_pic ? <img src={`https://kkc3349.mycafe24.com/data/member/${profile.mem_pic}`} alt={safeName} className="w-full h-full object-cover" /> : <span className="text-5xl font-black">{safeName.charAt(0)}</span>}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg"><ShieldCheck size={20} /></div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{safeName}님</h2>
                <div className="flex gap-2">
                  <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                    {formatMemberRank(profile.mem_degree)}
                  </div>
                  {pendingApp && pendingApp.status === 'P' && (
                    <div className="bg-orange-100 text-orange-600 border border-orange-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> 입금 확인 대기 중
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 bg-white text-slate-500 border border-slate-200 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                  <Settings size={14} /> 내 정보 관리
                </button>
                {(!pendingApp || pendingApp.status !== 'P') && profile.mem_degree !== 'C0' && (
                  <button onClick={() => setIsUpgradeModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] shadow-xl shadow-orange-100/50 hover:scale-105 active:scale-95 transition-all group">
                    <Gem size={14} className="group-hover:animate-bounce" /> {profile.mem_degree === 'B0' ? '정회원 신청하기' : '멤버십 갱신/전환'}
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500">
                <div className="flex items-center gap-2"><Mail size={16} /><span className="font-bold text-sm">{profile.email || '이메일 없음'}</span></div>
                <div className="flex items-center gap-2"><Smartphone size={16} /><span className="font-bold text-sm">{profile.hp || '연락처 없음'}</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 group/stat">
              <div className="flex items-center gap-3 text-slate-400 mb-4"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover/stat:rotate-12 transition-transform"><Dog size={20} /></div><span className="text-xs font-black uppercase tracking-widest">나의 반려견</span></div>
              <div className="flex items-end gap-2"><div className="text-4xl font-black text-slate-900 leading-none">{dogs.length}</div><div className="text-slate-400 font-bold mb-1">마리</div></div>
            </div>
            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 group/qual">
              <div className="flex items-center gap-3 text-slate-400 mb-6">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl group-hover/qual:rotate-12 transition-transform"><Award size={20} /></div>
                <span className="text-xs font-black uppercase tracking-widest">전문가 자격 및 직능 관리</span>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mb-2 ml-1">Professional Skills (직능)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.length > 0 ? skills.map((n, i) => (<span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100 shadow-sm">{n}</span>)) : <span className="text-slate-300 text-[10px] font-bold ml-1">등록된 직능 내역 없음</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-orange-600/70 uppercase tracking-widest mb-2 ml-1">Certifications (자격증)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {licenses.length > 0 ? licenses.map((n, i) => (<span key={i} className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl text-[10px] font-black border border-orange-100 shadow-sm">{n}</span>)) : <span className="text-slate-300 text-[10px] font-bold ml-1">등록된 자격증 내역 없음</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 ml-2"><div className="w-1.5 h-6 bg-blue-600 rounded-full"></div> 등록 혈통서 조회</h3>
            <div className="space-y-4">
              {dogs.length === 0 ? <div className="bg-white rounded-[32px] p-12 text-center border border-dashed text-slate-300 font-bold">등록된 혈통서가 없습니다.</div> : dogs.map((dog: any, idx: number) => (
                <div key={idx} onClick={() => setSelectedDog(dog)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-50 group-hover:border-blue-300">
                      {dog.pix1 ? <img src={`https://kkc3349.mycafe24.com/data/dog/${dog.pix1}`} alt={dog.name} className="w-full h-full object-cover" /> : <Dog size={24} className="text-slate-200" />}
                    </div>
                    <div><div className="font-black text-lg text-slate-900">{dog.name}</div><div className="text-xs text-slate-400 font-bold tracking-tight">{dog.dog_class} | {dog.reg_no}</div></div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight size={20} /></div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 ml-2"><div className="w-1.5 h-6 bg-orange-600 rounded-full"></div> 최근 대회 신청 내역</h3>
            {recentApplications && recentApplications.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {paginatedApps.map((app: any, idx: number) => (
                    <div key={idx} onClick={() => setSelectedApp(app)} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group cursor-pointer">
                      <div className="flex flex-col gap-1.5 flex-1 p-1">
                        <div className="flex items-center gap-3 mb-1">
                           <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-widest bg-blue-600 text-white shadow-sm shadow-blue-100">{app.source}</span>
                           <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-widest ${app.payment_status === '입금완료' || app.payment_status === '입금' ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                              {app.payment_status === '입금완료' || app.payment_status === '입금' ? '접수완료(입금)' : '접수중(미입금)'}
                           </span>
                           <span className="text-[11px] font-bold text-slate-400 ml-auto">{app.apply_date}</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-[17px] mb-1 group-hover:text-blue-600 transition-colors uppercase">{app.event_title || '참가 신청'}</h4>
                        <div className="flex flex-col gap-2">
                           <div className="flex flex-wrap items-center gap-2">
                             <div className="text-[12px] font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-100 text-slate-700">{app.dog_name || '신청 정보'}</div>
                             {app.options_summary && (
                               <div className="text-[11px] font-medium text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-50 truncate max-w-[200px]" title={app.options_summary}>
                                 {app.options_summary}
                               </div>
                             )}
                             <div className="text-[13px] font-black text-slate-900 ml-auto leading-none">
                               {Number(app.total_amount || 0).toLocaleString()}원
                             </div>
                           </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-200">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  ))}

                  {/* 🧬 [DYNAMIC PAGINATION] */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-slate-100">
                       <button 
                         disabled={currentPage === 1}
                         onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                         className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                       >
                         <ChevronRight className="rotate-180" size={20} />
                       </button>
                       <div className="flex items-center gap-1.5 px-4">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                       </div>
                       <button 
                         disabled={currentPage === totalPages}
                         onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                         className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                       >
                         <ChevronRight size={20} />
                       </button>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">조회된 신청 데이터 총 {recentApplications.length}건</p>
                  </div>
                </div>
            ) : (
                <div className="bg-white rounded-[40px] p-12 text-center border border-slate-50 shadow-sm text-slate-400 h-[220px] flex flex-col items-center justify-center gap-4 group">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <History size={40} className="opacity-20 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900">최근 신청 내역이 없습니다.</p>
                    <p className="text-xs font-bold text-slate-400">대회 참가 신청 시 이곳에 표시됩니다.</p>
                    <p className="text-[9px] font-bold text-slate-200 mt-4">Debug Link ID: {userData.mid} / {userData.id}</p>
                  </div>
                </div>
            )}
          </section>
        </div>
      </main>

      {/* Pedigree Detail Modal */}
      {selectedDog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 p-8 text-white relative flex items-center gap-6">
               <button onClick={() => setSelectedDog(null)} className="absolute top-8 right-8 p-2 bg-white/20 rounded-full hover:bg-white/30"><X size={20} /></button>
               <div className="w-24 h-24 bg-white/10 rounded-2xl overflow-hidden border border-white/20">{selectedDog.pix1 && <img src={`https://kkc3349.mycafe24.com/data/dog/${selectedDog.pix1}`} alt="" className="w-full h-full object-cover" />}</div>
               <div><h2 className="text-3xl font-black tracking-tighter">{selectedDog.name}</h2><p className="font-bold opacity-80">{selectedDog.reg_no}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
               <div className="space-y-6">
                  <div className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-4 h-0.5 bg-blue-600"></div> 기본 및 외형 정보</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                     <DetailItem label="견명 (Name)" value={selectedDog.name || '-'} />
                     <DetailItem label="풀네임 (Full Name)" value={selectedDog.fullname || '-'} />
                     <DetailItem label="견종 (Breed)" value={selectedDog.dog_class || '-'} />
                     <DetailItem label="성별 (Sex)" value={selectedDog.sex === 'M' ? '수컷 (Male)' : '암컷 (Female)'} />
                     <DetailItem label="생년월일 (Birth)" value={selectedDog.birth || '-'} />
                     <DetailItem label="모색 (Color)" value={selectedDog.hair || '-'} />
                     <DetailItem label="모종 (Coat Type)" value={selectedDog.hair_long || '-'} />
                     <DetailItem label="견사호 (Kennel)" value={selectedDog.saho || '-'} />
                     <DetailItem label="견사호 영문 (Kennel EN)" value={selectedDog.saho_eng || '-'} />
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-4 h-0.5 bg-purple-600"></div> 부모견 정보 (Lineage)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100">
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Father (부견)</div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold text-slate-500"><span>UID</span> <span>{selectedDog.fa_uid || '0'}</span></div>
                           <div className="flex justify-between text-xs font-bold text-slate-500"><span>등록번호</span> <span>{selectedDog.fa_regno || '-'}</span></div>
                           <div className="pt-2 border-t border-blue-100 font-black text-slate-800">{selectedDog.fa_name || '부견명 정보 없음'}</div>
                        </div>
                     </div>
                     <div className="bg-pink-50/30 p-6 rounded-3xl border border-pink-100">
                        <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-3">Mother (모견)</div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold text-slate-500"><span>UID</span> <span>{selectedDog.mo_uid || '0'}</span></div>
                           <div className="flex justify-between text-xs font-bold text-slate-500"><span>등록번호</span> <span>{selectedDog.mo_regno || '-'}</span></div>
                           <div className="pt-2 border-t border-pink-100 font-black text-slate-800">{selectedDog.mo_name || '모견명 정보 없음'}</div>
                        </div>
                     </div>
                  </div>
               </div>
               {/* Owner & Breeder */}
               <div className="space-y-6">
                  <div className="text-[11px] font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-4 h-0.5 bg-green-600"></div> 소유 및 번식 정보</div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                        <h5 className="font-black text-slate-900 mb-4 flex items-center gap-2"><User size={16} /> 소유자 정보</h5>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <DetailItem label="소유자명" value={selectedDog.poss_name || '-'} />
                              <DetailItem label="소유자 ID" value={selectedDog.poss_id || '-'} />
                           </div>
                           <DetailItem label="연락처" value={selectedDog.poss_phone || '-'} />
                           <DetailItem label="주소" value={selectedDog.poss_addr || '-'} />
                        </div>
                     </div>
                     <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                        <h5 className="font-black text-slate-900 mb-4 flex items-center gap-2"><ShieldCheck size={16} /> 번식자 정보</h5>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <DetailItem label="번식자명" value={selectedDog.breed_name || '-'} />
                              <DetailItem label="번식자 ID" value={selectedDog.breed_id || '-'} />
                           </div>
                           <DetailItem label="연락처" value={selectedDog.breed_phone || '-'} />
                           <DetailItem label="주소" value={selectedDog.breed_addr || '-'} />
                        </div>
                     </div>
                  </div>
               </div>
               {/* Awards & Other */}
               <div className="space-y-6">
                  <div className="text-[11px] font-black text-orange-600 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-4 h-0.5 bg-orange-600"></div> 특이 사항 및 기타 정보</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
                        <div className="text-[10px] font-bold text-orange-400 mb-1">고관절 검사</div>
                        <div className="font-black text-slate-800">{selectedDog.spec_bone || '-'}</div>
                     </div>
                     <div className="p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
                        <div className="text-[10px] font-bold text-orange-400 mb-1">DNA 특이사항</div>
                        <div className="font-black text-slate-800">{selectedDog.spec_dna || '-'}</div>
                     </div>
                     <div className="p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
                        <div className="text-[10px] font-bold text-orange-400 mb-1">종견인정평정</div>
                        <div className="font-black text-slate-800">{selectedDog.spec_male || '-'}</div>
                     </div>
                     <div className="p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
                        <div className="text-[10px] font-bold text-orange-400 mb-1">훈련 기록</div>
                        <div className="font-black text-slate-800">{selectedDog.spec_train || '-'}</div>
                     </div>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="수상 경력 1" value={selectedDog.spec_win || '-'} />
                        <DetailItem label="수상 경력 2" value={selectedDog.spec_win2 || '-'} />
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-200">
                        <DetailItem label="국내타단체번호" value={selectedDog.foreign100 || '-'} />
                        <DetailItem label="외국타단체번호" value={selectedDog.foreign_no || '-'} />
                        <DetailItem label="외국타단체번호2" value={selectedDog.foreign_no2 || '-'} />
                        <DetailItem label="마이크로칩" value={selectedDog.micro || '-'} />
                     </div>
                  </div>
               </div>
               <div className="pt-2 text-center">
                  <div className="text-xs font-black text-slate-300 italic">Data Reflected as of {new Date().toLocaleDateString('ko-KR')} | KKC Registry</div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-center"><button onClick={() => setSelectedDog(null)} className="px-12 py-4 bg-slate-950 text-white rounded-2xl font-black transition-all active:scale-95">닫기</button></div>
          </div>
        </div>
      )}

      {/* Membership Upgrade Modal */}
      {isUpgradeModalOpen && (
        <MembershipUpgradeModal 
          onClose={() => setIsUpgradeModalOpen(false)} 
          onApply={async (reqData: any) => {
            console.log("🚀 [Portal Apply] Submitting Request:", reqData);
            setIsUpdating(true);
            try {
              // 🔄 [FIELD MAPPING] 프론트엔드 필드명을 백엔드 규격에 맞게 변환
              const mappedData = {
                req_degree: reqData.req_degree,
                req_years: Number(reqData.req_years || 0),
                amount: Number(reqData.amount || 0), // 💰 숫자로 확실하게 변환
                depositor: reqData.depositor
              };
              
              const res = await portalApplyMembership(userData.mid, mappedData);
              console.log("📥 [Portal Apply] Server Feedback:", res);
              if (res.success) {
                  alert(res.message || '등급 전환 신청이 성공적으로 접수되었습니다. 입금이 확인되면 관리자가 승인해 드립니다.');
                  setIsUpgradeModalOpen(false);
                  fetchData();
              } else {
                  alert(res.error || '신청 도중 오류가 발생했습니다.');
              }
            } catch (e: any) {
              console.error("🔥 [Portal Apply] Error occurred:", e);
              alert("통신 중 심각한 오류가 발생했습니다. 브라우저 콘솔(F12)을 확인해 주세요.");
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <MemberEditModal 
          profile={profile}
          isLoading={isUpdating}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (updateData: any) => {
            setIsUpdating(true);
            try {
              const res = await portalUpdateMyData(userData.mid, updateData);
              if (res.success) { 
                setData((prev: any) => ({ ...prev, profile: { ...prev.profile, ...updateData } })); 
                alert('성공적으로 수정되었습니다.'); 
                setIsEditModalOpen(false); 
              } else { 
                alert(res.error || '오류가 발생했습니다.'); 
              }
            } catch (e) {
              console.error("Update Profile Error:", e);
              alert("수정 처리 중 오류가 발생했습니다.");
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal 
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
};

// 🏛️ Membership Upgrade Modal Component
const MembershipUpgradeModal = ({ onClose, onApply }: any) => {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [depositor, setDepositor] = useState('');

  const plans = [
    { id: 'A1', title: '정회원 1년', period: 1, price: 60000, desc: '가입비 포함 / 1년 유효', degree: 'A1' },
    { id: 'A2', title: '정회원 2년', period: 2, price: 80000, desc: '가입비 포함 / 2년 유효', degree: 'A2' },
    { id: 'A3', title: '정회원 3년', period: 3, price: 100000, desc: '가입비 포함 / 3년 유효', degree: 'A3' },
    { id: 'C0', title: '특별회원 (평생)', period: 99, price: 500000, desc: '만 65세까지 유효 / 평생 혜택', degree: 'C0' },
  ];

  const handleNext = () => {
    if (selectedPlan) setStep(2);
    else alert('등급을 선택해 주세요.');
  };

  const handleFinalSubmit = () => {
    console.log("👆 Final Submission Clicked:", selectedPlan, depositor);
    if (!depositor.trim()) return alert('입금자 성함을 입력해 주세요.');
    onApply({
        req_degree: selectedPlan.degree,
        req_years: selectedPlan.period,
        amount: selectedPlan.price,
        depositor: depositor.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
        <div className="bg-white rounded-[50px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-10 pb-6 flex justify-between items-center bg-white">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">멤버십 전환 신청</h2>
                   <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Upgrade Your Experience</p>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 pt-4">
                {step === 1 ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map(plan => (
                                <button 
                                    key={plan.id} 
                                    onClick={() => setSelectedPlan(plan)} 
                                    className={`p-6 rounded-[32px] border-2 text-left transition-all relative ${selectedPlan?.id === plan.id ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'}`}
                                >
                                    <div className="text-lg font-black text-slate-900 mb-1">{plan.title}</div>
                                    <div className="text-xs text-slate-400 font-bold mb-4">{plan.desc}</div>
                                    <div className="text-2xl font-black text-orange-600">₩{plan.price.toLocaleString()}</div>
                                    {selectedPlan?.id === plan.id && <div className="absolute top-4 right-4 text-orange-500"><CheckCircle size={24} /></div>}
                                </button>
                            ))}
                        </div>

                        {/* Benefits Display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100 space-y-4">
                                <h5 className="font-black text-blue-700 text-sm flex items-center gap-2"><Star size={16} fill="currentColor" /> 정회원 혜택</h5>
                                <ul className="text-[11px] text-blue-900/70 space-y-2 font-bold leading-relaxed">
                                    <li>• 회원증 발급 (가입비 포함)</li>
                                    <li>• 협회 주최 전 행사 무료 입장</li>
                                    <li>• 자견 등록 및 혈통서 발급 권한</li>
                                    <li>• Dog Show 출전 자격 부여</li>
                                </ul>
                            </div>
                            <div className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100 space-y-4">
                                <h5 className="font-black text-orange-700 text-sm flex items-center gap-2"><Gem size={16} fill="currentColor" /> 특별회원 혜택</h5>
                                <ul className="text-[11px] text-orange-900/70 space-y-2 font-bold leading-relaxed">
                                    <li>• 정회원과 동일한 모든 혜택 제공</li>
                                    <li className="text-orange-600 font-extrabold">• 만 65세까지 유효 (평생 혜택)</li>
                                    <li>• 단 한번의 회비로 영구 자격 유지</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100">
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Deposit Account (입금 계좌)</div>
                          <div className="text-xl font-black text-blue-900 mb-1">KEB하나은행 222-910031-30404</div>
                          <div className="text-sm font-bold text-blue-600">(사단법인 한국애견협회)</div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">실제 입금자 성함을 입력해 주세요</label>
                           <input 
                              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] px-6 py-4 text-lg font-black outline-none transition-all" 
                              placeholder="입금자 성함" 
                              value={depositor} 
                              onChange={e => setDepositor(e.target.value)} 
                           />
                           <p className="text-[11px] text-slate-400 font-bold ml-2 mt-2 leading-relaxed">
                             * 입금 확인 후 등급 변경까지 영업일 기준 약 1일이 소요됩니다.
                           </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                <button onClick={() => step === 1 ? onClose() : setStep(1)} className="flex-1 py-4 bg-white border border-slate-200 rounded-[22px] font-black text-sm text-slate-500 transition-all hover:bg-slate-100">
                  {step === 1 ? '취소' : '이전으로'}
                </button>
                <button 
                  disabled={step === 1 && !selectedPlan} 
                  onClick={() => step === 1 ? handleNext() : handleFinalSubmit()} 
                  className="flex-[1.5] py-4 bg-slate-900 text-white rounded-[22px] font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30"
                >
                  {step === 1 ? '계속하기' : '신청 완료하기'}
                </button>
            </div>
        </div>
    </div>
  );
};

// 🏛️ Edit Modal Component
const MemberEditModal = ({ profile, isLoading, onClose, onSave }: any) => {
    const [formData, setFormData] = useState({ 
        passwd: '',
        confirmPasswd: '',
        name: profile.name || '', 
        name_eng: profile.name_eng || '',
        birth: profile.birth || '',
        email: profile.email || '', 
        hp: profile.hp || '', 
        phone: profile.phone || '', 
        zipcode: profile.zipcode || '', 
        addr: profile.addr || '', 
        addr_1: profile.addr_1 || '',
        zipcode2: profile.zipcode2 || '',
        addr2: profile.addr2 || '',
        addr2_1: profile.addr2_1 || ''
    });

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

    const handleSave = () => {
        if (formData.passwd && formData.passwd !== formData.confirmPasswd) {
            return alert('비밀번호가 일치하지 않습니다.');
        }
        
        // Remove confirmPasswd before saving, and passwd if it's empty
        const payload = { ...formData };
        delete (payload as any).confirmPasswd;
        if (!payload.passwd) delete payload.passwd;

        onSave(payload);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-8 pb-6 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">회원 정보 수정</h2>
                        <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Edit My Info</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="space-y-8 max-w-3xl mx-auto">
                        
                        {/* 1. 계정 정보 섹션 */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200 hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl"><Lock size={20}/></div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">비밀번호 변경 <span className="text-sm font-bold text-slate-400 font-normal">(선택)</span></h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">새 비밀번호</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="password"
                                            value={formData.passwd}
                                            onChange={(e) => setFormData({ ...formData, passwd: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-sm placeholder:text-slate-300"
                                            placeholder="변경할 비밀번호 입력 (선택)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">새 비밀번호 확인</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="password"
                                            value={formData.confirmPasswd}
                                            onChange={(e) => setFormData({ ...formData, confirmPasswd: e.target.value })}
                                            className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl transition-all outline-none font-bold text-sm placeholder:text-slate-300 ${formData.confirmPasswd && formData.passwd === formData.confirmPasswd ? 'border-green-500 bg-green-50' : 'border-transparent focus:border-blue-500 focus:bg-white'}`}
                                            placeholder="비밀번호 재입력"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. 인적 사항 섹션 */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200 hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl"><User size={20}/></div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">인적 사항</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">성함 (실명) *</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                                        placeholder="예: 홍길동"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">생년월일 *</label>
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
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">이름 (영문)</label>
                                    <input
                                        type="text"
                                        value={formData.name_eng}
                                        onChange={(e) => setFormData({ ...formData, name_eng: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300"
                                        placeholder="English Name (예: HONG GILDONG)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. 연락처 정보 섹션 */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200 hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl"><Smartphone size={20}/></div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">연락처 정보</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">휴대폰 번호 *</label>
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
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">일반 전화</label>
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
                                    <label className="block text-xs font-black text-slate-500 mb-3 ml-2 tracking-wide uppercase">이메일 주소</label>
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
                        </div>

                        {/* 4. 주소 정보 섹션 */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200 hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl"><MapPin size={20}/></div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">거주지 주소</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text" readOnly
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
                                    type="text" readOnly
                                    value={formData.addr}
                                    className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-600 mb-2 cursor-not-allowed"
                                    placeholder="기본 주소"
                                />
                                <input
                                    type="text"
                                    value={formData.addr_1}
                                    onChange={(e) => setFormData({ ...formData, addr_1: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 shadow-inner"
                                    placeholder="상세 주소를 입력하세요"
                                />
                            </div>
                        </div>

                        {/* 5. DM 주소 정보 섹션 */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200 hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl"><Globe size={20}/></div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">DM 주소 <span className="text-sm font-bold text-slate-400 font-normal">(우편물 수령지)</span></h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-2 text-sm justify-end mb-2">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ 
                                            ...formData, 
                                            zipcode2: formData.zipcode, 
                                            addr2: formData.addr, 
                                            addr2_1: formData.addr_1 
                                        })}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        거주지와 동일하게 채우기
                                    </button>
                                </div>
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
                                </div>
                                <input
                                    type="text" readOnly
                                    value={formData.addr2}
                                    className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-600 cursor-not-allowed"
                                    placeholder="우편물을 받으실 주소"
                                />
                                <input
                                    type="text"
                                    value={formData.addr2_1}
                                    onChange={(e) => setFormData({ ...formData, addr2_1: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 shadow-inner"
                                    placeholder="상세 주소"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Submit Block */}
                <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 mx-auto w-full justify-between items-center rounded-b-[40px]">
                    <div className="text-xs text-slate-400 font-bold hidden md:block">* 제출 시 정보가 즉시 업데이트됩니다.</div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-10 py-4 bg-white border-2 border-slate-200 rounded-[20px] font-black text-slate-500 transition-all hover:bg-slate-50 hover:border-slate-300">
                            취소
                        </button>
                        <button disabled={isLoading} onClick={handleSave} className="flex-1 md:flex-none px-14 py-4 bg-blue-600 text-white rounded-[20px] font-black shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 text-lg flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none min-w-[200px]">
                            {isLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />} 변경사항 저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 🏛️ Detail Item Component
const DetailItem = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</div>
    <div className="font-bold text-slate-800 tracking-tight text-sm">{value}</div>
  </div>
);
// 🏛️ Application Detail Modal
const ApplicationDetailModal = ({ app, onClose }: any) => {
    const isPaid = app.payment_status === '입금완료' || app.payment_status === '입금';
    
    return (
        <div className="fixed inset-0 z-[203] flex justify-center items-start p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 flex flex-col my-8" onClick={e => e.stopPropagation()}>
                <div className={`p-8 pb-14 text-white relative overflow-hidden ${isPaid ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-rose-600'}`}>
                    <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12"><Calendar size={180} /></div>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all focus:outline-none z-[100]"><X size={20} /></button>
                    
                    <div className="relative z-10">
                        <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-4 border border-white/20 shadow-sm">{app.source} APPLICATION</div>
                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">{app.event_title}</h2>
                        <div className="flex items-center gap-2 opacity-80 text-sm font-bold">
                            <Calendar size={16} /> 
                            <span>대회일자: {app.event_date || '일정 확인 중'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-8 -mt-8 bg-white rounded-t-[32px] relative z-20 overflow-y-auto">
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4 ml-1">나의 신청 정보 (Entry Info)</label>
                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px] space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-bold">혈통서 등록번호</span>
                                    <span className="text-slate-900 font-black">{app.reg_no || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-sm">
                                    <span className="text-slate-400 font-bold">신청 항목(견명 등)</span>
                                    <span className="text-slate-900 font-black">{app.dog_name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start border-t border-slate-100 pt-4 text-sm">
                                    <span className="text-slate-400 font-bold shrink-0">선택 품목</span>
                                    <span className="text-slate-900 font-black text-right">{app.options_summary || '기본 참가'}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-sm">
                                    <span className="text-slate-400 font-bold">참가비 총액</span>
                                    <span className="text-blue-600 font-black text-lg">{Number(app.total_amount || 0).toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-sm">
                                    <span className="text-slate-400 font-bold">신청 일자</span>
                                    <span className="text-slate-900 font-black">{app.apply_date}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4 ml-1">접수 및 결제 상태 (Status)</label>
                            <div className={`p-8 rounded-[28px] border-2 flex flex-col items-center text-center gap-3 transition-all ${isPaid ? 'bg-teal-50/50 border-teal-100 shadow-teal-50 shadow-lg' : 'bg-orange-50/50 border-orange-100 shadow-orange-50 shadow-lg'}`}>
                                <div className={`p-4 rounded-full ${isPaid ? 'bg-teal-500 text-white' : 'bg-orange-500 text-white animate-bounce'}`}>
                                    {isPaid ? <CheckCircle size={32} /> : <Banknote size={32} />}
                                </div>
                                <div>
                                    <div className={`text-2xl font-black ${isPaid ? 'text-teal-700' : 'text-orange-700'}`}>
                                        {isPaid ? '접수완료(입금)' : '접수중(미입금)'}
                                    </div>
                                    <p className={`text-[11px] font-bold mt-2 ${isPaid ? 'text-teal-600/60' : 'text-orange-600/60'}`}>
                                        {isPaid ? '성공적으로 접수되었습니다. 대회장에서 뵙겠습니다!' : (
                                            <>
                                                입금 확인 후 접수가 최종 완료됩니다.
                                                <br />
                                                <span className="text-[14px] font-[900] text-orange-900 mt-4 block bg-white/60 py-4 px-5 rounded-[22px] border border-orange-200 shadow-sm leading-relaxed">
                                                    하나은행 222-910031-29404 <br />
                                                    <span className="text-[11px] opacity-70">(예금주: 사단법인 한국애견협회)</span>
                                                    <span className="block mt-3 text-[12px] font-black text-red-600 bg-red-50 border border-red-200 rounded-[12px] py-2 px-3">
                                                        ⚠️ 입금자명을 꼭 회원이름으로 입금해주시기 바랍니다.
                                                    </span>
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t flex justify-center">
                    <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm transition-all hover:bg-black active:scale-95 shadow-xl shadow-slate-200">
                        확인 완료
                    </button>
                </div>
            </div>
        </div>
    );
};
