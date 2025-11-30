
import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto, ListingCategory } from '../types';
import { CameraIcon, CheckCircleIcon, MapPinIcon, RefreshCwIcon, XIcon, AlertCircleIcon, ShieldIcon, ChevronRightIcon, ChevronLeftIcon } from './icons';
import ImageUploader from './ImageUploader';

interface DigitalInspectionProps {
    booking: Booking;
    mode: 'handover' | 'return';
    currentUserLocation?: { lat: number, lng: number };
    onComplete: (photos: InspectionPhoto[], damageReported: boolean) => void;
    onCancel: () => void;
}

interface AngleConfig {
    id: string;
    label: string;
    description: string;
    overlayPath?: string; // Simulated SVG path for ghost overlay
}

const getRequiredAngles = (category: ListingCategory, subcategory: string = ''): AngleConfig[] => {
    const sub = subcategory.toLowerCase();
    
    if (category === ListingCategory.BOATS) {
        return [
            { id: 'bow', label: 'Bow (Front)', description: 'Capture the entire front hull.', overlayPath: 'M12 2 L2 22 L22 22 Z' },
            { id: 'stern', label: 'Stern (Back)', description: 'Capture the back and engine mount.', overlayPath: 'M2 2 L22 2 L12 22 Z' },
            { id: 'prop', label: 'Propeller', description: 'CRITICAL: Close up of propeller blades.', overlayPath: 'M12 12 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0' },
            { id: 'port', label: 'Port Side (Left)', description: 'Full length of the left side.', overlayPath: 'M2 10 L22 10' },
            { id: 'starboard', label: 'Starboard (Right)', description: 'Full length of the right side.', overlayPath: 'M2 10 L22 10' },
        ];
    }
    
    if (category === ListingCategory.WATER_SPORTS && (sub.includes('jet') || sub.includes('ski'))) {
        return [
            { id: 'hull_bottom', label: 'Hull Bottom', description: 'Check for scratches on the underside.', overlayPath: 'M2 12 Q12 22 22 12' },
            { id: 'handlebars', label: 'Controls', description: 'Dashboard, handlebars and mirrors.' },
            { id: 'safety_lanyard', label: 'Safety Lanyard', description: 'Photo of the kill switch cord.' },
            { id: 'intake', label: 'Jet Intake', description: 'Check the grate for debris.' }
        ];
    }

    if (category === ListingCategory.RVS || category === ListingCategory.ATVS_UTVS || category === ListingCategory.MOTORCYCLES) {
        return [
            { id: 'front', label: 'Front', description: 'Front view including headlights.' },
            { id: 'back', label: 'Back', description: 'Rear view including license plate.' },
            { id: 'driver_side', label: 'Driver Side', description: 'Full side view.' },
            { id: 'passenger_side', label: 'Passenger Side', description: 'Full side view.' },
            { id: 'tires', label: 'Tires/Wheels', description: 'Condition of tires.' }
        ];
    }

    // Default Generic
    return [
        { id: 'overall', label: 'Overall Item', description: 'Full view of the item.' },
        { id: 'detail_1', label: 'Detail / Accessories', description: 'Any included accessories.' }
    ];
};

