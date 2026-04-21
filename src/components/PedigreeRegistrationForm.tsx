
import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Save, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { fetchDogsByRegNos } from '../services/memberService';
import { fetchLastRegNo, checkRegNoExists, fetchHairs, checkForeignNoExists, checkOtherOrgNoExists, addDogClass, addHairColor, fetchDogClasses, deleteDogClass, deleteHairColor } from '../services/pedigreeService';
import { PersonSearchModal } from './MemberSearchModal';

const normalizeCoatType = (val: string): string => {
  return val ? val.trim() : ''; // dogTab 내용 있는 그대로 표시
};
const toDBCoatType = (val: string): string => {
  return val ? val.trim() : ''; // 선택된 값 그대로 DB에 저장
};

interface PedigreeRegistrationFormProps {
  initialData: {
    selectedType: string;
    group: string;
    breed: string;
    count: number;
    dogClasses?: any[];
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

const REG_TYPE_LABELS: Record<string, string> = {
  'D': '자견', 'I': '수입견', 'E': '타단체견', 'S': '단독견', 'DR': '국내 관계견', 'FR': '외국 관계견', 'N': 'NR'
};

export const PedigreeRegistrationForm: React.FC<PedigreeRegistrationFormProps> = ({ initialData, onSave, onCancel }) => {
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  
  const isShepherd = initialData.breed?.includes('셰퍼드') || initialData.breed?.includes('세퍼드');
  
  // 1. 공통 정보 및 번식자/소유자 정보
  const [commonData, setCommonData] = useState({
    kennel: '',
    kennelEng: '',
    // 번식자 정보
    breederId: '',
    breeder: '',
    breederEng: '',
    breederPhone: '',
    breederAddr: '',
    // 소유자 정보
    owner: '',
    ownerId: '',
    ownerEng: '',
    ownerPhone: '',
    ownerAddr: '',
    // 등록/공통
    registrationDate: new Date().toISOString().split('T')[0],
    group: initialData.group,
    breed: initialData.breed,
    birthDate: '',
    sireRegNo: '',
    damRegNo: '',
    sireUid: '',
    damUid: '',
    sireCoatType: isShepherd ? 'stock hair' : '', // 🚀 부견 모종 추가
    damCoatType: isShepherd ? 'stock hair' : ''   // 🚀 모견 모종 추가
  });

  // 2. 개별 애견 정보 (1/1 형식)
  const [dogsData, setDogsData] = useState(
    Array.from({ length: initialData.count }, () => ({
      name: '',
      fullName: '',
      gender: 'M',
      regNo: '',
      color: '',
      coatType: isShepherd ? 'stock hair' : '',
      microchip: '',
      otherOrg: '',
      foreignNo: '',
      foreignNo2: '',
      hairIndex: '',
      hipBone: '',
      dnaTest: '',
      training: '',
      highestAward: '',
      inbreeding: '',
      breedApproval: '',
      highestAward2: '',
      indexNo: '',
      memo: ''
    }))
  );

  const [sireInfo, setSireInfo] = useState<{ name: string; breed: string; sex: string } | null>(null);
  const [damInfo, setDamInfo] = useState<{ name: string; breed: string; sex: string } | null>(null);
  const [isLoadingSire, setIsLoadingSire] = useState(false);
  const [isLoadingDam, setIsLoadingDam] = useState(false);
  const [isAssigningRegNo, setIsAssigningRegNo] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<'breeder' | 'owner' | null>(null);

  const [hairOptions, setHairOptions] = useState<any[]>([]);
  const [dogClasses, setDogClasses] = useState<any[]>(initialData.dogClasses || []);

  useEffect(() => {
    fetchHairs().then(hairs => setHairOptions(hairs.sort((a, b) => a.name.localeCompare(b.name)))).catch(console.error);
    if (!initialData.dogClasses) {
      fetchDogClasses().then(classes => setDogClasses(classes)).catch(console.error);
    }
  }, []);

  const [isCheckingRegNo, setIsCheckingRegNo] = useState<Record<number, boolean>>({});
  const [regNoExistInfo, setRegNoExistInfo] = useState<Record<number, any>>({});
  const [searchError, setSearchError] = useState<{ sire?: string; dam?: string; regNo?: Record<number, string> }>({});

  const handleAssignRegNo = async () => {
    const classes = initialData.dogClasses || [];
    const breedInfo = classes.find(d => d.breed === initialData.breed);
    const prefix = initialData.selectedType === 'N' ? 'NR' : (breedInfo?.keyy ? `${breedInfo.keyy}-C` : '');
    
    if (!prefix) {
      alert('해당 견종의 코드를 찾을 수 없어 자동 부여가 불가능합니다.');
      return;
    }

    setIsAssigningRegNo(true);
    try {
      const lastRegNo = await fetchLastRegNo(prefix);
      let nextNum = 1;

      if (lastRegNo) {
        const numPart = lastRegNo.replace(prefix, '').match(/\d+/);
        if (numPart) nextNum = parseInt(numPart[0], 10) + 1;
      }

      const newDogs = [...dogsData];
      for (let i = 0; i < newDogs.length; i++) {
        const paddedNum = (nextNum + i).toString().padStart(initialData.selectedType === 'N' ? 6 : 5, '0');
        newDogs[i] = { ...newDogs[i], regNo: `${prefix}${paddedNum}` };
      }
      setDogsData(newDogs);
    } catch (e) {
      console.error("Assign RegNo Error:", e);
      alert('등록번호를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsAssigningRegNo(false);
    }
  };

  const handleCheckRegNo = async (index: number) => {
    const regNo = dogsData[index].regNo;
    if (!regNo.trim()) return;

    setIsCheckingRegNo(prev => ({ ...prev, [index]: true }));
    setSearchError(prev => ({ ...prev, regNo: { ...prev.regNo, [index]: '' } }));
    setRegNoExistInfo(prev => ({ ...prev, [index]: null }));

    try {
      const exists = await checkRegNoExists(regNo);
      if (exists) {
        setRegNoExistInfo(prev => ({ ...prev, [index]: exists }));
        setSearchError(prev => ({ ...prev, regNo: { ...prev.regNo, [index]: '중복된 등록번호가 존재합니다.' } }));
      } else {
        alert('사용 가능한 등록번호입니다.');
      }
    } catch (e) {
      setSearchError(prev => ({ ...prev, regNo: { ...prev.regNo, [index]: '조회 중 오류가 발생했습니다.' } }));
    } finally {
      setIsCheckingRegNo(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSearchParent = async (type: 'sire' | 'dam') => {
    const regNo = type === 'sire' ? commonData.sireRegNo : commonData.damRegNo;
    if (!regNo.trim()) return;

    if (type === 'sire') { setIsLoadingSire(true); setSearchError(prev => ({ ...prev, sire: undefined })); }
    else { setIsLoadingDam(true); setSearchError(prev => ({ ...prev, dam: undefined })); }

    try {
      const results = await fetchDogsByRegNos([regNo], 'dogTab');
      const dogList = Object.values(results);
      
      if (dogList.length > 0) {
        const dog = dogList[0] as any;
        const expectedSex = type === 'sire' ? 'M' : 'F';
        
        // 성별 검증 (수컷 M / 암컷 F)
        const dogSex = (dog.sex || '').toUpperCase();
        if (dogSex !== expectedSex && dogSex !== (expectedSex === 'M' ? '수컷' : '암컷')) {
          setSearchError(prev => ({ ...prev, [type]: `${type === 'sire' ? '부견' : '모견'}은 ${expectedSex}이어야 합니다. (현재: ${dog.sex || '미상'})` }));
          if (type === 'sire') setSireInfo(null); else setDamInfo(null);
        } else {
          // 🛡️ [DATA ROBUSTNESS] 필드명 변동성 및 영문-한글 변환 대응
          const rawCoat = dog.hair_long || dog.coatType || '';
          const coat = normalizeCoatType(rawCoat); // 영문을 한글로 번역

          const info = { 
            name: dog.name, 
            breed: dog.dog_class, 
            sex: dog.sex, 
            uid: dog.uid, 
            hair_long: coat // 🎯 한글로 변환된 값 저장
          };

          if (type === 'sire') {
            setSireInfo(info as any);
            setCommonData(prev => ({ ...prev, sireUid: dog.uid, sireCoatType: coat }));
          } else {
            setDamInfo(info as any);
            setCommonData(prev => ({ ...prev, damUid: dog.uid, damCoatType: coat }));
          }
        }
      } else {
        setSearchError(prev => ({ ...prev, [type]: '등록된 번호가 없습니다.' }));
        if (type === 'sire') {
          setSireInfo(null);
          setCommonData(prev => ({ ...prev, sireUid: '' }));
        } else {
          setDamInfo(null);
          setCommonData(prev => ({ ...prev, damUid: '' }));
        }
      }
    } catch (e: any) {
      setSearchError(prev => ({ ...prev, [type]: '조회 중 오류가 발생했습니다.' }));
    } finally {
      if (type === 'sire') setIsLoadingSire(false); else setIsLoadingDam(false);
    }
  };

  const handleSelectPerson = (person: any) => {
    if (searchTarget === 'breeder') {
      setCommonData(prev => ({
        ...prev,
        breederId: person.data.id || '',
        breeder: person.name || '',
        breederEng: person.data.nameEng || '',
        breederPhone: person.data.phone || '',
        breederAddr: person.data.address || '',
        // 🎯 [KSAHO AUTO-PROPAGATION] 번식자 선택 시 견사호 정보 동시 주입
        kennel: person.data.saho || prev.kennel,
        kennelEng: person.data.sahoEng || prev.kennelEng
      }));
    } else if (searchTarget === 'owner') {
      setCommonData(prev => ({
        ...prev,
        owner: person.name || '',
        ownerId: person.data.id || '',
        ownerEng: person.data.nameEng || '',
        ownerPhone: person.data.phone || '',
        ownerAddr: person.data.address || ''
      }));
    }
  };

  const handleDogChange = (field: string, value: string) => {
    const newDogs = [...dogsData];
    
    // 🎯 [INTELLIGENT COLOR PROPAGATION] 
    // 모색(color)이 변경될 때, 뒷순서 강아지들의 모색이 비어있다면 동일한 값으로 미리 채워줌
    if (field === 'color' && value.trim() !== '') {
      for (let i = currentDogIndex; i < newDogs.length; i++) {
        // 현재 강아지 이후의 강아지들 중 모색이 아직 비어있는 경우에만 자동 적용
        if (i === currentDogIndex || !newDogs[i].color || newDogs[i].color.trim() === '') {
          newDogs[i] = { ...newDogs[i], [field]: value };
        }
      }
    } else {
      // 그 외 필드 혹은 빈 값으로 변경 시에는 현재 강아지만 변경
      newDogs[currentDogIndex] = { ...newDogs[currentDogIndex], [field]: value };
      
      // 🚀 [OPTION 1] 국내/외국 관계견일 경우 타단체/외국번호를 등록번호로 실시간 동기화
      if (initialData.selectedType === 'DR' || initialData.selectedType === 'FR') {
        if (field === 'otherOrg' || field === 'foreignNo' || field === 'foreignNo2') {
          newDogs[currentDogIndex].regNo = value;
        }
      }
    }
    
    setDogsData(newDogs);
  };

  const handleFullNameAssembly = (index: number, type: 'prefix' | 'suffix') => {
    const kennel = commonData.kennelEng || commonData.kennel || '';
    const name = dogsData[index].name || '';
    let assembled = '';
    if (type === 'prefix') assembled = `${name} OF ${kennel}`.trim();
    else assembled = `${kennel} ${name}`.trim();
    
    handleDogChange('fullName', assembled);
  };

  const typeLabel = REG_TYPE_LABELS[initialData.selectedType] || initialData.selectedType;
  const isNR = initialData.selectedType === 'N';

  // 스타일 유틸리티
  const labelStyle = "text-[11px] font-bold text-slate-500 mb-1 block ml-1";
  const inputStyle = "w-full bg-slate-50 border border-slate-200 rounded-md h-9 px-3 text-[12px] focus:border-blue-400 focus:bg-white outline-none transition-all placeholder:text-slate-300";
  const sectionCardStyle = "bg-white p-5 rounded-lg shadow-sm border border-slate-100";
  const subTitleStyle = "text-[13px] font-black text-slate-700 mb-4 flex items-center gap-2";

  return (
    <div className="absolute inset-0 bg-[#f0f2f5] overflow-y-auto z-[30] animate-in fade-in duration-300">
      {/* 🚀 상단 전역 헤더: 뒤로 가기 버튼 추가 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 mb-6 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft size={18} /> 뒤로 가기
            </button>
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
            <div>
              <h2 className="text-base font-black text-slate-800">신규 {typeLabel} 혈통서 등록 <span className="text-blue-500 ml-1 text-xs">v2.1</span></h2>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full min-h-full p-6 pt-0">
        <div className="max-w-[1600px] mx-auto pb-10">
          
          <div className="grid grid-cols-12 gap-5">
            
            {/* ==========================================================
                LEFT COLUMN: 기본 정보 (견사호, 번식자, 소유자)
               ========================================================== */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-5">
              <div className={sectionCardStyle}>
                 <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-100">
                   <h3 className="text-lg font-black text-slate-800 leading-tight">
                     {typeLabel} 혈통서<br/>신규 등록
                   </h3>
                   <button 
                     onClick={onCancel}
                     className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-bold transition-colors"
                   >
                     <ChevronLeft size={14} /> 이전
                   </button>
                 </div>
                 
                 <div className="space-y-3 mb-6">
                   <div>
                     <label className={labelStyle}>견사호</label>
                     <input type="text" className={inputStyle} value={commonData.kennel} onChange={e => setCommonData({...commonData, kennel: e.target.value})} />
                   </div>
                   <div>
                     <label className={labelStyle}>견사호 영어</label>
                     <input type="text" className={inputStyle} value={commonData.kennelEng} onChange={e => setCommonData({...commonData, kennelEng: e.target.value})} />
                   </div>
                 </div>

                 <div className={`border-t border-slate-100 pt-5 ${isNR ? 'opacity-50 grayscale brightness-75 contrast-75 pointer-events-none select-none' : ''}`}>
                   <h3 className={subTitleStyle}>
                     번식자/소유자 정보
                     {isNR && <span className="text-[10px] text-red-500 ml-2 font-normal">(NR 등록 시 불필요)</span>}
                   </h3>
                   <div className="space-y-3">
                     <div className="flex gap-2 items-end">
                       <div className="flex-1">
                         <label className={labelStyle}>번식자</label>
                         <input type="text" className={inputStyle} value={commonData.breeder} onChange={e => setCommonData({...commonData, breeder: e.target.value})} />
                       </div>
                       <button onClick={() => { setSearchTarget('breeder'); setIsSearchModalOpen(true); }} className="h-9 px-3 bg-[#10b981] text-white text-[11px] font-bold rounded-md hover:bg-emerald-600 transition-colors">검색</button>
                     </div>
                     <div>
                       <label className={labelStyle}>번식자 아이디</label>
                       <input type="text" className={inputStyle} value={commonData.breederId} onChange={e => setCommonData({...commonData, breederId: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelStyle}>번식자 영문이름</label>
                       <input type="text" className={inputStyle} value={commonData.breederEng} onChange={e => setCommonData({...commonData, breederEng: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelStyle}>번식자 연락처</label>
                       <input type="text" className={inputStyle} value={commonData.breederPhone} onChange={e => setCommonData({...commonData, breederPhone: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelStyle}>번식자 주소</label>
                       <input type="text" className={inputStyle} value={commonData.breederAddr} onChange={e => setCommonData({...commonData, breederAddr: e.target.value})} />
                     </div>

                     <div className="pt-2 flex gap-2 items-end">
                       <div className="flex-1">
                         <label className={labelStyle}>소유자 명</label>
                         <input type="text" className={inputStyle} value={commonData.owner} onChange={e => setCommonData({...commonData, owner: e.target.value})} />
                       </div>
                       <button onClick={() => { setSearchTarget('owner'); setIsSearchModalOpen(true); }} className="h-9 px-3 bg-[#10b981] text-white text-[11px] font-bold rounded-md hover:bg-emerald-600 transition-colors">검색</button>
                       <button onClick={() => setCommonData(prev => ({ 
                          ...prev, 
                          owner: prev.breeder, 
                          ownerId: prev.breederId,
                          ownerEng: prev.breederEng, 
                          ownerPhone: prev.breederPhone, 
                          ownerAddr: prev.breederAddr 
                        }))} className="h-9 px-3 bg-[#3b82f6] text-white text-[11px] font-bold rounded-md hover:bg-blue-600 transition-colors">동일</button>
                     </div>
                     <div>
                       <label className={labelStyle}>소유자 아이디</label>
                       <input type="text" className={inputStyle} value={commonData.ownerId} onChange={e => setCommonData({...commonData, ownerId: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelStyle}>소유자 영문이름</label>
                       <input type="text" className={inputStyle} value={commonData.ownerEng} onChange={e => setCommonData({...commonData, ownerEng: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelStyle}>소유자 연락처</label>
                       <input type="text" className={inputStyle} value={commonData.ownerPhone} onChange={e => setCommonData({...commonData, ownerPhone: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelStyle}>소유자 주소</label>
                       <input type="text" className={inputStyle} value={commonData.ownerAddr} onChange={e => setCommonData({...commonData, ownerAddr: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelStyle}>등록일자</label>
                       <input type="date" className={inputStyle} value={commonData.registrationDate || ''} onChange={e => setCommonData({...commonData, registrationDate: e.target.value})} />
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* ==========================================================
                MIDDLE COLUMN: 공통 정보 (그룹, 견종, 부모견)
               ========================================================== */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-5">
              <div className={sectionCardStyle}>
                 <h3 className={subTitleStyle}>공통 정보</h3>
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className={labelStyle}>그룹</label>
                      <input type="text" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-md h-9 px-3 text-[12px] text-slate-400 outline-none" value={commonData.group} />
                    </div>
                    <div className="relative">
                      <div className="flex justify-between items-end mb-1">
                        <label className={labelStyle}>견종</label>
                        <div className="flex gap-2">
                           <button 
                             onClick={async () => {
                               const selected = dogClasses.find(d => d.breed === commonData.breed);
                               if (!selected || !selected.uid) { alert("삭제할 견종을 먼저 선택해주세요."); return; }
                               if (!confirm(`'${selected.breed}' 견종을 마스터 데이터에서 정말 삭제하시겠습니까?`)) return;
                               try {
                                 const res = await deleteDogClass(selected.uid);
                                 if (res.success) {
                                   alert("삭제되었습니다.");
                                   const updated = await fetchDogClasses();
                                   setDogClasses(updated);
                                   setCommonData({...commonData, breed: ''}); 
                                 }
                               } catch (e) { alert("삭제 실패: " + e); }
                             }}
                             className="text-[9px] text-red-500 hover:underline font-black mb-1 mr-1"
                           >
                             삭제[-]
                           </button>
                           <button 
                             onClick={async () => {
                               const name = prompt("추가할 한글 견종명을 입력하세요:");
                               if (!name) return;
                               const eng = prompt("추가할 영문 견종명을 입력하세요 (또는 한글명 입력):") || name;
                               const keyy = prompt("견종 코드(Prefix)를 입력하세요 (예: S, P, Y):");
                               if (!keyy) return;
                               const groupp = prompt("그룹 번호를 입력하세요 (예: 1, 2, 3...):") || "1";
                               
                               try {
                                 const res = await addDogClass({ keyy, kor_name: name, name: eng, groupp });
                                 if (res.success) {
                                   alert("견종이 추가되었습니다.");
                                   const updated = await fetchDogClasses();
                                   setDogClasses(updated);
                                   setCommonData({...commonData, breed: name}); 
                                 }
                               } catch (e) { alert("추가 실패: " + e); }
                             }}
                             className="text-[9px] text-blue-500 hover:underline font-black mb-1 mr-1"
                           >
                             추가[+]
                           </button>
                        </div>
                      </div>
                      <select 
                        className={inputStyle} 
                        value={commonData.breed} 
                        onChange={e => {
                          const newBreed = e.target.value;
                          const breed = dogClasses.find(d => d.breed === newBreed);
                          const isNowShepherd = newBreed.includes('셰퍼드') || newBreed.includes('세퍼드');
                          
                          setCommonData({
                            ...commonData, 
                            breed: newBreed, 
                            group: breed?.group || '',
                            ...(isNowShepherd ? { sireCoatType: 'stock hair', damCoatType: 'stock hair' } : {})
                          });
                          
                          if (isNowShepherd) {
                            setDogsData(prev => prev.map(dog => ({ ...dog, coatType: 'stock hair' })));
                          }
                        }}
                      >
                        <option value="">견종 선택...</option>
                        {dogClasses.map((d, i) => <option key={i} value={d.breed}>{d.breed} ({d.group}그룹)</option>)}
                      </select>
                    </div>
                 </div>
                 <div>
                    <label className={labelStyle}>생년월일</label>
                    <input 
                      type="date" 
                      className={inputStyle}
                      value={commonData.birthDate}
                      onChange={e => setCommonData({...commonData, birthDate: e.target.value})}
                    />
                 </div>
              </div>

              <div className={sectionCardStyle}>
                 <h3 className={subTitleStyle}>
                   부견 정보 <span className="text-blue-500 text-[10px]">▲</span>
                 </h3>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="부견 등록번호 입력" 
                      className={`${inputStyle} ${searchError.sire ? 'border-red-400 focus:border-red-400' : ''}`}
                      value={commonData.sireRegNo}
                      onChange={e => {
                        setCommonData({...commonData, sireRegNo: e.target.value, sireUid: ''});
                        setSireInfo(null);
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleSearchParent('sire')}
                    />
                    <button 
                      onClick={() => handleSearchParent('sire')}
                      disabled={isLoadingSire}
                      className="px-4 h-9 bg-[#c7d2fe] text-[#4338ca] hover:bg-[#a5b4fc] text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 min-w-[50px] justify-center disabled:opacity-50"
                    >
                      {isLoadingSire ? <Loader2 size={12} className="animate-spin" /> : '조회'}
                    </button>
                 </div>
                 {sireInfo ? (
                   <div className="mt-3 p-2 bg-blue-50/50 rounded-lg text-[11px] border border-blue-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-blue-500" />
                        <div><span className="font-bold text-blue-700">{sireInfo.name}</span> <span className="text-gray-400 mx-1">|</span> {sireInfo.breed}</div>
                      </div>
                      <div className="pl-5 text-gray-500 font-bold">기존 모종: {commonData.sireCoatType || '미지정'}</div>
                   </div>
                 ) : searchError.sire ? (
                   <div className="mt-2 text-[10px] text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle size={10} /> {searchError.sire}
                   </div>
                 ) : null}

                 <div className={`mt-4 ${isNR ? 'opacity-50 grayscale brightness-75 contrast-75 pointer-events-none select-none' : ''}`}>
                    <label className={labelStyle}>부견 모종 선택</label>
                    <select 
                      className={inputStyle} 
                      value={commonData.sireCoatType} 
                      onChange={e => setCommonData({...commonData, sireCoatType: e.target.value})}
                    >
                      <option value="">- 선택 -</option>
                      <option value="stock hair">stock hair</option>
                      <option value="Long Coat">Long Coat</option>
                      {commonData.sireCoatType && commonData.sireCoatType !== 'stock hair' && commonData.sireCoatType !== 'Long Coat' && <option value={commonData.sireCoatType}>{commonData.sireCoatType}</option>}
                    </select>
                 </div>
              </div>

              <div className={sectionCardStyle}>
                 <h3 className={subTitleStyle}>
                   모견 정보 <span className="text-pink-500 text-[10px]">▲</span>
                 </h3>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="모견 등록번호 입력" 
                      className={`${inputStyle} ${searchError.dam ? 'border-red-400 focus:border-red-400' : ''}`}
                      value={commonData.damRegNo}
                      onChange={e => {
                        setCommonData({...commonData, damRegNo: e.target.value, damUid: ''});
                        setDamInfo(null);
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleSearchParent('dam')}
                    />
                    <button 
                      onClick={() => handleSearchParent('dam')}
                      disabled={isLoadingDam}
                      className="px-4 h-9 bg-[#fbcfe8] text-[#be185d] hover:bg-[#f9a8d4] text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 min-w-[50px] justify-center disabled:opacity-50"
                    >
                      {isLoadingDam ? <Loader2 size={12} className="animate-spin" /> : '조회'}
                    </button>
                 </div>
                 {damInfo ? (
                   <div className="mt-3 p-2 bg-pink-50/50 rounded-lg text-[11px] border border-pink-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-pink-500" />
                       <div><span className="font-bold text-pink-700">{damInfo.name}</span> <span className="text-gray-400 mx-1">|</span> {damInfo.breed}</div>
                      </div>
                      <div className="pl-5 text-gray-500 font-bold">기존 모종: {commonData.damCoatType || '미지정'}</div>
                   </div>
                 ) : searchError.dam ? (
                   <div className="mt-2 text-[10px] text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle size={10} /> {searchError.dam}
                   </div>
                 ) : null}

                 <div className={`mt-4 ${isNR ? 'opacity-50 grayscale brightness-75 contrast-75 pointer-events-none select-none' : ''}`}>
                    <label className={labelStyle}>모견 모종 선택</label>
                    <select 
                      className={inputStyle} 
                      value={commonData.damCoatType} 
                      onChange={e => setCommonData({...commonData, damCoatType: e.target.value})}
                    >
                      <option value="">- 선택 -</option>
                      <option value="stock hair">stock hair</option>
                      <option value="Long Coat">Long Coat</option>
                      {commonData.damCoatType && commonData.damCoatType !== 'stock hair' && commonData.damCoatType !== 'Long Coat' && <option value={commonData.damCoatType}>{commonData.damCoatType}</option>}
                    </select>
                 </div>
              </div>
            </div>

            {/* ==========================================================
                RIGHT COLUMN: 개별 애견 정보
               ========================================================== */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-6 space-y-5">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col h-full min-h-[600px]">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                       <h3 className="text-sm font-black text-slate-800">애견 정보 ({currentDogIndex + 1} / {initialData.count})</h3>
                       <button 
                         disabled={isAssigningRegNo || initialData.selectedType === 'DR' || initialData.selectedType === 'FR'}
                         onClick={handleAssignRegNo}
                         className={`${initialData.selectedType === 'DR' || initialData.selectedType === 'FR' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#10b981] text-white hover:bg-emerald-600 disabled:opacity-50'} px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1`}
                         title={initialData.selectedType === 'DR' || initialData.selectedType === 'FR' ? '관계견은 고유 등록번호를 자동 발급하지 않습니다.' : ''}
                       >
                          {isAssigningRegNo && !(initialData.selectedType === 'DR' || initialData.selectedType === 'FR') ? <Loader2 size={12} className="animate-spin" /> : null}
                          {initialData.selectedType === 'DR' || initialData.selectedType === 'FR' ? '자동 부여 불가 (관계견)' : '등록번호 자동 부여'}
                       </button>
                    </div>
                    <div className="flex gap-1.5">
                       <button 
                         disabled={currentDogIndex === 0}
                         onClick={() => setCurrentDogIndex(prev => prev - 1)}
                         className="px-2 py-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30"
                       >
                         이전
                       </button>
                       <button 
                         disabled={currentDogIndex === initialData.count - 1}
                         onClick={() => setCurrentDogIndex(prev => prev + 1)}
                         className="px-2 py-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30"
                       >
                         다음
                       </button>
                    </div>
                 </div>
                 
                 <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-6 space-y-5 flex-1 relative overflow-hidden">
                    <h4 className="text-[14px] font-black text-slate-800 mb-6 border-b border-slate-200 pb-2">애견 정보 {currentDogIndex + 1}</h4>
                    
                    {/* 행 1: 이름, 풀네임, 성별 */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-4">
                         <label className={labelStyle}>이름</label>
                         <input type="text" className={inputStyle} value={dogsData[currentDogIndex].name} onChange={e => handleDogChange('name', e.target.value)} />
                      </div>
                      <div className="col-span-12 md:col-span-5">
                         <div className="flex justify-between items-end mb-1">
                            <label className="text-[11px] font-bold text-slate-500 ml-1">풀네임</label>
                            <div className="flex gap-1">
                               <button onClick={() => handleFullNameAssembly(currentDogIndex, 'prefix')} className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded font-bold">앞</button>
                               <button onClick={() => handleFullNameAssembly(currentDogIndex, 'suffix')} className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded font-bold">뒤</button>
                            </div>
                         </div>
                         <input type="text" className={inputStyle} value={dogsData[currentDogIndex].fullName} onChange={e => handleDogChange('fullName', e.target.value)} />
                      </div>
                      <div className="col-span-12 md:col-span-3">
                         <label className={labelStyle}>성별</label>
                         <div className="flex gap-5 items-center h-9">
                            <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-slate-600">
                              <input type="radio" name={`gender-${currentDogIndex}`} checked={dogsData[currentDogIndex].gender === 'M'} onChange={() => handleDogChange('gender', 'M')} className="w-4 h-4 accent-blue-600" /> M
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-slate-600">
                              <input type="radio" name={`gender-${currentDogIndex}`} checked={dogsData[currentDogIndex].gender === 'F'} onChange={() => handleDogChange('gender', 'F')} className="w-4 h-4 accent-blue-600" /> F
                            </label>
                         </div>
                      </div>
                    </div>

                    {/* 행 2: 등록번호, 모색, 모종 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                          <label className={labelStyle}>등록번호</label>
                          <div className="flex gap-2 relative">
                            <input 
                              type="text" 
                              className={`${inputStyle} flex-1 ${searchError.regNo?.[currentDogIndex] ? 'border-red-400 focus:border-red-400' : ''} ${(initialData.selectedType === 'DR' || initialData.selectedType === 'FR') ? 'bg-indigo-50/50 text-indigo-700 font-bold' : ''}`}
                              value={dogsData[currentDogIndex].regNo} 
                              onChange={e => handleDogChange('regNo', e.target.value)} 
                              placeholder={(initialData.selectedType === 'DR' || initialData.selectedType === 'FR') ? "타단체/외국번호 동기화 됨" : ""}
                            />
                            <button 
                              onClick={() => handleCheckRegNo(currentDogIndex)}
                              disabled={isCheckingRegNo[currentDogIndex]}
                              className="px-4 h-9 bg-[#f1f5f9] text-slate-600 hover:bg-[#e2e8f0] border border-slate-200 text-[11px] font-bold rounded-md transition-colors flex items-center justify-center min-w-[50px] disabled:opacity-50"
                            >
                              {isCheckingRegNo[currentDogIndex] ? <Loader2 size={12} className="animate-spin" /> : '조회'}
                            </button>
                          </div>
                          {regNoExistInfo[currentDogIndex] && (
                            <div className="mt-1 p-2 bg-red-50 rounded text-[10px] text-red-500 font-bold border border-red-100 flex flex-col gap-1 w-[200%] max-w-[400px]">
                               <span className="flex items-center gap-1"><AlertCircle size={10} /> {searchError.regNo?.[currentDogIndex]}</span>
                               <span className="text-gray-500 font-normal pl-3">등록된 개체명: {regNoExistInfo[currentDogIndex].name}</span>
                            </div>
                          )}
                      </div>
                      <div className={isNR ? 'opacity-50 grayscale brightness-75 contrast-75 pointer-events-none select-none' : ''}>
                          <div className="flex justify-between items-end mb-1">
                             <label className={labelStyle}>모색</label>
                             <div className="flex gap-2">
                                <button 
                                  onClick={async () => {
                                    const selected = hairOptions.find(h => h.name === dogsData[currentDogIndex].color);
                                    if (!selected || !selected.uid) { alert("삭제할 모색을 먼저 선택해주세요."); return; }
                                    if (!confirm(`'${selected.name}' 모색을 마스터 데이터에서 정말 삭제하시겠습니까?`)) return;
                                    try {
                                      const res = await deleteHairColor(selected.uid);
                                      if (res.success) {
                                        alert("삭제되었습니다.");
                                        const updated = await fetchHairs();
                                        setHairOptions(updated.sort((a,b) => a.name.localeCompare(b.name)));
                                        handleDogChange('color', '');
                                      }
                                    } catch (e) { alert("삭제 실패: " + e); }
                                  }}
                                  className="text-[9px] text-red-500 hover:underline font-black mb-1 mr-1"
                                >
                                  삭제[-]
                                </button>
                                <button 
                                  onClick={async () => {
                                    const color = prompt("추가할 새로운 모색명을 입력하세요 (예: 화이트, 레드파티...):");
                                    if (!color) return;
                                    try {
                                      const res = await addHairColor(color);
                                      if (res.success) {
                                        alert("모색이 추가되었습니다.");
                                        const updated = await fetchHairs();
                                        setHairOptions(updated.sort((a,b) => a.name.localeCompare(b.name)));
                                        handleDogChange('color', color);
                                      }
                                    } catch (e) { alert("추가 실패: " + e); }
                                  }}
                                  className="text-[9px] text-emerald-600 hover:underline font-black mb-1 mr-1"
                                >
                                  추가[+]
                                </button>
                             </div>
                          </div>
                          <select className={inputStyle} value={dogsData[currentDogIndex].color} onChange={e => handleDogChange('color', e.target.value)}>
                              <option value="">모색 선택...</option>
                              {hairOptions.map((h, i) => <option key={i} value={h.name}>{h.name}</option>)}
                          </select>
                      </div>
                      <div className={isNR ? 'opacity-50 grayscale brightness-75 contrast-75 pointer-events-none select-none' : ''}>
                          <label className={labelStyle}>모종</label>
                          <select className={inputStyle} value={dogsData[currentDogIndex].coatType} onChange={e => handleDogChange('coatType', e.target.value)}>
                              <option value="">-선택-</option>
                              <option value="stock hair">stock hair</option>
                              <option value="Long Coat">Long Coat</option>
                              {dogsData[currentDogIndex].coatType && dogsData[currentDogIndex].coatType !== 'stock hair' && dogsData[currentDogIndex].coatType !== 'Long Coat' && <option value={dogsData[currentDogIndex].coatType}>{dogsData[currentDogIndex].coatType}</option>}
                          </select>
                      </div>
                    </div>

                    {/* 그리드 필드들 (마이크로칩 ~ 최고상력2) */}
                    <div className={`grid grid-cols-3 gap-4 ${isNR ? 'opacity-50 grayscale brightness-75 contrast-75 pointer-events-none select-none' : ''}`}>
                      <div><label className={labelStyle}>마이크로칩</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].microchip} onChange={e => handleDogChange('microchip', e.target.value)} /></div>
                      <div>
                        <label className={labelStyle}>
                          국내 타단체 
                          {initialData.selectedType === 'DR' && <span className="text-indigo-500 font-bold ml-1 text-[9px]">(번호 입력 시 동기화)</span>}
                        </label>
                        <input type="text" className={`${inputStyle} ${initialData.selectedType === 'DR' ? 'border-indigo-300 bg-indigo-50/20' : ''}`} value={dogsData[currentDogIndex].otherOrg} onChange={e => handleDogChange('otherOrg', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelStyle}>
                          외국번호
                          {initialData.selectedType === 'FR' && <span className="text-indigo-500 font-bold ml-1 text-[9px]">(번호 입력 시 동기화)</span>}
                        </label>
                        <input type="text" className={`${inputStyle} ${initialData.selectedType === 'FR' ? 'border-indigo-300 bg-indigo-50/20' : ''}`} value={dogsData[currentDogIndex].foreignNo} onChange={e => handleDogChange('foreignNo', e.target.value)} />
                      </div>
                      
                      <div><label className={labelStyle}>외국2</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].foreignNo2} onChange={e => handleDogChange('foreignNo2', e.target.value)} /></div>
                      <div><label className={labelStyle}>색인</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].hairIndex} onChange={e => handleDogChange('hairIndex', e.target.value)} /></div>
                      <div><label className={labelStyle}>고관절검사</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].hipBone} onChange={e => handleDogChange('hipBone', e.target.value)} /></div>
                      
                      <div><label className={labelStyle}>DNA검사</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].dnaTest} onChange={e => handleDogChange('dnaTest', e.target.value)} /></div>
                      <div><label className={labelStyle}>훈련</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].training} onChange={e => handleDogChange('training', e.target.value)} /></div>
                      <div><label className={labelStyle}>최고상력</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].highestAward} onChange={e => handleDogChange('highestAward', e.target.value)} /></div>
                      
                      <div><label className={labelStyle}>근친번식</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].inbreeding} onChange={e => handleDogChange('inbreeding', e.target.value)} /></div>
                      <div><label className={labelStyle}>종견인정검사</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].breedApproval} onChange={e => handleDogChange('breedApproval', e.target.value)} /></div>
                      <div><label className={labelStyle}>최고상력2</label><input type="text" className={inputStyle} value={dogsData[currentDogIndex].highestAward2} onChange={e => handleDogChange('highestAward2', e.target.value)} /></div>

                      <div className="col-span-3">
                         <label className={labelStyle}>색인번호</label>
                         <input type="text" className={inputStyle} value={dogsData[currentDogIndex].indexNo} onChange={e => handleDogChange('indexNo', e.target.value)} />
                      </div>
                    </div>

                    {/* 메모 */}
                    <div className={isNR ? 'opacity-50 grayscale brightness-75 contrast-75 pointer-events-none select-none' : ''}>
                      <label className={labelStyle}>메모</label>
                      <textarea 
                        className="w-full bg-white border border-slate-200 rounded-md p-3 text-[12px] h-20 outline-none focus:border-blue-400 transition-all"
                        value={dogsData[currentDogIndex].memo}
                        onChange={e => handleDogChange('memo', e.target.value)}
                      />
                    </div>
                 </div>
                 
                 <div className="mt-8 flex justify-end gap-2">
                    <button 
                      onClick={onCancel}
                      className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
                    >
                      이전으로
                    </button>
                    <button 
                      onClick={async () => {
                        // 🛡️ [DUPLICATION CHECK CONSTITUTION]
                        // 저장 전 타단체/해외번호 중복 전수 조사
                        try {
                          for (let i = 0; i < dogsData.length; i++) {
                            const dog = dogsData[i];
                            
                            // 1. 외국 타단체 번호 (foreignNo)
                            if (dog.foreignNo && dog.foreignNo.trim() !== '') {
                              const found = await checkForeignNoExists(dog.foreignNo);
                              if (found) {
                                alert(`[애견 ${i + 1}] 입력하신 해우/외국번호(${dog.foreignNo})는\n이미 등록된 개체('${found.name}')와 중복됩니다.\n중복 등록은 불가능합니다.`);
                                return;
                              }
                            }

                            // 2. 외국 타단체 번호 2 (foreignNo2)
                            if (dog.foreignNo2 && dog.foreignNo2.trim() !== '') {
                              const found = await checkForeignNoExists(dog.foreignNo2);
                              if (found) {
                                alert(`[애견 ${i + 1}] 입력하신 해외/외국번호2(${dog.foreignNo2})는\n이미 등록된 개체('${found.name}')와 중복됩니다.\n중복 등록은 불가능합니다.`);
                                return;
                              }
                            }

                            // 3. 국내 타단체 번호 (otherOrg)
                            if (dog.otherOrg && dog.otherOrg.trim() !== '') {
                              const found = await checkOtherOrgNoExists(dog.otherOrg);
                              if (found) {
                                alert(`[애견 ${i + 1}] 입력하신 타단체번호(${dog.otherOrg})는\n이미 등록된 개체('${found.name}')와 중복됩니다.\n중복 등록은 불가능합니다.`);
                                return;
                              }
                            }
                          }
                          // 🛡️ [DATA CONVERSION] 저장 전 한글 -> DB 영문 변환
                          const finalCommonData = {
                            ...commonData,
                            sireCoatType: toDBCoatType(commonData.sireCoatType),
                            damCoatType: toDBCoatType(commonData.damCoatType)
                          };

                          const finalDogsData = dogsData.map(dog => ({
                            ...dog,
                            coatType: toDBCoatType(dog.coatType)
                          }));

                          // 모든 검증 통과 시 변환된 최종 데이터로 저장
                          onSave({ commonData: finalCommonData, dogsData: finalDogsData });
                        } catch (e) {
                          console.error(e);
                          alert('중복 체크 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                        }
                      }}
                      className="px-10 py-2.5 bg-[#3b82f6] text-white rounded-lg text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      등록하기
                    </button>
                 </div>
              </div>
            </div>

          </div>
        </div>
        <PersonSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSelectPerson={handleSelectPerson}
          title={`${searchTarget === 'breeder' ? '번식자' : '소유자'} 회원 검색`}
          tableName="memTab"
          onlyWithSaho={searchTarget === 'breeder'}
        />
      </div>
    </div>
  );
};
