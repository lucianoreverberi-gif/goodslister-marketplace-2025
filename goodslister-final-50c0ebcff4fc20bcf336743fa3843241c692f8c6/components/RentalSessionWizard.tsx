
import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto, User } from '../types';
import { 
    CameraIcon, RefreshCwIcon, FuelIcon, 
    ShieldCheckIcon, TrashIcon, AlertTriangleIcon, 
    ScanIcon, BrainCircuitIcon, CheckCircleIcon, UserCheckIcon, XIcon, FileSignatureIcon, PenToolIcon, ClockIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { differenceInSeconds, format } from 'date-fns';
import ReviewWizard from './ReviewWizard';
import DigitalInspection from './DigitalInspection';
import { LegalService } from '../services/legalService';

type WizardPhase = 'IDLE' | 'HANDOVER' | 'ACTIVE' | 'RETURN' | 'COMPLETED';
type WizardStep = 'PAYMENT_CHECK' | 'ID_SCAN' | 'CONTRACT_SIGNATURE' | 'HANDOVER_DOCUMENTATION' | 'RENTAL_DASHBOARD' | 'INBOUND_INSPECTION' | 'DAMAGE_ASSESSMENT' | 'REVIEW_CLOSE';

interface RentalSessionWizardProps {
    booking: Booking;
    initialMode?: 'handover' | 'return';
    onStatusChange: (newStatus: string) => void | Promise<void>;
    onComplete: () => void;
}

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        const timer = setInterval(() => {
            const end = new Date(endDate);
            const now = new Date();
            const diff = differenceInSeconds(end, now);
            if (diff <= 0) { setTimeLeft('Time is up!'); clearInterval(timer); } 
            else {
                const hours = Math.floor(diff / 3600);
                const mins = Math.floor((diff % 3600) / 60);
                const secs = diff % 60;
                setTimeLeft(`${hours}h ${mins}m ${secs}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [endDate]);
    return <p className="text-4xl font-black text-gray-900 tracking-tighter">{timeLeft}</p>;
};

const RentalSessionWizard: React.FC<RentalSessionWizardProps> = ({ booking, initialMode, onStatusChange, onComplete }) => {
    const [phase, setPhase] = useState<WizardPhase>('IDLE');
    const [step, setStep] = useState<WizardStep>('PAYMENT_CHECK');
    const [isLoading, setIsLoading] = useState(false);

    // Session Data
    const [idFront, setIdFront] = useState('');
    const [outboundPhotos, setOutboundPhotos] = useState<InspectionPhoto[]>([]);
    const [inboundPhotos, setInboundPhotos] = useState<InspectionPhoto[]>([]);
    const [signatureName, setSignatureName] = useState('');

    // Return Data
    const [showInspectionModal, setShowInspectionModal] = useState(false);
    const [damageVerdict, setDamageVerdict] = useState<'clean' | 'damage' | null>(null);
    const [damageNotes, setDamageNotes] = useState('');

    useEffect(() => {
        if (initialMode === 'return' || booking.status === 'active') {
            setPhase('RETURN'); setStep('INBOUND_INSPECTION'); return;
        }
        if (booking.status === 'confirmed') {
            setPhase('HANDOVER'); setStep('PAYMENT_CHECK');
        } else if (booking.status === 'completed') {
            setPhase('COMPLETED');
        }
    }, [booking.status, initialMode]);

    const handleStartRental = async () => {
        setIsLoading(true);
        try {
            await onStatusChange('active');
            setPhase('ACTIVE');
            setStep('RENTAL_DASHBOARD');
        } catch (e) { alert("Failed to start rental."); }
        finally { setIsLoading(false); }
    };

    const handleInspectionComplete = (capturedPhotos: InspectionPhoto[], damageDetected: boolean) => {
        setShowInspectionModal(false);
        if (phase === 'HANDOVER') {
            setOutboundPhotos(capturedPhotos);
            handleStartRental();
        } else {
            setInboundPhotos(capturedPhotos);
            if (damageDetected) setDamageVerdict('damage');
            setStep('DAMAGE_ASSESSMENT');
        }
    };

    const renderContractSignature = () => {
        const renterMock: User = { name: 'Renter' } as any;
        const contractHtml = LegalService.generateContractHtml(booking.listing, renterMock, new Date(booking.startDate), new Date(booking.endDate), booking.totalPrice);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-2xl mx-auto">
                <div className="text-center">
                    <h3 className="text-2xl font-black text-gray-900">Legal Agreement</h3>
                    <p className="text-gray-500 text-sm">Review on owner device before key handover.</p>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 h-64 overflow-y-auto shadow-inner prose prose-xs" 
                     dangerouslySetInnerHTML={{ __html: contractHtml }} />

                <div className="bg-cyan-50 p-6 rounded-2xl border border-cyan-100 space-y-4">
                    <label className="block text-xs font-black text-cyan-800 uppercase tracking-widest">Renter Signature (Full Name)</label>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            value={signatureName}
                            onChange={e => setSignatureName(e.target.value)}
                            className="flex-1 bg-white border-gray-200 rounded-xl px-4 py-3 text-lg font-serif italic shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="Type Full Name"
                        />
                        <button 
                            onClick={() => setShowInspectionModal(true)}
                            disabled={signatureName.length < 5}
                            className="px-8 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            <PenToolIcon className="h-5 w-5" /> Sign & Inspect
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderHandoverStep = () => {
        if (step === 'PAYMENT_CHECK') return (
            <div className="space-y-6 animate-in fade-in max-w-md mx-auto py-10">
                 <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 shadow-sm text-center">
                    <h3 className="font-bold text-amber-900 text-lg uppercase tracking-widest text-[10px]">Balance Due on Pickup</h3>
                    <p className="text-5xl font-black text-amber-600 mt-2 tracking-tighter">${booking.balanceDueOnSite.toFixed(2)}</p>
                    <p className="text-xs text-amber-700 mt-4 font-medium">Confirm payment arrival before key exchange.</p>
                </div>
                <button onClick={() => setStep('ID_SCAN')} className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Received →</button>
            </div>
        );
        
        if (step === 'ID_SCAN') return (
            <div className="space-y-6 max-w-md mx-auto py-10">
                <div className="text-center">
                    <h3 className="text-2xl font-black">Identity Check</h3>
                    <p className="text-gray-500">Scan Renter's Official ID</p>
                </div>
                <ImageUploader label="" currentImageUrl={idFront} onImageChange={setIdFront} />
                <button onClick={() => setStep('CONTRACT_SIGNATURE')} disabled={!idFront} className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl disabled:opacity-50">Proceed to Contract</button>
            </div>
        );

        if (step === 'CONTRACT_SIGNATURE') return renderContractSignature();
        return null;
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col p-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-900 p-2 rounded-lg text-white"><ScanIcon className="h-5 w-5" /></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Rental Session</p>
                        <h2 className="font-bold text-gray-900">{booking.listing.title}</h2>
                    </div>
                </div>
            </div>

            {phase === 'HANDOVER' && renderHandoverStep()}
            
            {step === 'RENTAL_DASHBOARD' && (
                <div className="max-w-md mx-auto w-full space-y-6 py-20 text-center">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-cyan-500 to-green-500"></div>
                        <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-4">Adventure in Progress</p>
                        <CountdownTimer endDate={booking.endDate} />
                    </div>
                    <button onClick={() => { setPhase('RETURN'); setStep('INBOUND_INSPECTION'); }} className="w-full py-5 bg-gray-900 text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl">
                        <RefreshCwIcon className="h-6 w-6" /> Receive & Inspect Return
                    </button>
                </div>
            )}

            {phase === 'RETURN' && (
                <div className="max-w-md mx-auto w-full py-10">
                    {step === 'INBOUND_INSPECTION' && (
                        <div className="text-center space-y-6">
                            <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <ScanIcon className="h-12 w-12 text-orange-600" />
                            </div>
                            <h3 className="text-3xl font-black tracking-tighter">Return Protocol</h3>
                            <p className="text-gray-500">Perform the mandatory timestamped comparison scan.</p>
                            <button onClick={() => setShowInspectionModal(true)} className="w-full py-5 bg-orange-600 text-white font-black rounded-3xl shadow-xl">Start Verification Scan</button>
                        </div>
                    )}
                    
                    {step === 'DAMAGE_ASSESSMENT' && (
                        <div className="space-y-4">
                             <h3 className="text-2xl font-black text-center mb-6">Security Results</h3>
                             <button onClick={() => { setDamageVerdict('clean'); setStep('REVIEW_CLOSE'); }} className="w-full p-8 bg-green-50 border-2 border-green-500 rounded-[32px] text-left">
                                <div className="flex justify-between items-center"><p className="font-black text-green-800 text-xl italic">CLEAN RETURN</p><CheckCircleIcon className="h-8 w-8 text-green-500" /></div>
                             </button>
                             <button onClick={() => setDamageVerdict('damage')} className={`w-full p-8 bg-red-50 border-2 border-red-500 rounded-[32px] text-left transition-all ${damageVerdict === 'damage' ? 'ring-4 ring-red-100' : ''}`}>
                                <div className="flex justify-between items-center"><p className="font-black text-red-800 text-xl italic">REPORT DAMAGE</p><AlertTriangleIcon className="h-8 w-8 text-red-500" /></div>
                             </button>
                             
                             {damageVerdict === 'damage' && (
                                 <div className="space-y-4 animate-in slide-in-from-top-4 mt-6">
                                     <textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)} className="w-full p-5 border-gray-200 rounded-[24px] shadow-inner text-sm" placeholder="Evidence description..." rows={4} />
                                     <button onClick={() => setStep('REVIEW_CLOSE')} disabled={!damageNotes} className="w-full py-5 bg-red-600 text-white font-black rounded-[24px]">Continue with Claim</button>
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
                            onComplete={() => onStatusChange('completed').then(() => setPhase('COMPLETED'))} 
                        />
                    )}
                </div>
            )}

            {phase === 'COMPLETED' && (
                <div className="text-center py-20 animate-in zoom-in-95">
                    <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircleIcon className="h-16 w-16 text-green-600" /></div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Done. Secure.</h2>
                    <button onClick={onComplete} className="mt-12 px-10 py-4 bg-gray-900 text-white font-black rounded-full shadow-xl hover:scale-105 transition-all">Archive Session</button>
                </div>
            )}

            {showInspectionModal && (
                <DigitalInspection 
                    booking={booking} 
                    mode={phase === 'HANDOVER' ? 'handover' : 'return'} 
                    handoverReferencePhotos={outboundPhotos} 
                    onComplete={handleInspectionComplete} 
                    onCancel={() => setShowInspectionModal(false)} 
                />
            )}
        </div>
    );
};

export default RentalSessionWizard;
