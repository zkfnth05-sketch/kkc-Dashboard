
import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, Trophy, Search } from 'lucide-react';
import { Pedigree, DongtaeInfo, ParentDogInfo, Evaluation, OwnerHistory } from '../types';
import { fetchDogsByUids, fetchPointsByRegNo, fetchPrizesByRegNo, fetchOwnerHistory, deleteOwnerHistory } from '../services/memberService';
import { fetchDongtaeInfo } from '../services/dongtaeService'; // 👈 분리된 서비스 참조
import { AlertCircle } from 'lucide-react';

const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "확인", cancelText = "취소", isDanger = false }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="bg-gray-50 px-5 py-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-md transition-all active:scale-95 shadow-lg ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-100'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PedigreeDetailModalProps {
  pedigree: Pedigree;
  onClose: () => void;
  onEdit: (pedigree: Pedigree) => void;
  onOpenDongtaeForm: (dongtaeNo: string, dogId?: string) => void;
  onEditOwner: (id: string) => void;
  onEditEvaluation: (evaluation: Evaluation) => void;
  onManagePoints: (regNo: string) => void; 
  onDelete: (id: string) => void;
  onViewPedigreeByUid?: (uid: string) => void;
  tableName?: string;
  dogClasses?: any[];
}

export const PedigreeDetailModal: React.FC<PedigreeDetailModalProps> = ({ 
    pedigree, onClose, onEdit, onOpenDongtaeForm, onEditOwner, onEditEvaluation, onManagePoints, onDelete,
    onViewPedigreeByUid,
    tableName = 'dogTab',
    dogClasses = []
}) => {
  const [litterInfo, setLitterInfo] = useState<Partial<DongtaeInfo> | null>(null);
  const [isLoadingLitter, setIsLoadingLitter] = useState(false);
  const [sireInfo, setSireInfo] = useState<ParentDogInfo | null>(null);
  const [damInfo, setDamInfo] = useState<ParentDogInfo | null>(null);
  const [isLoadingParents, setIsLoadingParents] = useState(false);

  const [pointsList, setPointsList] = useState<any[]>([]);
  const [prizesList, setPrizesList] = useState<any[]>([]);
  const [ownerHistory, setOwnerHistory] = useState<OwnerHistory[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false });

  const loadOwnerHistory = async () => {
    if (pedigree.id) {
      try {
        const history = await fetchOwnerHistory(pedigree.id);
        const sorted = [...history].sort((a, b) => {
            const dateA = a.change_date || '0000-00-00';
            const dateB = b.change_date || '0000-00-00';
            return dateB.localeCompare(dateA);
        });
        setOwnerHistory(sorted);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    const loadLitterInfo = async () => {
        if (pedigree.dongtaeNo && pedigree.dongtaeNo !== '-' && pedigree.dongtaeNo.trim() !== '' && pedigree.dongtaeNo !== '0') {
            setIsLoadingLitter(true);
            try {
                const info = await fetchDongtaeInfo(pedigree.dongtaeNo);
                setLitterInfo(info);
            } catch (error) {
                console.error("Error loading litter info:", error);
            } finally {
                setIsLoadingLitter(false);
            }
        } else {
            setLitterInfo(null);
        }
    };
    
    const loadParentInfo = async () => {
        setIsLoadingParents(true);
        try {
            const sireVal = (pedigree.sireRegNo || '').toString().trim();
            const damVal = (pedigree.damRegNo || '').toString().trim();
            const sireSearch = (pedigree.sireRegNoText || sireVal);
            const damSearch = (pedigree.damRegNoText || damVal);
            
            const searchKeys = [sireSearch, damSearch, sireVal, damVal].filter(v => v !== '' && v !== '미등록' && v !== '0' && v !== '-');
            
            if (searchKeys.length > 0) {
                const byUid = await fetchDogsByUids(searchKeys, tableName);
                const missingKeys = searchKeys.filter(k => !byUid[k]);
                let byRegNo: Record<string, ParentDogInfo> = {};
                if (missingKeys.length > 0) {
                    const fetchDogsByRegNos = (await import('../services/memberService')).fetchDogsByRegNos;
                    byRegNo = await fetchDogsByRegNos(missingKeys, tableName);
                }
                const getDog = (key: string, backupKey?: string) => byUid[key] || byRegNo[key] || (backupKey ? (byUid[backupKey] || byRegNo[backupKey]) : null);
                setSireInfo(getDog(sireSearch, sireVal));
                setDamInfo(getDog(damSearch, damVal));
            }
        } catch (err) {
            console.error("Parent load error:", err);
        } finally {
            setIsLoadingParents(false);
        }
    };

    loadLitterInfo();
    loadParentInfo();
    loadOwnerHistory();
    
    if (pedigree.regNo && String(pedigree.regNo).trim() !== '') {
      fetchPointsByRegNo(pedigree.regNo).then(setPointsList).catch(console.error);
      fetchPrizesByRegNo(pedigree.regNo).then(setPrizesList).catch(console.error);
    }
  }, [pedigree.id, tableName]);
  
  const getLitterValue = (key: keyof DongtaeInfo) => {
    if (isLoadingLitter) return '...';
    // 🛡️ 텍스트 필드와 숫자 필드의 기본값을 구분합니다.
    const isTextField = ['memo', 'spec_relate', 'dongtae_no', 'regno_start', 'regno_end'].includes(key);
    
    if (!litterInfo) return isTextField ? '-' : '0';
    
    const val = litterInfo[key];
    if (val !== undefined && val !== null) {
        const strVal = String(val).trim();
        if (strVal === "" || strVal === "null") return isTextField ? '-' : '0';
        return strVal;
    }
    return isTextField ? '-' : '0';
  };

  const handleDeleteHistory = async (uid: string) => {
    console.log("Preparing to delete owner history with UID:", uid);
    if (!uid) {
        alert("삭제할 항목의 식별자(UID)가 없습니다.");
        return;
    }
    
    setConfirmModal({
        isOpen: true,
        title: '변경 이력 삭제',
        message: '이 소유자 변경 기록을 정말 삭제하시겠습니까?',
        isDanger: true,
        onConfirm: async () => {
            try {
                const res = await deleteOwnerHistory(uid);
                console.log("Server response:", res);
                if (res && res.success) {
                    alert('삭제가 완료되었습니다.');
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    await loadOwnerHistory();
                } else {
                    alert('서버 응답 실패: ' + (res?.message || '알 수 없는 이유로 실패했습니다.'));
                }
            } catch (e: any) {
                console.error("Delete failed:", e);
                alert('삭제 실패: ' + (e.message || '알 수 없는 오류가 발생했습니다.'));
            }
        }
    });
  };

  const formatGender = (gender: string) => {
    if (!gender) return '-';
    const g = gender.toLowerCase().trim();
    if (g === 'm' || g === 'male' || gender === '수컷') return '수컷';
    if (g === 'f' || g === 'female' || gender === '암컷') return '암컷';
    return gender;
  };

  const thStyle = "px-3 py-2.5 text-left font-normal text-gray-500 bg-white border-b border-gray-100 text-[13px] w-[22%]";
  const tdStyle = "px-3 py-2.5 border-b border-gray-100 text-[13px] font-medium text-gray-800";
  const sectionTitleStyle = "px-4 py-2 bg-[#f8f9fa] border-b border-gray-200 font-bold text-gray-700 text-[14px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[1520px] h-[92vh] flex flex-col rounded-md shadow-2xl overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-[17px] font-bold text-gray-800">혈통서 상세 정보</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 bg-[#f0f2f5]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>기본 정보</div>
                   <table className="w-full"><tbody>
                       <tr><th className={thStyle}>등록번호</th><td className={tdStyle}><span className="font-bold">{pedigree.regNo || '-'}</span></td><th className={thStyle}>등록 타입</th><td className={tdStyle}>{pedigree.regType === 'D' ? '자견' : pedigree.regType === 'N' ? 'NR' : pedigree.regType || '-'}</td></tr>
                   </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>소유자, 번식자 정보</div>
                   <table className="w-full"><tbody>
                       <tr><th className={thStyle}>소유자명</th><td className={tdStyle}>{pedigree.owner || '-'}</td><th className={thStyle}>소유자 ID</th><td className={tdStyle}><span onClick={() => pedigree.ownerId && onEditOwner(pedigree.ownerId)} className="text-blue-500 cursor-pointer hover:underline font-bold">{pedigree.ownerId || '-'}</span></td></tr>
                       <tr><th className={thStyle}>연락처</th><td className={tdStyle}>{pedigree.ownerPhone || '-'}</td><th className={thStyle}>주소</th><td className={tdStyle}>{pedigree.ownerAddr || '-'}</td></tr>
                       <tr><th className={thStyle}>번식자명</th><td className={tdStyle}>{pedigree.breeder || '-'}</td><th className={thStyle}>번식자 ID</th><td className={tdStyle}>-</td></tr>
                       <tr><th className={thStyle}>연락처</th><td className={tdStyle}>{pedigree.breederPhone || '-'}</td><th className={thStyle}>주소</th><td className={tdStyle}>{pedigree.breederAddr || '-'}</td></tr>
                   </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>특이 사항 및 기타 정보</div>
                   <table className="w-full table-fixed"><tbody>
                       <tr><th className={thStyle}>고관절 검사</th><td className={tdStyle}>{pedigree.specBone || '-'}</td><th className={thStyle}>특이사항 (DNA)</th><td className={tdStyle}>{pedigree.specDna || '-'}</td></tr>
                       <tr><th className={thStyle}>종견인정평정</th><td className={tdStyle} colSpan={3}>{pedigree.okDate || (pedigree.okStat === 'Y' ? '기록 확인' : '-')}</td></tr>
                       <tr><th className={thStyle}>훈련</th><td className={tdStyle}>{pedigree.specTrain || '-'}</td><th className={thStyle}>근친번식</th><td className={tdStyle}>{pedigree.specRelate || '-'}</td></tr>
                       <tr>
                           <th className={thStyle}>수상 경력</th>
                           <td className={tdStyle} colSpan={3}>
                               <div>{pedigree.specWin || '-'}</div>
                               {pointsList.length > 0 && (
                                  <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded p-2 text-[11px] max-h-32 overflow-y-auto">
                                    <div className="font-bold text-blue-800 mb-1 border-b border-blue-200 pb-1 flex items-center gap-1"><Trophy size={11} className="text-yellow-500"/> 공식 도그쇼 포인트 내역 (point 테이블)</div>
                                    <ul className="space-y-1">
                                      {pointsList.map((pt: any) => (
                                        <li key={pt.id} className="text-gray-600 flex items-start gap-1">
                                          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                                          <span><span className="font-bold text-gray-800">{pt.title}</span> ({pt.regDate}) - <span className="text-blue-600 font-bold">{pt.points}P</span> / {pt.award}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                               )}
                           </td>
                       </tr>
                       <tr>
                           <th className={thStyle}>수상 경력2</th>
                           <td className={tdStyle} colSpan={3}>
                               <div>{pedigree.specWin2 || '-'}</div>
                               {prizesList.length > 0 && (
                                  <div className="mt-2 bg-indigo-50/50 border border-indigo-100 rounded p-2 text-[11px] max-h-32 overflow-y-auto">
                                    <div className="font-bold text-indigo-800 mb-1 border-b border-indigo-200 pb-1 flex items-center gap-1"><Trophy size={11} className="text-indigo-400"/> 공식 상력 기록 내역 (prize_dogTab)</div>
                                    <ul className="space-y-1">
                                      {prizesList.map((pz: any) => (
                                        <li key={pz.id} className="text-gray-600 flex items-start gap-1">
                                          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                                          <span><span className="font-bold text-gray-800">{pz.dogShowName}</span> ({pz.date}) - 심사위원: {pz.judge} / {pz.points}P</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                               )}
                           </td>
                       </tr>
                       <tr><th className={thStyle}>국내타단체번호</th><td className={tdStyle}>{pedigree.domesticNo || '-'}</td><th className={thStyle}>외국타단체번호</th><td className={tdStyle}>{pedigree.foreignNo || '-'}</td></tr>
                       <tr><th className={thStyle}>외국타단체번호2</th><td className={tdStyle}>{pedigree.foreignNo2 || '-'}</td><th className={thStyle}>마이크로칩번호</th><td className={tdStyle}>{pedigree.microchip || '-'}</td></tr>
                        <tr><th className={thStyle}>색인번호</th><td className={tdStyle} colSpan={3}><span className="text-blue-600 font-bold">{pedigree.indexNo || '-'}</span></td></tr>
                       <tr><th className={thStyle}>메모</th><td className={tdStyle} colSpan={3}>{pedigree.memo || '-'}</td></tr>
                   </tbody></table>
               </div>

               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>소유자 변경 이력</div>
                    <div className="p-0 bg-white min-h-[100px] max-h-[400px] overflow-y-auto">
                        {ownerHistory.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                                    <tr>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600">변경일자</th>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600">새 소유자</th>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600">소유자 ID</th>
                                        <th className="px-4 py-2 text-[12px] font-bold text-gray-600 text-center">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {ownerHistory.map((h, idx) => (
                                        <tr key={h.uid || idx} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-2.5 text-[12px] text-gray-500 font-medium">{h.change_date || h.sign_date}</td>
                                            <td className="px-4 py-2.5 text-[12px] text-gray-900 font-bold">{h.poss_name}</td>
                                            <td className="px-4 py-2.5 text-[12px]">
                                                <span 
                                                    onClick={() => h.poss_id && onEditOwner(h.poss_id)} 
                                                    className="text-blue-600 font-bold cursor-pointer hover:underline"
                                                >
                                                    {h.poss_id || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[12px] text-center">
                                                <button 
                                                    onClick={() => handleDeleteHistory(h.uid || (h as any).id)} 
                                                    className="text-red-500 hover:underline font-bold"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-24 flex flex-col items-center justify-center text-gray-400 italic text-[13px] px-4">
                                소유자 변경 이력이 없습니다.
                            </div>
                        )}
                    </div>
               </div>
            </div>
            <div className="space-y-5">
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>애견 정보</div>
                   <table className="w-full"><tbody>
                       <tr><th className={thStyle}>견명</th><td className={tdStyle}>{pedigree.name || '-'}</td><th className={thStyle}>풀네임</th><td className={tdStyle}>{pedigree.fullName || '-'}</td></tr>
                       <tr>
                            <th className={thStyle}>그룹</th>
                            <td className={tdStyle}>
                                {(() => {
                                    const found = dogClasses.find((c: any) => c.breed === pedigree.breed);
                                    return found ? found.group : (pedigree.group || '-');
                                })()}
                            </td>
                            <th className={thStyle}>견종</th>
                            <td className={tdStyle}>
                                {(() => {
                                    const found = dogClasses.find((c: any) => c.breed === pedigree.breed);
                                    if (found) {
                                        return (
                                            <div className="flex flex-col">
                                                <span className="text-blue-600 font-bold text-[11px]">{found.keyy}</span>
                                                <span className="font-bold">{pedigree.breed}</span>
                                            </div>
                                        );
                                    }
                                    return pedigree.breed || '-';
                                })()}
                            </td>
                        </tr>
                       <tr><th className={thStyle}>성별</th><td className={tdStyle}>{formatGender(pedigree.gender)}</td><th className={thStyle}>생년월일</th><td className={tdStyle}>{pedigree.birthDate || '-'}</td></tr>
                       <tr><th className={thStyle}>모색</th><td className={tdStyle}>{pedigree.color || '-'}</td><th className={thStyle}>모종</th><td className={tdStyle}>{pedigree.coatType || '-'}</td></tr>
                       <tr><th className={thStyle}>견사호</th><td className={tdStyle}>{pedigree.kennel || '-'}</td><th className={thStyle}>견사호(영문)</th><td className={tdStyle}>{pedigree.kennelNameEng || '-'}</td></tr>
                   </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                    <div className={sectionTitleStyle}>부모견 정보</div>
                    <table className="w-full table-fixed"><tbody>
                        <tr className="bg-blue-50/20 border-b border-gray-100">
                            <th className={thStyle}>부견 UID</th>
                            <td className={tdStyle}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-blue-700 font-bold">{pedigree.sireRegNo || '-'}</span>
                                    <button 
                                        onClick={() => pedigree.sireRegNo && onViewPedigreeByUid?.(pedigree.sireRegNo)}
                                        className="bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0 flex items-center gap-1"
                                    >
                                        <Search size={11} /> 정보보기
                                    </button>
                                </div>
                            </td>
                            <th className={thStyle}><div className="flex items-center gap-1.5 font-bold">{sireInfo ? <Check size={14} className="text-blue-500" /> : <div className="w-3 h-3 bg-gray-100 rounded-full" />}부견 등록번호</div></th>
                            <td className={tdStyle}><span className="text-gray-900 font-bold">{sireInfo?.reg_no || pedigree.sireRegNoText || (isLoadingParents ? '조회중...' : '-')}</span></td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <th className={thStyle}>부견명</th>
                            <td colSpan={3} className="px-3 py-2.5 border-b border-gray-100 text-[13px] font-bold text-blue-800 bg-white">
                                {sireInfo?.fullname || sireInfo?.name || pedigree.sireNameText || '-'}
                            </td>
                        </tr>
                        <tr className="bg-pink-50/20 border-t-2 border-gray-100">
                            <th className={thStyle}>모견 UID</th>
                            <td className={tdStyle}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-pink-700 font-bold">{pedigree.damRegNo || '-'}</span>
                                    <button 
                                        onClick={() => pedigree.damRegNo && onViewPedigreeByUid?.(pedigree.damRegNo)}
                                        className="bg-white border border-pink-200 text-pink-600 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-pink-600 hover:text-white transition-all shadow-sm shrink-0 flex items-center gap-1"
                                    >
                                        <Search size={11} /> 정보보기
                                    </button>
                                </div>
                            </td>
                            <th className={thStyle}><div className="flex items-center gap-1.5 font-bold">{damInfo ? <Check size={14} className="text-pink-500" /> : <div className="w-3 h-3 bg-gray-100 rounded-full" />}모견 등록번호</div></th>
                            <td className={tdStyle}><span className="text-gray-900 font-bold">{damInfo?.reg_no || pedigree.damRegNoText || (isLoadingParents ? '조회중...' : '-')}</span></td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <th className={thStyle}>모견명</th>
                            <td colSpan={3} className="px-3 py-2.5 border-b border-gray-100 text-[13px] font-bold text-pink-800 bg-white">
                                {damInfo?.fullname || damInfo?.name || pedigree.damNameText || '-'}
                            </td>
                        </tr>
                    </tbody></table>
               </div>
               <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                   <div className={sectionTitleStyle}>동태 정보</div>
                   <table className="w-full table-fixed"><tbody>
                        <tr><th className={thStyle}>동태자 코드</th><td className={tdStyle}>{getLitterValue('dongtae_no') || pedigree.dongtaeNo || '-'}</td><th className={thStyle}>근친 번식</th><td className={tdStyle}>{getLitterValue('spec_relate')}</td></tr>
                        <tr><th className={thStyle}>시작 등록번호</th><td className={tdStyle}>{getLitterValue('regno_start')}</td><th className={thStyle}>끝 등록번호</th><td className={tdStyle}>{getLitterValue('regno_end')}</td></tr>
                        <tr><th className={thStyle}>출산(수컷)</th><td className={tdStyle}>{getLitterValue('birth_M')}</td><th className={thStyle}>출산(암컷)</th><td className={tdStyle}>{getLitterValue('birth_F')}</td></tr>
                        <tr><th className={thStyle}>등록건(수컷)</th><td className={tdStyle}>{getLitterValue('reg_count_M')}</td><th className={thStyle}>등록건(암컷)</th><td className={tdStyle}>{getLitterValue('reg_count_F')}</td></tr>
                        <tr><th className={thStyle}>비고</th><td className={tdStyle} colSpan={3}>{getLitterValue('memo')}</td></tr>
                   </tbody></table>
               </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-[#f8f9fa] flex justify-end gap-2 shrink-0">
           <button onClick={() => onOpenDongtaeForm(pedigree.dongtaeNo, pedigree.id)} className="px-4 py-1.5 bg-[#4b5563] text-white text-[13px] font-medium rounded hover:bg-gray-700 transition-colors shadow-sm">동태정보 입력</button>
           <button onClick={() => onDelete(pedigree.id)} className="px-6 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[13px] font-bold rounded hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm ml-auto">삭제하기</button>
           <button onClick={() => onEdit(pedigree)} className="px-6 py-1.5 bg-[#374151] text-white text-[13px] font-bold rounded hover:bg-black transition-all ml-2 shadow-md">수정하기</button>
        </div>
      </div>

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
};
