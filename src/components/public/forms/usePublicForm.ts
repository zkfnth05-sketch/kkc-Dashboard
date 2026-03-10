import React, { useState } from 'react';
import { fetchMembers, uploadFile } from '../../../services/memberService';
import { createApplicant } from '../../../services/eventService';

export const usePublicForm = (competition: any, targetTable: string, onClose: () => void, showAlert: (title: string, message: string) => void) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [formData, setFormData] = useState<any>({
        name: '',
        contact: '',
        payment_status: '미입금',
        pedigree_number: '',
        birthdate: '',
        email: '',
        address: '',
        affiliation: '',
        dog_breed: '',
        entry_type: '',
        entry_category: '',
        handler_id: '',
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
        license_number: ''
    });

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
        const searchTerm = (formData.handler_id || formData.pedigree_no || formData.pedigree_number)?.trim();
        if (!searchTerm) {
            return showAlert('알림', '조회할 아이디 또는 혈통서 번호를 입력해주세요.');
        }

        setIsSearching(true);
        try {
            // Member Search
            let res = await fetchMembers('memTab', 1, searchTerm, 'id', 1);
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
                showAlert('성공', '회원 정보를 불러왔습니다.');
                return;
            }

            // Dog Search
            res = await fetchMembers('dogTab', 1, searchTerm, 'reg_no', 1);
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
                showAlert('성공', `'${d.name}' 견 정보를 불러왔습니다.`);
            } else {
                showAlert('알림', '검색 결과가 없습니다.');
            }
        } catch (e) {
            showAlert('오류', '조회 중 오류가 발생했습니다.');
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

            // 🛡️ [COLUMN FILTERING] - Unknown column 오류 방지를 위해 테이블별 허용 필드만 추출합니다.
            let payload: any = { ds_pid };

            const commonFields = ['name', 'contact', 'payment_status'];

            if (targetTable === 'dogshow_applicant') {
                const fields = [...commonFields, 'pedigree_number'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else if (targetTable === 'stylist_applicant') {
                const fields = [...commonFields, 'birthdate', 'email', 'address', 'affiliation', 'dog_breed', 'entry_type', 'entry_category', 'student_id_photo'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else if (targetTable === 'stylist_intl_applicant') {
                const fields = [...commonFields, 'handler_id', 'birthdate', 'email', 'address', 'affiliation', 'dog_breed', 'entry_type', 'entry_category', 'license_number'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else if (targetTable === 'sports_applicant') {
                const fields = [...commonFields, 'handler_id', 'subject', 'dog_breed', 'dog_name', 'dog_gender', 'is_heat', 'pedigree_no', 'division', 'dog_photo', 'student_id_photo'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else if (['agility_applicant', 'discdog_applicant'].includes(targetTable)) {
                // 어질리티 등은 'size'가 있을 수 있으므로 구분
                const fields = [...commonFields, 'handler_id', 'subject', 'dog_breed', 'dog_name', 'dog_gender', 'is_heat', 'division', 'dog_photo', 'student_id_photo', 'size', 'team_name', 'name_eng', 'dog_name_eng'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else if (targetTable === 'flyball_applicant') {
                const fields = [...commonFields, 'handler_id', 'subject', 'dog_breed', 'dog_name'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else if (targetTable === 'seminar_applicant') {
                const fields = [...commonFields, 'handler_id', 'birthdate', 'email', 'affiliation'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else if (targetTable === 'breed_exam_applicant') {
                const fields = [...commonFields, 'pedigree_number'];
                fields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
            }
            else {
                // 알 수 없는 테이블의 경우 전체 전송 (위험할 수 있음)
                payload = { ...formData, ds_pid };
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
        handleSave
    };
};
