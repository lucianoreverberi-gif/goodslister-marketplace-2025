
import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto, ListingCategory } from '../types';
import { CameraIcon, CheckCircleIcon, MapPinIcon, RefreshCwIcon, XIcon, AlertCircleIcon, ShieldIcon, ChevronRightIcon, ChevronLeftIcon } from './icons';
import ImageUploader from './ImageUploader';

interface DigitalInspectionProps {
    booking: Booking;
    mode: 'handover' | 'return';
    currentUserLocation?: { lat: number, lng: number };
    handoverReferencePhotos?: string[]; 
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
    
    // Helper to determine if we need fuel check
    const needsFuelCheck = 
        category === ListingCategory.BOATS || 
        category === ListingCategory.ATVS_UTVS || 
        category === ListingCategory.RVS || 
        category === ListingCategory.MOTORCYCLES || 
        (category === ListingCategory.WATER_SPORTS && (sub.includes('jet') || sub.includes('ski')));

    let angles: AngleConfig[] = [];

    // Marine Logic
    if (category === ListingCategory.BOATS || (category === ListingCategory.WATER_SPORTS && (sub.includes('jet') || sub.includes('ski')))) {
        angles = [
            { id: 'bow', label: 'Hull (Front/Bow)', description: 'Capture the nose and front hull for impact marks.', overlayPath: 'M12 2 L2 22 L22 22 Z' },
            { id: 'hull_bottom', label: 'Hull (Underside)', description: 'Check underneath for beaching scratches.', overlayPath: 'M2 12 Q12 22 22 12' },
            { id: 'prop', label: 'Propeller/Intake', description: 'CRITICAL: Check blades for chips or bends.', overlayPath: 'M12 12 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0' },
            { id: 'starboard', label: 'Right Side', description: 'Full length view.', overlayPath: 'M2 10 L22 10' },
            { id: 'port', label: 'Left Side', description: 'Full length view.', overlayPath: 'M2 10 L22 10' },
        ];
    }
    // Vehicle Logic
    else if (category === ListingCategory.RVS || category === ListingCategory.ATVS_UTVS || category === ListingCategory.MOTORCYCLES) {
        angles = [
            { id: 'front', label: 'Front', description: 'Front view including headlights.' },
            { id: 'driver_side', label: 'Driver Side', description: 'Full side view, check panels.' },
            { id: 'passenger_side', label: 'Passenger Side', description: 'Full side view.' },
            { id: 'rear', label: 'Rear', description: 'Back view and exhaust.' },
            { id: 'wheels', label: 'Wheels/Tires', description: 'Check rims for curb rash.' }
        ];
    }
    // Default Generic
    else {
        angles = [
            { id: 'overall', label: 'Overall Item', description: 'Full view of the item.' },
            { id: 'detail_1', label: 'Detail / Accessories', description: 'Any included accessories (paddles, etc).' }
        ];
    }

