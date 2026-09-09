import React from 'react';
import { XIcon, AlertTriangleIcon, CheckCircleIcon, AlertCircleIcon } from './icons';

type ConfirmVariant = 'danger' | 'warning' | 'primary' | 'success';

interface ConfirmActionModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    icon?: React.ReactNode;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
    isProcessing?: boolean;
}

const variantStyles: Record<ConfirmVariant, {
    iconBg: string;
    iconColor: string;
    button: string;
    accent: string;
}> = {
    danger: {
        iconBg: 'bg-rose-50 border-rose-200',
        iconColor: 'text-rose-600',
        button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100',
        accent: 'bg-gradient-to-b from-rose-50/50 to-white',
    },
    warning: {
        iconBg: 'bg-amber-50 border-amber-200',
        iconColor: 'text-amber-600',
        button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-100',
        accent: 'bg-gradient-to-b from-amber-50/50 to-white',
    },
    primary: {
        iconBg: 'bg-cyan-50 border-cyan-200',
        iconColor: 'text-cyan-600',
        button: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-100',
        accent: 'bg-gradient-to-b from-cyan-50/50 to-white',
    },
    success: {
        iconBg: 'bg-emerald-50 border-emerald-200',
        iconColor: 'text-emerald-600',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100',
        accent: 'bg-gradient-to-b from-emerald-50/50 to-white',
    },
};

const defaultIcon: Record<ConfirmVariant, React.ReactNode> = {
    danger: <AlertTriangleIcon className="h-6 w-6" />,
    warning: <AlertCircleIcon className="h-6 w-6" />,
    primary: <AlertCircleIcon className="h-6 w-6" />,
    success: <CheckCircleIcon className="h-6 w-6" />,
};

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    icon,
    onConfirm,
    onClose,
    isProcessing = false,
}) => {
    const styles = variantStyles[variant];
    const iconEl = icon || defaultIcon[variant];

    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 ${styles.accent}`}>
                <div className="flex items-start justify-between p-6 pb-4">
                    <div className={`h-14 w-14 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 ${styles.iconBg} ${styles.iconColor}`}>
                        {iconEl}
                    </div>
                    <button onClick={onClose} disabled={isProcessing} className="text-slate-400 hover:text-slate-900 disabled:opacity-40">
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <h2 className="text-xl font-black text-slate-900 mb-2">{title}</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-sm rounded-xl transition-colors disabled:opacity-40"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className={`px-6 py-2.5 font-black text-sm rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}
                    >
                        {isProcessing ? 'Working...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmActionModal;
