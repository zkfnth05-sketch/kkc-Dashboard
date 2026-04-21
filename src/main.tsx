import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * 🚀 KKC INTEGRATED SYSTEM - SINGLETON RESPONSIVE MOUNTER
 * PC/모바일 중복 출력을 방지하기 위해 단 하나의 컨테이너에만 마운트합니다.
 */
const mountApp = () => {
    // 🛡️ [SINGLETON GUARD] 
    if ((window as any).__KKC_MOUNTED__) return;

    const containers = document.querySelectorAll('.kkf-system-root, #root');
    if (containers.length === 0) return;

    // 1. 현재 화면에 보이는(display !== none) 컨테이너를 우선 탐색
    let target = Array.from(containers).find(c => {
        const style = window.getComputedStyle(c);
        return style.display !== 'none';
    }) || containers[0];

    if (target) {
        (window as any).__KKC_MOUNTED__ = true;
        console.log("🚀 Mounting KKC System on:", target);
        
        try {
            const root = ReactDOM.createRoot(target);
            root.render(<React.StrictMode><App /></React.StrictMode>);
        } catch (e) {
            console.error("Mounting error:", e);
        }
    }
};

// 🛡️ [DOUBLE EXECUTION GUARD]
if (!(window as any).__KKC_INITIALIZED__) {
    (window as any).__KKC_INITIALIZED__ = true;
    
    // 즉시 실행 및 DOM 완료 시 재확인
    mountApp();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountApp);
    }
}