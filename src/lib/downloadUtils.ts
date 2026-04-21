
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

        // 2. 엑셀 호환용 BOM 추가 및 인코딩
        const BOM = '\uFEFF';
        const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(BOM + csvContent);

        // 3. 임시 앵커 요소 생성
        const link = document.createElement('a');
        link.style.display = 'none';
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', safeName);
        
        // 4. DOM에 추가 (이 과정이 있어야 일부 브라우저에서 차단 안 됨)
        document.body.appendChild(link);
        
        // 5. 클릭 트리거
        link.click();

        // 6. 즉각적인 정리
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 500);

        return true;
    } catch (error) {
        console.error("Critical Export Error:", error);
        // 최후의 수단: 새 창으로 열기 (수동 저장 유도)
        const BOM = '\uFEFF';
        window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(BOM + csvContent));
        return false;
    }
};
