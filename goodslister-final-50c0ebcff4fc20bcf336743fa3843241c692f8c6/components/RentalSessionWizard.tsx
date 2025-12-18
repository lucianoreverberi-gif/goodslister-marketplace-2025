import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto } from '../types';
import { 
    CameraIcon, RefreshCwIcon, FuelIcon, 
    ShieldCheckIcon, TrashIcon, AlertTriangleIcon, 
    ScanIcon, BrainCircuitIcon, CheckCircleIcon, UserCheckIcon, XIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { differenceInSeconds } from 'date-fns';
import ReviewWizard from './ReviewWizard';
import DigitalInspection from './DigitalInspection';

type WizardPhase = 'IDLE' | 'HANDOVER' | 'ACTIVE' | 'RETURN' | 'COMPLETED';
type WizardStep = 'PAYMENT_CHECK' | 'ID_SCAN' | 'HANDOVER_DOCUMENTATION' | 'RENTAL_DASHBOARD' | 'INBOUND_INSPECTION' | 'DAMAGE_ASSESSMENT' | 'REVIEW_CLOSE';

interface IdAnalysis {
    extractedName: string;
    dob: string;
    expiryDate: string;
    docNumber: string;
    isExpired: boolean;
    nameMatchScore: number;
    verificationStatus: 'verified' | 'flagged' | 'manual_check';
    summary: string;
}

interface RentalSessionWizardProps {
    booking: Booking;
    initialMode?: 'handover' | 'return';
    onStatusChange: (newStatus: string) => void | Promise<void>;
    onComplete: () => void;
}

// FIX: Added CountdownTimer component which was missing
const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
        const timer = setInterval(() => {
            const end = new Date(endDate);
            const now = new Date();
            const diff = differenceInSeconds(end, now);
            
            if (diff <= 0) {
                setTimeLeft('Time is up!');
                clearInterval(timer);
            } else {
                const hours = Math.floor(diff / 3600);
                const mins = Math.floor((diff % 3600) / 60);
                const secs = diff % 60;
                setTimeLeft(`${hours}h ${mins}m ${secs}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [endDate]);

    return <p className="text-4xl font-black text-gray-900">{timeLeft}</p>;
};

const RentalSessionWizard: React.FC<RentalSessionWizardProps> = ({ booking, initialMode, onStatusChange, onComplete }) => {
    const [phase, setPhase] = useState<WizardPhase>('IDLE');
    const [step, setStep] = useState<WizardStep>('PAYMENT_CHECK');
    const [isLoading, setIsLoading] = useState(false);

    // Handover Data
    const [balanceConfirmed, setBalanceConfirmed] = useState(false);
    const [idFront, setIdFront] = useState('');
    const [isAnalyzingId, setIsAnalyzingId] = useState(false);
    const [idAnalysis, setIdAnalysis] = useState<IdAnalysis | null>(null);
    const [outboundPhotos, setOutboundPhotos] = useState<string[]>([]);
    const [waiverSigned, setWaiverSigned] = useState(false);

    // Return Data - FIX: Added missing states for return phase and damage assessment
    const [showInspectionModal, setShowInspectionModal] = useState(false);
    const [damageVerdict, setDamageVerdict] = useState<'clean' | 'damage' | null>(null);
    const [damageNotes, setDamageNotes] = useState('');
    const [isFilingClaim, setIsFilingClaim] = useState(false);

    useEffect(() => {
        if (initialMode === 'return' || booking.status === 'active') {
            setPhase('RETURN'); 
            setStep('INBOUND_INSPECTION'); 
            return;
        }
        if (booking.status === 'confirmed') {
            setPhase('HANDOVER'); 
            setStep('PAYMENT_CHECK');
        } else if (booking.status === 'completed') {
            setPhase('COMPLETED');
        }
    }, [booking.status, initialMode]);

    const handleAnalyzeID = async () => {
        if (!idFront) return;
        setIsAnalyzingId(true);
        try {
            const res = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'analyze-id', 
                    frontImageBase64: idFront,
                    expectedName: "The Renter" 
                })
            });
            if (res.ok) {
                const data = await res.json();
                setIdAnalysis(data);
            }
        } catch (e) {
            alert("AI Analysis failed. Please check the document manually.");
        } finally {
            setIsAnalyzingId(false);
        }
    };

    // FIX: Added missing handleStartRental function to activate the session
    const handleStartRental = async () => {
        setIsLoading(true);
        try {
            await onStatusChange('active');
            setPhase('ACTIVE');
            setStep('RENTAL_DASHBOARD');
        } catch (e) {
            alert("Failed to start rental.");
        } finally {
            setIsLoading(false);
        }
    };

    // FIX: Added missing handleFileClaim function for damage disputes
    const handleFileClaim = async () => {
        setIsFilingClaim(true);
        try {
            const res = await fetch('/api/disputes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    reporterId: booking.listing.owner.id,
                    reason: 'damage',
                    description: damageNotes
                })
            });
            if (res.ok) {
                setStep('REVIEW_CLOSE');
            }
        } catch (e) {
            alert("Failed to file claim.");
        } finally {
            setIsFilingClaim(false);
        }
    };

    // FIX: Added missing handleSessionFinished function to close the wizard
    const handleSessionFinished = async () => {
        await onStatusChange('completed');
        setPhase('COMPLETED');
    };

    // FIX: Added missing handleInspectionComplete function to process scan results
    const handleInspectionComplete = (photos: InspectionPhoto[], damageDetected: boolean) => {
        setShowInspectionModal(false);
        if (damageDetected) {
            setDamageVerdict('damage');
        }
        setStep('DAMAGE_ASSESSMENT');
    };

    const renderIdScanStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 max-w-md mx-auto">
            <div className="text-center">
                <div className="bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheckIcon className="h-8 w-8 text-cyan-600" />
                </div>
                <h3 className="font-bold text-xl">Identity Guard</h3>
                <p className="text-gray-500 text-sm">Photograph the renter's ID to verify their identity.</p>
            </div>

            <div className="relative group">
                <ImageUploader label="Front of Driver's License" currentImageUrl={idFront} onImageChange={setIdFront} />
                {idFront && !idAnalysis && !isAnalyzingId && (
                    <div className="mt-4">
                        <button 
                            onClick={handleAnalyzeID}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            <BrainCircuitIcon className="h-5 w-5" /> Verify with AI
                        </button>
                    </div>
                )}
            </div>

            {isAnalyzingId && (
                <div className="bg-white p-6 rounded-xl border border-indigo-100 text-center space-y-4 shadow-sm animate-pulse">
                    <div className="relative h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500 w-1/2 animate-[progress_1.5s_infinite]"></div>
                    </div>
                    <p className="text-sm font-bold text-indigo-600">AI is analyzing document security features...</p>
                </div>
            )}

            {idAnalysis && (
                <div className={`p-5 rounded-2xl border-2 animate-in zoom-in-95 ${idAnalysis.verificationStatus === 'verified' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        {idAnalysis.verificationStatus === 'verified' ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : (
                            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
                        )}
                        <h4 className={`font-bold ${idAnalysis.verificationStatus === 'verified' ? 'text-green-800' : 'text-red-800'}`}>
                            {idAnalysis.verificationStatus === 'verified' ? 'AI Verified Match' : 'Potential Flag'}
                        </h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 text-xs">
                        <div><p className="text-gray-500 font-bold uppercase">Extracted Name</p><p className="text-gray-900 font-medium">{idAnalysis.extractedName}</p></div>
                        <div><p className="text-gray-500 font-bold uppercase">Match Score</p><p className="text-gray-900 font-medium">{idAnalysis.nameMatchScore}%</p></div>
                        <div><p className="text-gray-500 font-bold uppercase">Expiry Date</p><p className={`${idAnalysis.isExpired ? 'text-red-600 font-bold' : 'text-gray-900'}`}>{idAnalysis.expiryDate}</p></div>
                        <div><p className="text-gray-500 font-bold uppercase">Status</p><p className="text-gray-900 font-medium">{idAnalysis.isExpired ? 'EXPIRED' : 'VALID'}</p></div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <p className="text-[11px] text-gray-600 italic">"{idAnalysis.summary}"</p>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={() => setStep('PAYMENT_CHECK')} className="px-6 py-3 text-gray-500 font-bold">Back</button>
                <button 
                    onClick={() => setStep('HANDOVER_DOCUMENTATION')} 
                    disabled={!idFront || (idAnalysis && idAnalysis.verificationStatus === 'flagged')}
                    className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl disabled:opacity-50"
                >
                    Confirm & Proceed
                </button>
            </div>

            <p className="text-[10px] text-center text-gray-400">
                Security Note: ID photos are used for verification only and are not stored in our public servers.
            </p>
            <style>{` @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } } `}</style>
        </div>
    );

    const renderHandoverStep = () => {
        if (step === 'PAYMENT_CHECK') return (
            <div className="space-y-6 animate-in fade-in max-w-md mx-auto">
                 <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm text-center">
                    <h3 className="font-bold text-amber-900 text-lg">Balance Due on Pickup</h3>
                    <p className="text-4xl font-black text-amber-600 mt-2">${booking.balanceDueOnSite.toFixed(2)}</p>
                    <p className="text-xs text-amber-700 mt-4">Confirm receipt via Zelle, CashApp or Cash before proceeding.</p>
                </div>
                <label className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 cursor-pointer">
                    <input type="checkbox" checked={balanceConfirmed} onChange={e => setBalanceConfirmed(e.target.checked)} className="mt-1" />
                    <span className="text-sm font-medium">I have received the full balance.</span>
                </label>
                <button onClick={() => setStep('ID_SCAN')} disabled={!balanceConfirmed} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50">Next: Identity Check</button>
            </div>
        );
        if (step === 'ID_SCAN') return renderIdScanStep();
        if (step === 'HANDOVER_DOCUMENTATION') return (
            <div className="space-y-6 animate-in fade-in max-w-md mx-auto">
                 <h3 className="text-xl font-bold text-center">Equipment Condition</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {outboundPhotos.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                            <img src={url} className="w-full h-full object-cover" />
                        </div>
                    ))}
                    <div className="aspect-video"><ImageUploader label="+ Add Photo" currentImageUrl="" onImageChange={u => setOutboundPhotos([...outboundPhotos, u])} /></div>
                 </div>
                 <label className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer">
                    <input type="checkbox" checked={waiverSigned} onChange={e => setWaiverSigned(e.target.checked)} />
                    <span className="text-xs text-blue-900">I confirm the Renter has signed the Liability Waiver and understood safety rules.</span>
                 </label>
                 <button onClick={handleStartRental} disabled={isLoading || outboundPhotos.length < 2 || !waiverSigned} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50">
                    {isLoading ? 'Starting...' : 'Start Rental 🚀'}
                 </button>
            </div>
        );
        return null;
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col p-6">
            {(phase === 'HANDOVER' || phase === 'IDLE') && renderHandoverStep()}
            
            {step === 'RENTAL_DASHBOARD' && (
                <div className="max-w-md mx-auto w-full space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Session Active</p>
                        <CountdownTimer endDate={booking.endDate} />
                    </div>
                    <button onClick={() => { setPhase('RETURN'); setStep('INBOUND_INSPECTION'); }} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                        <RefreshCwIcon className="h-5 w-5" /> End Rental & Inspect
                    </button>
                </div>
            )}

            {phase === 'RETURN' && step !== 'RENTAL_DASHBOARD' && (
                <div className="max-w-md mx-auto w-full">
                    {step === 'INBOUND_INSPECTION' && (
                        <div className="text-center py-10 space-y-6">
                            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                                <ScanIcon className="h-10 w-10 text-orange-600" />
                            </div>
                            <h3 className="text-2xl font-bold">Return Inspection</h3>
                            <p className="text-gray-500">Scan the equipment one last time before closing the session.</p>
                            <button onClick={() => setShowInspectionModal(true)} className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg">Start Scan</button>
                        </div>
                    )}
                    
                    {step === 'DAMAGE_ASSESSMENT' && (
                        <div className="space-y-6">
                             <h3 className="text-xl font-bold text-center">Final Verdict</h3>
                             <button onClick={() => { setDamageVerdict('clean'); setStep('REVIEW_CLOSE'); }} className="w-full p-6 bg-green-50 border-2 border-green-500 rounded-2xl text-left">
                                <p className="font-bold text-green-800 text-lg">No New Damage</p>
                                <p className="text-green-600 text-sm">Security deposit will be released shortly.</p>
                             </button>
                             <button onClick={() => setDamageVerdict('damage')} className={`w-full p-6 bg-red-50 border-2 border-red-500 rounded-2xl text-left ${damageVerdict === 'damage' ? 'ring-4 ring-red-100' : ''}`}>
                                <p className="font-bold text-red-800 text-lg">Damage/Fuel Issues</p>
                                <p className="text-red-600 text-sm">Freeze deposit and file a claim.</p>
                             </button>
                             
                             {damageVerdict === 'damage' && (
                                 <div className="space-y-4 animate-in fade-in">
                                     <textarea 
                                        value={damageNotes} 
                                        onChange={e => setDamageNotes(e.target.value)} 
                                        className="w-full p-4 border rounded-xl" 
                                        placeholder="Explain the issue..." 
                                        rows={3} 
                                     />
                                     <button 
                                        onClick={handleFileClaim} 
                                        disabled={isFilingClaim || !damageNotes} 
                                        className="w-full py-4 bg-red-600 text-white font-bold rounded-xl"
                                     >
                                         {isFilingClaim ? 'Filing...' : 'Submit Claim'}
                                     </button>
                                 </div>
                             )}
                        </div>
                    )}
                    
                    {step === 'REVIEW_CLOSE' && (
                        <ReviewWizard 
                            bookingId={booking.id} 
                            authorId={booking.listing.owner.id} 
                            targetId={booking.renterId} 
                            targetName="Renter" 
                            role="HOST" 
                            onComplete={handleSessionFinished} 
                        />
                    )}
                </div>
            )}

            {phase === 'COMPLETED' && (
                <div className="text-center py-20 animate-in zoom-in-95">
                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Adventure Complete</h2>
                    <p className="text-gray-500 mt-2">The session is closed and archived.</p>
                    <button onClick={onComplete} className="mt-8 text-cyan-600 font-bold hover:underline">Back to Dashboard</button>
                </div>
            )}

            {/* Modal Injection - FIX: Resolved "Cannot find name" for showInspectionModal and its handlers */}
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