    // FIX: Dynamically add Fuel Check for motorized items
    if (needsFuelCheck) {
        angles.push({ 
            id: 'fuel_dash', 
            label: 'Fuel Gauge / Dash', 
            description: 'Capture the fuel level and mileage/hours.' 
        });
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

    const currentReferencePhoto = handoverReferencePhotos && handoverReferencePhotos[step] 
        ? handoverReferencePhotos[step] 
        : null;

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => setLocationError('GPS Location required for legal validation.')
            );
        } else {
            setLocationError('Geolocation is not supported by this browser.');
        }
    }, []);

    const handlePhotoUpload = (url: string) => {
        const newPhoto: InspectionPhoto = {
            url,
            angleId: currentAngle.id,
            angleLabel: currentAngle.label,
            timestamp: new Date().toISOString(),
            latitude: currentLocation?.lat,
            longitude: currentLocation?.lng,
            takenByUserId: 'current-user-id'
        };

        const updatedPhotos = [...photos];
        const existingIndex = updatedPhotos.findIndex(p => p.angleId === currentAngle.id);
        if (existingIndex >= 0) {
            updatedPhotos[existingIndex] = newPhoto;
        } else {
            updatedPhotos.push(newPhoto);
        }
        setPhotos(updatedPhotos);
        
        setTimeout(() => {
            if (step < angles.length) setStep(s => s + 1);
        }, 800);
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            onComplete(photos, damageReported);
        }, 1500);
    };

    if (isComplete) {
        return (
            <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 text-white">
                <div className="max-w-md w-full bg-gray-900 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <ShieldIcon className="h-8 w-8 text-green-500" />
                        <h2 className="text-2xl font-bold">Inspection Ready</h2>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-sm text-gray-400 border-b border-gray-800 pb-2">
                            <span>Photos Captured</span>
                            <span className="text-white">{photos.length} / {angles.length}</span>
                        </div>
                        {/* GPS Stamp Removed per request */}
                    </div>

                    {mode === 'return' && (
                        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <AlertCircleIcon className="h-5 w-5 text-yellow-500" />
                                Preliminary Damage Check
                            </h3>
                            <p className="text-sm text-gray-300 mb-4">Did you notice any obvious new damage during the scan?</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setDamageReported(false)}
                                    className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${!damageReported ? 'bg-green-600 border-green-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                                >
                                    Looks Clean
                                </button>
                                <button 
                                    onClick={() => setDamageReported(true)}
                                    className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${damageReported ? 'bg-red-600 border-red-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                                >
                                    Possible Damage
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Securing Evidence...' : `Sign & Complete ${mode === 'handover' ? 'Handover' : 'Return'}`}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${mode === 'return' ? 'bg-orange-600' : 'bg-cyan-600'}`}>{mode}</span>
                    <span className="text-sm font-medium text-gray-300">Step {step + 1} of {angles.length}</span>
                </div>
                <button onClick={onCancel} className="text-gray-400 hover:text-white"><XIcon className="h-6 w-6" /></button>
            </div>

            {/* Split View for Return Mode */}
            <div className="flex-1 relative flex flex-col md:flex-row bg-black">
                
                {/* Reference Photo (Comparison) */}
                {mode === 'return' && currentReferencePhoto && (
                    <div className="h-1/3 md:h-auto md:w-1/2 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-700 relative overflow-hidden">
                        <img src={currentReferencePhoto} className="w-full h-full object-contain opacity-90" alt="Reference" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-[10px] font-bold uppercase border border-white/20">
                            Reference (Handover)
                        </div>
                    </div>
                )}

                {/* Active Camera/Upload Area */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    {/* Ghost Overlay */}
                    {currentAngle.overlayPath && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-30">
                            <svg viewBox="0 0 24 24" className="w-64 h-64 stroke-white stroke-[0.5] fill-none">
                                <path d={currentAngle.overlayPath} />
                            </svg>
                            <p className="absolute bottom-10 text-white text-xs font-mono tracking-widest uppercase opacity-70">Align Here</p>
                        </div>
                    )}

                    {photos[step] ? (
                        <div className="relative w-full h-full">
                            <img src={photos[step].url} alt="Current" className="w-full h-full object-contain" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                                <button 
                                    onClick={() => {
                                        const newPhotos = [...photos];
                                        newPhotos.splice(step, 1);
                                        setPhotos(newPhotos);
                                    }}
                                    className="bg-white/20 hover:bg-white/40 text-white px-6 py-2 rounded-full flex items-center gap-2 backdrop-blur-md"
                                >
                                    <RefreshCwIcon className="h-4 w-4" /> Retake
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-sm p-4 z-20">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">{currentAngle.label}</h2>
                                <p className="text-gray-400 text-sm">{currentAngle.description}</p>
                                {locationError && <p className="text-red-400 text-xs mt-2 flex items-center justify-center gap-1"><AlertCircleIcon className="h-3 w-3"/> {locationError}</p>}
                            </div>
                            
                            <div className="bg-gray-800/50 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                                <ImageUploader 
                                    label=""
                                    currentImageUrl=""
                                    onImageChange={handlePhotoUpload}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Nav */}
            <div className="bg-gray-900 p-4 flex justify-between items-center border-t border-gray-800">
                <button 
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-30 px-4 py-2"
                >
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                
                <div className="flex gap-1">
                    {angles.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all ${
                                i === step ? 'w-8 bg-cyan-500' : 
                                i < step ? 'w-2 bg-green-500' : 'w-2 bg-gray-700'
                            }`}
                        />
                    ))}
                </div>

                <button 
                    onClick={() => setStep(s => Math.min(angles.length, s + 1))}
                    disabled={!photos[step]}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${photos[step] ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-600 cursor-not-allowed'}`}
                >
                    Next <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default DigitalInspection;
