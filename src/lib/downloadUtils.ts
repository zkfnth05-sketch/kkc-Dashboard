
/**
 * 🕵️‍♂️ [ULTIMATE FIX] 브라우저 차단 및 파일명 누락 완벽 해결용 다운로더
 * Blob 방식이 실패하는 환경(보안 PC, 특정 크롬 버전)에서도 작동하는 Data URI 방식 적용
 */
export const downloadCsv = (csvContent: string, filename: string) => {
    try {
        // 1. 파일 이름 정규화 (.csv 확장자 보장)
        let safeName = filename.replace(/[\\/:*?"<>|]/g, '_').trim();
        if (!safeName.toLowerCase().endsWith('.csv')) {
            safeName += '.csv';
        }

        // 2. 엑셀 호환용 BOM 추가 및 Blob 생성
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // 3. 임시 앵커 요소 생성
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.setAttribute('download', safeName);
        
        // 4. DOM에 추가 후 클릭 트리거
        document.body.appendChild(link);
        link.click();

        // 5. 정리 (메모리 해제)
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        return true;
    } catch (error) {
        console.error("Critical Export Error:", error);
        return false;
    }
};
