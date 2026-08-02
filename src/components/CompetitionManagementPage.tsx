
import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Calendar, MapPin, Loader2, Trophy,
  Edit2, Trash2, ChevronLeft, ChevronRight, X,
  CheckCircle2, Download, Users, Settings2, Filter,
  ArrowLeft, Check, Upload, Image as ImageIcon,
  Clock, Building2, Save
} from 'lucide-react';
import { fetchBridge, SECRET_KEY, BRIDGE_URL, uploadFile } from '../services/memberService';
import { fetchDogShows, createDogShow, updateDogShow, deleteDogShow, fetchApplicants, fetchEventOptions, saveEventOptions } from '../services/eventService';
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
import { downloadCsv } from '../lib/downloadUtils';
import { exportDogShowCatalog } from '../lib/catalogExport';
import FeeOptionEditor, { FeeOption } from './common/FeeOptionEditor';

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
  ds_type?: string; // 🚀 대회 유형 (도그쇼, 세퍼드전람회 등)
  ds_date?: string; // 🚀 대회 개최일
  applicant_count?: number; // 신청자 수
  organizer?: string;
}

interface CompetitionManagementPageProps {
  tableName: string;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  editData?: Competition | null; // 🚀 [SYNC FIX] External edit request
  onClearEditData?: () => void;
  initialTab?: string;
  forcedCategory?: string;
  onGoToMember?: (loginId: string) => void;
}

/**
 * 🎨 대회 등록/수정 전용 폼 (전체 페이지 버전)
 */
