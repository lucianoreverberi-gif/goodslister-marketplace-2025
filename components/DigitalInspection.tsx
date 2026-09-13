import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto, ListingCategory } from '../types';
import { CameraIcon, CheckCircleIcon, MapPinIcon, RefreshCwIcon, XIcon, AlertCircleIcon, ShieldIcon, ChevronRightIcon, ChevronLeftIcon, ZapIcon } from './icons';
import ImageUploader from './ImageUploader';
import CameraCapture from './CameraCapture';

interface DigitalInspectionProps {
    booking: Booking;
    mode: 'handover' | 'return';
    handoverReferencePhotos?: string[]; 
    onComplete: (photos: InspectionPhoto[], damageReported: boolean) => void;
    onCancel: () => void;
}

const CATEGORY_INSPECTION_CONFIG: Partial<Record<ListingCategory, { id: string; label: string; desc: string; checklist: string[] }[]>> = {
    [ListingCategory.BOATS]: [
        { id: 'front', label: 'Bow & Hull', desc: 'Check for cracks or impact marks on the front hull.', checklist: ['No hull cracks', 'Anchor present', 'Navigation lights work'] },
        { id: 'right', label: 'Starboard Side', desc: 'Full profile of the right side.', checklist: ['Fenders in place', 'No dock rash', 'Rub rail intact'] },
        { id: 'left', label: 'Port Side', desc: 'Full profile of the left side.', checklist: ['Fenders in place', 'No dock rash', 'Rub rail intact'] },
        { id: 'rear', label: 'Stern & Propeller', desc: 'CRITICAL: Check the propeller and engine mount.', checklist: ['Propeller blades intact', 'No fishing line in hub', 'Engine tilt works', 'Drain plug in place'] }
    ],
    [ListingCategory.WATER_SPORTS]: [
        { id: 'front', label: 'Front & Intake', desc: 'Check the front hull and intake grate.', checklist: ['Intake grate clear', 'No hull damage', 'Storage bin closed'] },
        { id: 'right', label: 'Right Side', desc: 'Full profile view.', checklist: ['Sponsons intact', 'No deep scratches'] },
        { id: 'left', label: 'Left Side', desc: 'Full profile view.', checklist: ['Sponsons intact', 'No deep scratches'] },
        { id: 'rear', label: 'Jet Pump & Reboarding', desc: 'Check the nozzle and reboarding step.', checklist: ['Jet nozzle moves freely', 'Reboarding step works', 'Lanyard present'] }
    ],
    [ListingCategory.RVS]: [
        { id: 'front', label: 'Front & Cab', desc: 'Check windshield and front cap.', checklist: ['No windshield chips', 'Front cap intact', 'Wipers functional'] },
        { id: 'right', label: 'Passenger Side', desc: 'Check awning and storage doors.', checklist: ['Awning fabric intact', 'Storage doors lock', 'Tires condition'] },
        { id: 'left', label: 'Driver Side', desc: 'Check utility connections.', checklist: ['Slide-out seals ok', 'Utility ports intact', 'Tires condition'] },
        { id: 'rear', label: 'Rear & Roof', desc: 'Check ladder and roof seals.', checklist: ['Ladder secure', 'Roof seals intact', 'Rear camera works'] }
    ],
    [ListingCategory.MOTORCYCLES]: [
        { id: 'front', label: 'Front Fork & Brakes', desc: 'Check forks, brakes, and tire.', checklist: ['No fork leaks', 'Brake pads ok', 'Tire tread good'] },
        { id: 'right', label: 'Right Side', desc: 'Check exhaust and footpegs.', checklist: ['Exhaust secure', 'Footpegs intact', 'No oil leaks'] },
        { id: 'left', label: 'Left Side', desc: 'Check chain/belt and shifter.', checklist: ['Chain tension ok', 'Shifter moves freely', 'Kickstand secure'] },
        { id: 'rear', label: 'Rear Wheel & Lights', desc: 'Check rear tire and signals.', checklist: ['Signals work', 'Brake light works', 'Tire tread good'] }
    ]
};

