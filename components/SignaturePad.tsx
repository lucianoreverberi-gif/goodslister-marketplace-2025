import React, { useRef, useEffect, useState } from 'react';
import { RefreshCwIcon } from './icons';

interface SignaturePadProps {
    onChange: (dataUrl: string | null) => void;
    label?: string;
    height?: number;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onChange, label = 'Sign here', height = 180 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = canvasRef.current!.getContext('2d');
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const move = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current!.getContext('2d');
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const end = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setHasSignature(true);
        const dataUrl = canvasRef.current!.toDataURL('image/png');
        onChange(dataUrl);
    };

    const clear = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onChange(null);
    };

    return (
        <div className="w-full">
            {label && <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{label}</p>}
            <div className="relative bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: `${height}px`, touchAction: 'none' }}
                    className="cursor-crosshair"
                    onMouseDown={start}
                    onMouseMove={move}
                    onMouseUp={end}
                    onMouseLeave={end}
                    onTouchStart={start}
                    onTouchMove={move}
                    onTouchEnd={end}
                />
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-slate-300 font-medium italic">Draw your signature</span>
                    </div>
                )}
                <div className="absolute top-1/2 left-6 right-6 border-t border-dashed border-slate-200 pointer-events-none" style={{ top: 'auto', bottom: '30px' }} />
            </div>
            <div className="flex justify-between mt-2">
                <button
                    type="button"
                    onClick={clear}
                    disabled={!hasSignature}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-40 flex items-center gap-1"
                >
                    <RefreshCwIcon className="h-3 w-3" /> Clear signature
                </button>
                {hasSignature && <span className="text-xs font-bold text-emerald-600">✓ Signed</span>}
            </div>
        </div>
    );
};

export default SignaturePad;
