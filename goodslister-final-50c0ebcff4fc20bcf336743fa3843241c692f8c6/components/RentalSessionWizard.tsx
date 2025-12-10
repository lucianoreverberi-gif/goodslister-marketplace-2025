
import React, { useState, useEffect } from 'react';
import { Booking, ListingCategory, InspectionPhoto } from '../types';
import { 
    CameraIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, 
    SmartphoneIcon, MapPinIcon, ShieldIcon, ShieldCheckIcon, 
    ChevronRightIcon, LockIcon, DollarSignIcon, StarIcon, 
    RefreshCwIcon, FuelIcon, AnchorIcon, FileSignatureIcon, PlusIcon, TrashIcon, GavelIcon, EyeIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { format, differenceInSeconds } from 'date-fns';
import ReviewWizard from './ReviewWizard';
import DigitalInspection from './DigitalInspection';

type WizardPhase = 'IDLE' | 'HANDOVER' | 'ACTIVE' | 'RETURN' | 'COMPLETED';

type WizardStep = 
    // Handover Steps
    | 'PAYMENT_CHECK'
    | 'ID_SCAN'
    | 'HANDOVER_DOCUMENTATION'
    // Active
    | 'RENTAL_DASHBOARD'
    // Return Steps
    | 'INBOUND_INSPECTION'
    | 'FUEL_CHECK' // NEW STEP
    | 'DAMAGE_ASSESSMENT'
    | 'REVIEW_CLOSE';

interface RentalSessionWizardProps {
    booking: Booking;
    onStatusChange: (newStatus: string) => void;
    onComplete: () => void;
}

const RentalSessionWizard: React.FC<RentalSessionWizardProps> = ({ booking, onStatusChange, onComplete }) => {
    // --- State Machine ---
    const [phase, setPhase] = useState<WizardPhase>('IDLE');
    const [step, setStep] = useState<WizardStep>('PAYMENT_CHECK');
    const [isLoading, setIsLoading] = useState(false);

    // --- Data State ---
    const [balanceConfirmed, setBalanceConfirmed] = useState(false);
    const [idFront, setIdFront] = useState<string>('');
    const [idBack, setIdBack] = useState<string>('');
    const [showIdWarning, setShowIdWarning] = useState(false);

    // Handover Data
    const [outboundPhotos, setOutboundPhotos] = useState<string[]>([]);
    const [waiverSigned, setWaiverSigned] = useState(false);

    // Return Data
    const [inboundPhotos, setInboundPhotos] = useState<InspectionPhoto[]>([]);
    const [fuelLevel, setFuelLevel] = useState<number>(100); // 0 to 100%
    const [damageVerdict, setDamageVerdict] = useState<'clean' | 'damage' | null>(null);
    const [damageNotes, setDamageNotes] = useState('');
    const [showInspectionModal, setShowInspectionModal] = useState(false);

    // --- Initial State Check ---
    useEffect(() => {
        if (booking.status === 'confirmed') {
            setPhase('HANDOVER');
            setStep('PAYMENT_CHECK');
        } else if (booking.status === 'active') {
            setPhase('ACTIVE');
            setStep('RENTAL_DASHBOARD');
        } else if (booking.status === 'completed') {
            setPhase('COMPLETED');
        }
    }, [booking.status]);

    // --- Handlers ---
    const handleStartRental = async () => {
        setIsLoading(true);
        setTimeout(() => {
            onStatusChange('active');
            setPhase('ACTIVE');
            setStep('RENTAL_DASHBOARD');
            setIsLoading(false);
        }, 1500);
    };

    const handleEndRental = () => {
        setPhase('RETURN');
        setStep('INBOUND_INSPECTION');
        // Open the full screen inspection tool
        setShowInspectionModal(true);
    };

    const handleInspectionComplete = (photos: InspectionPhoto[], reportedDamage: boolean) => {
        setInboundPhotos(photos);
        setDamageVerdict(reportedDamage ? 'damage' : 'clean');
        setShowInspectionModal(false);
        setStep('FUEL_CHECK');
    };

    const handleSessionFinished = async () => {
        setIsLoading(true);
        // Simulate API call to complete booking
        setTimeout(() => {
            onStatusChange('completed');
            setPhase('COMPLETED');
            onComplete();
            setIsLoading(false);
        }, 2000);
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

    // --- RENDERERS ---

    const renderPaymentCheck = () => {
        const balanceDue = booking.balanceDueOnSite || 0;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                    <h3 className="text-amber-900 font-bold uppercase tracking-wider text-sm mb-1">Action Required</h3>
                    <p className="text-amber-800">You must collect the remaining balance before handing over the keys.</p>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500 text-sm uppercase font-semibold">Balance Due to You</p>
                    <p className="text-5xl font-extrabold text-gray-900 mt-2">${balanceDue.toFixed(2)}</p>
                    <p className="text-sm text-gray-400 mt-2">Via Cash, Venmo, or Zelle</p>
                </div>
                <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-cyan-500 transition-colors bg-white">
                    <input type="checkbox" checked={balanceConfirmed} onChange={(e) => setBalanceConfirmed(e.target.checked)} className="w-6 h-6 text-cyan-600 rounded focus:ring-cyan-500 mt-1" />
                    <div>
                        <span className="font-bold text-gray-900 block">Payment Received</span>
                        <span className="text-sm text-gray-500">I confirm I have received ${balanceDue} from the renter.</span>
                    </div>
                </label>
                <button onClick={() => setStep('ID_SCAN')} disabled={!balanceConfirmed} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    Next Step <ChevronRightIcon className="h-5 w-5" />
                </button>
            </div>
        );
    };

    const renderIdScan = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-gray-900">Step 1: Validate ID</h3>
                <p className="text-gray-500 mt-1 text-sm">Take clear photos of the renter's Driver's License or Passport.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Front of ID</label>
                    <ImageUploader label="Front" currentImageUrl={idFront} onImageChange={setIdFront} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Back of ID</label>
                    <ImageUploader label="Back" currentImageUrl={idBack} onImageChange={setIdBack} />
                </div>
            </div>
            {idFront && idBack && !showIdWarning && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-bold mb-1">Verify Information:</p>
                    <ul className="list-disc list-inside">
                        <li>Does the name match the booking?</li>
                        <li>Is the ID valid and not expired?</li>
                        <li>Is the photo clearly the person in front of you?</li>
                    </ul>
                 </div>
            )}
            <button onClick={() => setShowIdWarning(true)} disabled={!idFront || !idBack} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                ID Verified - Next <ChevronRightIcon className="h-5 w-5" />
            </button>
            {showIdWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
                        <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-gray-900 mb-2">RETURN THE ID!</h4>
                        <p className="text-gray-600 mb-6">Do not keep the renter's physical ID. We have secured digital copies. Please hand it back now.</p>
                        <button onClick={() => { setShowIdWarning(false); setStep('HANDOVER_DOCUMENTATION'); }} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                            I have returned the ID
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderHandoverDocumentation = () => {
        const handleAddPhoto = (url: string) => setOutboundPhotos(prev => [...prev, url]);
        const handleRemovePhoto = (index: number) => setOutboundPhotos(prev => prev.filter((_, i) => i !== index));
        const canStart = outboundPhotos.length >= 2 && waiverSigned;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 pb-20">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900">Step 2: Document Condition</h3>
                    <p className="text-gray-500 mt-1 text-sm">Take 2 to 8 photos of the item before handing it over.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {outboundPhotos.map((url, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                            <img src={url} className="w-full h-full object-cover" alt={`Handover ${idx}`} />
                            <button onClick={() => handleRemovePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="h-3 w-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Photo {idx + 1}</span>
                        </div>
                    ))}
                    {outboundPhotos.length < 8 && (
                        <div className="aspect-video"><ImageUploader label={outboundPhotos.length === 0 ? "Add Photo 1" : "+ Add Photo"} currentImageUrl="" onImageChange={handleAddPhoto} /></div>
                    )}
                </div>
                {outboundPhotos.length < 2 && <p className="text-xs text-red-500 text-center font-medium">* Minimum 2 photos required to proceed (Current: {outboundPhotos.length})</p>}
                <div className="border-t border-gray-200 pt-6 mt-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <div className="pt-0.5"><input type="checkbox" checked={waiverSigned} onChange={(e) => setWaiverSigned(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" /></div>
                            <div className="text-sm">
                                <span className="font-bold text-blue-900 block mb-1">Legal Verification</span>
                                <span className="text-blue-800">I confirm that the Renter has signed the <strong>Liability Waiver</strong> and <strong>Rental Agreement</strong>.</span>
                            </div>
                        </label>
                    </div>
                    <button onClick={handleStartRental} disabled={!canStart || isLoading} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                         {isLoading ? 'Starting Rental...' : 'Start Rental Session 🚀'}
                    </button>
                </div>
            </div>
        );
    };

    const renderActiveDashboard = () => (
        <div className="space-y-8 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Time Remaining</p>
                <CountdownTimer />
                <div className="mt-6 flex justify-center gap-4">
                    <button className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-100">+ Extend Rental</button>
                    <button className="px-4 py-2 bg-red-50 text-red-700 font-bold rounded-lg text-sm hover:bg-red-100">Emergency</button>
                </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <button onClick={handleEndRental} className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg shadow-md hover:bg-black flex items-center justify-center gap-2">
                    <RefreshCwIcon className="h-5 w-5" /> End Rental & Start Return
                </button>
            </div>
        </div>
    );

    const renderReturnInspectionButton = () => (
        // This is a placeholder as the modal handles the actual UI
        <div className="text-center py-12">
            <p className="text-gray-500">Launching Inspection Tool...</p>
        </div>
    );

    const renderFuelCheck = () => (
        <div className="space-y-8 animate-in fade-in">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">Final Checks</h3>
                <p className="text-gray-500 mt-1">Verify consumable levels.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <label className="block font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FuelIcon className="h-5 w-5 text-gray-500" /> 
                    Fuel Level Returned
                </label>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="25" 
                    value={fuelLevel} 
                    onChange={(e) => setFuelLevel(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                    <span>Empty</span>
                    <span>1/4</span>
                    <span>1/2</span>
                    <span>3/4</span>
                    <span>Full</span>
                </div>
                <p className="text-center font-bold text-cyan-600 mt-4 text-lg">{fuelLevel}%</p>
            </div>

            <button onClick={() => setStep('DAMAGE_ASSESSMENT')} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl shadow-lg hover:bg-cyan-700">
                Continue to Verdict
            </button>
        </div>
    );

    const renderDamageAssessment = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">The Verdict</h2>
                <p className="text-gray-600">Based on your inspection and photos.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <button 
                    onClick={() => {
                        setDamageVerdict('clean');
                        setStep('REVIEW_CLOSE');
                    }}
                    className={`p-6 border-2 rounded-xl transition-all text-left group ${damageVerdict === 'clean' ? 'border-green-500 bg-green-50 ring-1 ring-green-200' : 'border-gray-200 hover:border-green-200 bg-white'}`}
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-green-100 p-2 rounded-full text-green-700">
                            <ShieldCheckIcon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-green-900 text-lg">All Clean</h3>
                    </div>
                    <p className="text-green-800 text-sm ml-14">Item returned in good condition. Release security deposit.</p>
                </button>

                <button 
                    onClick={() => setDamageVerdict('damage')}
                    className={`p-6 border-2 rounded-xl transition-all text-left group ${damageVerdict === 'damage' ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-gray-200 hover:border-red-200 bg-white'}`}
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-red-100 p-2 rounded-full text-red-700">
                            <AlertTriangleIcon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-red-900 text-lg">Report Issue</h3>
                    </div>
                    <p className="text-red-800 text-sm ml-14">Damage found or fuel missing. Freeze deposit and open a claim.</p>
                </button>
            </div>

            {damageVerdict === 'damage' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Describe the issue</label>
                    <textarea 
                        value={damageNotes}
                        onChange={(e) => setDamageNotes(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={3}
                        placeholder="E.g., Deep scratch on hull, missing life vest..."
                    />
                    <button 
                        onClick={() => setStep('REVIEW_CLOSE')}
                        disabled={!damageNotes}
                        className="w-full mt-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        File Claim & Continue
                    </button>
                </div>
            )}
        </div>
    );

    const renderReviewClose = () => {
        return (
            <ReviewWizard 
                bookingId={booking.id}
                authorId={booking.listing.owner.id} 
                targetId={booking.renterId}
                targetName={`Renter (${booking.renterId})`}
                role="HOST"
                onComplete={handleSessionFinished}
            />
        );
    };

    // --- MAIN RENDER ---
    const getProgress = () => {
        if (phase === 'HANDOVER') {
            if (step === 'PAYMENT_CHECK') return 10;
            if (step === 'ID_SCAN') return 20;
            if (step === 'HANDOVER_DOCUMENTATION') return 30;
        }
        if (phase === 'ACTIVE') return 50;
        if (phase === 'RETURN') {
            if (step === 'INBOUND_INSPECTION') return 60;
            if (step === 'FUEL_CHECK') return 70;
            if (step === 'DAMAGE_ASSESSMENT') return 80;
            if (step === 'REVIEW_CLOSE') return 90;
        }
        return 100;
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            {/* Wizard Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4">
                <div className="container mx-auto max-w-md">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="font-bold text-gray-900">Rental Session</h1>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${phase === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {phase}
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600 transition-all duration-500 ease-out" style={{ width: `${getProgress()}%` }} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 container mx-auto max-w-md p-6">
                {step === 'PAYMENT_CHECK' && renderPaymentCheck()}
                {step === 'ID_SCAN' && renderIdScan()}
                {step === 'HANDOVER_DOCUMENTATION' && renderHandoverDocumentation()}
                
                {step === 'RENTAL_DASHBOARD' && renderActiveDashboard()}
                
                {step === 'INBOUND_INSPECTION' && renderReturnInspectionButton()}
                {step === 'FUEL_CHECK' && renderFuelCheck()}
                {step === 'DAMAGE_ASSESSMENT' && renderDamageAssessment()}
                {step === 'REVIEW_CLOSE' && renderReviewClose()}
                
                {phase === 'COMPLETED' && (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                            <ShieldCheckIcon className="h-12 w-12" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Session Closed</h2>
                        <p className="text-gray-600">The booking has been marked as completed.</p>
                        <div className="mt-4 p-4 bg-white border rounded-lg inline-block text-left text-sm">
                            <p><strong>Verdict:</strong> {damageVerdict === 'clean' ? 'Clean Return' : 'Damage Reported'}</p>
                            <p><strong>Deposit:</strong> {damageVerdict === 'clean' ? 'Released to Renter' : 'Frozen for Review'}</p>
                        </div>
                        <div className="mt-8">
                            <button onClick={onComplete} className="text-cyan-600 font-bold hover:underline">Return to Dashboard</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Screen Inspection Modal */}
            {showInspectionModal && (
                <DigitalInspection 
                    booking={booking}
                    mode="return"
                    // Pass reference photos from handover for comparison
                    // In a real app, these come from the booking.inspections data
                    handoverReferencePhotos={outboundPhotos}
                    onComplete={handleInspectionComplete}
                    onCancel={() => setShowInspectionModal(false)}
                />
            )}
        </div>
    );
};

export default RentalSessionWizard;