const DigitalInspection: React.FC<DigitalInspectionProps> = ({ booking, mode, handoverReferencePhotos, onComplete, onCancel }) => {
    const [step, setStep] = useState(0);
    const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
    const [damageReported, setDamageReported] = useState(false);
    // Extra optional photos captured after the 4 required angles
    // (odometer, fuel gauge, close-up damage, extra angles). Merged into
    // the photos array on FINISH, capped at 10 total by the API.
    const [extras, setExtras] = useState<InspectionPhoto[]>([]);
    const [capturingExtra, setCapturingExtra] = useState(false);
    
    const category = booking.listing.category;
    const angles = CATEGORY_INSPECTION_CONFIG[category] || [
        { id: 'front', label: 'Front View', desc: 'Capture the main face and lights.', checklist: ['No visible cracks', 'Lights intact'] },
        { id: 'right', label: 'Right Side', desc: 'Full profile view.', checklist: ['No scratches', 'Tires/Wheels ok'] },
        { id: 'left', label: 'Left Side', desc: 'Full profile view.', checklist: ['No scratches', 'Tires/Wheels ok'] },
        { id: 'rear', label: 'Rear/Detailed', desc: 'Back side and critical parts.', checklist: ['Engine/Exhaust ok', 'Rear lights work'] }
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

    const handleExtraPhoto = (url: string) => {
        const newPhoto: InspectionPhoto = {
            url,
            angleId: 'extra_' + (extras.length + 1),
            category,
            capturedAt: Date.now(),
            takenByUserId: 'user'
        };
        setExtras(prev => [...prev, newPhoto]);
        setCapturingExtra(false);
    };
    const removeExtra = (idx: number) => {
        setExtras(prev => prev.filter((_, i) => i !== idx));
    };

    const handleNext = () => {
        if (isLastStep) {
            const allPhotos = [...photos, ...extras].slice(0, 10);
            onComplete(allPhotos, damageReported);
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
            <div className="flex-1 flex flex-col md:flex-row relative overflow-y-auto md:overflow-hidden bg-black">
                
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
                <div className="flex-1 relative flex md:items-center justify-center p-4 pb-32 md:pb-4 md:overflow-y-auto">
                    {capturingExtra ? (
                        <div className="text-center max-w-sm w-full">
                            <div className="bg-amber-500/10 p-4 rounded-3xl mb-6 inline-block">
                                <CameraIcon className="h-10 w-10 text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">Extra photo</h2>
                            <p className="text-slate-400 text-sm mb-6">Odometer, fuel gauge, extra angle, or a close-up of something worth documenting.</p>
                            <div className="bg-white/5 border border-white/10 p-2 rounded-3xl mb-4">
                                <CameraCapture
                                    label=""
                                    aspectRatio="video"
                                    onCapture={handleExtraPhoto}
                                    bookingId={booking.id}
                                    photoType={mode}
                                    angleId={'extra_' + (extras.length + 1)}
                                    angleLabel={'Extra ' + (extras.length + 1)}
                                    folder={`inspections/${booking.id}`}
                                />
                            </div>
                            <button onClick={() => setCapturingExtra(false)} className="text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
                        </div>
                    ) : photos[step] ? (
                        <div className="relative w-full h-full animate-in zoom-in-95 flex flex-col">
                            <div className="relative flex-1 min-h-0">
                                <img src={photos[step].url} className="w-full h-full object-contain rounded-2xl" />
                                <button 
                                    onClick={() => { const u = [...photos]; u[step] = null as any; setPhotos(u.filter(Boolean)); }}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                                >
                                    <RefreshCwIcon className="h-4 w-4" /> RETAKE
                                </button>
                            </div>
                            {photos.filter(Boolean).length > 0 && (
                                <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            {isLastStep ? (
                                                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircleIcon className="h-3 w-3" /> 4 required photos done
                                                </div>
                                            ) : (
                                                <div className="text-amber-300 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                                    <CameraIcon className="h-3 w-3" /> Extras (optional, any time)
                                                </div>
                                            )}
                                            <p className="text-slate-400 text-[11px] mt-1">Add extras (optional): odometer &middot; fuel gauge &middot; damage close-up &middot; extra angles</p>
                                        </div>
                                        {extras.length + 4 < 10 && (
                                            <button
                                                onClick={() => setCapturingExtra(true)}
                                                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-xs uppercase px-4 py-2 rounded-xl flex items-center gap-1 whitespace-nowrap"
                                            >
                                                + Add extra
                                            </button>
                                        )}
                                    </div>
                                    {extras.length > 0 && (
                                        <div className="grid grid-cols-6 gap-2 mt-3">
                                            {extras.map((p, idx) => (
                                                <div key={idx} className="relative aspect-square">
                                                    <img src={p.url} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    <button
                                                        onClick={() => removeExtra(idx)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {extras.length + 4 >= 10 && (
                                        <p className="text-amber-300 text-[10px] mt-2 font-bold">Maximum 10 photos reached</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center max-w-sm w-full">
                            <div className="bg-cyan-500/10 p-4 rounded-3xl mb-6 inline-block">
                                <CameraIcon className="h-10 w-10 text-cyan-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">{currentAngle.label}</h2>
                            <p className="text-slate-400 text-sm mb-6">{currentAngle.desc}</p>
                            
                            {/* Expert Checklist */}
                            <div className="mb-10 bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                                <h4 className="text-cyan-500 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ZapIcon className="h-3 w-3" /> Expert Checklist
                                </h4>
                                <ul className="space-y-2">
                                    {currentAngle.checklist.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                            <CheckCircleIcon className="h-3 w-3 text-emerald-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-2 rounded-3xl">
                                <CameraCapture
                                    label=""
                                    aspectRatio="video"
                                    onCapture={handlePhotoUpload}
                                    bookingId={booking.id}
                                    photoType={mode}
                                    angleId={currentAngle.id}
                                    angleLabel={currentAngle.label}
                                    folder={`inspections/${booking.id}`}
                                />
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
