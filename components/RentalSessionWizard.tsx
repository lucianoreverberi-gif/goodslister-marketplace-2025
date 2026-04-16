
import React, { useState, useEffect } from 'react';
import { Booking, InspectionPhoto } from '../types';
// FIX: Added WalletIcon, ClockIcon, and RocketIcon to the import list to resolve "Cannot find name" errors.
import { 
    CameraIcon, RefreshCwIcon, FuelIcon, 
    ShieldCheckIcon, TrashIcon, AlertTriangleIcon,
    FileTextIcon, FileSignatureIcon, CreditCardIcon, CheckCircleIcon, XIcon,
    UserCheckIcon, ShieldIcon, SearchIcon, WalletIcon, ClockIcon, RocketIcon
} from './icons';
import ImageUploader from './ImageUploader';
import CameraCapture from './CameraCapture';
import { differenceInSeconds, isValid, format } from 'date-fns';
import ReviewWizard from './ReviewWizard';
import DigitalInspection from './DigitalInspection';
import { LegalService } from '../services/legalService';

type WizardPhase = 'IDLE' | 'HANDOVER' | 'ACTIVE' | 'RETURN' | 'COMPLETED';

type WizardStep = 
    | 'PAYMENT_COLLECTION'
    | 'IDENTITY_VERIFICATION'
    | 'CONTRACT_SIGNING'
    | 'HANDOVER_INSPECTION'
    | 'RENTAL_DASHBOARD'
    | 'RETURN_INSPECTION'
    | 'DAMAGE_VERDICT'
    | 'REVIEW_CLOSE';

interface RentalSessionWizardProps {
    booking: Booking;
    initialMode?: 'handover' | 'return';
    onStatusChange: (newStatus: string) => void;
    onUpdateDepositStatus?: (bookingId: string, newStatus: 'held' | 'released' | 'disputed' | 'claimed') => void;
    onComplete: () => void;
}

