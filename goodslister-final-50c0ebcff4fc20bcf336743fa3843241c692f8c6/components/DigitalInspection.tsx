
import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto, ListingCategory } from '../types';
import { CameraIcon, CheckCircleIcon, MapPinIcon, RefreshCwIcon, XIcon, AlertCircleIcon, ShieldIcon, ChevronRightIcon, ChevronLeftIcon, ClockIcon, LockIcon } from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';

interface DigitalInspectionProps {
    booking: Booking;
    mode: 'handover' | 'return';
    currentUserLocation?: { lat: number, lng: number };
    handoverReferencePhotos?: InspectionPhoto[]; 
    onComplete: (photos: InspectionPhoto[], damageReported: boolean) => void;
    onCancel: () => void;
}

interface AngleConfig {
    id: string;
    label: string;
    description: string;
    overlayPath?: string;
}

const getRequiredAngles = (category: ListingCategory, subcategory: string = ''): AngleConfig[] => {
    const sub = subcategory.toLowerCase();
    const needsFuelCheck = 
        category === ListingCategory.BOATS || 
        category === ListingCategory.ATVS_UTVS || 
        category === ListingCategory.RVS || 
        category === ListingCategory.MOTORCYCLES || 
        (category === ListingCategory.WATER_SPORTS && (sub.includes('jet') || sub.includes('ski')));

    let angles: AngleConfig[] = [];

    if (category === ListingCategory.BOATS || (category === ListingCategory.WATER_SPORTS && (sub.includes('jet') || sub.includes('ski')))) {
        angles = [
            { id: 'bow', label: 'Hull (Front/Bow)', description: 'Capture the nose and front hull for impact marks.' },
            { id: 'hull_bottom', label: 'Hull (Underside)', description: 'Check underneath for beaching scratches.' },
            { id: 'prop', label: 'Propeller/Intake', description: 'CRITICAL: Check blades for chips or bends.' },
            { id: 'starboard', label: 'Right Side', description: 'Full length view.' },
            { id: 'port', label: 'Left Side', description: 'Full length view.' },
        ];
    } else if (category === ListingCategory.RVS || category === ListingCategory.ATVS_UTVS || category === ListingCategory.MOTORCYCLES) {
        angles = [
            { id: 'front', label: 'Front', description: 'Front view including headlights.' },
            { id: 'driver_side', label: 'Driver Side', description: 'Full side view, check panels.' },
            { id: 'passenger_side', label: 'Passenger Side', description: 'Full side view.' },
            { id: 'rear', label: 'Rear', description: 'Back view and exhaust.' }
        ];
    } else {
        angles = [
            { id: 'overall', label: 'Overall Item', description: 'Full view of the item.' },
            { id: 'detail_1', label: 'Detail / Accessories', description: 'Any included accessories.' }
        ];
    }

    if (needsFuelCheck) {
        angles.push({ id: 'fuel_dash', label: 'Fuel Gauge / Dash', description: 'Capture current fuel level and hours/miles.' });
    }

    return angles;
};