const CompetitionCreateForm: React.FC<{
  onClose: () => void;
  onSave: (data: any, options: FeeOption[]) => Promise<void>;
  initialData: Competition | null;
  defaultCategory?: string;
}> = ({ onClose, onSave, initialData, defaultCategory = '도그쇼' }) => {
  const [formData, setFormData] = useState<any>({
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
    thumbnail_id: '',
    organizer: '(사)한국애견협회'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [feeOptions, setFeeOptions] = useState<FeeOption[]>([]);
  const [recentCompetitions, setRecentCompetitions] = useState<any[]>([]);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await fetchDogShows(1, '', 50, '전체');
        if (res.data) {
          setRecentCompetitions(res.data);
        }
      } catch (err) {
        console.error('Failed to load recent competitions:', err);
      }
    };
    loadRecent();
  }, []);

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

      // 💰 [LOAD OPTIONS]
      const loadOptions = async () => {
        const idStr = String(initialData.id);
        const pid = parseInt(idStr.replace(/[^0-9]/g, ''));
        if (pid > 0) {
          let eventType = 'dogshow';
          if (idStr.startsWith('st_')) eventType = 'stylist';
          else if (idStr.startsWith('sp_')) eventType = 'sports_event';
          else if (idStr.startsWith('sm_')) eventType = 'seminar';
          else if (idStr.startsWith('be_')) eventType = 'breed_exam';

          const res = await fetchEventOptions(eventType, pid);
          if (res.data) {
            // 🛡️ [SAFETY FILTER] 서버 응답 데이터 중 현재 유형과 완벽히 일치하는 것만 필터링
            const filtered = (res.data || []).filter((o: any) => o.event_type === eventType);
            setFeeOptions(filtered.map((opt: any) => ({
              id: opt.id,
              label: opt.option_name,
              price: opt.option_price,
              is_required: opt.is_required === 1 || opt.is_required === '1'
            })));
          }
        }
      };
      loadOptions();
    }
  }, [initialData]);

  const internalImageUpload = async (file: File) => {
    try {
      const result = await uploadFile(file);
      return result && result.success ? { url: result.url, id: result.id } : null;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const result = await internalImageUpload(file);
      if (result) {
        setFormData((prev: any) => ({ ...prev, thumbnail_url: result.url, thumbnail_id: result.id.toString() }));
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
        organizer: formData.organizer || '',
        type_names: formData.category,
        thumbnail_url: formData.thumbnail_url,
        thumbnail_id: formData.thumbnail_id,
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
      await onSave(payload, feeOptions);
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
                <img src={formData.thumbnail_url} className="!w-full !h-full !object-cover transition-transform duration-700 group-hover:scale-105" alt="Thumbnail" />
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
              <option>기타</option>
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

          {formData.category !== '기타' && (
            <>
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
            </>
          )}

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

          {formData.category !== '기타' && (
            <>
              {/* 📋 [COPY RECENT OPTIONS] 최근 대회 옵션 불러오기 추가 */}
              <div className="p-4 bg-blue-50/30 rounded-xl border border-dashed border-blue-200/50 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="text-left">
                  <span className="text-[13px] font-bold text-slate-700">이전 대회 옵션 복사하기</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">이전에 개설했던 대회에서 사용했던 참가비 옵션을 그대로 가져옵니다.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <select
                    className="text-[12px] font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 max-w-[240px] truncate"
                    onChange={async (e) => {
                      const targetIdStr = e.target.value;
                      if (!targetIdStr) return;
                      
                      setIsLoading(true);
                      try {
                        const pid = parseInt(targetIdStr.replace(/[^0-9]/g, ''));
                        let eventType = 'dogshow';
                        if (targetIdStr.startsWith('st_')) eventType = 'stylist';
                        else if (targetIdStr.startsWith('sp_')) eventType = 'sports_event';
                        else if (targetIdStr.startsWith('sm_')) eventType = 'seminar';
                        else if (targetIdStr.startsWith('be_')) eventType = 'breed_exam';

                        const res = await fetchEventOptions(eventType, pid);
                        if (res.data && res.data.length > 0) {
                          // 🛡️ [SAFETY FILTER]
                          const filtered = (res.data || []).filter((o: any) => o.event_type === eventType);
                          const loadedOptions = filtered.map((opt: any) => ({
                            label: opt.option_name,
                            price: opt.option_price,
                            is_required: opt.is_required === 1 || opt.is_required === '1'
                          }));
                          setFeeOptions(loadedOptions);
                          alert(`'${e.target.selectedOptions[0].text}' 대회의 옵션 ${loadedOptions.length}개를 성공적으로 불러왔습니다!`);
                        } else {
                          alert('선택한 대회에 등록된 참가비 옵션이 없습니다.');
                        }
                      } catch (err) {
                        alert('옵션을 불러오는 데 실패했습니다.');
                      } finally {
                        setIsLoading(false);
                        e.target.value = ''; // reset dropdown
                      }
                    }}
                  >
                    <option value="">복사할 대회를 선택하세요...</option>
                    {recentCompetitions.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        [{comp.category || '기타'}] {comp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 💰 [FEE OPTION EDITOR] 쇼핑몰 방식 옵션 설정 추가 */}
              <FeeOptionEditor 
                options={feeOptions} 
                onUpdate={setFeeOptions} 
              />
            </>
          )}

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
const getRegistrationStatus = (item: Competition) => {
  if (!item.reg_start_date || !item.reg_end_date) {
    return { text: '기간 미설정', color: 'text-gray-400 bg-gray-50 border-gray-200' };
  }

  const now = new Date();
  const startStr = `${item.reg_start_date} ${item.reg_start_h || '00'}:${item.reg_start_m || '00'}:00`;
  const startDate = new Date(startStr.replace(/-/g, '/'));
  const endStr = `${item.reg_end_date} ${item.reg_end_h || '23'}:${item.reg_end_m || '59'}:00`;
  const endDate = new Date(endStr.replace(/-/g, '/'));

  if (now < startDate) {
    return { text: '접수예정', color: 'text-blue-600 bg-blue-50 border-blue-200 font-bold' };
  } else if (now >= startDate && now <= endDate) {
    return { text: '접수중', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 font-bold' };
  } else {
    return { text: '접수마감', color: 'text-rose-600 bg-rose-50 border-rose-200 font-bold' };
  }
};

export const CompetitionManagementPage: React.FC<CompetitionManagementPageProps & { portalUser?: any }> = ({
  tableName, showAlert, showConfirm, editData, onClearEditData, initialTab, forcedCategory, portalUser, onGoToMember
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

  useEffect(() => {
    if (editData) {
      setSelectedComp(editData);
      setViewMode('form');
    }
  }, [editData]);

  const tabs = [
    '전체', '도그쇼', '셰퍼드 전람회', '진도견 선발대회', '반려견 스타일리스트 경연대회', '반려견 스타일리스트 경연대회(국제)',
    '훈련 경기대회', '어질리티', '디스크독', '플라이볼', '세미나', '종견인정검사', '기타'
  ];

  const loadData = async (page: number = 1, q: string = searchQuery, cat: string = activeTab) => {
    if (isLoading) return; // 🛡️ [REDUNDANCY LOCK] 중복 요청 방지
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const res = await fetchDogShows(page, q, 20, cat);
      const sanitizedData = (res.data || []).map((item: any) => {
        const sDt = item.actual_start_dt || item.startDate || '';
        const eDt = item.actual_end_dt || item.endDate || '';
        const sParts = sDt.split(' ');
        const eParts = eDt.split(' ');
        const normalizeTime = (t: string) => (!t || t.trim() === '' || t.substring(0, 5) === '00:00') ? '' : t.substring(0, 5);
        let startDate = sParts[0] || '';
        if (startDate === '0000-00-00') startDate = '';
        
        const startTime = normalizeTime(item.startTime || (sParts[1] || ''));
        
        let endDate = (eParts[0] && eParts[0] !== '-' && eParts[0] !== '0000-00-00') ? eParts[0] : startDate;
        const endTime = normalizeTime(item.endTime || (eParts[1] || ''));
        
        const venueRaw = item.venue || item.venue_name || '';
        const venue = (venueRaw && !venueRaw.includes('미지정')) ? venueRaw : '';
        const organizerRaw = item.organizer || item.organizer_name || item.event_organizer || '';
        const organizer = (organizerRaw && !organizerRaw.includes('미지정') && !organizerRaw.includes('KKC')) ? organizerRaw : '(사)한국애견협회';
        
        // 🛡️ [ROBUST DATE COMPARISON] 날짜가 둘 다 존재할 때만 비교 및 뒤바꿈 적용 (0000-00-00 오작동 방지)
        let finalStartDate = startDate;
        let finalStartTime = startTime;
        let finalEndDate = endDate;
        let finalEndTime = endTime;
        
        if (startDate && endDate) {
          const sTimeVal = startDate + ' ' + (startTime || '00:00');
          const eTimeVal = endDate + ' ' + (endTime || '00:00');
          if (sTimeVal > eTimeVal) {
            finalStartDate = endDate;
            finalStartTime = endTime;
            finalEndDate = startDate;
            finalEndTime = startTime;
          }
        }
        
        return { ...item, startDate: finalStartDate, startTime: finalStartTime, endDate: finalEndDate, endTime: finalEndTime, venue, organizer };
      }).sort((a: any, b: any) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });
      setData(sanitizedData);
      setTotal(res.total);
    } catch (e: any) { showAlert('오류', e.message); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(1); }, [activeTab]);

  const handleSave = async (payload: any, options: FeeOption[] = []) => {
    try {
      let res;
      if (payload.ID) {
        res = await updateDogShow(payload);
        if (!res.success) throw new Error(res.error || '수정에 실패했습니다.');
        
        // 💰 [SAVE OPTIONS]
        const idStr = String(res.id);
        const pid = parseInt(idStr.replace(/[^0-9]/g, ''));
        let eventType = 'dogshow';
        if (idStr.startsWith('st_')) eventType = 'stylist';
        else if (idStr.startsWith('sp_')) eventType = 'sports_event';
        else if (idStr.startsWith('sm_')) eventType = 'seminar';
        else if (idStr.startsWith('be_')) eventType = 'breed_exam';
        
        await saveEventOptions(eventType, pid, options);
        showAlert('성공', '대회 정보가 수정되었습니다.');
      } else {
        res = await createDogShow(payload);
        if (!res.success) throw new Error(res.error || '등록에 실패했습니다.');

        // 💰 [SAVE OPTIONS]
        const idStr = String(res.id);
        const pid = parseInt(idStr.replace(/[^0-9]/g, ''));
        let eventType = 'dogshow';
        if (idStr.startsWith('st_')) eventType = 'stylist';
        else if (idStr.startsWith('sp_')) eventType = 'sports_event';
        else if (idStr.startsWith('sm_')) eventType = 'seminar';
        else if (idStr.startsWith('be_')) eventType = 'breed_exam';
        
        await saveEventOptions(eventType, pid, options);
        showAlert('성공', '새 대회가 등록되었습니다.');
      }
      setViewMode('list');
      loadData(currentPage);
    } catch (e: any) { showAlert('오류', e.message); throw e; }
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
      const idStr = String(comp.id || '').toLowerCase();
      const cat = (comp.category || '').toLowerCase();
      const title = (comp.title || '').toLowerCase();

      // 🛡️ [ROBUST DETECTION] ID 접두어 + 제목 키워드 통합 판별
      const isStylist = idStr.startsWith('st_') || title.includes('미용');
      const isStylistIntl = isStylist && (cat.includes('국제') || cat.includes('intl'));
      const isSeminar = idStr.startsWith('sm_') || title.includes('세미나');
      const isBreedComp = idStr.startsWith('be_') || title.includes('종견');
      
      const isAgility = idStr.startsWith('ag_') || (idStr.startsWith('sp_') && cat.includes('어질리티')) || title.includes('어질리티');
      const isDiscDog = idStr.startsWith('dd_') || (idStr.startsWith('sp_') && cat.includes('디스크독')) || title.includes('디스크독');
      const isFlyball = idStr.startsWith('fb_') || (idStr.startsWith('sp_') && cat.includes('플라이볼')) || title.includes('플라이볼');
      const isTraining = (idStr.startsWith('tr_') || idStr.startsWith('sp_')) && !isAgility && !isDiscDog && !isFlyball;

      let targetTable = 'dogshow_applicant';
      if (isStylistIntl) targetTable = 'stylist_intl_applicant';
      else if (isStylist) targetTable = 'stylist_applicant';
      else if (isSeminar) targetTable = 'seminar_applicant';
      else if (isBreedComp) targetTable = 'breed_exam_applicant';
      else if (isAgility) targetTable = 'agility_applicant';
      else if (isDiscDog) targetTable = 'discdog_applicant';
      else if (isFlyball) targetTable = 'flyball_applicant';
      else if (isTraining) targetTable = 'sports_applicant';

      const res = await fetchApplicants(parsedDsPid, targetTable);
      // 🛡️ [PAYMENT FILTER 제거] 입금 여부 상관없이 모든 신청자를 카탈로그에 포함
      const applicants = res.data || [];
      
      if (applicants.length === 0) { 
        showAlert('알림', '등록된 신청자가 한 명도 없습니다.'); 
        return; 
      }

      let finalData: any[] = [];

      // 🏆 [DOG SHOW CATALOG LOGIC]
      // ds_type이 정확히 '도그쇼'인 경우에만 3줄 카탈로그 양식 적용 (전람회/진도견 제외)
      const isPureDogShow = (comp.category === '도그쇼' || comp.category === 'Dog Show') && (comp.ds_type === '도그쇼' || comp.ds_type === 'Dog Show');
      const isShepherdShow = comp.ds_type === '셰퍼드 전람회';
      const isJindoShow = comp.ds_type === '진도견 선발대회';

      if (isPureDogShow || isShepherdShow || isJindoShow) {
        const regNos = applicants.map(a => a.pedigree_number).filter(Boolean);
        if (regNos.length === 0) {
          finalData = applicants.map(a => ({ '번호': '', '정보1': a.name, '정보2': a.pedigree_number, '정보3': '혈통정보 없음' }));
        } else {
          // 🚀 1. dogTab 상세 정보 및 dog_classTab 정보 조회
          const dogMap: Record<string, any> = {};
          const breedMap: Record<string, any> = {};
          
          // 견종 정보 미리 로드
          const breedRes = await fetchBridge({ mode: 'list', table: 'dog_classTab', limit: 1000 });
          if (breedRes.data) {
            breedRes.data.forEach((b: any) => {
              breedMap[b.keyy] = b;
            });
          }

          await Promise.all(regNos.map(async (rawRegNo) => {
            const regNo = rawRegNo.trim();
            const res = await fetchBridge({ mode: 'list', table: 'dogTab', search: regNo, field: 'reg_no', limit: 1 });
            if (res.data && res.data.length > 0) {
              const exactDog = res.data.find((d: any) => d.reg_no.trim() === regNo);
              if (exactDog) dogMap[rawRegNo] = exactDog;
            }
          }));

          // 🚀 2. 데이터 정제 및 조(Class) 판별

          // 🚀 3. 조(Class) 판별 및 데이터 정제
          const groupOrder = ['Herding', 'Hound', 'Non-Sporting', 'Sporting', 'Terrier', 'Toy', 'Working', '한국견'];
          const classOrder = ['BABY', 'PUPPY B', 'PUPPY A', 'JUNIOR', 'YOUNG ADULT', 'ADULT', 'CHAMPION'];
          const classAgeMap: Record<string, string> = {
            'BABY': '(3-6개월)',
            'PUPPY B': '(6~9개월)',
            'PUPPY A': '(9~12개월)',
            'JUNIOR': '(12~18개월)',
            'YOUNG ADULT': '(18~24개월)',
            'ADULT': '(24개월~)',
            'CHAMPION': ''
          };
          const shepherdClassOrder = ['유견 C', '유견 B', '유견 A', '장견', '미성견', '성견'];
          const jindoClassOrder = ['자견', '유견', '장견', '미성견', '성견'];

          const enriched = applicants.map(a => {
            const d = dogMap[a.pedigree_number] || {};
            const birth = d.birth || '';
            let months = -1;
            if (birth && birth !== '0000-00-00') {
              const bDate = new Date(birth);
              if (!isNaN(bDate.getTime()) && bDate.getFullYear() > 1970) {
                const targetDate = new Date(comp.startDate || comp.ds_date || new Date());
                months = (targetDate.getFullYear() - bDate.getFullYear()) * 12 + (targetDate.getMonth() - bDate.getMonth());
              }
            }

            let className = '';
            let classIdx = 0;

            if (months === -1) {
              // 생년월일 없으면 공란 유지
            } else if (isShepherdShow) {
              const sexE = d.sex === 'M' ? 'Male' : 'Female';
              const sexK = d.sex === 'M' ? '수조' : '암조';
              if (months >= 3 && months < 6) className = `유견 C ${sexK}(3~6 Month ${sexE})`;
              else if (months >= 6 && months < 9) className = `유견 B ${sexK}(6~9 Month ${sexE})`;
              else if (months >= 9 && months < 12) className = `유견 A ${sexK}(9~12 Month ${sexE})`;
              else if (months >= 12 && months < 18) className = `장견 ${sexK}(12~18 Month ${sexE})`;
              else if (months >= 18 && months < 24) className = `미성견 ${sexK}(18~24 Month ${sexE})`;
              else if (months >= 24) className = `성견 ${sexK}(24~Month ${sexE})`;
              
              const baseName = className.split(' ')[0] + (className.includes('유견') ? ' ' + className.split(' ')[1] : '');
              const baseIdx = ['유견 C', '유견 B', '유견 A', '장견', '미성견', '성견'].indexOf(baseName.trim());
              classIdx = baseIdx * 2 + (d.sex === 'M' ? 1 : 0);
            } else if (isJindoShow) {
              const sexK = d.sex === 'M' ? '수조' : '암조';
              if (months >= 3 && months < 6) className = `자견${sexK}(3~6개월)`;
              else if (months >= 6 && months < 12) className = `유견${sexK}(6~12개월)`;
              else if (months >= 12 && months < 18) className = `장견${sexK}(12~18개월)`;
              else if (months >= 18 && months < 24) className = `미성견${sexK}(18~24개월)`;
              else if (months >= 24) className = `성견${sexK}(24~개월)`;
              
              const baseName = className.split(sexK)[0];
              const baseIdx = ['자견', '유견', '장견', '미성견', '성견'].indexOf(baseName);
              classIdx = baseIdx * 2 + (d.sex === 'M' ? 1 : 0);
            } else {
              if (months >= 3 && months < 6) className = 'BABY(3-6개월)';
              else if (months >= 6 && months < 9) className = 'PUPPY B(6~9개월)';
              else if (months >= 9 && months < 12) className = 'PUPPY A(9~12개월)';
              else if (months >= 12 && months < 18) className = 'JUNIOR(12~18개월)';
              else if (months >= 18 && months < 24) className = 'YOUNG ADULT(18~24개월)';
              else className = 'ADULT(24개월~)';
              if (d.show_title?.includes('CH')) className = 'CHAMPION';
              classIdx = classOrder.indexOf(className.split('(')[0]);
            }

            const breedInfo = breedMap[d.dog_class];
            const groupName = breedInfo ? `그룹: ${breedInfo.groupp}` : (d.groupp ? `그룹: ${d.groupp}` : '그룹: Other');
            const fullBreedName = breedInfo ? `${breedInfo.name}(${breedInfo.kor_name})` : (d.dog_class || 'Other');

            return {
              ...a,
              dogDetail: d,
              group: groupName,
              breed: fullBreedName,
              sex: (d.sex === '1' || d.sex === '수') ? '수' : '암',
              className,
              classIdx
            };
          });

          // 정렬 (셰퍼드/진도는 조별 암수순, 도그쇼는 그룹/견종별)
          if (isShepherdShow || isJindoShow) {
            enriched.sort((a, b) => {
              if (a.classIdx !== b.classIdx) return a.classIdx - b.classIdx;
              if (a.sex !== b.sex) return a.sex === '암' ? -1 : 1;
              return 0;
            });
          } else {
            enriched.sort((a, b) => {
              const gA = groupOrder.findIndex(g => a.group.includes(g));
              const gB = groupOrder.findIndex(g => b.group.includes(g));
              if (gA !== gB) return (gA === -1 ? 999 : gA) - (gB === -1 ? 999 : gB);
              
              if (a.breed !== b.breed) return a.breed.localeCompare(b.breed, 'ko');
              
              // 성별 우선 (암 -> 수)
              if (a.sex !== b.sex) return a.sex === '암' ? -1 : 1;
              
              // 조 순서
              return a.classIdx - b.classIdx;
            });
          }

          // 🚀 4. 최종 카탈로그 조립 (3줄 레이아웃)

          // 🚀 5. ExcelJS를 이용한 리치 카탈로그 생성
          let entryNo = 1;
          const catalogGroups: any[] = [];
          let currentGroup: any = null;
          let currentBreed: any = null;
          let currentClass: any = null;

          enriched.forEach(item => {
            const d = item.dogDetail;
            const groupName = item.group || 'Other';
            const breedName = item.breed || 'Other';
            
            // 조별 명칭 구성 (나이 정보가 없으면 성별만 표시)
            // 🚀 셰퍼드 & 진도는 이미 className에 모든 정보가 포함되어 있음
            const cleanClassName = item.className ? item.className.split('(')[0].trim() : '';
            const className = (isShepherdShow || isJindoShow) ? item.className : (cleanClassName ? `${cleanClassName} ${item.sex}조` : `${item.sex}조`);

            // Group 변경 체크
            if (!currentGroup || currentGroup.groupName !== groupName) {
              currentGroup = { groupName, breeds: [] };
              catalogGroups.push(currentGroup);
              currentBreed = null;
            }

            // Breed 변경 체크
            if (!currentBreed || currentBreed.breedName !== breedName) {
              currentBreed = { breedName, classes: [] };
              currentGroup.breeds.push(currentBreed);
              currentClass = null;
            }

            // Class 변경 체크
            if (!currentClass || currentClass.className !== className) {
              currentClass = { className, entries: [] };
              currentBreed.classes.push(currentClass);
            }

            // 🚀 부모견 정보 매핑 (dog_logic.php의 JOIN 결과 활용)
            const sName = d.sire_name_text || '[정보 없음]';
            const sReg = d.sire_reg_no_text || '-';
            const mName = d.dam_name_text || '[정보 없음]';
            const mReg = d.dam_reg_no_text || '-';

            currentClass.entries.push({
              entryNo: entryNo++,
              dogName: d.fullname || d.name || item.name,
              regNo: d.reg_no || item.pedigree_number,
              birthDate: d.birth && d.birth !== '0000-00-00' ? d.birth : '-',
              sireName: sName,
              sireRegNo: sReg,
              damName: mName,
              damRegNo: mReg,
              // 🚀 번시자(breed_name) 및 소유자(poss_name) 매핑
              breeder: d.breed_name || item.breeder_name || '-',
              owner: d.poss_name || item.owner_name || item.name || '-',
              microchip: d.micro || item.micro_chip || '-'
            });
          });

          const exportType = isShepherdShow ? 'shepherd' : (isJindoShow ? 'jindo' : 'default');
          await exportDogShowCatalog(comp.title, catalogGroups, exportType);
          return; // CSV 다운로드 중단
        }
      } else {
        // 기존 타 종목 처리
        finalData = applicants.map((a: any) => {
          if (isStylistIntl) {
            return {
              '신청날짜': a.created_at || '-',
              '아이디': a.handler_id || '-',
              '이름': a.name || '-',
              '연락처': a.contact || '-',
              '생년월일': a.birthdate || '-',
              '이메일': a.email || '-',
              '주소': a.address || '-',
              '반려견스타일리스트 자격증 번호': a.license_number || '-',
              '소속': a.affiliation || '-',
              '참가유형': a.entry_type || '-',
              '모종': a.dog_breed || '-',
              '종목': a.entry_category || '-',
              '신청 옵션': a.options_summary || '-',
              '참가비': a.total_amount ? `${Number(a.total_amount).toLocaleString()}원` : '0원',
              '입금 상태': a.payment_status || '-'
            };
          }
          if (isStylist) {
            return {
              '신청날짜': a.created_at || '-',
              '이름': a.name || '-',
              '연락처': a.contact || '-',
              '생년월일': a.birthdate || '-',
              '이메일': a.email || '-',
              '주소': a.address || '-',
              '소속': a.affiliation || '-',
              '모종': a.dog_breed || '-',
              '참가유형': a.entry_type || '-',
              '종목': a.entry_category || '-',
              '신청옵션': a.options_summary || '-',
              '참가비': a.total_amount ? `${Number(a.total_amount).toLocaleString()}원` : '0원',
              '학생증 사진': a.student_id_photo || '-',
              '입금 상태': a.payment_status || '-'
            };
          }
          if (isAgility) {
            return {
              '신청날짜': a.created_at || '-',
              '핸들러(ID)': a.handler_id || '-',
              '이름': a.name || '-',
              '연락처': a.contact || '-',
              '종목': a.subject || '-',
              '사이즈': a.size || '-',
              '구분': a.division || '-',
              '견종': a.dog_breed || '-',
              '견명': a.dog_name || '-',
              '출진견 성별': a.dog_gender || '-',
              '발정유무': a.is_heat || '-',
              '견사진': a.dog_photo || '-',
              '학생증 사진': a.student_id_photo || '-',
              '신청옵션': a.options_summary || '-',
              '입금 상태': a.payment_status || '-'
            };
          }
          if (isDiscDog) {
            return {
              '신청날짜': a.created_at || '-',
              '핸들러(ID)': a.handler_id || '-',
              '이름': a.name || '-',
              '이름(영문)': a.name_eng || '-',
              '연락처': a.contact || '-',
              '견명': a.dog_name || '-',
              '견명(영문)': a.dog_name_eng || '-',
              '견종': a.dog_breed || '-',
              '종목': a.subject || '-',
              '팀명 (3명 이상)': a.team_name || '-',
              '학생증사진': a.student_id_photo || '-',
              '신청옵션': a.options_summary || '-',
              '입금 상태': a.payment_status || '-'
            };
          }
          if (isFlyball) {
            return {
              '신청날짜': a.created_at || '-',
              '핸들러(ID)': a.handler_id || '-',
              '이름': a.name || '-',
              '연락처': a.contact || '-',
              '견종': a.dog_breed || '-',
              '견명': a.dog_name || '-',
              '종목': a.subject || '-',
              '신청옵션': a.options_summary || '-',
              '입금 상태': a.payment_status || '-'
            };
          }
          if (isTraining) {
            return {
              '신청날짜': a.created_at || '-',
              '핸들러(ID)': a.handler_id || '-',
              '이름': a.name || '-',
              '연락처': a.contact || '-',
              '종목': a.subject || '-',
              '견종': a.dog_breed || '-',
              '견명': a.dog_name || '-',
              '성별': a.dog_gender || '-',
              '발정유무': a.is_heat || '-',
              '혈통서 번호': a.pedigree_no || '-',
              '구분': a.division || '-',
              '견사진': a.dog_photo || '-',
              '학생증 사진': a.student_id_photo || '-',
              '신청옵션': a.options_summary || '-',
              '입금 상태': a.payment_status || '-'
            };
          }
          if (isSeminar) {
            return {
              '신청날짜': a.created_at || '-',
              '핸들러(ID)': a.handler_id || '-',
              '이름': a.name || '-',
              '연락처': a.contact || '-',
              '생년월일': a.birthdate || '-',
              '이메일': a.email || '-',
              '소속 (직업)': a.affiliation || '-',
              '신청옵션': a.options_summary || '-',
              '입금 상태': a.payment_status || '-'
            };
          }
          if (isBreedComp) {
            return {
              '신청날짜': a.created_at || '-',
              '회원 ID': a.handler_id || '-',
              '이름': a.name || '-',
              '연락처': a.contact || '-',
              '혈통서 번호': a.pedigree_number || '-',
              '신청옵션': a.options_summary || '-',
              '참가비': a.total_amount ? `${Number(a.total_amount).toLocaleString()}원` : '0원',
              '입금상태': a.payment_status || '-'
            };
          }
          return { '핸들러ID': a.handler_id, '이름': a.name, '연락처': a.contact, '혈통번호': a.pedigree_number || a.pedigree_no || '-', '입금상태': a.payment_status, '참가비': a.total_amount, '신청일': a.created_at };
        });
      }

      if (finalData.length === 0) return;

      const headers = Object.keys(finalData[0]);
      const csvContent = [
        headers.join(','),
        ...finalData.map((row: any) => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const safeTitle = (title || '대회_신청자명단').replace(/[\\/:*?"<>|]/g, '_').trim();
      downloadCsv(csvContent, safeTitle);

    } catch (e: any) { showAlert('오류', '다운로드 실패: ' + e.message); }
    finally { setIsLoading(false); }
  };

  if (viewMode === 'form') {
    return (
      <CompetitionCreateForm
        onClose={() => { setViewMode('list'); onClearEditData?.(); }}
        onSave={handleSave}
        initialData={selectedComp}
        defaultCategory={forcedCategory || (activeTab !== '전체' ? activeTab : '도그쇼')}
      />
    );
  }

  if (viewMode === 'applicants' && selectedComp) {
    const idStr = String(selectedComp.id || '');
    const itemCat = selectedComp.category || '';
    // 🛡️ [ROBUST CHECK] 인코딩 문제로 (국제)가 ()로 보일 수 있으므로 유연하게 체크
    const isStylistIntl = idStr.startsWith('st_') && (itemCat.includes('(국제)') || itemCat.includes('()'));
    const isStylist = idStr.startsWith('st_') && !isStylistIntl;
    const isAgility = idStr.startsWith('sp_') && itemCat.includes('어질리티');
    const isDiscDog = idStr.startsWith('sp_') && itemCat.includes('디스크독');
    const isFlyball = idStr.startsWith('sp_') && itemCat.includes('플라이볼');
    const isTraining = idStr.startsWith('sp_') && !isAgility && !isDiscDog && !isFlyball;
    const isSeminar = idStr.startsWith('sm_');
    const isBreedExam = idStr.startsWith('be_');

    if (isSeminar) return <SeminarApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
    if (isBreedExam) return <CompetitionApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} applicantTable="breed_exam_applicant" showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
    if (isStylistIntl) return <StylistIntlApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
    if (isStylist) return <StylistCompetitionApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} />;
    if (isAgility) return <AgilityApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
    if (isDiscDog) return <DiscDogApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
    if (isTraining) return <TrainingApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
    if (isFlyball) return <FlyballApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
    return <CompetitionApplicantManagement competitionId={selectedComp.id} competitionTitle={selectedComp.title} onClose={() => { setViewMode('list'); loadData(currentPage); }} showAlert={showAlert} showConfirm={showConfirm} onGoToMember={onGoToMember} />;
  }

  return (
    <div className="flex flex-col h-full bg-white p-6 font-sans text-gray-800 overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-[24px] font-black tracking-tight">{forcedCategory || '대회 관리'}</h2>
        <button onClick={() => { setSelectedComp(null); setViewMode('form'); }} className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm"><Plus size={14} strokeWidth={3} /> {forcedCategory ? `${forcedCategory} 추가` : '대회 추가'}</button>
      </div>
      {!forcedCategory && (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${activeTab === tab ? 'bg-[#009292] text-white border-[#009292]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{tab}</button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto border-t border-gray-100 relative">
        {isLoading && <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>}
        <table className="w-full text-[13px] border-collapse text-left">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-gray-400 font-bold">
              <th className="py-4 px-4 w-[22%] font-bold">대회명</th>
              <th className="py-4 px-4 w-[11%] font-bold">장소</th>
              <th className="py-4 px-4 w-[11%] font-bold">심사위원</th>
              <th className="py-4 px-4 w-[14%] font-bold">접수기간</th>
              <th className="py-4 px-4 w-[9%] text-center font-bold">접수상태</th>
              <th className="py-4 px-4 w-[11%] font-bold">대회일자</th>
              <th className="py-4 px-4 w-[7%] font-bold">신청자 수</th>
              <th className="py-4 px-4 w-[12%] text-center font-bold">신청자 관리</th>
              <th className="py-4 px-4 w-[7%] text-center font-bold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length > 0 ? data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-5 px-4 font-bold text-gray-800"><button onClick={() => setViewDetailComp(item)} className="hover:text-blue-600 transition-colors text-left">{item.title}</button></td>
                <td className="py-5 px-4 text-gray-600">{item.venue || '-'}</td>
                <td className="py-5 px-4 text-blue-600 font-bold">{item.judges || '-'}</td>
                <td className="py-5 px-4 text-gray-500">{item.reg_start_date ? <div className="flex flex-col"><span>{item.reg_start_date} ({item.reg_start_h}:{item.reg_start_m})</span><span className="text-gray-400 text-[11px]">~ {item.reg_end_date} ({item.reg_end_h}:{item.reg_end_m})</span></div> : '-'}</td>
                <td className="py-5 px-4 text-center whitespace-nowrap">
                  {(() => {
                    const status = getRegistrationStatus(item);
                    return (
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[11px] border rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    );
                  })()}
                </td>
                <td className="py-5 px-4 text-gray-700 font-medium whitespace-nowrap">{item.startDate ? <div className="flex flex-col"><span className="font-bold">{item.startDate} {item.startTime}</span>{item.endDate && item.endDate !== '-' && item.endDate !== item.startDate && <span className="text-gray-400 text-[11px] font-normal">~ {item.endDate} {item.endTime}</span>}</div> : '-'}</td>
                <td className="py-5 px-4 text-gray-600 font-bold">{item.applicant_count || 0}명</td>
                <td className="py-5 px-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelectedComp(item); setViewMode('applicants'); }} className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm">신청자 관리</button>
                    <button onClick={() => handleDownloadApplicants(item)} className="px-3 py-1.5 bg-[#006b3d] text-white rounded text-[11px] font-bold hover:bg-[#005a33] shadow-sm flex items-center gap-1">다운로드</button>
                  </div>
                </td>
                <td className="py-5 px-4">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => { setSelectedComp(item); setViewMode('form'); }} className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50">수정</button>
                    <button onClick={() => handleDelete(item)} className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50">삭제</button>
                  </div>
                </td>
              </tr>
            )) : !isLoading && (
              <tr><td colSpan={9} className="py-40 text-center text-gray-400 italic">등록된 대회 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-center items-center gap-1 border-t border-gray-100 pt-6">
        <button onClick={() => loadData(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30"><ChevronLeft size={20} /></button>
        {(() => {
          const totalPages = Math.ceil(total / 20) || 1;
          const pages = [];
          const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
          const endPage = Math.min(totalPages, startPage + 4);
          for (let i = startPage; i <= endPage; i++) {
            pages.push(<button key={i} onClick={() => loadData(i)} className={`w-8 h-8 flex items-center justify-center rounded font-bold text-[13px] transition-all ${currentPage === i ? 'bg-[#009292] text-white shadow-md scale-110' : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100'}`}>{i}</button>);
          }
          return pages;
        })()}
        <button onClick={() => loadData(currentPage + 1)} disabled={(currentPage * 20) >= total} className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30"><ChevronRight size={20} /></button>
      </div>

      {viewDetailComp && (() => {
        let extra: any = {};
        try { extra = viewDetailComp.ds_etc ? JSON.parse(viewDetailComp.ds_etc) : {}; } catch (err) { }
        return (
          <div className="fixed inset-0 z-[450] bg-black/80 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 lg:p-10 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl bg-white rounded-[24px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh] animate-in zoom-in-95 duration-500">
              <div className="p-5 md:p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4"><span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase">{viewDetailComp.category}</span><h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">대회 상세 정보</h3></div>
                <button onClick={() => setViewDetailComp(null)} className="p-2 md:p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all text-slate-400 hover:text-slate-900"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
                  <div className="lg:col-span-4 space-y-6 md:space-y-8">
                    <div className="rounded-3xl overflow-hidden shadow-xl aspect-square bg-slate-100 relative group">
                      {viewDetailComp.thumbnail_url ? <img src={viewDetailComp.thumbnail_url} className="!w-full !h-full !object-cover" alt={viewDetailComp.title} /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={64} /></div>}
                    </div>
                    <div className="space-y-6">
                      <div className="p-4 md:p-6 bg-slate-50 rounded-[20px] md:rounded-[32px] border border-slate-100 space-y-4 md:space-y-6">
                        <div className="flex items-center gap-4"><div className="p-4 bg-indigo-50 rounded-2xl shadow-sm text-indigo-600"><Clock size={22} strokeWidth={2.5} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">대회 일시</p><p className="text-sm font-black text-slate-800 leading-tight">{viewDetailComp.startDate} {viewDetailComp.startTime && `(${viewDetailComp.startTime})`} <br /> <span className="text-slate-300 mx-auto block my-1">~</span> {viewDetailComp.endDate || viewDetailComp.startDate} {viewDetailComp.endTime && `(${viewDetailComp.endTime})`}</p></div></div>
                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4"><div className="p-3 bg-white rounded-xl shadow-sm text-rose-400"><MapPin size={18} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">장소</p><p className="text-xs font-black text-slate-800">{viewDetailComp.venue || '장소 추후 공지'}</p></div></div>
                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4"><div className="p-3 bg-white rounded-xl shadow-sm text-blue-400"><Building2 size={18} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주최</p><p className="text-xs font-black text-slate-800">{viewDetailComp.organizer || '(사)한국애견협회'}</p></div></div>
                        {viewDetailComp.judges && <div className="flex items-center gap-4 border-t border-slate-100 pt-4"><div className="p-3 bg-white rounded-xl shadow-sm text-amber-500"><Trophy size={18} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">심사위원</p><p className="text-xs font-black text-slate-800">{viewDetailComp.judges}</p></div></div>}
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-8 space-y-6 md:space-y-8">
                    <div className="space-y-4">{viewDetailComp.subtitle && <p className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em]">{viewDetailComp.subtitle}</p>}<h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">{viewDetailComp.title}</h2></div>
                    <div className="prose prose-indigo max-w-none text-slate-600 border-t border-slate-100 pt-6 md:pt-8" dangerouslySetInnerHTML={{ __html: viewDetailComp.content }} />
                  </div>
                </div>
              </div>
              <div className="p-4 md:p-8 border-t bg-slate-50/50 flex justify-end gap-3"><button onClick={() => { const item = viewDetailComp; setViewDetailComp(null); setSelectedComp(item); setViewMode('form'); }} className="px-6 md:px-8 py-3 md:py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest">수정하기</button><button onClick={() => setViewDetailComp(null)} className="px-8 md:px-10 py-3 md:py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-black transition-all shadow-xl uppercase tracking-widest">닫기</button></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
