import React, { useState } from 'react';
import { fetchMembers, uploadFile } from '../../../services/memberService';
import { createApplicant, fetchEventOptions } from '../../../services/eventService';
import { useEffect } from 'react';

export const usePublicForm = (competition: any, targetTable: string, onClose: () => void, showAlert: (title: string, message: string) => void) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [formData, setFormData] = useState<any>(() => {
        let user = { name: '', hp: '', phone: '', email: '', birth: '', id: '' };
        if (typeof window !== 'undefined') {
            try {
                const raw = sessionStorage.getItem('kkf_portal_user');
                if (raw) user = { ...user, ...JSON.parse(raw) };
            } catch (e) {}
        }

        return {
            name: user.name || '',
            contact: user.hp || user.phone || '',
            payment_status: '미입금',
            pedigree_number: '',
            birthdate: user.birth || '',
            email: user.email || '',
            address: '',
            affiliation: '',
            dog_breed: '',
            entry_type: '',
            entry_category: '',
            handler_id: user.id || '',
            subject: '',
            dog_name: '',
            dog_gender: '수',
            is_heat: '무',
            pedigree_no: '',
            division: '일반부',
            dog_photo: '',
            student_id_photo: '',
            size: '',
            name_eng: '',
            dog_name_eng: '',
            team_name: '',
            license_number: '',
            total_amount: 0
        };
    });

    const [eventOptions, setEventOptions] = useState<any[]>([]);
    const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());

    // 💰 [FETCH OPTIONS]
    useEffect(() => {
        const loadOptions = async () => {
            const idStr = String(competition.id);
            const pid = parseInt(idStr.replace(/[^0-9]/g, ''));
            if (pid > 0) {
                // 🚀 [FIX] competition.source 필드를 1순위로 사용 (dogshow, sports_event, stylist, seminar, breed_exam)
                // source가 없을 경우에만 ID 접두어로 fallback
                let eventType = 'dogshow';
                const src = (competition.source || '').toString().toLowerCase();
                if (src) {
                    eventType = src; // source 필드 직접 사용 (가장 정확)
                } else {
                    // fallback: ID 접두어 기반 추론
                    if (idStr.startsWith('st_')) eventType = 'stylist';
                    else if (idStr.startsWith('sp_')) eventType = 'sports_event';
                    else if (idStr.startsWith('sm_')) eventType = 'seminar';
                    else if (idStr.startsWith('be_')) eventType = 'breed_exam';
                    // agility(ag_), discdog(dd_), flyball(fb_)도 sports_event 테이블 소속
                    else if (idStr.startsWith('ag_') || idStr.startsWith('dd_') || idStr.startsWith('fb_')) eventType = 'sports_event';
                }

                const res = await fetchEventOptions(eventType, pid);
                if (res.data) {
                    setEventOptions(res.data);
                    // 🚀 [REQUIRED OPTIONS] 필수로 설정된 옵션 자동 선택
                    const required = res.data
                        .filter((opt: any) => opt.is_required === 1 || opt.is_required === '1')
                        .map((opt: any) => String(opt.id));
                    setSelectedOptionIds(new Set(required));
                }
            }
        };
        loadOptions();
    }, [competition]);

    // 💰 [TOTAL CALCULATION]
    const totalAmount = eventOptions.reduce((sum, opt) => {
        if (selectedOptionIds.has(String(opt.id))) {
            return sum + parseInt(opt.option_price);
        }
        return sum;
    }, 0);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        try {
            const result = await uploadFile(file);
            if (result && result.success) {
                setFormData((prev: any) => ({ ...prev, [field]: result.url }));
            } else {
                showAlert('오류', '이미지 업로드에 실패했습니다.');
            }
        } catch (err) {
            showAlert('오류', '이미지 서버 통신 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSearchMember = async () => {
        // [수정] 폼에서 입력된 값 분리 (혈통서 번호 vs 아이디)
        const pedigreeSearch = (formData.pedigree_no || formData.pedigree_number)?.trim();
        const handlerSearch = formData.handler_id?.trim();
        
        // 혈통서 폼(도그쇼 등)에서 글자를 쳤다면 강아지 검색이 우선
        const isDogSearch = !!pedigreeSearch;
        const searchTerm = pedigreeSearch || handlerSearch;

        if (!searchTerm) {
            return showAlert('알림', '조회할 아이디 또는 혈통서 번호를 먼저 각각의 빈 칸에 입력해주세요.');
        }

        setIsSearching(true);
        try {
            // 1. 강아지 검색 모드 (혈통서 필드가 폼에 활성화된 경우)
            if (isDogSearch) {
                const res = await fetchMembers('dogTab', 1, searchTerm, 'reg_no', 1);
                if (res.data && res.data.length > 0) {
                    const d = res.data[0];
                    setFormData((prev: any) => ({
                        ...prev,
                        name: d.poss_name || prev.name,
                        contact: d.poss_phone || prev.contact,
                        dog_name: d.name || prev.dog_name,
                        dog_breed: d.dog_class || prev.dog_breed,
                        dog_gender: d.sex === '1' ? '수' : d.sex === '2' ? '암' : prev.dog_gender,
                        pedigree_number: d.reg_no || prev.pedigree_number,
                        pedigree_no: d.reg_no || prev.pedigree_no,
                    }));
                    showAlert('성공', `'${d.name || '알 수 없음'}' 견 정보를 성공적으로 불러왔습니다.`);
                } else {
                    showAlert('알림', `조회하신 혈통서 등록번호 [${searchTerm}] 와 일치하는 강아지 정보가 등록되어 있지 않습니다. 다시 확인해주세요.`);
                }
                return; // 강아지 폼에서는 여기서 처리 종료 (회원 검색으로 넘어가지 않음)
            }

            // 2. 회원 검색 모드 (세미나, 미용대회 등 핸들러/참가자 ID 조회 시)
            if (!isDogSearch && handlerSearch) {
                const res = await fetchMembers('memTab', 1, searchTerm, 'id', 1);
                if (res.data && res.data.length > 0) {
                    const m = res.data[0];
                    setFormData((prev: any) => ({
                        ...prev,
                        name: m.name || prev.name,
                        contact: m.hp || m.tel || prev.contact,
                        email: m.email || prev.email,
                        birthdate: m.birth || prev.birthdate,
                        affiliation: m.company || prev.affiliation,
                        address: m.addr1 ? `${m.addr1} ${m.addr2 || ''}` : prev.address
                    }));
                    showAlert('성공', '해당 회원의 정보를 양식에 불러왔습니다.');
                } else {
                    showAlert('알림', `입력하신 아이디 [${searchTerm}] 와 일치하는 회원 정보가 없습니다.`);
                }
            }
        } catch (e) {
            showAlert('오류', '원격 서버에서 정보를 조회하는 중 시스템 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return showAlert('알림', '이름을 입력해주세요.');

        setIsSubmitting(true);
        try {
            const extractNumericId = (idStr: string | number) => {
                if (typeof idStr === 'number') return idStr;
                const match = String(idStr).match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
            };

            const ds_pid = extractNumericId(competition.id);

            // 💰 [OPTIONS SUMMARY GENERATE]
            const selectedOptNames = eventOptions
                .filter(opt => selectedOptionIds.has(String(opt.id)))
                .map(opt => opt.option_name)
                .join(', ');

            // 🛡️ [COLUMN FILTERING] - Unknown column 오류 방지를 위해 테이블별 허용 필드만 추출합니다.
            let payload: any = { ds_pid };

            // [재수정] 이제 DB에 기둥(handler_id)이 완성되었으므로, 무조건 로그인 아이디를 전송합니다!
            const commonFields = ['name', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary'];
            
            // 💰 [FINAL DATA PREPARATION]
            // 상태(formData)를 직접 수정하지 않고, 서버에 보낼 최종 데이터를 깨끗하게 생성합니다.
            const finalData = {
                ...formData,
                total_amount: totalAmount,
                options_summary: selectedOptNames
            };

            if (targetTable === 'dogshow_applicant') {
                // ✅ [FIX] 실제 DB 컬럼명: pedigree_number (reg_no 아님)
                const fields = [...commonFields, 'pedigree_number'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'stylist_applicant') {
                // ✅ [FIX] stylist_applicant에 reg_no 컬럼 없음 → 제거
                const fields = [...commonFields, 'birthdate', 'email', 'address', 'affiliation', 'dog_breed', 'entry_type', 'entry_category', 'student_id_photo'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'stylist_intl_applicant') {
                // ✅ [FIX] stylist_intl_applicant에 reg_no 컬럼 없음 → 제거
                const fields = [...commonFields, 'birthdate', 'email', 'address', 'affiliation', 'dog_breed', 'entry_type', 'entry_category', 'license_number'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'sports_applicant') {
                // ⚠️ [FIX] sports_applicant 테이블에는 reg_no 컬럼이 없으므로 제거
                const fields = [...commonFields, 'subject', 'dog_breed', 'dog_name', 'dog_gender', 'is_heat', 'pedigree_no', 'division', 'dog_photo', 'student_id_photo'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'agility_applicant') {
                // ✅ pedigree_no 없음
                const fields = ['name', 'name_eng', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary',
                    'subject', 'dog_breed', 'dog_name', 'dog_name_eng', 'dog_gender', 'is_heat',
                    'division', 'dog_photo', 'student_id_photo', 'size', 'team_name'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'discdog_applicant') {
                // ✅ options_summary 있음, pedigree_no 없음
                const fields = ['name', 'name_eng', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary',
                    'subject', 'dog_breed', 'dog_name', 'dog_name_eng', 'dog_gender', 'is_heat',
                    'division', 'dog_photo', 'student_id_photo', 'size', 'team_name'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'flyball_applicant') {
                // ✅ options_summary 있음, 단순 구조 (영문명/사이즈/구분/사진 없음)
                const fields = ['name', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary',
                    'subject', 'dog_breed', 'dog_name'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'seminar_applicant') {
                // ✅ [FIX] address 컬럼 없음 → 제거
                const fields = [...commonFields, 'birthdate', 'email', 'affiliation'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else if (targetTable === 'breed_exam_applicant') {
                // ✅ [FIX] pedigree_number 사용 (reg_no 아님)
                const fields = ['name', 'contact', 'payment_status', 'handler_id', 'total_amount', 'options_summary', 'pedigree_number'];
                fields.forEach(f => { if (finalData[f] !== undefined) payload[f] = finalData[f]; });
            }
            else {
                payload = { ...finalData, ds_pid };
            }

            const res = await createApplicant(payload, targetTable);
            if (res.success) {
                showAlert('성공', '신청이 완료되었습니다.');
                onClose();
            } else {
                throw new Error(res.error || '저장 실패');
            }
        } catch (err: any) {
            showAlert('오류', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
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
        handleOptionToggle
    };
};