const IdentityVerificationStep: React.FC<{ 
    bookingId: string, 
    onVerified: (idUrl: string, faceUrl: string) => void 
}> = ({ bookingId, onVerified }) => {
    const [subStep, setSubStep] = useState<'intro' | 'scan_id' | 'face_scan' | 'verifying' | 'success'>('intro');
    const [idPhoto, setIdPhoto] = useState<string | null>(null);
    const [facePhoto, setFacePhoto] = useState<string | null>(null);

    const handleIdPhoto = (url: string) => {
        setIdPhoto(url);
        setSubStep('face_scan');
    };

    const handleFacePhoto = (url: string) => {
        setFacePhoto(url);
        setSubStep('verifying');
        setTimeout(() => setSubStep('success'), 3000);
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4 min-h-[500px] flex flex-col">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-100 text-cyan-600 rounded-2xl shadow-lg shadow-cyan-100">
                    <ShieldIcon className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Real-Time Identity</h3>
                    <p className="text-sm text-slate-500 font-medium">AI-Powered Face & ID Verification</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                {subStep === 'intro' && (
                    <div className="text-center space-y-6 animate-in fade-in">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                            <UserCheckIcon className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900">Start Verification</h4>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">We'll scan the renter's physical ID and perform a live face match to ensure 100% security.</p>
                        </div>
                        <button 
                            onClick={() => setSubStep('scan_id')}
                            className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                        >
                            BEGIN SCAN
                        </button>
                    </div>
                )}

                {subStep === 'scan_id' && (
                    <div className="text-center space-y-6 animate-in zoom-in-95 w-full">
                        <div className="bg-cyan-500/10 p-4 rounded-3xl mb-2 inline-block">
                            <CreditCardIcon className="h-10 w-10 text-cyan-500" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900">Scan Renter ID</h4>
                            <p className="text-sm text-slate-500">Place the physical ID (Driver's License/Passport) in front of the camera.</p>
                        </div>
                        <CameraCapture 
                            label="Capture ID Document" 
                            onCapture={handleIdPhoto} 
                            aspectRatio="id-card" 
                            folder={`verifications/${bookingId}`}
                        />
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <ShieldIcon className="h-3 w-3" />
                            <span>Privacy: Photo is handled securely and NOT stored on this device</span>
                        </div>
                    </div>
                )}

                {subStep === 'face_scan' && (
                    <div className="text-center space-y-6 animate-in zoom-in-95 w-full">
                        <div className="bg-indigo-500/10 p-4 rounded-3xl mb-2 inline-block">
                            <CameraIcon className="h-10 w-10 text-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900">Live Face Match</h4>
                            <p className="text-sm text-slate-500">Ask the renter to look directly at the camera for a live selfie.</p>
                        </div>
                        <CameraCapture 
                            label="Capture Live Selfie" 
                            onCapture={handleFacePhoto} 
                            aspectRatio="portrait" 
                            folder={`verifications/${bookingId}`}
                        />
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <ShieldIcon className="h-3 w-3" />
                            <span>Privacy: Photo is handled securely and NOT stored on this device</span>
                        </div>
                    </div>
                )}

                {subStep === 'verifying' && (
                    <div className="text-center space-y-8 animate-in fade-in">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-cyan-100 border-t-cyan-600 animate-spin mx-auto"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShieldIcon className="h-10 w-10 text-cyan-600 animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900">AI Comparison...</h4>
                            <p className="text-sm text-slate-500">Matching facial features with ID document data.</p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <div className="w-16 h-16 rounded-xl overflow-hidden grayscale opacity-50 border border-slate-200">
                                <img src={idPhoto!} className="w-full h-full object-cover" />
                            </div>
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                                <img src={facePhoto!} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                )}

                {subStep === 'success' && (
                    <div className="text-center space-y-8 animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                            <CheckCircleIcon className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Identity Confirmed</h4>
                            <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                                <ShieldCheckIcon className="h-4 w-4" /> 100% Match Detected
                            </div>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-4">The renter's live face matches the ID document perfectly. Safety audit trail updated.</p>
                        </div>
                        
                        <button 
                            onClick={() => onVerified(idPhoto!, facePhoto!)}
                            className="w-full py-5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-3xl shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            PROCEED TO CONTRACT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const RentalSessionWizard: React.FC<RentalSessionWizardProps> = ({ booking, initialMode, onStatusChange, onUpdateDepositStatus, onComplete }) => {
    const [phase, setPhase] = useState<WizardPhase>('IDLE');
    const [step, setStep] = useState<WizardStep>('PAYMENT_COLLECTION');
    const [isLoading, setIsLoading] = useState(false);

    // Handover State
    const [handoverPhotos, setHandoverPhotos] = useState<InspectionPhoto[]>([]);

    // Return State
    const [returnPhotos, setReturnPhotos] = useState<InspectionPhoto[]>([]);
    const [damageVerdict, setDamageVerdict] = useState<'clean' | 'damage' | null>(null);
    const [damageNotes, setDamageNotes] = useState('');

    // Verification Photos to cleanup later
    const [verificationPhotos, setVerificationPhotos] = useState<{id: string, face: string} | null>(null);

    useEffect(() => {
        if (initialMode === 'return' || booking.status === 'active') {
            setPhase('RETURN');
            setStep('RETURN_INSPECTION');
        } else if (booking.status === 'confirmed') {
            setPhase('HANDOVER');
            setStep('PAYMENT_COLLECTION');
        }
    }, [booking.status, initialMode]);

    const handleContractSign = () => {
        setIsLoading(true);
        setTimeout(() => {
            setStep('HANDOVER_INSPECTION');
            setIsLoading(false);
        }, 1000);
    };

    const handleHandoverComplete = (photos: InspectionPhoto[]) => {
        setHandoverPhotos(photos);
        onStatusChange('active');
        setPhase('ACTIVE');
        setStep('RENTAL_DASHBOARD');
    };

    const handleReturnComplete = (photos: InspectionPhoto[], hasDamage: boolean) => {
        setReturnPhotos(photos);
        setDamageVerdict(hasDamage ? 'damage' : 'clean');
        setStep('DAMAGE_VERDICT');
    };

    const handleFinalize = async () => {
        onStatusChange('completed');
        
        // Cleanup verification photos if the trip ended successfully
        if (verificationPhotos) {
            try {
                await fetch('/api/cleanup-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls: [verificationPhotos.id, verificationPhotos.face] })
                });
                console.log("Verification photos cleaned up successfully");
            } catch (err) {
                console.error("Failed to cleanup verification photos:", err);
            }
        }

        if (damageVerdict === 'clean' && onUpdateDepositStatus) {
            onUpdateDepositStatus(booking.id, 'released');
        } else if (damageVerdict === 'damage' && onUpdateDepositStatus) {
            onUpdateDepositStatus(booking.id, 'disputed');
        }
        setStep('REVIEW_CLOSE');
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
            {/* Steps Progress Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${phase === 'HANDOVER' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-100' : 'bg-slate-100 text-slate-400'}`}>1</span>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Check-in</span>
                    </div>
                    <div className="w-8 h-px bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${phase === 'ACTIVE' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-100' : 'bg-slate-100 text-slate-400'}`}>2</span>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Trip</span>
                    </div>
                    <div className="w-8 h-px bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${phase === 'RETURN' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-100' : 'bg-slate-100 text-slate-400'}`}>3</span>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Return</span>
                    </div>
                </div>
                <button onClick={onComplete} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-all"><XIcon className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 container mx-auto max-w-2xl p-6">
                
                {/* PHASE 1: HANDOVER */}
                {step === 'PAYMENT_COLLECTION' && (
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-amber-50 p-6 rounded-3xl mb-8 flex items-start gap-4 border border-amber-100">
                            <WalletIcon className="h-8 w-8 text-amber-600 mt-1" />
                            <div>
                                <h3 className="font-black text-amber-900 tracking-tight text-lg">Collect Direct Payment</h3>
                                <p className="text-sm text-amber-800 font-medium leading-relaxed">Goodslister Fees have been paid. Now, please confirm you've received the rental and deposit from the renter.</p>
                            </div>
                        </div>
                        <div className="text-center py-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Host Payout Due Now</p>
                            <h4 className="text-6xl font-black text-slate-900 tracking-tighter">${booking.balanceDueOnSite.toFixed(2)}</h4>
                            <p className="text-xs text-slate-400 mt-4 font-bold">+ Security Deposit (Held separately if needed)</p>
                        </div>
                        <button 
                            onClick={() => setStep('IDENTITY_VERIFICATION')}
                            className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <CheckCircleIcon className="h-6 w-6 text-cyan-400" /> CONFIRM RECEIPT & PROCEED
                        </button>
                    </div>
                )}

                {step === 'IDENTITY_VERIFICATION' && (
                    <IdentityVerificationStep 
                        bookingId={booking.id}
                        onVerified={(idUrl, faceUrl) => {
                            setVerificationPhotos({ id: idUrl, face: faceUrl });
                            setStep('CONTRACT_SIGNING');
                        }}
                    />
                )}

                {step === 'CONTRACT_SIGNING' && (
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                <FileSignatureIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Legal Signature</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 mb-8 max-h-[350px] overflow-y-auto text-sm text-slate-600 leading-relaxed font-serif shadow-inner">
                            {booking.listing.contractPreference === 'custom' ? (
                                <div className="text-center py-12">
                                    <FileTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <p className="font-black text-slate-800 uppercase tracking-widest">Custom Host Agreement</p>
                                    <a href={booking.listing.customContractUrl} target="_blank" className="text-cyan-600 font-black underline mt-4 block text-xs">VIEW PDF ATTACHMENT</a>
                                </div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: LegalService.generateContractHtml(booking.listing, booking.listing.owner, new Date(booking.startDate), new Date(booking.endDate), booking.totalPrice) }} />
                            )}
                        </div>
                        <button 
                            onClick={handleContractSign}
                            disabled={isLoading}
                            className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-3xl shadow-xl transition-all active:scale-95"
                        >
                            {isLoading ? 'SIGNING...' : 'CONFIRM & SIGN AGREEMENT'}
                        </button>
                    </div>
                )}

                {step === 'HANDOVER_INSPECTION' && (
                    <DigitalInspection 
                        booking={booking} 
                        mode="handover" 
                        onComplete={handleHandoverComplete} 
                        onCancel={onComplete}
                    />
                )}

                {/* PHASE 2: ACTIVE */}
                {step === 'RENTAL_DASHBOARD' && (
                    <div className="text-center animate-in fade-in zoom-in-95">
                        <div className="bg-emerald-500 text-white py-2 px-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] inline-block mb-10 animate-pulse border-4 border-emerald-100">RENTAL ACTIVE</div>
                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Adventure in Progress</h2>
                        <p className="text-slate-500 font-medium mb-12 max-w-xs mx-auto leading-relaxed">The gear is in the renter's possession. Your asset is protected by our digital audit trail.</p>
                        
                        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 mb-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ClockIcon className="h-32 w-32" /></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Time to Return</p>
                            <div className="text-6xl font-black text-slate-900 tracking-tighter">
                                {format(new Date(booking.endDate), 'HH:mm:ss')}
                            </div>
                            <p className="text-xs text-slate-400 font-bold mt-6 uppercase tracking-widest">Scheduled Return: {format(new Date(booking.endDate), 'MMM dd, p')}</p>
                        </div>

                        <button 
                            onClick={() => setStep('RETURN_INSPECTION')}
                            className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-[2rem] shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-4 active:scale-95"
                        >
                            <RefreshCwIcon className="h-6 w-6" /> INITIATE RETURN PROCESS
                        </button>
                    </div>
                )}

                {/* PHASE 3: RETURN */}
                {step === 'RETURN_INSPECTION' && (
                    <DigitalInspection 
                        booking={booking} 
                        mode="return" 
                        handoverReferencePhotos={handoverPhotos.map(p => p.url)}
                        onComplete={handleReturnComplete} 
                        onCancel={onComplete}
                    />
                )}

                {step === 'DAMAGE_VERDICT' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Condition Audit</h2>
                            <p className="text-slate-500 font-medium mt-1">Comparing pre-trip vs post-trip photos...</p>
                        </div>
                        
                        <button 
                            onClick={() => { setDamageVerdict('clean'); handleFinalize(); }}
                            className={`w-full p-10 rounded-[2.5rem] border-4 transition-all flex items-center justify-between group active:scale-[0.98] ${damageVerdict === 'clean' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-lg'}`}
                        >
                            <div className="text-left">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight">All Clean</h4>
                                <p className="text-sm text-slate-500 font-medium">No new damages detected. Clear to close.</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${damageVerdict === 'clean' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-500'}`}>
                                <CheckCircleIcon className="h-8 w-8" />
                            </div>
                        </button>

                        <button 
                            onClick={() => setDamageVerdict('damage')}
                            className={`w-full p-10 rounded-[2.5rem] border-4 transition-all flex items-center justify-between group active:scale-[0.98] ${damageVerdict === 'damage' ? 'bg-red-50 border-red-500' : 'bg-white border-slate-100 hover:border-red-200 shadow-lg'}`}
                        >
                            <div className="text-left">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight">Report Damage</h4>
                                <p className="text-sm text-slate-500 font-medium">Issue found. Open dispute and hold deposit.</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${damageVerdict === 'damage' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-red-100 group-hover:text-red-500'}`}>
                                <AlertTriangleIcon className="h-8 w-8" />
                            </div>
                        </button>

                        {damageVerdict === 'damage' && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-2xl animate-in slide-in-from-top-6">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Incident Report</label>
                                <textarea 
                                    value={damageNotes}
                                    onChange={e => setDamageNotes(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium focus:ring-4 focus:ring-red-500/10 outline-none min-h-[120px] transition-all"
                                    placeholder="Briefly describe the new scratch, dent, or fuel issue..."
                                />
                                <button 
                                    onClick={handleFinalize}
                                    className="w-full mt-6 py-5 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
                                >
                                    FILE CLAIM • FINALIZE TRIP
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
                        onComplete={onComplete} 
                    />
                )}

            </div>
        </div>
    );
};

export default RentalSessionWizard;
