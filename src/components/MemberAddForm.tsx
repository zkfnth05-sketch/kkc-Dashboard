import React, { useState, useEffect, useRef } from 'react';
import DaumPostcode from 'react-daum-postcode';
import { fetchMembers } from '../services/memberService';
import { Member, MEMBER_RANK_MAP } from '../types';

interface MemberAddFormProps {
    onClose: () => void;
    onSave: (data: any) => void;
}

export const MemberAddForm: React.FC<MemberAddFormProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Member>>({
        loginId: '',
        mem_no: '',
        name: '',
        birth: '',
        name_eng: '',
        zipcode: '',
        addr: '',
        addr1: '',
        zipcode_dm: '',
        addr_dm: '',
        addr1_dm: '',
        tel: '',
        hp: '',
        email: '',
        memo: '',
        rank: 'B0',
        expiryDate: '',
        saho: '',
        saho_eng: '',
        saho_no: '',
        saho_date: '',
    });

    const [postcodeTarget, setPostcodeTarget] = useState<'main' | 'dm' | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const [idCheckStatus, setIdCheckStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
    const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [idMessage, setIdMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

    const handleChange = (field: keyof Member, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 자동 중복 확인 로직 (Debounced)
    useEffect(() => {
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

        const trimmedId = (formData.loginId || '').trim();
        if (!trimmedId) {
            setIdCheckStatus('idle');
            setIdMessage(null);
            return;
        }

        if (trimmedId.length < 2) {
            setIdCheckStatus('idle');
            setIdMessage({ text: '아이디는 2자 이상 입력해주세요.', type: 'info' });
            return;
        }

        setIdCheckStatus('checking');
        setIdMessage({ text: '중복 확인 중...', type: 'info' });

        checkTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetchMembers('memTab', 1, trimmedId, 'id', 10);
                const isDuplicate = res.data.some((m: Member) => m.loginId === trimmedId);

                if (isDuplicate) {
                    setIdCheckStatus('duplicate');
                    setIdMessage({ text: '이 아이디는 다른 사람이 사용중입니다.', type: 'error' });
                } else {
                    setIdCheckStatus('available');
                    setIdMessage({ text: '사용가능합니다.', type: 'success' });
                }
            } catch (error: any) {
                setIdCheckStatus('idle');
                setIdMessage({ text: '중복 확인 오류: ' + error.message, type: 'error' });
            }
        }, 500);

        return () => {
            if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
        };
    }, [formData.loginId]);

    const handleComplete = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') extraAddress += data.bname;
            if (data.buildingName !== '') extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
            fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
        }

        if (postcodeTarget === 'main') {
            handleChange('zipcode', data.zonecode);
            handleChange('addr', fullAddress);
        } else if (postcodeTarget === 'dm') {
            handleChange('zipcode_dm', data.zonecode);
            handleChange('addr_dm', fullAddress);
        }
        setPostcodeTarget(null);
    };

    const handleSaveSubmit = () => {
        if (!formData.name || !formData.loginId) {
            setAlertMessage("아이디와 이름은 필수 입력입니다.");
            return;
        }
        if (idCheckStatus === 'duplicate') {
            setAlertMessage("중복된 아이디는 사용할 수 없습니다.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ top: '64px' }}>
            <div className="flex-1 overflow-y-auto p-10 bg-white">
                <div className="max-w-[1000px] mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">회원 추가</h2>

                    <div className="flex flex-col gap-0 border-t border-gray-200">
                        {/* 회원번호 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">회원번호</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.mem_no || ''} onChange={e => handleChange('mem_no', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 아이디 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">아이디</div>
                            <div className="flex-1 py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="아이디를 입력하세요"
                                        className={`w-full max-w-[400px] border rounded px-3 py-2 text-sm focus:outline-none transition-all ${idCheckStatus === 'duplicate' ? 'border-red-500 bg-red-50' : idCheckStatus === 'available' ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-blue-500'}`}
                                        value={formData.loginId || ''}
                                        onChange={(e) => handleChange('loginId', e.target.value)}
                                    />
                                    {idCheckStatus === 'checking' && (
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                </div>
                                {idMessage && (
                                    <div className={`mt-1.5 text-xs font-bold flex items-center gap-1.5 ${idMessage.type === 'error' ? 'text-red-500' : idMessage.type === 'success' ? 'text-green-600' : 'text-blue-500'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${idMessage.type === 'error' ? 'bg-red-500' : idMessage.type === 'success' ? 'bg-green-600' : 'bg-blue-500'}`}></span>
                                        {idMessage.text}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 이름 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">이름</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 생년월일 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">생년월일</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.birth || ''} onChange={(e) => handleChange('birth', e.target.value)} placeholder="YYMMDD 하이픈(-) 없이 숫자만 입력" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 이름(영문) */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">이름(영문)</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.name_eng || ''} onChange={(e) => handleChange('name_eng', e.target.value)} placeholder="영문 이름을 입력하세요" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 우편번호 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">우편번호</div>
                            <div className="flex-1 py-3 px-4 flex gap-2">
                                <input type="text" placeholder="우편번호" className="w-[200px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" readOnly value={formData.zipcode || ''} />
                                <button type="button" onClick={() => setPostcodeTarget('main')} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium shadow-sm active:scale-95">우편번호 찾기</button>
                            </div>
                        </div>

                        {/* 주소 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">주소</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" placeholder="주소" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" readOnly value={formData.addr || ''} />
                            </div>
                        </div>

                        {/* 상세주소 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">상세주소</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.addr1 || ''} onChange={(e) => handleChange('addr1', e.target.value)} placeholder="상세주소를 입력하세요" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                zipcode_dm: prev.zipcode,
                                                addr_dm: prev.addr,
                                                addr1_dm: prev.addr1
                                            }));
                                        }}
                                        className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors active:scale-95"
                                    >
                                        DM 주소 기본 주소와 동일
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* DM우편번호 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">DM우편번호</div>
                            <div className="flex-1 py-3 px-4 flex gap-2">
                                <input type="text" placeholder="우편번호" className="w-[200px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" readOnly value={formData.zipcode_dm || ''} />
                                <button type="button" onClick={() => setPostcodeTarget('dm')} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium shadow-sm active:scale-95">우편번호 찾기</button>
                            </div>
                        </div>

                        {/* DM주소 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">DM주소</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" placeholder="주소" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" readOnly value={formData.addr_dm || ''} />
                            </div>
                        </div>

                        {/* DM상세주소 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">DM상세주소</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.addr1_dm || ''} onChange={(e) => handleChange('addr1_dm', e.target.value)} placeholder="상세주소를 입력하세요" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 연락처 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">연락처</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.tel || ''} onChange={(e) => handleChange('tel', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 핸드폰 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">핸드폰</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.hp || ''} onChange={(e) => handleChange('hp', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 이메일 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">이메일</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 기타메모 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">기타메모</div>
                            <div className="flex-1 py-3 px-4">
                                <textarea value={formData.memo || ''} onChange={(e) => handleChange('memo', e.target.value)} placeholder="추가 메모를 입력하세요" className="w-full max-w-[500px] h-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"></textarea>
                            </div>
                        </div>

                        {/* 회원 등급 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">회원 등급</div>
                            <div className="flex-1 py-3 px-4">
                                <select
                                    className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                    value={formData.rank}
                                    onChange={(e) => handleChange('rank', e.target.value)}
                                >
                                    {Object.entries(MEMBER_RANK_MAP).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 유효 날짜 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">유효 날짜</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.expiryDate || ''} onChange={(e) => handleChange('expiryDate', e.target.value)} placeholder="YYYY-MM-DD" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 mt-12 mb-6 border-b pb-4">견사호</h2>

                    <div className="flex flex-col gap-0 border-t border-gray-200">
                        {/* 이름 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">이름</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.saho || ''} onChange={(e) => handleChange('saho', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 이름(영문) */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">이름(영문)</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.saho_eng || ''} onChange={(e) => handleChange('saho_eng', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 등록번호 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">등록번호</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.saho_no || ''} onChange={(e) => handleChange('saho_no', e.target.value)} className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* 등록일 */}
                        <div className="flex border-b border-gray-200">
                            <div className="w-[180px] bg-white py-4 px-6 text-sm font-medium text-gray-500 flex items-center">등록일</div>
                            <div className="flex-1 py-3 px-4">
                                <input type="text" value={formData.saho_date || ''} onChange={(e) => handleChange('saho_date', e.target.value)} placeholder="YYYY-MM-DD" className="w-full max-w-[500px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 mb-20">
                        <div className="flex items-center gap-6 mb-8 text-sm text-gray-400">
                            <span className="font-medium text-gray-500">등록일</span>
                            <span>2026-03-05</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded font-bold shadow-sm transition-colors active:scale-95"
                                onClick={handleSaveSubmit}
                            >
                                회원 추가
                            </button>
                            <button
                                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-8 py-2.5 rounded font-bold transition-colors active:scale-95 flex items-center gap-1"
                                onClick={onClose}
                            >
                                <span className="text-gray-400">↩</span> 돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 우편번호 모달 */}
            {postcodeTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-4 rounded-lg shadow-xl w-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">우편번호 찾기</h3>
                            <button onClick={() => setPostcodeTarget(null)} className="text-gray-500 hover:text-black font-bold">✕</button>
                        </div>
                        <div className="border border-gray-200 h-[400px]">
                            <DaumPostcode onComplete={handleComplete} style={{ height: '100%' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* 알림 팝업 모달 */}
            {alertMessage && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[400px] flex flex-col">
                        <div className="mt-4 mb-8 text-center text-gray-800 font-bold whitespace-pre-line text-lg">
                            {alertMessage}
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setAlertMessage(null)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded shadow-sm font-bold transition-colors active:scale-95"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
