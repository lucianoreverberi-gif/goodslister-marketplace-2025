import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircleIcon, XIcon, AlertTriangleIcon } from './icons';

// Toast system for global user feedback
// Usage:
//   const { toast } = useToast();
//   toast.success('Booking confirmed!');
//   toast.error('Payment failed. Try again.');
//   toast.info('Uploading photos...');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: number;
    type: ToastType;
    message: string;
    duration?: number; // ms, default 4000
}

interface ToastContextType {
    toasts: ToastMessage[];
    toast: {
        success: (message: string, duration?: number) => void;
        error: (message: string, duration?: number) => void;
        info: (message: string, duration?: number) => void;
        warning: (message: string, duration?: number) => void;
    };
    dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Graceful fallback if provider not mounted - log to console
        return {
            toasts: [],
            toast: {
                success: (m: string) => console.log('[toast.success]', m),
                error: (m: string) => console.error('[toast.error]', m),
                info: (m: string) => console.log('[toast.info]', m),
                warning: (m: string) => console.warn('[toast.warning]', m),
            },
            dismiss: () => {},
        };
    }
    return ctx;
};

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration: number = 4000) => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, type, message, duration }]);
        if (duration > 0) {
            setTimeout(() => dismiss(id), duration);
        }
    }, [dismiss]);

    const toast = {
        success: (m: string, d?: number) => addToast('success', m, d),
        error: (m: string, d?: number) => addToast('error', m, d ?? 6000), // errors linger longer
        info: (m: string, d?: number) => addToast('info', m, d),
        warning: (m: string, d?: number) => addToast('warning', m, d ?? 5000),
    };

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, dismiss } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Enter animation
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    const config = {
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> },
        error: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: <XIcon className="h-5 w-5 text-rose-600" /> },
        info: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', icon: <CheckCircleIcon className="h-5 w-5 text-cyan-600" /> },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: <AlertTriangleIcon className="h-5 w-5 text-amber-600" /> },
    }[toast.type];

    return (
        <div
            className={`${config.bg} ${config.border} ${config.text} border-2 rounded-2xl shadow-lg p-4 pr-3 flex items-start gap-3 pointer-events-auto transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
            <div className="flex-1 text-sm font-bold leading-snug">{toast.message}</div>
            <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Dismiss notification"
            >
                <XIcon className="h-4 w-4 opacity-60" />
            </button>
        </div>
    );
};

export default ToastProvider;
