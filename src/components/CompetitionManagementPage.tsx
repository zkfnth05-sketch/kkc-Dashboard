
import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Calendar, MapPin, Loader2, Trophy,
  Edit2, Trash2, ChevronLeft, ChevronRight, X,
  CheckCircle2, Download, Users, Settings2, Filter,
  ArrowLeft, Check, Upload, Image as ImageIcon,
  Clock, Building2, Save
} from 'lucide-react';
import { fetchBridge, SECRET_KEY, BRIDGE_URL } from '../services/memberService';
import { fetchDogShows, createDogShow, updateDogShow, deleteDogShow } from '../services/eventService';
import { CustomEditor } from './EventManagementPage';
import { CompetitionApplicantManagement } from './CompetitionApplicantManagement';
import { StylistCompetitionApplicantManagement } from './StylistCompetitionApplicantManagement';
import { StylistIntlApplicantManagement } from './StylistIntlApplicantManagement';
import { TrainingApplicantManagement } from './TrainingApplicantManagement';
import { AgilityApplicantManagement } from './AgilityApplicantManagement';
import { DiscDogApplicantManagement } from './DiscDogApplicantManagement';
import { FlyballApplicantManagement } from './FlyballApplicantManagement';
import { SeminarApplicantManagement } from './SeminarApplicantManagement';
import Papa from 'papaparse';
import { fetchApplicants } from '../services/eventService';

// 🛡️ [DATA MAPPING] wp_posts (kkf_event) 기반 데이터 규격
interface Competition {
  id: string | number;
  title: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  content: string;
  thumbnail_url?: string;
  thumbnail_id?: string;
  category?: string;
  venue?: string;
  judges?: string;
  subtitle?: string;
  reg_start_date?: string;
  reg_start_h?: string;
  reg_start_m?: string;
  reg_end_date?: string;
  reg_end_h?: string;
  reg_end_m?: string;
  is_multi_day?: boolean;
  ds_etc?: string; // 추가 필드 (부제목, 접수일자 등 JSON)
  applicant_count?: number; // 신청자 수
}

interface CompetitionManagementPageProps {
  tableName: string;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  editData?: Competition | null; // 🚀 [SYNC FIX] External edit request
  initialTab?: string;
  forcedCategory?: string;
}

/**
 * 🎨 대회 등록/수정 전용 폼 (전체 페이지 버전)
 * 사용자가 제공한 사진의 레이아웃을 1:1로 구현
 */