const DigitalInspection: React.FC<DigitalInspectionProps> = ({ booking, mode, onComplete, onCancel }) => {
    const [step, setStep] = useState(0);
    const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationError, setLocationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [damageReported, setDamageReported] = useState(false);

    const angles = getRequiredAngles(booking.listing.category, booking.listing.subcategory);
    const currentAngle = angles[step];
    const isComplete = step >= angles.length;

    // Mock previous photos for Return mode comparison
    // In a real app, these would come from the `booking` prop via DB
    const handoverPhotosMock: Record<string, string> = {
        'bow': 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1000&auto=format&fit=crop',
        'prop': 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1000&auto=format&fit=crop', // Placeholders
        'hull_bottom': 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1000&auto=format&fit=crop'
    };

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
            takenByUserId: 'current-user-id' // In real app, get from session
        };

        const updatedPhotos = [...photos];
        // Replace if retaking, otherwise append
        const existingIndex = updatedPhotos.findIndex(p => p.angleId === currentAngle.id);
        if (existingIndex >= 0) {
            updatedPhotos[existingIndex] = newPhoto;
        } else {
            updatedPhotos.push(newPhoto);
        }
        setPhotos(updatedPhotos);
        
        // Auto advance after short delay for UX
        setTimeout(() => {
            if (step < angles.length) setStep(s => s + 1);
        }, 800);
    };

    const handleRetake = (index: number) => {
        setStep(index);
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onComplete(photos, damageReported);
        }, 1500);
    };

    // -- UI: Welcome Screen --
    if (step === -1) { // Not implemented, but useful concept. We start at 0.
        return null; 
    }

    // -- UI: Summary / Submit Screen --
    if (isComplete) {
        return (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 text-white">
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
                        <div className="flex justify-between text-sm text-gray-400 border-b border-gray-800 pb-2">
                            <span>GPS Stamp</span>
                            <span className={currentLocation ? "text-green-400" : "text-red-400"}>
                                {currentLocation ? "✓ Locked" : "Missing"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 border-b border-gray-800 pb-2">
                            <span>Time Stamp</span>
                            <span className="text-white">UTC {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>

                    {mode === 'return' && (
                        <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <AlertCircleIcon className="h-5 w-5 text-yellow-500" />
                                Damage Assessment
                            </h3>
                            <p className="text-sm text-gray-300 mb-4">Based on your visual inspection compared to handover photos:</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setDamageReported(false)}
                                    className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${!damageReported ? 'bg-green-600 border-green-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                                >
                                    All Good
                                </button>
                                <button 
                                    onClick={() => setDamageReported(true)}
                                    className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${damageReported ? 'bg-red-600 border-red-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                                >
                                    Damage Found
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
                    <button onClick={() => setStep(0)} className="w-full mt-4 text-gray-400 hover:text-white text-sm">Review Photos</button>
                </div>
            </div>
        );
    }

    // -- UI: Wizard Step --
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <span className="bg-cyan-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">{mode}</span>
                    <span className="text-sm font-medium text-gray-300">Step {step + 1} of {angles.length}</span>
                </div>
                <button onClick={onCancel} className="text-gray-400 hover:text-white"><XIcon className="h-6 w-6" /></button>
            </div>

            {/* Main Area */}
            <div className="flex-1 relative flex flex-col md:flex-row">
                
                {/* Comparison View (Left Side - Only in Return Mode) */}
                {mode === 'return' && (
                    <div className="hidden md:flex md:w-1/2 bg-gray-800 items-center justify-center border-r border-gray-700 relative">
                        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-xs font-bold">
                            ORIGINAL HANDOVER PHOTO
                        </div>
                        {handoverPhotosMock[currentAngle.id] ? (
                            <img src={handoverPhotosMock[currentAngle.id]} alt="Original" className="max-h-full max-w-full object-contain opacity-80" />
                        ) : (
                            <div className="text-gray-500 text-center p-8">
                                <p>No handover photo available for this angle.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Active Camera/Upload Area */}
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                    {/* Ghost Overlay */}
                    {currentAngle.overlayPath && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-30">
                            <svg viewBox="0 0 24 24" className="w-64 h-64 stroke-white stroke-[0.5] fill-none">
                                <path d={currentAngle.overlayPath} />
                            </svg>
                            <p className="absolute bottom-1/4 text-white text-xs font-mono tracking-widest uppercase opacity-70">Align Here</p>
                        </div>
                    )}

                    {/* Current Photo or Uploader */}
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
                                <p className="text-gray-400">{currentAngle.description}</p>
                                {locationError && <p className="text-red-400 text-xs mt-2 flex items-center justify-center gap-1"><AlertCircleIcon className="h-3 w-3"/> {locationError}</p>}
                            </div>
                            
                            <ImageUploader 
                                label=""
                                currentImageUrl=""
                                onImageChange={handlePhotoUpload}
                            />
                            
                            {mode === 'return' && (
                                <div className="md:hidden mt-4 text-center">
                                    <p className="text-xs text-gray-500">Tip: Refer to handover photos in dashboard if unsure of original condition.</p>
                                </div>
                            )}
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
