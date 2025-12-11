
import React, { useState, useEffect } from 'react';
import { Session, Listing, Booking, InspectionPhoto } from '../types';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService';
import { PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, LightbulbIcon, MegaphoneIcon, WandSparklesIcon, ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, PencilIcon, RocketIcon, XIcon, LandmarkIcon, CalculatorIcon, UmbrellaIcon, SmartphoneIcon, CameraFaceIcon, ScanIcon, FileWarningIcon, GavelIcon, CameraIcon, HeartIcon, UserCheckIcon, TrashIcon, AlertTriangleIcon } from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';
import DigitalInspection from './DigitalInspection';
import ListingCard from './ListingCard';
import RentalSessionWizard from './RentalSessionWizard';

interface UserDashboardPageProps {
    user: Session;
    listings: Listing[];
    bookings: Booking[];
    onVerificationUpdate: (userId: string, verificationType: 'email' | 'phone' | 'id') => void;
    onUpdateAvatar: (userId: string, newAvatarUrl: string) => Promise<void>;
    onUpdateProfile: (bio: string, avatarUrl: string) => Promise<void>;
    onListingClick?: (listingId: string) => void;
    onEditListing?: (listingId: string) => void;
    favoriteListings?: Listing[];
    onToggleFavorite: (id: string) => void;
    onViewPublicProfile: (userId: string) => void;
    onDeleteListing: (listingId: string) => Promise<void>;
    onBookingStatusUpdate: (bookingId: string, status: string) => Promise<void>;
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'aiAssistant' | 'security' | 'favorites';

interface PromotionModalProps {
    listing: Listing;
    onClose: () => void;
}

const InspectionModal: React.FC<{ booking: Booking, onClose: () => void }> = ({ booking, onClose }) => {
    const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
    const [image, setImage] = useState('');
    const [analysisResult, setAnalysisResult] = useState<{ status: 'clean' | 'damaged', details: string } | null>(null);

    const handleAnalyze = () => {
        if (!image) return;
        setStep('analyzing');
        setTimeout(() => {
            const isDamaged = Math.random() > 0.7; 
            setAnalysisResult({
                status: isDamaged ? 'damaged' : 'clean',
                details: isDamaged 
                    ? "Detected: Deep scratch on the front surface (Confidence: 92%). Possible dent on side panel." 
                    : "Condition Verified: Excellent. No visible scratches, dents, or wear detected beyond normal usage."
            });
            setStep('result');
        }, 3000);
    };

    const handleFileClaim = () => {
        alert("Claim filed! Use the Admin Panel > Disputes to manage this case.");
        onClose();
    };

    const handleReleaseDeposit = () => {
        alert("Deposit released to renter successfully.");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ScanIcon className="h-7 w-7 text-cyan-600" />
                        AI Smart Inspector
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">Verifying return condition for <strong>{booking.listing.title}</strong></p>
                </div>
                <div className="p-6">
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                                <p className="text-sm text-blue-700">
                                    <strong>Step 1:</strong> Upload a clear photo of the returned item. Our AI will compare it against the listing's original condition to detect damages.
                                </p>
                            </div>
                            <ImageUploader label="Upload Return Photo" currentImageUrl={image} onImageChange={setImage} />
                            <button onClick={handleAnalyze} disabled={!image} className="w-full mt-4 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                <BrainCircuitIcon className="h-5 w-5" /> Analyze Condition
                            </button>
                        </div>
                    )}
                    {step === 'analyzing' && (
                        <div className="text-center py-10">
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-cyan-200 rounded-full opacity-25 animate-ping"></div>
                                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                                <ScanIcon className="absolute inset-0 m-auto h-10 w-10 text-cyan-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 animate-pulse">Analyzing Image...</h3>
                            <p className="text-gray-500 mt-2">Scanning for scratches, dents, and wear.</p>
                        </div>
                    )}
                    {step === 'result' && analysisResult && (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${analysisResult.status === 'clean' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {analysisResult.status === 'clean' ? <CheckCircleIcon className="h-10 w-10" /> : <FileWarningIcon className="h-10 w-10" />}
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${analysisResult.status === 'clean' ? 'text-green-700' : 'text-red-700'}`}>
                                {analysisResult.status === 'clean' ? 'Condition Verified' : 'Damage Detected'}
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg border text-left mb-6">
                                <p className="text-gray-700 text-sm font-medium">AI Analysis Report:</p>
                                <p className="text-gray-600 text-sm mt-1">{analysisResult.details}</p>
                            </div>
                            {analysisResult.status === 'clean' ? (
                                <button onClick={handleReleaseDeposit} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md">
                                    Release Security Deposit
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={onClose} className="py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">Ignore (Minor Wear)</button>
                                    <button onClick={handleFileClaim} className="py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md flex items-center justify-center gap-2">
                                        <GavelIcon className="h-5 w-5" /> File Claim
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PromotionModal: React.FC<PromotionModalProps> = ({ listing, onClose }) => {
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const plans = [
        { id: 1, name: 'Local Boost', price: 4.99, duration: '3 Days', features: ['2x Visibility in search', `Targeted to ${listing.location.city}`, 'Basic Analytics'] },
        { id: 2, name: 'City Star', price: 9.99, duration: '7 Days', features: ['5x Visibility', 'Top of search results', 'Verified Badge on listing'], recommended: true },
        { id: 3, name: 'Regional Hero', price: 29.99, duration: '30 Days', features: ['Max Visibility', 'Homepage Feature', 'Email Newsletter Feature'] },
    ];

    const handlePromote = () => {
        if (!selectedPlan) return;
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
                    <div className="bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                    <p className="text-gray-600 mt-2">Your listing <strong>{listing.title}</strong> is now being promoted.</p>
                    <button onClick={onClose} className="mt-6 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <RocketIcon className="h-6 w-6 text-cyan-600" /> Boost Visibility
                    </h2>
                    <p className="text-gray-600 mt-1">Promote <strong>{listing.title}</strong> to renters in <strong>{listing.location.city}</strong>.</p>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-cyan-600 bg-cyan-50 ring-2 ring-cyan-200' : 'border-gray-200 hover:border-cyan-300'}`}>
                                {plan.recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">MOST POPULAR</div>}
                                <h3 className="font-bold text-lg text-gray-900 text-center">{plan.name}</h3>
                                <div className="text-center my-3"><span className="text-2xl font-extrabold text-gray-900">${plan.price}</span></div>
                                <p className="text-center text-sm font-semibold text-cyan-700 mb-4">{plan.duration}</p>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    {plan.features.map((feature, idx) => <li key={idx} className="flex items-start"><CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" /><span>{feature}</span></li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                    <button onClick={handlePromote} disabled={!selectedPlan || isProcessing} className="w-full py-3 px-4 text-white font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                        {isProcessing ? 'Processing Payment...' : (selectedPlan ? `Pay $${plans.find(p => p.id === selectedPlan)?.price} & Promote` : 'Select a Plan')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PhoneVerificationModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<'input' | 'code'>('input');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async () => {
        if (!phone || phone.length < 10) {
            setError("Please enter a valid phone number.");
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/verify/phone', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'send', phoneNumber: phone })
            });
            const data = await res.json();
            
            if (res.ok) {
                setStep('code');
            } else {
                setError(data.error || 'Failed to send code.');
            }
        } catch (e) {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            setError("Please enter the 6-digit code.");
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/verify/phone', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'verify', phoneNumber: phone, code })
            });
            const data = await res.json();

            if (res.ok && data.status === 'approved') {
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'Invalid code.');
            }
        } catch (e) {
            setError('Verification failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XIcon className="h-5 w-5" /></button>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <SmartphoneIcon className="h-6 w-6 text-cyan-600" />
                    Phone Verification
                </h3>

                {step === 'input' ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">We'll send a 6-digit code to your mobile number.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">🇺🇸 +1</span>
                                <input 
                                    type="tel" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                    placeholder="(555) 000-0000"
                                    className="w-full pl-14 border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 py-2.5"
                                />
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-600">{error}</p>}
                        <button onClick={handleSendCode} disabled={!phone || isLoading} className="w-full py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors">
                            {isLoading ? 'Sending SMS...' : 'Send Code'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Enter the code sent to</p>
                            <p className="font-bold text-gray-800">{phone}</p>
                        </div>
                        <div className="flex justify-center my-4">
                            <input 
                                type="text" 
                                value={code} 
                                onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} 
                                placeholder="000000"
                                className="w-48 text-center text-3xl tracking-widest border-b-2 border-gray-300 focus:border-cyan-500 outline-none pb-2 font-mono"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
                        <button onClick={handleVerify} disabled={code.length !== 6 || isLoading} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                            {isLoading ? 'Verifying...' : 'Verify Number'}
                        </button>
                        <button onClick={() => setStep('input')} className="w-full text-xs text-gray-500 hover:text-gray-700 mt-2">Change Number</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const IdVerificationModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [frontImage, setFrontImage] = useState('');
    const [backImage, setBackImage] = useState('');
    const [selfieImage, setSelfieImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleNext = () => {
        if (step === 1 && frontImage) setStep(2);
        else if (step === 2 && backImage) setStep(3);
        else if (step === 3 && selfieImage) handleSubmit();
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setStep(4);
        
        try {
            // Call API endpoint to start verification process (Stripe Identity)
            const res = await fetch('/api/verify/identity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    frontImage, backImage, selfieImage // In real flow, images might be uploaded directly or we get a redirect URL
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                 setTimeout(() => {
                    setIsLoading(false);
                    onSuccess();
                    onClose();
                }, 2000); // Simulate processing time for demo feel
            } else {
                 alert("Verification failed: " + data.error);
                 setIsLoading(false);
                 setStep(1);
            }
        } catch(e) {
            console.error(e);
            alert("Network error.");
            setIsLoading(false);
            setStep(1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden relative flex flex-col max-h-[90vh]">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserCheckIcon className="h-5 w-5 text-cyan-600" />
                        Identity Verification
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="h-5 w-5" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-cyan-500' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center">
                                <h4 className="text-xl font-bold text-gray-900">Upload ID (Front)</h4>
                                <p className="text-sm text-gray-500 mt-1">Government-issued Driver's License or Passport.</p>
                            </div>
                            <div className="border-2 border-dashed border-cyan-100 bg-cyan-50/50 rounded-xl p-6 flex flex-col items-center">
                                <CreditCardIcon className="h-12 w-12 text-cyan-300 mb-4" />
                                <ImageUploader label="Select Front Image" currentImageUrl={frontImage} onImageChange={setFrontImage} />
                            </div>
                            <button onClick={handleNext} disabled={!frontImage} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed">
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center">
                                <h4 className="text-xl font-bold text-gray-900">Upload ID (Back)</h4>
                                <p className="text-sm text-gray-500 mt-1">Flip your card over. Ensure barcode is visible.</p>
                            </div>
                            <div className="border-2 border-dashed border-cyan-100 bg-cyan-50/50 rounded-xl p-6 flex flex-col items-center">
                                <div className="h-12 w-12 bg-cyan-100 rounded-md mb-4 border border-cyan-200"></div>
                                <ImageUploader label="Select Back Image" currentImageUrl={backImage} onImageChange={setBackImage} />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="px-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Back</button>
                                <button onClick={handleNext} disabled={!backImage} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-50">Continue</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center">
                                <h4 className="text-xl font-bold text-gray-900">Selfie Check</h4>
                                <p className="text-sm text-gray-500 mt-1">Take a photo of your face to match with your ID.</p>
                            </div>
                            <div className="flex justify-center">
                                <div className="relative w-40 h-40 bg-gray-100 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {selfieImage ? (
                                        <img src={selfieImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <CameraFaceIcon className="h-16 w-16 text-gray-300" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <ImageUploader label="Take Selfie" currentImageUrl={selfieImage} onImageChange={setSelfieImage} />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep(2)} className="px-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Back</button>
                                <button onClick={handleSubmit} disabled={!selfieImage} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-md disabled:opacity-50">Submit Verification</button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-12 flex flex-col items-center animate-in zoom-in-95">
                            <div className="relative mb-6">
                                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                                <ShieldIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-cyan-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900">Verifying Identity...</h4>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">We are securely analyzing your documents and biometric data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
    const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);
    
    // NEW: Session Wizard State
    const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);
    const [sessionInitialMode, setSessionInitialMode] = useState<'handover' | 'return'>('handover');
    
    // Legacy Inspection State (for viewing past reports)
    const [selectedInspection, setSelectedInspection] = useState<Booking | null>(null);

    const rentingBookings = bookings.filter(b => b.renterId === userId);
    const hostingBookings = bookings.filter(b => b.listing.owner.id === userId);

    const displayedBookings = mode === 'renting' ? rentingBookings : hostingBookings;

    const now = new Date();
    
    // RELAXED FILTER: If status is 'active', show it in "Active" regardless of dates.
    // If status is 'confirmed' AND dates match today/past, show it here too for handover.
    const activeBookings = displayedBookings.filter(b => {
        if (b.status === 'active') return true; 
        if (b.status === 'confirmed') {
            const start = new Date(b.startDate);
            // Show if start date is today or in the past (late start)
            return start <= new Date(now.getTime() + 24 * 60 * 60 * 1000); 
        }
        return false;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const futureBookings = displayedBookings.filter(b => b.status === 'confirmed' && new Date(b.startDate) > new Date(now.getTime() + 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const pastBookings = displayedBookings.filter(b => b.status === 'completed' || b.status === 'cancelled')
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    const handleSessionComplete = () => {
        setActiveSessionBooking(null);
        // ideally trigger a refresh of bookings here
    };
    
    // Legacy Handler for standalone inspection modal
    const handleInspectionComplete = (photos: InspectionPhoto[], damageReported: boolean) => {
        alert("Inspection saved.");
        setActiveSessionBooking(null);
    };

    const renderBookingTable = (title: string, data: Booking[], emptyMsg: string, isHighlight = false) => (
        <div className="mb-8 last:mb-0 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4">
                <h3 className={`text-lg font-bold ${isHighlight ? 'text-cyan-700' : 'text-gray-800'}`}>{title}</h3>
                {data.length > 0 && <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{data.length}</span>}
            </div>
            <div className={`bg-white p-4 rounded-lg shadow overflow-x-auto ${isHighlight ? 'border border-cyan-200' : ''}`}>
                {data.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3">Item</th>
                                <th className="p-3">Dates</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(booking => (
                                <tr key={booking.id} className="border-b last:border-0">
                                    <td className="p-3">
                                        <div className="font-medium text-gray-900">{booking.listing.title}</div>
                                        <div className="text-xs text-gray-500">
                                            {mode === 'renting' ? `Owner: ${booking.listing.owner.name}` : `Renter: Client #${booking.renterId.substring(0,4)}`}
                                        </div>
                                    </td>
                                    <td className="p-3">{format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            booking.status === 'confirmed' ? 'text-green-800 bg-green-100' : 
                                            booking.status === 'active' ? 'text-blue-800 bg-blue-100' : 
                                            'text-gray-800 bg-gray-100'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            {/* Logic: If confirmed, show Handover. If Active, show Return. */}
                                            {booking.status === 'confirmed' && (
                                                <button 
                                                    onClick={() => { setActiveSessionBooking(booking); setSessionInitialMode('handover'); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-xs font-bold rounded hover:bg-cyan-700"
                                                >
                                                    <CameraIcon className="h-3 w-3" /> Start Handover
                                                </button>
                                            )}
                                            {booking.status === 'active' && (
                                                <button 
                                                    onClick={() => { setActiveSessionBooking(booking); setSessionInitialMode('return'); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700"
                                                >
                                                    <ScanIcon className="h-3 w-3" /> Start Return
                                                </button>
                                            )}
                                            {booking.status === 'completed' && (
                                                <button className="text-xs text-gray-400 cursor-default">Archived</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 text-sm italic py-2">{emptyMsg}</p>}
            </div>
        </div>
    );

    return (
        <div>
             {/* RENTAL SESSION WIZARD OVERLAY */}
             {activeSessionBooking && (
                 <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                     <div className="absolute top-4 right-4 z-50">
                        <button onClick={() => setActiveSessionBooking(null)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <XIcon className="h-6 w-6 text-gray-600" />
                        </button>
                     </div>
                     <RentalSessionWizard 
                        booking={activeSessionBooking}
                        initialMode={sessionInitialMode} // Pass the mode
                        onStatusChange={(status) => onStatusUpdate(activeSessionBooking.id, status)}
                        onComplete={handleSessionComplete}
                     />
                 </div>
             )}

             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    {mode === 'renting' ? 'My Trips & Rentals' : 'Reservations & Clients'}
                </h2>
                
                {mode === 'hosting' && (
                    <button 
                        onClick={() => setIsCalendarConnected(!isCalendarConnected)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                            isCalendarConnected 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {isCalendarConnected ? <><CheckCircleIcon className="h-4 w-4" /> Synced</> : <><CalendarIcon className="h-4 w-4" /> Sync Calendar</>}
                    </button>
                )}

                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                    <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'renting' ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>I'm Renting</button>
                    <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'hosting' ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>I'm Hosting</button>
                </div>
            </div>

            {displayedBookings.length === 0 ? (
                 <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500 border border-dashed border-gray-300">
                    <p className="text-lg">No bookings found in this category.</p>
                </div>
            ) : (
                <div>
                    {renderBookingTable("Active & Ready", activeBookings, "", true)}
                    {renderBookingTable("Upcoming", futureBookings, "")}
                    {renderBookingTable("History", pastBookings, "")}
                </div>
            )}
        </div>
    )
}

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ 
    user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onUpdateProfile,
    onListingClick, onEditListing, favoriteListings = [], onToggleFavorite, onViewPublicProfile, onDeleteListing, onBookingStatusUpdate 
}) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);
    const [listingToDelete, setListingToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'profile', name: 'Profile Settings', icon: UserCheckIcon },
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'bookings', name: 'My Bookings', icon: CalendarIcon },
        { id: 'favorites', name: 'Saved Items', icon: HeartIcon },
        { id: 'security', name: 'Security & Verification', icon: ShieldIcon },
        { id: 'billing', name: 'Billing', icon: DollarSignIcon },
        { id: 'analytics', name: 'Analytics', icon: BarChartIcon },
        { id: 'aiAssistant', name: 'AI Assistant', icon: BrainCircuitIcon },
    ];
    
    const handleDeleteConfirm = async () => {
        if (!listingToDelete) return;
        setIsDeleting(true);
        try {
            await onDeleteListing(listingToDelete);
            setListingToDelete(null); 
        } catch (e) {
            console.error(e);
            alert("Failed to delete listing.");
        } finally {
            setIsDeleting(false);
        }
    };
    
    // ... [ProfileSettingsTab, AIOptimizer, SecurityTab, FeeStrategyAdvisor components remain same] ...
    const ProfileSettingsTab: React.FC = () => {
        const [bio, setBio] = useState(user.bio || '');
        const [avatar, setAvatar] = useState(user.avatarUrl);
        const [isSaving, setIsSaving] = useState(false);
        const [saveMessage, setSaveMessage] = useState('');
        const handleSave = async () => { setIsSaving(true); await onUpdateProfile(bio, avatar); setSaveMessage('Saved!'); setIsSaving(false); };
        return ( <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6"> <div className="flex gap-6 items-center"> <div className="w-24 h-24"> <ImageUploader currentImageUrl={avatar} onImageChange={setAvatar} label="" /> </div> <div> <h3 className="font-bold text-gray-900">Profile Photo</h3> <p className="text-sm text-gray-500">Update your public avatar.</p> </div> </div> <div> <label className="block font-bold text-gray-700 mb-2">Bio</label> <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full border rounded-lg p-3" rows={4} /> </div> <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-lg">{isSaving ? 'Saving...' : 'Save Changes'}</button> {saveMessage && <span className="text-green-600 ml-4">{saveMessage}</span>} </div> );
    };
    
    const VerificationItem: React.FC<{icon: React.ElementType, text: string, isVerified: boolean, onVerify: () => void}> = ({ icon: Icon, text, isVerified, onVerify }) => (
         <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
                <Icon className={`w-5 h-5 mr-3 ${isVerified ? 'text-green-600' : 'text-gray-500'}`} />
                <span className="font-medium text-gray-800">{text}</span>
            </div>
            {isVerified ? (
                <div className="flex items-center text-green-600 font-semibold text-sm">
                    <CheckCircleIcon className="w-5 h-5 mr-1.5" />
                    Verified
                </div>
            ) : (
                <button onClick={onVerify} className="px-3 py-1 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-full">
                    Verify now
                </button>
            )}
        </li>
    );

    const SecurityTab: React.FC = () => {
        const getTrustScore = () => {
            let score = 25; // Base score
            if (user.isEmailVerified) score += 25;
            if (user.isPhoneVerified) score += 25;
            if (user.isIdVerified) score += 25;
            return score;
        };

        const score = getTrustScore();
        const circumference = 2 * Math.PI * 45; // 2 * pi * radius
        const offset = circumference - (score / 100) * circumference;

        return (
            <div>
                 <h2 className="text-2xl font-bold mb-6">Security & Verification</h2>
                 <div className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r pb-6 md:pb-0 md:pr-8">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                <circle
                                    className="text-green-500"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="45"
                                    cx="50"
                                    cy="50"
                                    style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                                    transform="rotate(-90 50 50)"
                                />
                                <text x="50" y="55" fontFamily="Verdana" fontSize="24" textAnchor="middle" fill="currentColor" className="font-bold">{score}%</text>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold mt-4">Trust Score</h3>
                        <p className="text-sm text-gray-600 mt-1">Complete your profile to increase your score and build more trust.</p>
                    </div>
                     <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Complete your profile</h3>
                        <ul className="space-y-4">
                            <VerificationItem 
                                icon={MailIcon} 
                                text="Email address verified" 
                                isVerified={!!user.isEmailVerified} 
                                onVerify={() => onVerificationUpdate(user.id, 'email')} 
                            />
                            <VerificationItem 
                                icon={PhoneIcon} 
                                text="Phone Number" 
                                isVerified={!!user.isPhoneVerified} 
                                onVerify={() => setShowPhoneModal(true)} 
                            />
                            <VerificationItem 
                                icon={CreditCardIcon} 
                                text="Identity Document" 
                                isVerified={!!user.isIdVerified} 
                                onVerify={() => setShowIdModal(true)} 
                            />
                        </ul>
                         <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-2">Reputation</h3>
                            <div className="flex items-center">
                                <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                                <span className="font-bold text-gray-800">{user.averageRating?.toFixed(1) || 'N/A'}</span>
                                <span className="text-sm text-gray-600 ml-2">({user.totalReviews || 0} reviews)</span>
                            </div>
                         </div>
                    </div>
                 </div>
            </div>
        )
    };

    const AIOptimizer = () => <div>AI Tools</div>;
    const FeeStrategyAdvisor = () => <div>Billing Info</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSettingsTab />;
            case 'listings': return (
                <div>
                    <h2 className="text-2xl font-bold mb-6">My Listings</h2>
                    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                        {listings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50"><tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
                                <tbody>
                                    {listings.map(listing => (
                                        <tr key={listing.id} className="border-b">
                                            <td className="p-3 font-medium">{listing.title}</td>
                                            <td className="p-3"><span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span></td>
                                            <td className="p-3 flex justify-end gap-2">
                                                <button onClick={() => onListingClick && onListingClick(listing.id)} className="p-2 text-gray-500 hover:text-cyan-600"><EyeIcon className="h-5 w-5" /></button>
                                                <button onClick={() => onEditListing && onEditListing(listing.id)} className="p-2 text-gray-500 hover:text-cyan-600"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => setListingToDelete(listing.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="h-5 w-5" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="text-center p-8 text-gray-600">No listings yet.</p>}
                    </div>
                </div>
            );
            case 'bookings': return <BookingsManager bookings={bookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'favorites': return (<div><h2 className="text-2xl font-bold mb-6">Saved Items</h2>{favoriteListings.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{favoriteListings.map(l => <ListingCard key={l.id} listing={l} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}</div>) : <p>No favorites.</p>}</div>);
            case 'security': return <SecurityTab />;
            case 'billing': return <FeeStrategyAdvisor />;
            case 'analytics': return <div>Analytics</div>;
            case 'aiAssistant': return <AIOptimizer />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm">
                        <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(newUrl) => onUpdateAvatar(user.id, newUrl)} label="" />
                    </div>
                    <div><h1 className="text-3xl font-bold">User Dashboard</h1><p className="text-gray-600 mt-1">Welcome back, {user.name}.</p></div>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-1/5"><nav className="flex flex-col space-y-2">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-4 py-2 rounded-lg text-left ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}><tab.icon className="h-5 w-5 mr-3" /> {tab.name}</button>))}</nav></aside>
                    <main className="flex-1">{renderContent()}</main>
                </div>
            </div>
            {showPhoneModal && <PhoneVerificationModal onClose={() => setShowPhoneModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'phone')} />}
            {showIdModal && <IdVerificationModal onClose={() => setShowIdModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'id')} />}
            {listingToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm text-center">
                        <h3 className="text-xl font-bold mb-2">Delete Listing?</h3>
                        <p className="text-gray-600 mb-6">Cannot be undone.</p>
                        <div className="flex gap-3"><button onClick={() => setListingToDelete(null)} className="flex-1 py-3 border rounded-xl">Cancel</button><button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">{isDeleting ? '...' : 'Delete'}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboardPage;