const CompetitionCreateForm: React.FC<{
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: Competition | null;
  defaultCategory?: string;
}> = ({ onClose, onSave, initialData, defaultCategory = '도그쇼' }) => {
  const [formData, setFormData] = useState({
    category: defaultCategory,
    title: '',
    subtitle: '',
    venue: '',
    startDate: '',
    startTime: '10:00',
    endDate: '',
    endTime: '18:00',
    reg_start_date: '',
    reg_start_h: '09',
    reg_start_m: '00',
    reg_end_date: '',
    reg_end_h: '17',
    reg_end_m: '00',
    is_multi_day: false,
    content: '',
    judges: '',
    thumbnail_url: '',
    thumbnail_id: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || '도그쇼',
        title: initialData.title || '',
        subtitle: initialData.subtitle || '',
        venue: initialData.venue || '',
        startDate: initialData.startDate || '',
        startTime: (initialData.startTime && initialData.startTime.substring(0, 5) !== '00:00') ? initialData.startTime.substring(0, 5) : '10:00',
        endDate: initialData.endDate || '',
        endTime: (initialData.endTime && initialData.endTime.substring(0, 5) !== '00:00') ? initialData.endTime.substring(0, 5) : '18:00',
        reg_start_date: initialData.reg_start_date || '',
        reg_start_h: initialData.reg_start_h || '09',
        reg_start_m: initialData.reg_start_m || '00',
        reg_end_date: initialData.reg_end_date || '',
        reg_end_h: initialData.reg_end_h || '17',
        reg_end_m: initialData.reg_end_m || '00',
        is_multi_day: initialData.is_multi_day || false,
        content: initialData.content || '',
        judges: initialData.judges || '',
        thumbnail_url: initialData.thumbnail_url || '',
        thumbnail_id: initialData.thumbnail_id || '',
        organizer: (initialData.organizer === '주최 미지정' || !initialData.organizer) ? '(사)한국애견협회' : initialData.organizer
      });
    }
  }, [initialData]);

  const internalImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('mode', 'upload_image');
    formData.append('image_file', file);
    try {
      const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'X-Auth-Token': SECRET_KEY },
        body: formData
      });
      if (!response.ok) return null;
      const res = await response.json();
      return res.success ? { url: res.url, id: res.id } : null;
    } catch (err) { return null; }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const result = await internalImageUpload(file);
      if (result) {
        setFormData(prev => ({ ...prev, thumbnail_url: result.url, thumbnail_id: result.id.toString() }));
      }
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) return alert('대회 제목을 입력해주세요.');
    setIsLoading(true);
    try {
      const payload = {
        ID: initialData?.id || '',
        post_title: formData.title,
        post_content: formData.content,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate || formData.startDate,
        endTime: formData.endTime,
        event_start_datetime: `${formData.startDate} ${formData.startTime}:00`,
        event_end_datetime: `${formData.endDate || formData.startDate} ${formData.endTime}:00`,
        event_venue: formData.venue || '',
        event_organizer: formData.organizer || '',
        organizer: formData.organizer || '', // 서버에서 두 가지 이름 다 확인하므로 둘 다 보냄
        type_names: formData.category,
        thumbnail_url: formData.thumbnail_url,
        thumbnail_id: formData.thumbnail_id,
        // 🚀 [1:1 FIELD MAPPING] 백엔드에서 각각의 컬럼에 매핑할 수 있도록 개별 전달
        subtitle: formData.subtitle,
        ds_subtitle: formData.subtitle,
        reg_start_date: formData.reg_start_date,
        reg_start_h: formData.reg_start_h,
        reg_start_m: formData.reg_start_m,
        reg_end_date: formData.reg_end_date,
        reg_end_h: formData.reg_end_h,
        reg_end_m: formData.reg_end_m,
        is_multi_day: formData.is_multi_day,
        judges: formData.judges,
      };
      await onSave(payload);
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '10', '20', '30', '40', '50'];

  return (
    <div className="bg-white min-h-screen pb-32 animate-in fade-in duration-300 overflow-y-auto">
      <div className="max-w-[800px] mx-auto pt-14 px-4">
        <h2 className="text-[28px] font-bold text-gray-900 text-center mb-12">대회 추가</h2>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[13px] font-bold text-gray-600">대표 이미지 (썸네일)</label>
            <div className="relative group w-full aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all group">
              {formData.thumbnail_url ? (
                <img src={formData.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Thumbnail" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-300">
                  <Upload size={32} strokeWidth={1.5} />
                  <span className="text-[12px] font-bold uppercase">이미지 업로드</span>
                </div>
              )}
              <input type="file" onChange={handleThumbnailUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">대회 유형</label>
            <select
              className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 bg-white shadow-sm font-bold"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option>도그쇼</option>
              <option>셰퍼드 전람회</option>
              <option>진도견 선발대회</option>
              <option>반려견 스타일리스트 경연대회</option>
              <option>반려견 스타일리스트 경연대회(국제)</option>
              <option>훈련 경기대회</option>
              <option>어질리티</option>
              <option>디스크독</option>
              <option>플라이볼</option>
              <option>세미나</option>
              <option>종견인정검사</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">대회 제목</label>
            <input
              type="text"
              placeholder="대회 제목을 입력하세요"
              className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">대회 부제목</label>
            <input
              type="text"
              placeholder="대회 부제목을 입력하세요"
              className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm"
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">장소</label>
            <input
              type="text"
              placeholder="대회 장소를 입력하세요"
              className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm"
              value={formData.venue}
              onChange={e => setFormData({ ...formData, venue: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">주최자</label>
            <input
              type="text"
              placeholder="주최자를 입력하세요"
              className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm"
              value={formData.organizer}
              onChange={e => setFormData({ ...formData, organizer: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">심사위원</label>
            <input
              type="text"
              placeholder="심사위원을 입력하세요"
              className="w-full border border-gray-300 rounded-sm px-4 py-3 text-gray-700 outline-none focus:border-blue-500 shadow-sm"
              value={formData.judges}
              onChange={e => setFormData({ ...formData, judges: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">접수 시작일</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 border border-gray-300 rounded-sm px-4 py-2.5 outline-none focus:border-blue-500 shadow-sm"
                value={formData.reg_start_date}
                onChange={e => setFormData({ ...formData, reg_start_date: e.target.value })}
              />
              <select className="w-24 border border-gray-300 rounded-sm px-2 outline-none focus:border-blue-500 shadow-sm" value={formData.reg_start_h} onChange={e => setFormData({ ...formData, reg_start_h: e.target.value })}>
                {hours.map(h => <option key={h} value={h}>{h}시</option>)}
              </select>
              <select className="w-24 border border-gray-300 rounded-sm px-2 outline-none focus:border-blue-500 shadow-sm" value={formData.reg_start_m} onChange={e => setFormData({ ...formData, reg_start_m: e.target.value })}>
                {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">접수 마감일</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 border border-gray-300 rounded-sm px-4 py-2.5 outline-none focus:border-blue-500 shadow-sm"
                value={formData.reg_end_date}
                onChange={e => setFormData({ ...formData, reg_end_date: e.target.value })}
              />
              <select className="w-24 border border-gray-300 rounded-sm px-2 outline-none focus:border-blue-500 shadow-sm" value={formData.reg_end_h} onChange={e => setFormData({ ...formData, reg_end_h: e.target.value })}>
                {hours.map(h => <option key={h} value={h}>{h}시</option>)}
              </select>
              <select className="w-24 border border-gray-300 rounded-sm px-2 outline-none focus:border-blue-500 shadow-sm" value={formData.reg_end_m} onChange={e => setFormData({ ...formData, reg_end_m: e.target.value })}>
                {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600">대회 기간</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[11px] text-gray-400 font-bold uppercase">시작 일시</span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-sm px-4 py-2 outline-none focus:border-blue-500 shadow-sm"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <input
                    type="time"
                    className="w-32 border border-gray-300 rounded-sm px-2 outline-none focus:border-blue-500 shadow-sm"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[11px] text-gray-400 font-bold uppercase">종료 일시</span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-sm px-4 py-2 outline-none focus:border-blue-500 shadow-sm"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                  <input
                    type="time"
                    className="w-32 border border-gray-300 rounded-sm px-2 outline-none focus:border-blue-500 shadow-sm"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer py-2 group">
            <div className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${formData.is_multi_day ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
              {formData.is_multi_day && <Check size={14} className="text-white" />}
            </div>
            <input type="checkbox" className="hidden" checked={formData.is_multi_day} onChange={e => setFormData({ ...formData, is_multi_day: e.target.checked })} />
            <span className="text-[14px] text-gray-700 font-medium">여러 일동안 진행되는 대회</span>
          </label>

          <div className="space-y-2 pb-24">
            <label className="text-[13px] font-bold text-gray-600">대회 소개 (전문 에디터)</label>
            <div className="min-h-[600px] h-full">
              <CustomEditor
                value={formData.content}
                onChange={val => setFormData({ ...formData, content: val })}
                onImageUpload={internalImageUpload}
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-[#f8f9fa] border-t border-gray-200 py-4 px-10 flex justify-end gap-3 z-[100]">
          <button onClick={onClose} className="px-7 py-2.5 bg-gray-400 text-white rounded-md font-bold text-[14px] hover:bg-gray-500 shadow-md">취소</button>
          <button onClick={handleSave} disabled={isLoading} className="px-10 py-2.5 bg-blue-600 text-white rounded-md font-bold text-[14px] hover:bg-blue-700 shadow-lg flex items-center gap-2">
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
};


export const CompetitionManagementPage: React.FC<CompetitionManagementPageProps> = ({
  tableName, showAlert, showConfirm, editData, onClearEditData, initialTab, forcedCategory
}) => {
  const [data, setData] = useState<Competition[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [viewMode, setViewMode] = useState<'list' | 'form' | 'applicants'>('list');
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [viewDetailComp, setViewDetailComp] = useState<Competition | null>(null);
  const [activeTab, setActiveTab] = useState(forcedCategory || initialTab || '전체');

  // 🚀 [SYNC EDIT] External edit request listener
  useEffect(() => {
    if (editData) {
      setSelectedComp(editData);
      setViewMode('form');
    }
  }, [editData]);

  const tabs = [
    '전체', '도그쇼', '셰퍼드 전람회', '진도견 선발대회', '반려견 스타일리스트 경연대회', '반려견 스타일리스트 경연대회(국제)',
    '훈련 경기대회', '어질리티', '디스크독', '플라이볼', '세미나', '종견인정검사'
  ];

  const loadData = async (page: number = 1, q: string = searchQuery, cat: string = activeTab) => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      // 🚀 wp_posts 및 레거시 테이블 통합 조회 (백엔드 필터 연동)
      const res = await fetchDogShows(page, q, 20, cat);
      const sanitizedData = (res.data || []).map((item: any) => {
        // [고도화] 서버 풀 데이터를 기반으로 정밀 날짜/시간 추출
        const sDt = item.actual_start_dt || item.startDate || '';
        const eDt = item.actual_end_dt || item.endDate || '';

        const sParts = sDt.split(' ');
        const eParts = eDt.split(' ');

        const normalizeTime = (t: string) => {
          if (!t || t.trim() === '' || t.substring(0, 5) === '00:00') return '';
          return t.substring(0, 5);
        };

        const startDate = sParts[0] || '';
        const startTime = normalizeTime(item.startTime || (sParts[1] || ''));

        const endDate = (eParts[0] && eParts[0] !== '-') ? eParts[0] : startDate;
        const endTime = normalizeTime(item.endTime || (eParts[1] || ''));

        const venueRaw = item.venue || item.venue_name || '';
        const venue = (venueRaw && !venueRaw.includes('미지정')) ? venueRaw : '';

        const organizerRaw = item.organizer || item.organizer_name || item.event_organizer || '';
        const organizer = (organizerRaw && !organizerRaw.includes('미지정') && !organizerRaw.includes('KKC')) ? organizerRaw : '(사)한국애견협회';

        // 🚀 [FIX] 시작날짜와 종료날짜가 반대로 된 경우 자동 보정
        const sTimeVal = startDate + ' ' + (startTime || '00:00');
        const eTimeVal = endDate + ' ' + (endTime || '00:00');

        const finalStartDate = (sTimeVal > eTimeVal) ? endDate : startDate;
        const finalStartTime = (sTimeVal > eTimeVal) ? endTime : startTime;
        const finalEndDate = (sTimeVal > eTimeVal) ? startDate : endDate;
        const finalEndTime = (sTimeVal > eTimeVal) ? startTime : endTime;

        return {
          ...item,
          startDate: finalStartDate,
          startTime: finalStartTime,
          endDate: finalEndDate,
          endTime: finalEndTime,
          venue,
          organizer
        };
      }).sort((a: any, b: any) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });

      setData(sanitizedData);
      setTotal(res.total);
    } catch (e: any) {
      showAlert('오류', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 탭이 변경될 때마다 데이터를 새로 로드합니다.
  useEffect(() => { loadData(1); }, [activeTab]);

  const handleSave = async (payload: any) => {
    try {
      let res;
      if (payload.ID) {
        res = await updateDogShow(payload);
        if (!res.success) throw new Error(res.error || '수정에 실패했습니다.');
        showAlert('성공', '대회 정보가 수정되었습니다.');
      } else {
        res = await createDogShow(payload);
        if (!res.success) throw new Error(res.error || '등록에 실패했습니다.');
        showAlert('성공', '새 대회가 등록되었습니다.');
      }
      setViewMode('list');
      loadData(currentPage);
    } catch (e: any) {
      showAlert('오류', e.message);
      throw e;
    }
  };

  const handleDelete = (item: Competition) => {
    showConfirm('대회 삭제', `'${item.title}' 대회를 삭제하시겠습니까?`, async () => {
      setIsLoading(true);
      try {
        await deleteDogShow(item.id);
        loadData(currentPage);
        showAlert('완료', '삭제되었습니다.');
      } catch (e: any) { showAlert('오류', e.message); }
      finally { setIsLoading(false); }
    });
  };

  const extractNumericId = (idStr: string | number) => {
    if (typeof idStr === 'number') return idStr;
    const match = idStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const handleDownloadApplicants = async (comp: Competition) => {
    setIsLoading(true);
    try {
      const parsedDsPid = extractNumericId(comp.id);
      if (parsedDsPid <= 0) {
        showAlert('알림', '신청자를 다운로드할 수 없는 대회입니다.');
        return;
      }

      const idStr = String(comp.id || '');
      const category = comp.category || '';

      // 🚀 [STRICT PREFIX MAPPING]
      const isStylistIntl = idStr.startsWith('st_') && category.includes('(국제)');
      const isStylistComp = idStr.startsWith('st_') && !isStylistIntl;
      const isSeminarComp = idStr.startsWith('sm_');
      const isBreedComp = idStr.startsWith('be_');
      const isAgility = idStr.startsWith('sp_') && category.includes('어질리티');
      const isDiscDog = idStr.startsWith('sp_') && category.includes('디스크독');
      const isFlyball = idStr.startsWith('sp_') && category.includes('플라이볼');
      const isTraining = idStr.startsWith('sp_') && !isAgility && !isDiscDog && !isFlyball;

      let targetTable = 'dogshow_applicant';
      if (isStylistIntl) targetTable = 'stylist_intl_applicant';
      else if (isStylistComp) targetTable = 'stylist_applicant';
      else if (isSeminarComp) targetTable = 'seminar_applicant';
      else if (isBreedComp) targetTable = 'breed_exam_applicant';
      else if (isAgility) targetTable = 'agility_applicant';
      else if (isDiscDog) targetTable = 'discdog_applicant';
      else if (isFlyball) targetTable = 'flyball_applicant';
      else if (isTraining) targetTable = 'sports_applicant';

      const res = await fetchApplicants(parsedDsPid, targetTable);
      const applicants = res.data || [];
      if (applicants.length === 0) {
        showAlert('알림', '등록된 신청자가 없습니다.');
        return;
      }

      const csvData = applicants.map((a: any) => {
        const basic = {
          '대회명': comp.title,
          '이름': a.name,
          '연락처': a.contact || '',
          '입금 상태': a.payment_status || '미입금',
          '신청일시': a.created_at || ''
        };

        if (isStylistComp || isStylistIntl) {
          return { ...basic, '생년월일': a.birthdate || '', '이메일': a.email || '', '주소': a.address || '', '소속': a.affiliation || '', '모종': a.dog_breed || '', '참가유형': a.entry_type || '', '종목': a.entry_category || '', '핸들러ID': a.handler_id || '', '자격번호': a.license_number || '' };
        }
        if (isSeminarComp) {
          return { ...basic, '회원 ID': a.handler_id || '', '이메일': a.email || '', '소속(직업)': a.affiliation || '' };
        }
        if (isAgility || isDiscDog || isFlyball || isTraining) {
          return { ...basic, '견종': a.dog_breed || '', '견명': a.dog_name || '', '성별': a.dog_gender || '', '종목': a.subject || '', '구분': a.division || '', '핸들러ID': a.handler_id || '' };
        }
        if (isBreedComp) {
          return { ...basic, '혈통서 번호': a.pedigree_number || '', '견종': a.dog_breed || '', '견명': a.dog_name || '', '자산번호': a.property_no || '', '성별': a.dog_gender || '' };
        }

        return {
          ...basic,
          '혈통서 등록번호': a.pedigree_number || ''
        };
      });

      const csvStr = Papa.unparse(csvData);
      const blob = new Blob(["\uFEFF" + csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${comp.title}_신청자목록.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e: any) {
      showAlert('오류', '다운로드 실패: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (viewMode === 'form') {
    return (
      <CompetitionCreateForm
        onClose={() => {
          setViewMode('list');
          onClearEditData?.(); // 🚀 Clear shared state
        }}
        onSave={handleSave}
        initialData={selectedComp}
        defaultCategory={forcedCategory || (activeTab !== '전체' ? activeTab : '도그쇼')}
      />
    );
  }

  if (viewMode === 'applicants' && selectedComp) {
    const idStr = String(selectedComp.id || '');
    const itemCat = selectedComp.category || '';

    // 🚀 [STRICT PREFIX MAPPING]
    const isStylistIntl = idStr.startsWith('st_') && itemCat.includes('(국제)');
    const isStylist = idStr.startsWith('st_') && !isStylistIntl;
    const isAgility = idStr.startsWith('sp_') && itemCat.includes('어질리티');
    const isDiscDog = idStr.startsWith('sp_') && itemCat.includes('디스크독');
    const isFlyball = idStr.startsWith('sp_') && itemCat.includes('플라이볼');
    const isTraining = idStr.startsWith('sp_') && !isAgility && !isDiscDog && !isFlyball;
    const isSeminar = idStr.startsWith('sm_');
    const isBreedExam = idStr.startsWith('be_');

    if (isSeminar) {
      return (
        <SeminarApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    if (isBreedExam) {
      return (
        <CompetitionApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          applicantTable="breed_exam_applicant"
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    if (isStylistIntl) {
      return (
        <StylistIntlApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    if (isStylist) {
      return (
        <StylistCompetitionApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    if (isAgility) {
      return (
        <AgilityApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    if (isDiscDog) {
      return (
        <DiscDogApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    if (isTraining) {
      return (
        <TrainingApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    if (isFlyball) {
      return (
        <FlyballApplicantManagement
          competitionId={selectedComp.id}
          competitionTitle={selectedComp.title}
          onClose={() => { setViewMode('list'); loadData(currentPage); }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      );
    }

    return (
      <CompetitionApplicantManagement
        competitionId={selectedComp.id}
        competitionTitle={selectedComp.title}
        onClose={() => { setViewMode('list'); loadData(currentPage); }}
        showAlert={showAlert}
        showConfirm={showConfirm}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white p-6 font-sans text-gray-800 overflow-hidden">
      {/* 🚀 Header Area */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-[24px] font-black tracking-tight">{forcedCategory || '대회 관리'}</h2>
        <button
          onClick={() => { setSelectedComp(null); setViewMode('form'); }}
          className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Plus size={14} strokeWidth={3} /> {forcedCategory ? `${forcedCategory} 추가` : '대회 추가'}
        </button>
      </div>

      {/* 🚀 Tabs Area */}
      {/* 🚀 Tabs Area */}
      {!forcedCategory && (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${activeTab === tab
                ? 'bg-[#009292] text-white border-[#009292]'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* 🚀 Table Area */}
      <div className="flex-1 overflow-auto border-t border-gray-100 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        )}
        <table className="w-full text-[13px] border-collapse text-left">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-gray-400 font-bold">
              <th className="py-4 px-4 w-[25%] font-bold">대회명</th>
              <th className="py-4 px-4 w-[12%] font-bold">장소</th>
              <th className="py-4 px-4 w-[13%] font-bold">심사위원</th>
              <th className="py-4 px-4 w-[15%] font-bold">접수기간</th>
              <th className="py-4 px-4 w-[12%] font-bold">대회일자</th>
              <th className="py-4 px-4 w-[8%] font-bold">신청자 수</th>
              <th className="py-4 px-4 w-[15%] text-center font-bold">신청자 관리</th>
              <th className="py-4 px-4 w-[8%] text-center font-bold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length > 0 ? data.map((item) => {
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-5 px-4 font-bold text-gray-800">
                    <button
                      onClick={() => setViewDetailComp(item)}
                      className="hover:text-blue-600 transition-colors text-left"
                    >
                      {item.title}
                    </button>
                  </td>
                  <td className="py-5 px-4 text-gray-600">{item.venue || '-'}</td>
                  <td className="py-5 px-4 text-blue-600 font-bold">{item.judges || '-'}</td>
                  <td className="py-5 px-4 text-gray-500">
                    {item.reg_start_date ? (
                      <div className="flex flex-col">
                        <span>{item.reg_start_date} ({item.reg_start_h}:{item.reg_start_m})</span>
                        <span className="text-gray-400 text-[11px]">~ {item.reg_end_date} ({item.reg_end_h}:{item.reg_end_m})</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-5 px-4 text-gray-700 font-medium whitespace-nowrap">
                    {item.startDate ? (
                      <div className="flex flex-col">
                        <span className="font-bold">{item.startDate} {item.startTime}</span>
                        {item.endDate && item.endDate !== '-' && item.endDate !== item.startDate && (
                          <span className="text-gray-400 text-[11px] font-normal">~ {item.endDate} {item.endTime}</span>
                        )}
                        {item.endDate === item.startDate && item.endTime !== item.startTime && (
                          <span className="text-gray-400 text-[11px] font-normal">~ {item.endTime}</span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-5 px-4 text-gray-600 font-bold">{item.applicant_count || 0}명</td>
                  <td className="py-5 px-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { setSelectedComp(item); setViewMode('applicants'); }}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm"
                      >
                        신청자 관리
                      </button>
                      <button
                        onClick={() => handleDownloadApplicants(item)}
                        className="px-3 py-1.5 bg-[#006b3d] text-white rounded text-[11px] font-bold hover:bg-[#005a33] shadow-sm flex items-center gap-1"
                      >
                        다운로드
                      </button>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => { setSelectedComp(item); setViewMode('form'); }}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : !isLoading && (
              <tr>
                <td colSpan={7} className="py-40 text-center text-gray-400 italic">
                  등록된 대회 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 Pagination Area */}
      <div className="mt-6 flex justify-center items-center gap-1 border-t border-gray-100 pt-6">
        <button
          onClick={() => loadData(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>

        {(() => {
          const totalPages = Math.ceil(total / 20) || 1;
          const pages = [];
          const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
          const endPage = Math.min(totalPages, startPage + 4);

          for (let i = startPage; i <= endPage; i++) {
            pages.push(
              <button
                key={i}
                onClick={() => loadData(i)}
                className={`w-8 h-8 flex items-center justify-center rounded font-bold text-[13px] transition-all ${currentPage === i
                  ? 'bg-[#009292] text-white shadow-md scale-110'
                  : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100'
                  }`}
              >
                {i}
              </button>
            );
          }
          return pages;
        })()}

        <button
          onClick={() => loadData(currentPage + 1)}
          disabled={(currentPage * 20) >= total}
          className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 🚀 Competition Detail Popup (Sync with EventManagementPage style) */}
      {viewDetailComp && (() => {
        let extra: any = {};
        try { extra = viewDetailComp.ds_etc ? JSON.parse(viewDetailComp.ds_etc) : {}; } catch (err) { }
        return (
          <div className="fixed inset-0 z-[450] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
              {/* Detail Header */}
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase">
                    {viewDetailComp.category}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">대회 상세 정보</h3>
                </div>
                <button
                  onClick={() => setViewDetailComp(null)}
                  className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all text-slate-400 hover:text-slate-900"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Info Sidebar */}
                  <div className="lg:col-span-4 space-y-8">
                    <div className="rounded-3xl overflow-hidden shadow-xl aspect-square bg-slate-100 relative group">
                      {viewDetailComp.thumbnail_url ? (
                        <img src={viewDetailComp.thumbnail_url} className="w-full h-full object-cover" alt={viewDetailComp.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <ImageIcon size={64} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-indigo-50 rounded-2xl shadow-sm text-indigo-600"><Clock size={22} strokeWidth={2.5} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">대회 일시</p>
                            <p className="text-sm font-black text-slate-800 leading-tight">
                              {viewDetailComp.startDate} {viewDetailComp.startTime ? `(${viewDetailComp.startTime})` : ''}
                              <br />
                              <span className="text-slate-300 mx-auto block my-1">~</span>
                              {viewDetailComp.endDate || viewDetailComp.startDate} {viewDetailComp.endTime ? `(${viewDetailComp.endTime})` : ''}
                            </p>
                          </div>
                        </div>

                        {(viewDetailComp.reg_start_date || viewDetailComp.reg_end_date || extra.reg_start_date) && (
                          <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-rose-500"><Save size={18} /></div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">접수 기간</p>
                              <p className="text-[11px] font-black text-slate-700">
                                {viewDetailComp.reg_start_date || extra.reg_start_date} ~
                                <br />
                                {viewDetailComp.reg_end_date || extra.reg_end_date}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-rose-400"><MapPin size={18} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">장소</p>
                            <p className="text-xs font-black text-slate-800">{viewDetailComp.venue || '장소 추후 공지'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-blue-400"><Building2 size={18} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주최</p>
                            <p className="text-xs font-black text-slate-800">{viewDetailComp.organizer || '(사)한국애견협회'}</p>
                          </div>
                        </div>

                        {viewDetailComp.judges && (
                          <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-amber-500"><Trophy size={18} /></div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">심사위원</p>
                              <p className="text-xs font-black text-slate-800">{viewDetailComp.judges}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="space-y-4">
                      {viewDetailComp.subtitle && (
                        <p className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em]">{viewDetailComp.subtitle}</p>
                      )}
                      <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                        {viewDetailComp.title}
                      </h2>
                    </div>
                    <div
                      className="prose prose-indigo max-w-none text-slate-600 border-t border-slate-50 pt-8"
                      dangerouslySetInnerHTML={{ __html: viewDetailComp.content }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    const item = viewDetailComp;
                    setViewDetailComp(null);
                    setSelectedComp(item);
                    setViewMode('form');
                  }}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  수정하기
                </button>
                <button
                  onClick={() => setViewDetailComp(null)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-black transition-all shadow-xl uppercase tracking-widest"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

