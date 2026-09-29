import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';

interface PaymentLayerModalProps {
    isOpen: boolean;
    payUrl: string | null;
    title?: string;
    onClose: () => void;
    onSuccess: (type?: string) => void;
    onFail?: (message: string) => void;
}

/**
 * 💳 [KG모빌리언스 전용 화면 내 결제 레이어 모달]
 * 브라우저 팝업 차단을 원천 방지하고 모바일/PC 모두에서 끊김 없는 결제 경험을 제공합니다.
 */
export const PaymentLayerModal: React.FC<PaymentLayerModalProps> = ({
    isOpen,
    payUrl,
    title = 'KG모빌리언스 안전 결제',
    onClose,
    onSuccess,
    onFail
}) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !payUrl) {
            setIsLoading(true);
            return;
        }

        const handlePaymentMessage = (event: MessageEvent) => {
            // 결제 완료 또는 실패 메시지 수신
            const data = event.data;
            if (data && typeof data === 'object' && data.status) {
                console.log('📥 [PaymentLayerModal] Payment Message Received:', data);
                if (data.status === 'success') {
                    onSuccess(data.type);
                } else {
                    const failMsg = data.message || '결제가 취소되었거나 정상 완료되지 않았습니다.';
                    if (onFail) {
                        onFail(failMsg);
                    } else {
                        alert(failMsg);
                    }
                    onClose();
                }
            }
        };

        window.addEventListener('message', handlePaymentMessage);
        return () => {
            window.removeEventListener('message', handlePaymentMessage);
        };
    }, [isOpen, payUrl, onSuccess, onFail, onClose]);

    if (!isOpen || !payUrl) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* Overlay Background */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Box */}
            <div 
                className="relative bg-white w-full h-full md:h-[700px] md:max-w-xl md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight text-white">{title}</h3>
                            <p className="text-[11px] font-bold text-slate-400">KG모빌리언스 암호화 보안 결제</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="결제 취소 / 창 닫기"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body / Iframe Area */}
                <div className="relative flex-1 w-full h-full bg-slate-50">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 z-20">
                            <Loader2 className="animate-spin text-orange-500" size={36} />
                            <p className="text-xs font-bold text-slate-600">보안 결제 모듈을 불러오는 중입니다...</p>
                        </div>
                    )}
                    <iframe
                        src={payUrl}
                        title="KG Mobilians Payment"
                        className="w-full h-full border-0"
                        onLoad={() => setIsLoading(false)}
                        allow="payment *"
                    />
                </div>
            </div>
        </div>
    );
};