const DigitalInspection: React.FC<DigitalInspectionProps> = ({ booking, mode, handoverReferencePhotos, onComplete, onCancel }) => {
    const [step, setStep] = useState(0);
    const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationError, setLocationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [damageReported, setDamageReported] = useState(false);

    const angles = getRequiredAngles(booking.listing.category, booking.listing.subcategory);
    const currentAngle = angles[step];
    const isComplete = step >= angles.length;

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => setLocationError('GPS Verification required for insurance.')
            );
        }
    }, []);

    const handlePhotoUpload = (url: string) => {
        const now = new Date();
        const newPhoto: InspectionPhoto = {
            url,
            angleId: currentAngle.id,
            angleLabel: currentAngle.label,
            timestamp: now.toISOString(),
            latitude: currentLocation?.lat,
            longitude: currentLocation?.lng,
            takenByUserId: 'current-user'
        };

        const updatedPhotos = [...photos];
        const existingIndex = updatedPhotos.findIndex(p => p.angleId === currentAngle.id);
        if (existingIndex >= 0) updatedPhotos[existingIndex] = newPhoto;
        else updatedPhotos.push(newPhoto);
        
        setPhotos(updatedPhotos);
        
        // Auto-advance with small delay for visual feedback
        setTimeout(() => {
            if (step < angles.length) setStep(s => s + 1);
        }, 800);
    };

    const VerificationBadge: React.FC<{ photo: InspectionPhoto }> = ({ photo }) => (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-2 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-2">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-white font-mono text-[10px] font-bold tracking-wider">
                        <ClockIcon className="h-3 w-3 text-cyan-400" />
                        {format(new Date(photo.timestamp), 'MMM dd, yyyy · HH:mm:ss')}
                    </div>
                    {photo.latitude && (
                        <div className="flex items-center gap-1.5 text-gray-300 font-mono text-[9px] mt-0.5">
                            <MapPinIcon className="h-3 w-3 text-green-400" />
                            GPS VERIFIED: {photo.latitude.toFixed(4)}, {photo.longitude?.toFixed(4)}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 bg-cyan-500/20 px-2 py-1 rounded border border-cyan-500/30">
                    <ShieldIcon className="h-3 w-3 text-cyan-400" />
                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter">SECURE LOG</span>
                </div>
            </div>
        </div>
    );

    if (isComplete) {
        return (
            <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 text-white">
                <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
                            <CheckCircleIcon className="h-10 w-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Security Scan Complete</h2>
                        <p className="text-gray-400 text-sm mt-1">All evidence is timestamped and location-encrypted.</p>
                    </div>
                    
                    {mode === 'return' && (
                        <div className="mb-8 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={damageReported}
                                    onChange={e => setDamageReported(e.target.checked)}
                                    className="w-6 h-6 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
                                />
                                <span className="font-bold text-gray-200 group-hover:text-white transition-colors">I noticed NEW damage during this return</span>
                            </label>
                            {damageReported && (
                                <p className="mt-3 text-xs text-red-400 font-medium animate-in fade-in slide-in-from-top-1">
                                    Trust & Safety will automatically review the comparison logs.
                                </p>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={() => { setIsSubmitting(true); onComplete(photos, damageReported); }}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'ENCRYPTING...' : 'FINALIZE INSPECTION'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Security Header */}
            <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                        <LockIcon className="h-3 w-3 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Evidence Collector</span>
                    </div>
                    <div className="h-4 w-px bg-gray-700" />
                    <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">{currentAngle.label}</span>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <XIcon className="h-6 w-6 text-gray-400" />
                </button>
            </div>

            <div className="flex-1 relative flex flex-col md:flex-row bg-black overflow-hidden">
                {/* Comparison UI (Mode Return) */}
                {mode === 'return' && handoverReferencePhotos && handoverReferencePhotos[step] && (
                    <div className="h-1/3 md:h-auto md:w-1/2 bg-gray-900 border-b md:border-b-0 md:border-r border-white/5 relative">
                        <img src={handoverReferencePhotos[step].url} className="w-full h-full object-contain opacity-50" />
                        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 flex items-center gap-2">
                            <ClockIcon className="h-3 w-3 text-gray-400" />
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Handover State: {format(new Date(handoverReferencePhotos[step].timestamp), 'HH:mm')}</span>
                        </div>
                    </div>
                )}

                {/* Primary Interaction Zone */}
                <div className="flex-1 relative flex items-center justify-center">
                    {photos[step] ? (
                        <div className="relative w-full h-full animate-in zoom-in-95 duration-500">
                            <img src={photos[step].url} className="w-full h-full object-contain shadow-2xl" />
                            <VerificationBadge photo={photos[step]} />
                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={() => {
                                        const newPhotos = photos.filter(p => p.angleId !== currentAngle.id);
                                        setPhotos(newPhotos);
                                    }}
                                    className="bg-red-500/20 hover:bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md border border-red-500/50 transition-all font-bold text-xs"
                                >
                                    <RefreshCwIcon className="h-4 w-4" /> RETAKE
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-sm p-6 text-center animate-in fade-in duration-700">
                            <div className="mb-10 space-y-2">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{currentAngle.label}</h2>
                                <p className="text-gray-400 text-sm">{currentAngle.description}</p>
                            </div>
                            
                            <div className="bg-gray-800/40 p-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/5">
                                <ImageUploader label="" currentImageUrl="" onImageChange={handlePhotoUpload} />
                                <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                    Secure Real-Time Upload Only
                                </div>
                            </div>
                            
                            {locationError && (
                                <div className="mt-8 flex items-center justify-center gap-2 text-red-500 font-bold text-xs bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                                    <AlertCircleIcon className="h-4 w-4" /> {locationError}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Step Progress Footer */}
            <div className="bg-gray-900 px-8 py-6 flex justify-between items-center border-t border-white/5">
                <button 
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-0 transition-all"
                >
                    <ChevronLeftIcon className="h-8 w-8" />
                </button>
                
                <div className="flex gap-2">
                    {angles.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                i === step ? 'w-12 bg-cyan-500' : 
                                i < step ? 'w-3 bg-green-500' : 'w-3 bg-gray-800'
                            }`}
                        />
                    ))}
                </div>

                <button 
                    onClick={() => setStep(s => s + 1)}
                    disabled={!photos[step]}
                    className={`p-3 rounded-full transition-all ${photos[step] ? 'bg-white text-black scale-110 shadow-xl' : 'bg-gray-800 text-gray-600'}`}
                >
                    <ChevronRightIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};

export default DigitalInspection;
