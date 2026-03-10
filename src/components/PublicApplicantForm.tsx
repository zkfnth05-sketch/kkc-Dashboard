import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// 🚀 [SPEED OPTIMIZATION: MODULAR FORMS]
// 각 카테고리별 전용 폼을 지연 로딩(Code Splitting)하여 
// 신청하기 버튼 클릭 시 반응 속도를 극대화하고 메모리 사용량을 최소화합니다.
const DogShowForm = lazy(() => import('./public/forms/DogShowForm').then(m => ({ default: m.DogShowForm })));
const StylistForm = lazy(() => import('./public/forms/StylistForm').then(m => ({ default: m.StylistForm })));
const StylistIntlForm = lazy(() => import('./public/forms/StylistIntlForm').then(m => ({ default: m.StylistIntlForm })));
const AgilityForm = lazy(() => import('./public/forms/AgilityForm').then(m => ({ default: m.AgilityForm })));
const DiscDogForm = lazy(() => import('./public/forms/DiscDogForm').then(m => ({ default: m.DiscDogForm })));
const FlyballForm = lazy(() => import('./public/forms/FlyballForm').then(m => ({ default: m.FlyballForm })));
const SportsForm = lazy(() => import('./public/forms/SportsForm').then(m => ({ default: m.SportsForm })));
const SeminarForm = lazy(() => import('./public/forms/SeminarForm').then(m => ({ default: m.SeminarForm })));
const BreedExamForm = lazy(() => import('./public/forms/BreedExamForm').then(m => ({ default: m.BreedExamForm })));

interface PublicApplicantFormProps {
    competition: any;
    onClose: () => void;
    showAlert: (title: string, message: string) => void;
    categoryHint?: string;
}

export const PublicApplicantForm: React.FC<PublicApplicantFormProps> = ({
    competition,
    onClose,
    showAlert,
    categoryHint
}) => {
    const source = (competition.source || '').toString();
    const category = (competition.category || '').toString();
    const typeNames = (competition.type_names || '').toString();
    const hint = (categoryHint || '').toString();

    // 🎯 [1:1 STRICT SOURCE TABLE MAPPING] - 접두어가 아닌 실제 DB 소스 테이블 기준으로 매핑

    // 1. 도그쇼 (dogshow 테이블 -> dogshow_applicant)
    const isDogShow = source === 'dogshow';

    // 2. 반려견 스타일리스트 (stylist 테이블 -> stylist_applicant or stylist_intl_applicant)
    const isStylistSource = source === 'stylist';
    const isStylistIntl = isStylistSource && (category.includes('국제') || typeNames.includes('국제') || hint.includes('국제'));
    const isStylist = isStylistSource && !isStylistIntl;

    // 3. 독스포츠 (sports_event 테이블 -> sports / agility / discdog / flyball applicant)
    const isSportsSource = source === 'sports_event';
    const isAgility = isSportsSource && (category.includes('어질리티') || typeNames.includes('어질리티') || hint.includes('어질리티'));
    const isDiscDog = isSportsSource && (category.includes('디스크독') || typeNames.includes('디스크독') || hint.includes('디스크독'));
    const isFlyball = isSportsSource && (category.includes('플라이볼') || typeNames.includes('플라이볼') || hint.includes('플라이볼'));
    const isTraining = isSportsSource && !isAgility && !isDiscDog && !isFlyball;

    // 4. 세미나 및 교육 (seminar 테이블 -> seminar_applicant)
    const isSeminar = source === 'seminar';

    // 5. 종견 인정 평가 (breed_exam 테이블 -> breed_exam_applicant)
    const isBreedExam = source === 'breed_exam';

    const LoadingFallback = (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-teal-500" size={40} />
                <p className="text-sm font-bold text-slate-600">신청 양식을 불러오는 중...</p>
            </div>
        </div>
    );

    // 🎯 [TABLE ROUTING] - 호출 시 정확한 테이블명을 명시합니다.
    return (
        <Suspense fallback={LoadingFallback}>
            {isStylistIntl && <StylistIntlForm competition={competition} onClose={onClose} showAlert={showAlert} />}
            {isStylist && <StylistForm competition={competition} onClose={onClose} showAlert={showAlert} />}
            {isAgility && <AgilityForm competition={competition} onClose={onClose} showAlert={showAlert} />}
            {isDiscDog && <DiscDogForm competition={competition} onClose={onClose} showAlert={showAlert} />}
            {isFlyball && <FlyballForm competition={competition} onClose={onClose} showAlert={showAlert} />}
            {isTraining && <SportsForm competition={competition} onClose={onClose} showAlert={showAlert} categoryName="훈련경기대회" />}
            {isSeminar && <SeminarForm competition={competition} onClose={onClose} showAlert={showAlert} />}
            {isBreedExam && <BreedExamForm competition={competition} onClose={onClose} showAlert={showAlert} />}
            {isDogShow && <DogShowForm competition={competition} onClose={onClose} showAlert={showAlert} />}

            {/* 🛡️ 안전 장치: 매핑되지 않은 경우 기본 도그쇼 폼 출력 */}
            {!isStylistSource && !isSportsSource && !isSeminar && !isBreedExam && !isDogShow && (
                <DogShowForm competition={competition} onClose={onClose} showAlert={showAlert} />
            )}
        </Suspense>
    );
};
