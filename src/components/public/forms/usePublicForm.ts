import React, { useState, useEffect } from 'react';
import { fetchMembers, uploadFile, registerPgTransaction } from '../../../services/memberService';
import { createApplicant, fetchEventOptions } from '../../../services/eventService';

export const usePublicForm = (competition: any, targetTable: string, onClose: () => void, showAlert: (title: string, message: string) => void) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');

    // 👤 [APPLICANT COMMON INFO]
    const [applicantInfo, setApplicantInfo] = useState(() => {
        let user = { name: '', hp: '', phone: '', email: '', birth: '', id: '', address: '', affiliation: '' };
        if (typeof window !== 'undefined') {
            try {
                const raw = sessionStorage.getItem('kkf_portal_user');
                if (raw) user = { ...user, ...JSON.parse(raw) };
            } catch (e) {}
        }
        return {
            name: user.name || '',
            contact: user.hp || user.phone || '',
            email: user.email || '',
            handler_id: user.id || '',
            birthdate: user.birth || '',
            address: user.address || '',
            affiliation: user.affiliation || '',
            payment_status: '미입금'
        };
    });

    // 🐶 [DEFAULT ENTRY GENERATOR]
    const createDefaultEntry = () => ({
        id: Math.random().toString(36).substring(2, 9),
        subject: '',
        dog_breed: '',
        dog_name: '',
        dog_name_eng: '',
        dog_gender: '수',
        is_heat: '무',
        pedigree_no: '',
        pedigree_number: '',
        division: '일반부',
        size: '',
        name_eng: '',
        team_name: '',
        license_number: '',
        entry_type: '',
        entry_category: '',
        dog_photo: '',
        student_id_photo: ''
    });

    // 📋 [ENTRIES ARRAY (MULTI-ENTRY)]
    const [entries, setEntries] = useState<any[]>([createDefaultEntry()]);

    // 🔄 [BACKWARD COMPATIBILITY: SINGLE FORM DATA]
    const formData = {
        ...applicantInfo,
        ...(entries[0] || {})
    };

    const setFormData = (updater: any) => {
        if (typeof updater === 'function') {
            const next = updater(formData);
            setApplicantInfo(prev => ({
                ...prev,
                name: next.name ?? prev.name,
                contact: next.contact ?? prev.contact,
                email: next.email ?? prev.email,
                handler_id: next.handler_id ?? prev.handler_id,
                birthdate: next.birthdate ?? prev.birthdate,
                address: next.address ?? prev.address,
                affiliation: next.affiliation ?? prev.affiliation,
                payment_status: next.payment_status ?? prev.payment_status,
            }));
            setEntries(prev => {
                const updated = [...prev];
                updated[0] = { ...(updated[0] || {}), ...next };
                return updated;
            });
        } else {
            setApplicantInfo(prev => ({
                ...prev,
                name: updater.name ?? prev.name,
                contact: updater.contact ?? prev.contact,
                email: updater.email ?? prev.email,
                handler_id: updater.handler_id ?? prev.handler_id,
                birthdate: updater.birthdate ?? prev.birthdate,
                address: updater.address ?? prev.address,
                affiliation: updater.affiliation ?? prev.affiliation,
                payment_status: updater.payment_status ?? prev.payment_status,
            }));
            setEntries(prev => {
                const updated = [...prev];
                updated[0] = { ...(updated[0] || {}), ...updater };
                return updated;
            });
        }
    };

    // ➕ [ENTRY ACTIONS]
    const addEntry = () => {
        setEntries(prev => [...prev, createDefaultEntry()]);
    };

    const removeEntry = (index: number) => {
        if (entries.length <= 1) {
            return showAlert('알림', '최소 1개의 출전 정보는 필요합니다.');
        }
        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: string, value: any) => {
        setEntries(prev => {
            const updated = [...prev];
            if (updated[index]) {
                updated[index] = { ...updated[index], [field]: value };
            }
            return updated;
        });
    };

    const copyEntryFromFirst = (targetIndex: number) => {
        if (targetIndex <= 0 || !entries[0]) return;
        const source = entries[0];
        setEntries(prev => {
            const updated = [...prev];
            updated[targetIndex] = {
                ...updated[targetIndex],
                dog_breed: source.dog_breed || '',
                dog_name: source.dog_name || '',
                dog_name_eng: source.dog_name_eng || '',
                dog_gender: source.dog_gender || '수',
                is_heat: source.is_heat || '무',
                pedigree_no: source.pedigree_no || '',
                pedigree_number: source.pedigree_number || '',
                size: source.size || '',
                division: source.division || '일반부'
            };
            return updated;
        });
        showAlert('완료', '1번 출전견의 정보가 복사되었습니다. 출진 종목을 선택해주세요.');
    };

    const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setApplicantInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (['name', 'contact', 'email', 'handler_id', 'birthdate', 'address', 'affiliation'].includes(name)) {
            setApplicantInfo(prev => ({ ...prev, [name]: value }));
        } else {
            updateEntry(0, name, value);
        }
    };

    const [eventOptions, setEventOptions] = useState<any[]>([]);
    const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());

    // 💰 [FETCH OPTIONS]
    useEffect(() => {
        const loadOptions = async () => {
            const idStr = String(competition.id);
            const pid = parseInt(idStr.replace(/[^0-9]/g, ''));
            if (pid > 0) {
                let eventType = 'dogshow';
                const src = (competition.source || '').toString().toLowerCase();
                if (src) {
                    eventType = src;
                } else {
                    if (idStr.startsWith('st_')) eventType = 'stylist';
                    else if (idStr.startsWith('sp_')) eventType = 'sports_event';
                    else if (idStr.startsWith('sm_')) eventType = 'seminar';
                    else if (idStr.startsWith('be_')) eventType = 'breed_exam';
                    else if (idStr.startsWith('ag_') || idStr.startsWith('dd_') || idStr.startsWith('fb_')) eventType = 'sports_event';
                }

                const res = await fetchEventOptions(eventType, pid);
                if (res.data) {
                    setEventOptions(res.data);
                    const required = res.data
                        .filter((opt: any) => opt.is_required === 1 || opt.is_required === '1')
                        .map((opt: any) => String(opt.id));
                    setSelectedOptionIds(new Set(required));
                }
            }
        };
        loadOptions();
    }, [competition]);

    // 💰 [TOTAL CALCULATION (PER ENTRY MULTIPLIER)]
    const optionBaseSum = eventOptions.reduce((sum, opt) => {
        if (selectedOptionIds.has(String(opt.id))) {
            return sum + parseInt(opt.option_price);
        }
        return sum;
    }, 0);

    const totalAmount = entries.length > 0 ? (optionBaseSum * entries.length) : optionBaseSum;

    const handleOptionToggle = (id: string | number) => {
        const idStr = String(id);
        const newSelected = new Set(selectedOptionIds);
        if (newSelected.has(idStr)) {
            const opt = eventOptions.find(o => String(o.id) === idStr);
            if (opt?.is_required === 1 || opt?.is_required === '1') return;
            newSelected.delete(idStr);
        } else {
            newSelected.add(idStr);
        }
        setSelectedOptionIds(newSelected);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, entryIndex: number = 0) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        try {
            const result = await uploadFile(file);
            if (result && result.success) {
                updateEntry(entryIndex, field, result.url);
            } else {
                showAlert('오류', '이미지 업로드에 실패했습니다.');
            }
        } catch (err) {
            showAlert('오류', '이미지 서버 통신 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🔍 [DOG SEARCH FOR SPECIFIC ENTRY]
    const handleSearchDogForEntry = async (entryIndex: number) => {
        const entry = entries[entryIndex];
        const pedigreeSearch = (entry?.pedigree_no || entry?.pedigree_number)?.trim();
        if (!pedigreeSearch) {
            return showAlert('알림', '조회할 혈통서 등록번호를 먼저 입력해주세요.');
        }

        setIsSearching(true);
        try {
            const res = await fetchMembers('dogTab', 1, pedigreeSearch, 'reg_no', 1);
            if (res.data && res.data.length > 0) {
                const d = res.data[0];
                setEntries(prev => {
                    const updated = [...prev];
                    updated[entryIndex] = {
                        ...updated[entryIndex],
                        dog_name: d.name || updated[entryIndex].dog_name,
                        dog_breed: d.dog_class || updated[entryIndex].dog_breed,
                        dog_gender: d.sex === '1' ? '수' : d.sex === '2' ? '암' : updated[entryIndex].dog_gender,
                        pedigree_number: d.reg_no || updated[entryIndex].pedigree_number,
                        pedigree_no: d.reg_no || updated[entryIndex].pedigree_no,
                    };
                    return updated;
                });
                showAlert('성공', `'${d.name || '알 수 없음'}' 견 정보를 성공적으로 불러왔습니다.`);
            } else {
                showAlert('알림', `조회하신 혈통서 등록번호 [${pedigreeSearch}] 와 일치하는 강아지 정보가 등록되어 있지 않습니다.`);
            }
        } catch (e) {
            showAlert('오류', '원격 서버에서 정보를 조회하는 중 시스템 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    // 🔍 [MEMBER INFO SEARCH]
    const handleSearchMember = async () => {
        const handlerSearch = applicantInfo.handler_id?.trim();
        if (!handlerSearch) {
            return showAlert('알림', '조회할 회원 아이디(ID)를 입력해주세요.');
        }

        setIsSearching(true);
        try {
            const res = await fetchMembers('memTab', 1, handlerSearch, 'id', 1);
            if (res.data && res.data.length > 0) {
                const m = res.data[0];
                setApplicantInfo(prev => ({
                    ...prev,
                    name: m.name || prev.name,
                    contact: m.hp || m.tel || prev.contact,
                    email: m.email || prev.email,
                    birthdate: m.birth || prev.birthdate,
                    affiliation: m.company || prev.affiliation,
                    address: m.addr1 ? `${m.addr1} ${m.addr2 || ''}` : prev.address
                }));
                showAlert('성공', '회원 정보를 성공적으로 불러왔습니다.');
            } else {
                showAlert('알림', `입력하신 아이디 [${handlerSearch}] 와 일치하는 회원 정보가 없습니다.`);
            }
        } catch (e) {
            showAlert('오류', '원격 서버에서 정보를 조회하는 중 시스템 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    // 💾 [SAVE ALL ENTRIES (MULTI-ROW CREATION)]
    const handleSave = async () => {
        if (!applicantInfo.name.trim()) return showAlert('알림', '신청자 성함을 입력해주세요.');

        // 스타일리스트 예외 체크
        if (targetTable === 'stylist_applicant') {
            if (entries[0]?.entry_type === '학생부' && !entries[0]?.student_id_photo?.trim()) {
                return showAlert('알림', '학생부는 학생증 또는 신분증 사진을 반드시 첨부해야 합니다.');
            }
        }

        // 출진 종목/내용 필수 검증
        for (let i = 0; i < entries.length; i++) {
            const ent = entries[i];
            if (targetTable.includes('sports') || targetTable.includes('agility') || targetTable.includes('discdog') || targetTable.includes('flyball')) {
                if (!ent.subject && !ent.dog_name && !ent.pedigree_no) {
                    return showAlert('알림', `[출전 ${i + 1}]의 출진 종목 또는 강아지 정보를 입력해주세요.`);
                }
            }
        }

        setIsSubmitting(true);
        try {
            const extractNumericId = (idStr: string | number) => {
                if (typeof idStr === 'number') return idStr;
                const match = String(idStr).match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
            };

            const ds_pid = extractNumericId(competition.id);

            const selectedOptNames = eventOptions
                .filter(opt => selectedOptionIds.has(String(opt.id)))
                .map(opt => opt.option_name)
                .join(', ');

            // 🚀 [CREATE PAYLOADS FOR EACH ENTRY]
            const payloads: any[] = entries.map((entry, index) => {
                const singleAmount = entries.length > 0 ? Math.round(totalAmount / entries.length) : totalAmount;
                const combinedData = {
                    ...applicantInfo,
                    ...entry,
                    total_amount: singleAmount,
                    options_summary: selectedOptNames,
                    ds_pid
                };

                const commonFields = ['name', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary', 'ds_pid'];
                let payload: any = { ds_pid };

                if (targetTable === 'dogshow_applicant') {
                    const fields = [...commonFields, 'pedigree_number'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'stylist_applicant') {
                    const fields = [...commonFields, 'birthdate', 'email', 'address', 'affiliation', 'dog_breed', 'entry_type', 'entry_category', 'student_id_photo'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'stylist_intl_applicant') {
                    const fields = [...commonFields, 'birthdate', 'email', 'address', 'affiliation', 'dog_breed', 'entry_type', 'entry_category', 'license_number'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'sports_applicant') {
                    const fields = [...commonFields, 'subject', 'dog_breed', 'dog_name', 'dog_gender', 'is_heat', 'pedigree_no', 'division', 'dog_photo', 'student_id_photo'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'agility_applicant') {
                    const fields = ['name', 'name_eng', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary', 'ds_pid',
                        'subject', 'dog_breed', 'dog_name', 'dog_name_eng', 'dog_gender', 'is_heat',
                        'division', 'dog_photo', 'student_id_photo', 'size', 'team_name'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'discdog_applicant') {
                    const fields = ['name', 'name_eng', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary', 'ds_pid',
                        'subject', 'dog_breed', 'dog_name', 'dog_name_eng', 'dog_gender', 'is_heat',
                        'division', 'dog_photo', 'student_id_photo', 'size', 'team_name'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'flyball_applicant') {
                    const fields = ['name', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary', 'ds_pid',
                        'subject', 'dog_breed', 'dog_name'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'seminar_applicant') {
                    const fields = [...commonFields, 'birthdate', 'email', 'affiliation'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else if (targetTable === 'breed_exam_applicant') {
                    const fields = ['name', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary', 'pedigree_number', 'ds_pid'];
                    fields.forEach(f => { if (combinedData[f] !== undefined) payload[f] = combinedData[f]; });
                } else {
                    payload = combinedData;
                }

                return payload;
            });

            if (totalAmount > 0 && paymentMethod === 'card') {
                // 💳 신용카드 결제 연동
                const paymentWindow = window.open('', 'kkc_payment', 'width=820,height=600,scrollbars=yes');
                if (!paymentWindow) {
                    throw new Error('팝업 차단이 설정되어 있습니다. 브라우저 설정에서 팝업을 허용해 주세요.');
                }

                try {
                    // 다중 출전 시 대표 정보 및 상세 목록 전송
                    const mainPayload = {
                        ...payloads[0],
                        total_amount: totalAmount,
                        multi_entries: payloads
                    };

                    const res = await registerPgTransaction('applicant', mainPayload, targetTable, competition.title);
                    if (res.success && res.pay_url) {
                        const handlePaymentMessage = (e: MessageEvent) => {
                            if (e.data && e.data.status) {
                                window.removeEventListener('message', handlePaymentMessage);
                                if (e.data.status === 'success') {
                                    showAlert('성공', `대회 신청(${entries.length}건) 및 카드 결제가 정상 처리되었습니다.`);
                                    onClose();
                                } else {
                                    showAlert('오류', e.data.message || '결제 처리에 실패하였습니다.');
                                }
                            }
                        };
                        window.addEventListener('message', handlePaymentMessage);
                        paymentWindow.location.href = res.pay_url;
                    } else {
                        paymentWindow.close();
                        throw new Error(res.error || '결제 등록 실패');
                    }
                } catch (err: any) {
                    paymentWindow.close();
                    throw err;
                }
            } else {
                // 🏦 무통장 입금 연동: 각 엔트리별로 독립된 DB 행(Row) 생성
                for (const p of payloads) {
                    await createApplicant(p, targetTable);
                }
                showAlert('성공', `총 ${entries.length}건의 출전 신청이 완료되었습니다. 지정된 계좌로 입금해 주시기 바랍니다.`);
                onClose();
            }
        } catch (err: any) {
            showAlert('오류', err.message || '저장 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        applicantInfo,
        setApplicantInfo,
        handleApplicantChange,
        entries,
        setEntries,
        addEntry,
        removeEntry,
        updateEntry,
        copyEntryFromFirst,
        handleSearchDogForEntry,
        formData,
        setFormData,
        isSubmitting,
        isSearching,
        handleInputChange,
        handleImageUpload,
        handleSearchMember,
        handleSave,
        eventOptions,
        selectedOptionIds,
        totalAmount,
        handleOptionToggle,
        paymentMethod,
        setPaymentMethod
    };
};
