
import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto } from '../types';
import { 
    ChevronRightIcon, AlertTriangleIcon, RefreshCwIcon, FuelIcon, 
    ShieldCheckIcon, TrashIcon, CameraIcon 
} from './icons';
import ImageUploader from './ImageUploader';
import { differenceInSeconds } from 'date-fns';
import ReviewWizard from './ReviewWizard';
import DigitalInspection from './DigitalInspection';

type WizardPhase = 'IDLE' | 'HANDOVER' | 'ACTIVE' | 'RETURN' | 'COMPLETED';

type WizardStep = 
    | 'PAYMENT_CHECK'
    | 'ID_SCAN'
    | 'HANDOVER_DOCUMENTATION'
    | 'RENTAL_DASHBOARD'
    | 'INBOUND_INSPECTION'
    | 'DAMAGE_ASSESSMENT'
    | 'REVIEW_CLOSE';

interface RentalSessionWizardProps {
    booking: Booking;
    initialMode?: 'handover' | 'return'; // NEW PROP
    onStatusChange: (newStatus: string) => void;
    onComplete: () => void;
}

const RentalSessionWizard: React.FC<RentalSessionWizardProps> = ({ booking, initialMode, onStatusChange, onComplete }) => {
    const [phase, setPhase] = useState<WizardPhase>('IDLE');
    const [step, setStep] = useState<WizardStep>('PAYMENT_CHECK');
    const [isLoading, setIsLoading] = useState(false);

    // Handover Data
    const [balanceConfirmed, setBalanceConfirmed] = useState(false);
    const [idFront, setIdFront] = useState('');
    const [idBack, setIdBack] = useState('');
    const [showIdWarning, setShowIdWarning] = useState(false);
    const [outboundPhotos, setOutboundPhotos] = useState<string[]>([]);
    const [waiverSigned, setWaiverSigned] = useState(false);

    // Return Data
    const [inboundPhotos, setInboundPhotos] = useState<InspectionPhoto[]>([]);
    const [damageVerdict, setDamageVerdict] = useState<'clean' | 'damage' | null>(null);
    const [damageNotes, setDamageNotes] = useState('');
    const [showInspectionModal, setShowInspectionModal] = useState(false);

    // Initialize State based on booking or prop
    useEffect(() => {
        // If explicitly requested to start RETURN
        if (initialMode === 'return' || booking.status === 'active') {
            setPhase('RETURN');
            setStep('INBOUND_INSPECTION');
            return;
        }
        
        // Normal state flow
        if (booking.status === 'confirmed') {
            setPhase('HANDOVER');
            setStep('PAYMENT_CHECK');
        } else if (booking.status === 'completed') {
            setPhase('COMPLETED');
        }
    }, [booking.status, initialMode]);

    // ... [Handlers] ...
    const handleStartRental = async () => {
        setIsLoading(true);
        setTimeout(() => {
            onStatusChange('active');
            setPhase('ACTIVE');
            setStep('RENTAL_DASHBOARD');
            setIsLoading(false);
        }, 1000);
    };

    const handleInspectionComplete = (photos: InspectionPhoto[], reportedDamage: boolean) => {
        setInboundPhotos(photos);
        setDamageVerdict(reportedDamage ? 'damage' : 'clean');
        setShowInspectionModal(false);
        // FIX: Skip fuel check slider, go straight to verdict
        setStep('DAMAGE_ASSESSMENT');
    };

    const handleSessionFinished = () => {
        onStatusChange('completed');
        setPhase('COMPLETED');
        onComplete();
    };
    
    // --- Helper Components ---
    const CountdownTimer = () => {
        const [timeLeft, setTimeLeft] = useState('');
        useEffect(() => {
            const interval = setInterval(() => {
                const end = new Date(booking.endDate);
                const now = new Date();
                const diff = differenceInSeconds(end, now);
                if (diff <= 0) setTimeLeft('Overdue');
                else {
                    const hours = Math.floor(diff / 3600);
                    const minutes = Math.floor((diff % 3600) / 60);
                    setTimeLeft(`${hours}h ${minutes}m remaining`);
                }
            }, 60000);
            return () => clearInterval(interval);
        }, []);
        return <div className="text-3xl font-mono font-bold text-gray-900 tracking-tight">{timeLeft || "Calculating..."}</div>;
    };

    // Renders
    const renderHandoverDocumentation = () => {
        const handleAddPhoto = (url: string) => setOutboundPhotos(prev => [...prev, url]);
        const handleRemovePhoto = (index: number) => setOutboundPhotos(prev => prev.filter((_, i) => i !== index));
        const canStart = outboundPhotos.length >= 2 && waiverSigned;

        return (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="text-center">
                    <h3 className="text-xl font-bold">Step 2: Document Condition</h3>
                    <p className="text-gray-500 text-sm">Take 2 to 8 photos.</p>

                    {/* NEW: Dynamic Fuel Tip */}
                    <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-100">
                        <FuelIcon className="h-3 w-3" />
                        <span>Tip: If it has an engine, include a photo of the fuel gauge.</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {/* Render existing photos */}
                    {outboundPhotos.map((url, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border">
                            <img src={url} className="w-full h-full object-cover" />
                             <button onClick={() => handleRemovePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity">
                                <TrashIcon className="h-3 w-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">Photo {idx + 1}</span>
                        </div>
                    ))}
                    
                    {/* Render Next Slot */}
                    {outboundPhotos.length < 8 && (
                        <div className="aspect-video">
                            <ImageUploader 
                                label={`+ Add Photo ${outboundPhotos.length + 1}`} 
                                currentImageUrl="" 
                                onImageChange={handleAddPhoto} 
                            />
                        </div>
                    )}
                </div>
                {outboundPhotos.length < 2 && <p className="text-xs text-red-500 text-center font-medium">* Minimum 2 photos required to proceed</p>}
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={waiverSigned} onChange={(e) => setWaiverSigned(e.target.checked)} className="mt-1" />
                        <span className="text-sm text-blue-900">I confirm the Waiver & Contract are signed.</span>
                    </label>
                </div>
                
                <button onClick={handleStartRental} disabled={!canStart || isLoading} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50">
                     {isLoading ? 'Starting...' : 'Start Rental Session 🚀'}
                </button>
            </div>
        );
    };

    const renderReturnFlow = () => {
        if (step === 'INBOUND_INSPECTION') return (
            <div className="text-center py-12 animate-in fade-in">
                <h3 className="text-xl font-bold mb-4">Ready to Return?</h3>
                <p className="text-gray-600 mb-6">Launch the inspection tool to scan the item and check for damages.</p>
                <button onClick={() => setShowInspectionModal(true)} className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors">
                    <CameraIcon className="h-5 w-5" /> Start Inspection Scan
                </button>
            </div>
        );
        
        if (step === 'DAMAGE_ASSESSMENT') return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xl font-bold text-center">Verdict</h3>
                <p className="text-center text-gray-500 text-sm mb-4">Based on your inspection comparison.</p>
                
                <button onClick={() => { setDamageVerdict('clean'); setStep('REVIEW_CLOSE'); }} className="w-full p-6 border-2 border-green-500 bg-green-50 rounded-xl font-bold text-green-800 hover:bg-green-100 transition-colors text-lg flex items-center justify-between">
                    <span>All Clean</span>
                    <span className="text-sm font-normal bg-green-200 px-2 py-1 rounded">Release Deposit</span>
                </button>

                <button onClick={() => setDamageVerdict('damage')} className="w-full p-6 border-2 border-red-500 bg-red-50 rounded-xl font-bold text-red-800 hover:bg-red-100 transition-colors text-lg flex items-center justify-between">
                    <span>Damage / Fuel Issue</span>
                    <span className="text-sm font-normal bg-red-200 px-2 py-1 rounded">Freeze Deposit</span>
                </button>

                {damageVerdict === 'damage' && (
                    <div className="animate-in fade-in mt-4">
                        <textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-red-500" placeholder="Describe damage or missing fuel..." rows={3} />
                        <button onClick={() => setStep('REVIEW_CLOSE')} className="w-full mt-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">File Claim & Continue</button>
                    </div>
                )}
            </div>
        );
        if (step === 'REVIEW_CLOSE') return <ReviewWizard bookingId={booking.id} authorId={booking.listing.owner.id} targetId={booking.renterId} targetName="Renter" role="HOST" onComplete={handleSessionFinished} />;
        return null;
    };
    
    // Render Handover steps if not in Return/Active mode
    const renderHandoverStep = () => {
         if (step === 'PAYMENT_CHECK') return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                    <h3 className="font-bold text-amber-900">Collect Balance</h3>
                    <p className="text-3xl font-bold mt-2">${booking.balanceDueOnSite}</p>
                </div>
                <label className="flex gap-4 p-4 bg-white border rounded-xl cursor-pointer"><input type="checkbox" checked={balanceConfirmed} onChange={e => setBalanceConfirmed(e.target.checked)} className="mt-1" /> <span>Payment Received</span></label>
                <button onClick={() => setStep('ID_SCAN')} disabled={!balanceConfirmed} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl disabled:opacity-50 transition-colors">Next</button>
            </div>
        );
        
        if (step === 'ID_SCAN') return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-xl text-center">ID Check</h3>
                <div className="grid grid-cols-2 gap-4">
                    <ImageUploader label="Front ID" currentImageUrl={idFront} onImageChange={setIdFront} />
                    <ImageUploader label="Back ID" currentImageUrl={idBack} onImageChange={setIdBack} />
                </div>
                {showIdWarning && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
                            <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 mb-2">RETURN THE ID!</h4>
                            <p className="text-gray-600 mb-6">Do not keep the renter's physical ID.</p>
                            <button onClick={() => { setShowIdWarning(false); setStep('HANDOVER_DOCUMENTATION'); }} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">I have returned the ID</button>
                        </div>
                    </div>
                )}
                <button onClick={() => setShowIdWarning(true)} disabled={!idFront || !idBack} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl disabled:opacity-50 transition-colors">Next</button>
            </div>
        );

        if (step === 'HANDOVER_DOCUMENTATION') return renderHandoverDocumentation();
        return null;
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col p-6">
            
            {(phase === 'HANDOVER' || phase === 'IDLE') && renderHandoverStep()}
            
            {/* Active Dashboard & Return Flow */}
            {step === 'RENTAL_DASHBOARD' && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Time Remaining</p>
                        <CountdownTimer />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <button onClick={() => { setPhase('RETURN'); setStep('INBOUND_INSPECTION'); }} className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg shadow-md hover:bg-black flex items-center justify-center gap-2 transition-colors">
                            <RefreshCwIcon className="h-5 w-5" /> End Rental & Start Return
                        </button>
                    </div>
                </div>
            )}
            
            {(phase === 'RETURN' && step !== 'RENTAL_DASHBOARD') && renderReturnFlow()}

            {phase === 'COMPLETED' && (
                <div className="text-center py-12 animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <ShieldCheckIcon className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Session Closed</h2>
                    <p className="text-gray-600">The booking has been marked as completed.</p>
                    <div className="mt-8">
                        <button onClick={onComplete} className="text-cyan-600 font-bold hover:underline">Return to Dashboard</button>
                    </div>
                </div>
            )}

            {/* Modal Injection */}
            {showInspectionModal && (
                <DigitalInspection 
                    booking={booking}
                    mode="return"
                    handoverReferencePhotos={outboundPhotos}
                    onComplete={handleInspectionComplete}
                    onCancel={() => setShowInspectionModal(false)}
                />
            )}
        </div>
    );
};

export default RentalSessionWizard;
