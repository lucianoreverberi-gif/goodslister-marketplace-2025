import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto, ListingCategory } from '../types';
import { CameraIcon, CheckCircleIcon, MapPinIcon, RefreshCwIcon, XIcon, AlertCircleIcon, ShieldIcon, ChevronRightIcon, ChevronLeftIcon, ZapIcon } from './icons';
import ImageUploader from './ImageUploader';

interface DigitalInspectionProps {
    booking: Booking;
    mode: 'handover' | 'return';
    handoverReferencePhotos?: string[]; 
    onComplete: (photos: InspectionPhoto[], damageReported: boolean) => void;
    onCancel: () => void;
}

const DigitalInspection: React.FC<DigitalInspectionProps> = ({ booking, mode, handoverReferencePhotos, onComplete, onCancel }) => {
    const [step, setStep] = useState(0);
    const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
    const [damageReported, setDamageReported] = useState(false);
    
    // Mínimo 4 fotos requerido
    const angles = [
        { id: 'front', label: 'Front View', desc: 'Capture the main face and lights.' },
        { id: 'right', label: 'Right Side', desc: 'Full profile view.' },
        { id: 'left', label: 'Left Side', desc: 'Full profile view.' },
        { id: 'rear', label: 'Rear/Detailed', desc: 'Back side and critical parts (propeller/engine).' }
    ];

    const currentAngle = angles[step];
    const isLastStep = step === angles.length - 1;

    const handlePhotoUpload = (url: string) => {
        const newPhoto: InspectionPhoto = {
            url,
            angleId: currentAngle.id,
            angleLabel: currentAngle.label,
            timestamp: new Date().toISOString(),
            takenByUserId: 'user'
        };
        const updated = [...photos];
        updated[step] = newPhoto;
        setPhotos(updated);
    };

    const handleNext = () => {
        if (isLastStep) {
            onComplete(photos, damageReported);
        } else {
            setStep(s => s + 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col animate-in fade-in duration-300">
            {/* Camera Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-center border-b border-white/10">
                <div>
                    <h3 className="text-white font-black uppercase text-xs tracking-widest mb-1">{mode === 'handover' ? 'Handover Inspection' : 'Return Comparison'}</h3>
                    <div className="flex gap-1">
                        {angles.map((_, i) => (
                            <div key={i} className={`h-1 w-8 rounded-full transition-all ${i <= step ? 'bg-cyan-500' : 'bg-white/20'}`} />
                        ))}
                    </div>
                </div>
                <button onClick={onCancel} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-all"><XIcon className="h-6 w-6" /></button>
            </div>

            {/* Split View Comparison */}
            <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-black">
                
                {/* Reference Photo (During Return) */}
                {mode === 'return' && handoverReferencePhotos && handoverReferencePhotos[step] && (
                    <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 relative group">
                        <img src={handoverReferencePhotos[step]} className="w-full h-full object-contain opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-slate-900/80 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase border border-white/20">Original State</span>
                        </div>
                    </div>
                )}

                {/* Active Capture Area */}
                <div className="flex-1 relative flex items-center justify-center p-4">
                    {photos[step] ? (
                        <div className="relative w-full h-full animate-in zoom-in-95">
                            <img src={photos[step].url} className="w-full h-full object-contain rounded-2xl" />
                            <button 
                                onClick={() => { const u = [...photos]; u[step] = null as any; setPhotos(u.filter(Boolean)); }}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                            >
                                <RefreshCwIcon className="h-4 w-4" /> RETAKE
                            </button>
                        </div>
                    ) : (
                        <div className="text-center max-w-sm w-full">
                            <div className="bg-cyan-500/10 p-4 rounded-3xl mb-6 inline-block">
                                <CameraIcon className="h-10 w-10 text-cyan-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">{currentAngle.label}</h2>
                            <p className="text-slate-400 text-sm mb-10">{currentAngle.desc}</p>
                            
                            <div className="bg-white/5 border border-white/10 p-2 rounded-3xl">
                                <ImageUploader label="" currentImageUrl="" onImageChange={handlePhotoUpload} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Footer */}
            <div className="bg-slate-900 p-8 border-t border-white/10 flex items-center justify-between">
                <button 
                    onClick={() => setStep(s => Math.max(0, s-1))}
                    disabled={step === 0}
                    className="text-slate-500 font-bold hover:text-white disabled:opacity-0 transition-all"
                >
                    BACK
                </button>
                
                {mode === 'return' && photos[step] && (
                    <div className="flex gap-4">
                        <button 
                            onClick={() => { setDamageReported(false); handleNext(); }}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                        >
                            NO DAMAGE
                        </button>
                        <button 
                            onClick={() => { setDamageReported(true); handleNext(); }}
                            className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                        >
                            DETECTED ISSUE
                        </button>
                    </div>
                )}

                {mode === 'handover' && (
                    <button 
                        onClick={handleNext}
                        disabled={!photos[step]}
                        className="bg-cyan-600 text-white px-10 py-3 rounded-2xl font-black shadow-lg shadow-cyan-900/20 disabled:opacity-20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {isLastStep ? 'FINISH' : 'NEXT'} <ChevronRightIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DigitalInspection;