import React, { useRef, useState } from 'react';
import { Upload, ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { Member } from '../types';
import { downloadCsv } from '../lib/downloadUtils';

interface MemberExcelUploadPageProps {
    onClose: () => void;
    onUpload: (members: Partial<Member>[]) => void;
}

export const MemberExcelUploadPage: React.FC<MemberExcelUploadPageProps> = ({ onClose, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<Partial<Member>[] | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleDownloadTemplate = () => {
        const headers = [
            '아이디', '회원번호', '이름', '생년월일(YYMMDD)', '가입일(YYYY-MM-DD)', '이름(영문)',
            '우편번호', '주소', '상세주소', 'DM우편번호', 'DM주소', 'DM상세주소',
            '연락처', '핸드폰', '이메일', '등급(예:B0)', '프로클래스', '메모',
            '만료일(YYYY-MM-DD)', '견사호', '견사호(영문)', '견사호등록번호', '견사호등록일'
        ];
        // Add dummy row
        const dummyrow = [
            'user_01', '', '홍길동', '800101', '2023-01-01', 'Hong Gil Dong',
            '01234', '서울시 강남구 테헤란로', '123-45', '', '', '',
            '02-1234-5678', '010-1234-5678', 'hong@test.com', 'B0', '', '',
            '', '', '', '', ''
        ];

        downloadCsv(headers.join(',') + '\n' + dummyrow.join(','), '회원대량가입_템플릿.csv');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMsg(null);
        setParsedData(null);
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFileName(null);
            return;
        }

        setSelectedFileName(file.name);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const members = results.data.map((row: any) => {
                        // Validate required
                        const loginId = row['아이디']?.trim();
                        const name = row['이름']?.trim() || row['성명(한글)']?.trim(); // Fallback to either
                        const birth = row['생년월일(YYMMDD)']?.trim() || row['생년월일']?.trim();
                        const joinDate = row['가입일(YYYY-MM-DD)']?.trim() || row['가입일']?.trim();

                        if (!loginId) throw new Error("아이디가 누락된 행이 있습니다.");
                        if (!name) throw new Error(`${loginId} 회원의 이름(성명)이 누락되었습니다.`);
                        if (!joinDate) throw new Error(`${loginId} 회원의 가입일이 누락되었습니다.`);

                        return {
                            loginId: loginId,
                            mem_no: row['회원번호'] || '',
                            name: name,
                            birth: birth || '',
                            joinDate: joinDate,
                            name_eng: row['이름(영문)'] || '',
                            zipcode: row['우편번호'] || '',
                            addr: row['주소'] || '',
                            addr1: row['상세주소'] || '',
                            zipcode_dm: row['DM우편번호'] || '',
                            addr_dm: row['DM주소'] || '',
                            addr1_dm: row['DM상세주소'] || '',
                            tel: row['연락처'] || '',
                            hp: row['핸드폰'] || row['휴대폰'] || '',
                            email: row['이메일'] || '',
                            rank: row['등급(예:B0)'] || 'B0',
                            proClass: row['프로클래스'] || '',
                            memo: row['메모'] || '',
                            expiryDate: row['만료일(YYYY-MM-DD)'] || '',
                            saho: row['견사호'] || '',
                            saho_eng: row['견사호(영문)'] || '',
                            saho_no: row['견사호등록번호'] || '',
                            saho_date: row['견사호등록일'] || ''
                        };
                    });

                    if (members.length === 0) {
                        setErrorMsg("데이터가 비어있습니다.");
                        return;
                    }

                    setParsedData(members);
                } catch (err: any) {
                    setErrorMsg(err.message);
                }
            },
            error: (error: any) => {
                setErrorMsg('엑셀 파일 읽기 실패: ' + error.message);
            }
        });
    };

    const handleSubmit = () => {
        if (parsedData && parsedData.length > 0) {
            onUpload(parsedData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50" style={{ top: '64px' }}>
            <div className="flex-1 overflow-y-auto p-10">
                <div className="max-w-[800px] mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">엑셀 대량 가입</h2>
                        <button
                            onClick={onClose}
                            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 font-medium rounded transition-colors"
                        >
                            뒤로 가기
                        </button>
                    </div>

                    <div className="bg-white rounded border border-gray-200 shadow-sm p-8 mb-6 relative">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">엑셀 파일 업로드</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            엑셀(.csv) 파일을 업로드하여 회원을 대량으로 등록할 수 있습니다.<br />
                            ※ 지원하는 파일 형식: .csv
                        </p>

                        <button
                            onClick={handleDownloadTemplate}
                            className="absolute top-8 right-8 text-sm bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded font-medium hover:bg-blue-100 transition flex items-center gap-2"
                        >
                            <Download size={16} /> 엑셀 양식 다운로드
                        </button>

                        <div className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors ${parsedData ? 'border-green-300 bg-green-50' : errorMsg ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded font-bold transition-colors shadow-sm mb-4 flex items-center gap-2"
                            >
                                <FileText size={18} /> 파일 선택
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {!selectedFileName ? (
                                <p className="text-gray-500 text-sm">선택된 파일이 없습니다.</p>
                            ) : (
                                <div className="text-center">
                                    <p className="font-bold text-gray-800 mb-1">{selectedFileName}</p>
                                    {parsedData && <p className="text-green-600 text-sm font-medium flex items-center justify-center gap-1"><CheckCircle2 size={16} /> 총 {parsedData.length}건 데이터 로드 완료</p>}
                                    {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}
                                </div>
                            )}
                        </div>

                        {parsedData && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={handleSubmit}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded text-lg font-bold transition-colors shadow-md"
                                >
                                    {parsedData.length}명 대량 등록 시작하기
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-100 rounded border border-gray-200 p-8 shadow-inner">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">엑셀 파일 양식 안내</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            엑셀 파일의 첫 번째 행에는 반드시 다음과 같은 컬럼 헤더가 포함되어야 합니다:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 ml-2 font-medium">
                            <li>아이디 <span className="text-red-500">(필수)</span> - (중복불가, 영문/숫자)</li>
                            <li>이름 <span className="text-red-500">(필수)</span> - (한글 성명)</li>
                            <li>생년월일 <span className="text-red-500">(필수)</span> - (예: 800101)</li>
                            <li>가입일 <span className="text-red-500">(필수)</span> - (예: 2023-01-01)</li>
                            <li>핸드폰 <span className="text-gray-400 font-normal">(선택)</span></li>
                            <li>주소 <span className="text-gray-400 font-normal">(선택)</span></li>
                            <li>이메일 <span className="text-gray-400 font-normal">(선택)</span></li>
                            <li>등급(예:B0) <span className="text-gray-400 font-normal">(선택)</span> - (입력안할시 기본 '준회원(B0)' 처리)</li>
                        </ul>
                        <p className="text-gray-500 mt-6 text-xs">
                            ※ 필수 항목이 누락된 행이 있을 경우 오류가 발생할 수 있습니다. 템플릿을 다운로드하여 양식에 맞춰 업로드해주세요.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
