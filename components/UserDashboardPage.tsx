import React, { useState, useMemo } from 'react';
import { Session, Listing, Booking, ListingCategory, Review } from '../types';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService';
import { 
    PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, 
    ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, 
    CalendarIcon, EyeIcon, PencilIcon, XIcon, LandmarkIcon, 
    CalculatorIcon, UmbrellaIcon, SmartphoneIcon, CameraFaceIcon, 
    ScanIcon, FileWarningIcon, GavelIcon, CameraIcon, HeartIcon, 
    UserCheckIcon, TrashIcon, AlertTriangleIcon, RocketIcon, ZapIcon, LockIcon,
    MapPinIcon, WandSparklesIcon, MegaphoneIcon, SparklesIcon, TrendUpIcon, 
    ArrowRightIcon, RefreshCwIcon, LightbulbIcon, ClockIcon, SlidersIcon,
    ShieldCheckIcon, MessageSquareIcon, ThumbsUpIcon, ChevronRightIcon, InfoIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { format, isAfter, isBefore } from 'date-fns';
import ListingCard from './ListingCard';
import RentalSessionWizard from './RentalSessionWizard';
import ReviewModal from './ReviewModal';
import { DayPicker } from 'react-day-picker';

interface UserDashboardPageProps {
    user: Session;
    listings: Listing[];
    bookings: Booking[];
    reviews?: Review[];
    onVerificationUpdate: (userId: string, verificationType: 'email' | 'phone' | 'id') => void;
    onUpdateAvatar: (userId: string, newAvatarUrl: string) => Promise<void>;
    onUpdateProfile: (name: string, bio: string, avatarUrl: string) => Promise<void>;
    onListingClick?: (listingId: string) => void;
    onEditListing?: (listingId: string) => void;
    favoriteListings?: Listing[];
    onToggleFavorite: (id: string) => void;
    onViewPublicProfile: (userId: string) => void;
    onDeleteListing: (listingId: string) => Promise<void>;
    onBookingStatusUpdate: (bookingId: string, status: string) => Promise<void>;
    onUpdateDepositStatus: (bookingId: string, newStatus: 'held' | 'released' | 'disputed' | 'claimed') => void;
    onReviewSubmit: (review: Partial<Review>) => Promise<void>;
    onReviewResponse: (reviewId: string, response: string) => Promise<void>;
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'security' | 'favorites' | 'aiAssistant' | 'reviews';

const PromotionModal: React.FC<{ listing: Listing, onClose: () => void }> = ({ listing, onClose }) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string>('social');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const plans = [
        {
            id: 'local',
            name: 'Local Boost',
            price: '5.99',
            duration: '3 DAYS',
            icon: MapPinIcon,
            features: [
                'Top of search in your city',
                'Highlighted map pin',
                '~200 Est. Reach'
            ]
        },
        {
            id: 'social',
            name: 'Social Spotlight',
            price: '14.99',
            duration: '7 DAYS',
            icon: MegaphoneIcon,
            popular: true,
            features: [
                'Included "Local Boost"',
                'Post on our Instagram/FB Stories',
                'Featured in weekly newsletter',
                '~1,500 Est. Reach'
            ]
        },
        {
            id: 'regional',
            name: 'Regional Hero',
            price: '29.99',
            duration: '14 DAYS',
            icon: StarIcon,
            features: [
                'Homepage "Hero" Slider Feature',
                'Dedicated Social Media Post',
                'Top placement in 3 nearby cities',
                '~5,000+ Est. Reach'
            ]
        }
    ];

    const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

    const handlePromote = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center text-slate-900 relative animate-in zoom-in duration-300">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                        <CheckCircleIcon className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900">Boost Active!</h2>
                    <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                        Your item <strong>"{listing.title}"</strong> is now receiving premium exposure.
                    </p>
                    <button onClick={onClose} className="mt-10 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 pb-4 flex justify-between items-start bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-400 text-slate-900 rounded-lg shadow-lg">
                            <ZapIcon className="h-6 w-6 fill-slate-900" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Boost Exposure</h2>
                            <p className="text-slate-400 text-sm font-medium">Promote <span className="text-white font-bold">{listing.title}</span> to get more bookings faster.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8 pt-10 flex-1 overflow-y-auto bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div 
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`relative group cursor-pointer flex flex-col rounded-3xl p-8 transition-all duration-300 h-full border-2 
                                    ${selectedPlanId === plan.id 
                                        ? 'bg-white border-cyan-500 shadow-2xl shadow-cyan-100 scale-[1.02] z-10' 
                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-20 whitespace-nowrap">
                                        MOST POPULAR
                                    </div>
                                )}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors 
                                    ${selectedPlanId === plan.id ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-50 text-slate-400'}`}>
                                    <plan.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-1 text-gray-900">
                                    <span className="text-3xl font-black">${plan.price.split('.')[0]}</span>
                                    <span className="text-lg font-black">.{plan.price.split('.')[1]}</span>
                                </div>
                                <p className="text-xs font-black text-slate-400 mb-8 tracking-widest">{plan.duration}</p>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm font-medium text-slate-600 leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className={`w-full py-3.5 rounded-2xl text-center text-sm font-black transition-all border
                                    ${selectedPlanId === plan.id 
                                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-lg' 
                                        : 'bg-slate-100 text-slate-500 border-slate-100 group-hover:bg-slate-200'}`}>
                                    {selectedPlanId === plan.id ? 'Selected' : 'Choose Plan'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                        <LockIcon className="h-4 w-4" />
                        <span>Secure payment processed by Stripe</span>
                    </div>
                    <button 
                        onClick={handlePromote}
                        disabled={isProcessing}
                        className="w-full sm:w-auto min-w-[280px] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : <>Pay ${selectedPlan.price} & Boost <RocketIcon className="h-5 w-5" /></>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookingsManager: React.FC<{ 
    bookings: Booking[], 
    reviews: Review[],
    userId: string, 
    onStatusUpdate: (id: string, status: string) => Promise<void>,
    onUpdateDepositStatus: (bookingId: string, newStatus: 'held' | 'released' | 'disputed' | 'claimed') => void,
    onReviewSubmit: (review: Partial<Review>) => Promise<void>
}> = ({ bookings, reviews, userId, onStatusUpdate, onUpdateDepositStatus, onReviewSubmit }) => {
    const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
    const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);
    const [sessionInitialMode, setSessionInitialMode] = useState<'handover' | 'return'>('handover');
    const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    const displayedBookings = mode === 'renting' ? bookings.filter(b => b.renterId === userId) : bookings.filter(b => b.listing.owner.id === userId);

    const getTimeline = (b: Booking) => {
        const now = new Date();
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        
        let progress = 0;
        if (b.status === 'completed') progress = 100;
        else if (b.status === 'cancelled' || b.status === 'rejected') progress = 0;
        else if (b.status === 'active') progress = 66;
        else if (b.status === 'confirmed') progress = 33;
        else progress = 15;

        return (
            <div className="w-full mt-4">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <span className={progress >= 15 ? 'text-cyan-600' : ''}>Requested</span>
                    <span className={progress >= 33 ? 'text-cyan-600' : ''}>Confirmed</span>
                    <span className={progress >= 66 ? 'text-cyan-600' : ''}>Active</span>
                    <span className={progress >= 100 ? 'text-cyan-600' : ''}>Completed</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${b.status === 'cancelled' || b.status === 'rejected' ? 'bg-red-400' : 'bg-cyan-600'}`} 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in duration-500">
             {activeSessionBooking && (
                 <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
                     <RentalSessionWizard 
                        booking={activeSessionBooking} 
                        initialMode={sessionInitialMode} 
                        onStatusChange={(status) => onStatusUpdate(activeSessionBooking.id, status)} 
                        onUpdateDepositStatus={onUpdateDepositStatus}
                        onComplete={() => setActiveSessionBooking(null)} 
                     />
                 </div>
             )}

             {reviewingBooking && (
                 <ReviewModal 
                    booking={reviewingBooking} 
                    onClose={() => setReviewingBooking(null)} 
                    onSubmit={async (rating, comment) => {
                        await onReviewSubmit({
                            bookingId: reviewingBooking.id,
                            authorId: userId,
                            targetId: reviewingBooking.listingId,
                            rating,
                            comment,
                            role: 'RENTER',
                            status: 'PUBLISHED',
                            createdAt: new Date().toISOString()
                        });
                    }}
                 />
             )}

             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{mode === 'renting' ? 'My Trips' : 'Reservations'}</h2>
                <div className="bg-white p-1 rounded-xl border border-slate-100 flex shadow-sm">
                    <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'renting' ? 'bg-cyan-100 text-cyan-700 shadow-inner' : 'text-slate-500'}`}>I'm Renting</button>
                    <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'hosting' ? 'bg-cyan-100 text-cyan-700 shadow-inner' : 'text-slate-500'}`}>I'm Hosting</button>
                </div>
            </div>

            <div className="space-y-4">
                {displayedBookings.length > 0 ? displayedBookings.map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 text-slate-900">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <img src={b.listing.images[0]} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" alt="item" />
                                <div>
                                    <h4 className="font-black leading-tight text-slate-900 tracking-tight">{b.listing.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1 font-bold">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd, yyyy')}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                            b.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                                            b.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                                            b.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {b.status}
                                        </span>
                                        {b.securityDeposit && b.securityDeposit > 0 && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                                                b.depositStatus === 'held' ? 'bg-cyan-600 text-white' :
                                                b.depositStatus === 'released' ? 'bg-emerald-100 text-emerald-700' :
                                                b.depositStatus === 'disputed' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                <LockIcon className="h-2.5 w-2.5" /> Deposit: {b.depositStatus || 'held'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                                {mode === 'renting' && b.status === 'active' && (
                                    <button className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-black rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
                                        <MessageSquareIcon className="h-4 w-4" /> CONTACT HOST
                                    </button>
                                )}
                                
                                {mode === 'hosting' && b.status === 'pending' && (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                            onClick={() => { setProcessingId(b.id); onStatusUpdate(b.id, 'confirmed').finally(() => setProcessingId(null)); }}
                                            disabled={processingId === b.id}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                                        >
                                            APPROVE
                                        </button>
                                        <button 
                                            onClick={() => { setProcessingId(b.id); onStatusUpdate(b.id, 'rejected').finally(() => setProcessingId(null)); }}
                                            disabled={processingId === b.id}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-black rounded-xl hover:bg-red-50"
                                        >
                                            REJECT
                                        </button>
                                    </div>
                                )}

                                {b.status === 'confirmed' && (
                                    <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('handover'); }} className="px-6 py-2.5 bg-cyan-600 text-white text-xs font-black rounded-xl hover:bg-cyan-700 shadow-lg shadow-cyan-100 flex items-center gap-2">
                                        <RocketIcon className="h-4 w-4" /> START CHECK-IN
                                    </button>
                                )}
                                {b.status === 'active' && (
                                    <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('return'); }} className="px-6 py-2.5 bg-orange-500 text-white text-xs font-black rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-100 flex items-center gap-2">
                                        <RefreshCwIcon className="h-4 w-4" /> START RETURN
                                    </button>
                                )}
                                {mode === 'renting' && b.status === 'completed' && !reviews.find(r => r.bookingId === b.id) && (
                                    <button onClick={() => setReviewingBooking(b)} className="px-6 py-2.5 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-100 flex items-center gap-2">
                                        <StarIcon className="h-4 w-4" /> LEAVE A REVIEW
                                    </button>
                                )}
                            </div>
                        </div>
                        {b.status !== 'cancelled' && b.status !== 'rejected' && getTimeline(b)}
                    </div>
                )) : (
                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold italic">No {mode === 'renting' ? 'trips' : 'reservations'} found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SecurityTab: React.FC<{ user: Session, onVerify: (type: 'email' | 'phone' | 'id') => void }> = ({ user, onVerify }) => {
    const score = useMemo(() => {
        let s = 25;
        if (user.isEmailVerified) s += 25;
        if (user.isPhoneVerified) s += 25;
        if (user.isIdVerified) s += 25;
        return s;
    }, [user]);

    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Security & Verification</h2>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-12 text-slate-900">
                <div className="flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r pb-12 lg:pb-0 lg:pr-12">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                            <circle className="text-emerald-500" strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.8s ease-out' }} transform="rotate(-90 50 50)" />
                            <text x="50" y="58" fontSize="24" textAnchor="middle" fill="#0f172a" className="font-black">{score}%</text>
                        </svg>
                    </div>
                    <h3 className="text-xl font-black mt-6">Trust Score</h3>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Verify your profile to unlock more bookings.</p>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    {[
                        { id: 'email', name: 'Email Verification', icon: MailIcon, done: !!user.isEmailVerified },
                        { id: 'phone', name: 'Phone Confirmation', icon: PhoneIcon, done: !!user.isPhoneVerified },
                        { id: 'id', name: 'Government ID Check', icon: CreditCardIcon, done: !!user.isIdVerified },
                    ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <item.icon className={`h-5 w-5 ${item.done ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className="font-bold text-slate-700">{item.name}</span>
                            </div>
                            {item.done ? <span className="text-emerald-600 font-black text-[10px] uppercase flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4" /> VERIFIED</span> : 
                                <button onClick={() => onVerify(item.id as any)} className="px-4 py-1.5 bg-cyan-600 text-white text-xs font-black rounded-lg">VERIFY</button>
                            }
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ReviewsTab: React.FC<{ reviews: Review[], listings: Listing[], onResponse: (reviewId: string, text: string) => Promise<void> }> = ({ reviews, listings, onResponse }) => {
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [responseText, setResponseText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter reviews for user's listings
    const userListingIds = listings.map(l => l.id);
    const hostReviews = reviews.filter(r => userListingIds.includes(r.targetId));

    const handleSubmitResponse = async (reviewId: string) => {
        if (!responseText.trim()) return;
        setIsSubmitting(true);
        try {
            await onResponse(reviewId, responseText);
            setRespondingId(null);
            setResponseText('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Reviews & Feedback</h2>
            <div className="space-y-4">
                {hostReviews.length > 0 ? hostReviews.map(review => {
                    const l = listings.find(item => item.id === review.targetId);
                    return (
                        <div key={review.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
                                    <div>
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <StarIcon key={s} className={`h-3 w-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l?.title} • {new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-bold italic">"{review.comment}"</p>
                            
                            {review.response ? (
                                <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
                                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <ThumbsUpIcon className="h-3 w-3" /> Your Response
                                    </p>
                                    <p className="text-xs text-cyan-800 leading-relaxed font-medium">{review.response}</p>
                                </div>
                            ) : (
                                respondingId === review.id ? (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                        <textarea 
                                            value={responseText}
                                            onChange={(e) => setResponseText(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                            placeholder="Write a professional thank you or address their feedback..."
                                            rows={3}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setRespondingId(null)} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                                            <button 
                                                onClick={() => handleSubmitResponse(review.id)}
                                                disabled={isSubmitting || !responseText.trim()}
                                                className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Sending...' : 'Post Response'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setRespondingId(review.id)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Respond to Review</button>
                                )
                            )}
                        </div>
                    );
                }) : (
                    <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                        <MessageSquareIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold italic">No reviews yet for your listings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
const AIListingCoach: React.FC<{ listings: Listing[] }> = ({ listings }) => {
    const [selectedId, setSelectedId] = useState(listings[0]?.id || '');
    const [type, setType] = useState<ListingAdviceType>('improvement');
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    const getAdvice = async () => {
        const item = listings.find(l => l.id === selectedId);
        if (!item) return;
        setLoading(true);
        try {
            const res = await getListingAdvice(item, type);
            setAdvice(res);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-indigo-900 p-8 rounded-[2rem] text-white">
                <h2 className="text-2xl font-black flex items-center gap-3"><BrainCircuitIcon className="h-8 w-8 text-blue-300" /> Rental Success Coach</h2>
                <p className="text-indigo-200 mt-2 font-medium">Get tailored AI strategies to improve your earnings.</p>
            </div>
            {listings.length > 0 ? (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900">
                        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 font-bold">
                            {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                        </select>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 font-bold">
                            <option value="improvement">Improve Listing</option>
                            <option value="pricing">Optimize Pricing</option>
                            <option value="promotion">Social Promotion</option>
                        </select>
                    </div>
                    <button onClick={getAdvice} disabled={loading} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2">
                        {loading ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : <WandSparklesIcon className="h-5 w-5" />}
                        {loading ? 'Consulting AI...' : 'Generate AI Strategy'}
                    </button>
                    {advice && <div className="p-6 bg-blue-50 rounded-2xl text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">{advice}</div>}
                </div>
            ) : <p className="text-center p-20 text-slate-400 italic font-bold">List an item to unlock AI Success Coach.</p>}
        </div>
    );
};

const UserDashboardPage: React.FC<UserDashboardPageProps> = (props) => {
    const { 
        user, listings, bookings, reviews = [], favoriteListings, onListingClick, onEditListing, 
        onDeleteListing, onToggleFavorite, onUpdateAvatar, onUpdateProfile, 
        onVerificationUpdate, onBookingStatusUpdate, onUpdateDepositStatus, onViewPublicProfile,
        onReviewSubmit, onReviewResponse
    } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    const [listingToBoost, setListingToBoost] = useState<Listing | null>(null);
    const [listingCalendar, setListingCalendar] = useState<Listing | null>(null);
    
    // Account Security State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    
    // Account Closure State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleUpdatePassword = () => {
        if (!newPassword || newPassword !== confirmPassword) {
            setPasswordMessage({ text: 'Passwords do not match or are empty.', type: 'error' });
            return;
        }
        setIsUpdatingPassword(true);
        // Simulate API call
        setTimeout(() => {
            setIsUpdatingPassword(false);
            setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage(null), 3000);
        }, 1000);
    };

    const handleCloseAccount = () => {
        setIsDeleting(true);
        // Simulate API call
        setTimeout(() => {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            alert('Your account has been request for closure. You will be logged out shortly.');
            window.location.reload(); // Refresh to logout for now in this demo
        }, 2000);
    };

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'profile', name: 'Profile Settings', icon: UserCheckIcon },
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'bookings', name: 'My Bookings', icon: CalendarIcon },
        { id: 'reviews', name: 'Reviews', icon: MessageSquareIcon },
        { id: 'favorites', name: 'Saved Items', icon: HeartIcon },
        { id: 'security', name: 'Security & Trust', icon: ShieldIcon },
        { id: 'analytics', name: 'Performance', icon: BarChartIcon },
        { id: 'aiAssistant', name: 'AI Coach', icon: BrainCircuitIcon },
        { id: 'billing', name: 'Billing', icon: DollarSignIcon },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in">
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="w-32 h-32 flex-shrink-0">
                                <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(url) => onUpdateAvatar(user.id, url)} label="" />
                            </div>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Public Name</label>
                                    <input type="text" defaultValue={user.name} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Bio</label>
                                    <textarea defaultValue={user.bio} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-slate-600 min-h-[120px]" rows={4} />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button onClick={() => onUpdateProfile(user.name, user.bio || '', user.avatarUrl)} className="px-8 py-3 bg-cyan-600 text-white font-black rounded-xl hover:bg-cyan-700 transition-colors">Save Changes</button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <LockIcon className="h-5 w-5 text-indigo-500" /> Account Security
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">New Password</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                    />
                                </div>
                            </div>
                            {passwordMessage && (
                                <div className={`mt-4 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {passwordMessage.type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <AlertTriangleIcon className="h-5 w-5" />}
                                    {passwordMessage.text}
                                </div>
                            )}
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={handleUpdatePassword}
                                    disabled={isUpdatingPassword}
                                    className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isUpdatingPassword ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : 'Update Password'}
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <h3 className="text-xl font-black text-red-600 mb-2 flex items-center gap-2">
                                <FileWarningIcon className="h-5 w-5" /> Danger Zone
                            </h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-black text-red-900">Close Account</h4>
                                    <p className="text-xs text-red-700 font-medium mt-1">Permanently delete your profile, listings, and history.</p>
                                </div>
                                <button 
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="px-8 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <TrashIcon className="h-4 w-4" /> Delete My Account
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'listings':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">My Listings</h2>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr><th className="p-4 font-bold text-slate-500">Item</th><th className="p-4 font-bold text-slate-500">Status</th><th className="p-4 font-bold text-slate-500 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {listings.map(l => (
                                        <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{l.title}</td>
                                            <td className="p-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full uppercase">Active</span></td>
                                            <td className="p-4 flex justify-end gap-2">
                                                <button onClick={() => onListingClick?.(l.id)} className="p-2 text-slate-400 hover:text-cyan-600" title="View"><EyeIcon className="h-5 w-5"/></button>
                                                <button onClick={() => setListingCalendar(l)} className="p-2 text-slate-400 hover:text-indigo-600" title="Calendar"><CalendarIcon className="h-5 w-5"/></button>
                                                <button onClick={() => onEditListing?.(l.id)} className="p-2 text-slate-400 hover:text-cyan-600" title="Edit"><PencilIcon className="h-5 w-5"/></button>
                                                <button onClick={() => setListingToBoost(l)} className="p-2 text-slate-400 hover:text-amber-500" title="Boost"><RocketIcon className="h-5 w-5"/></button>
                                                <button onClick={() => onDeleteListing(l.id)} className="p-2 text-slate-400 hover:text-red-500" title="Delete"><TrashIcon className="h-5 w-5"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {listings.length === 0 && <div className="p-20 text-center text-slate-400 italic font-bold">No items listed. Start earning today!</div>}
                        </div>
                    </div>
                );
            case 'bookings':
                return <BookingsManager bookings={bookings} reviews={reviews} userId={user.id} onStatusUpdate={onBookingStatusUpdate} onUpdateDepositStatus={onUpdateDepositStatus} onReviewSubmit={onReviewSubmit} />;
            case 'reviews':
                return <ReviewsTab reviews={reviews} listings={listings} onResponse={onReviewResponse} />;
            case 'security':
                return <SecurityTab user={user} onVerify={(type) => onVerificationUpdate(user.id, type)} />;
            case 'aiAssistant':
                return <AIListingCoach listings={listings} />;
            case 'analytics':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Performance Dashboard</h2>
                            <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-500 shadow-sm">
                                <ClockIcon className="h-4 w-4" /> Data as of today
                            </div>
                        </div>

                        {/* Top Line Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earnings</p>
                                <h4 className="text-3xl font-black mt-1">$1,240</h4>
                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold mt-4"><TrendUpIcon className="h-3 w-3" /> +12% this month</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Trips</p>
                                <h4 className="text-3xl font-black mt-1">{bookings.filter(b => b.status === 'active').length}</h4>
                                <div className="flex items-center gap-1 text-blue-500 text-[10px] font-bold mt-4"><ArrowRightIcon className="h-3 w-3" /> Rentals in progress</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviews</p>
                                <h4 className="text-3xl font-black mt-1">{reviews.filter(r => listings.map(l => l.id).includes(r.targetId)).length}</h4>
                                <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold mt-4"><StarIcon className="h-3 w-3" /> Avg. 4.9 rating</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Rate</p>
                                <h4 className="text-3xl font-black mt-1">98%</h4>
                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold mt-4"><CheckCircleIcon className="h-3 w-3" /> Top Tier</div>
                            </div>
                        </div>

                        {/* Earnings Growth */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 opacity-80 mb-2">Monthly Revenue</p>
                                <div className="flex items-end gap-3">
                                    <h4 className="text-5xl font-black tracking-tight">$3,450.00</h4>
                                    <span className="text-emerald-400 text-sm font-black mb-2 flex items-center gap-0.5">
                                        <TrendUpIcon className="h-4 w-4" /> 24%
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-6 font-medium">Your income grew by $670 compared to last month.</p>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Impact</p>
                                    <h4 className="text-4xl font-black text-slate-900 mt-2">1,240 <span className="text-slate-400 text-lg">views</span></h4>
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conversion</p>
                                        <p className="text-lg font-black text-slate-900">4.2%</p>
                                    </div>
                                    <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                                        <p className="text-lg font-black text-slate-900">92%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Individual Listing Stats */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Individual Asset Performance</h3>
                            {listings.length > 0 ? listings.map(listing => (
                                <div key={listing.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                                    <img src={listing.images[0]} className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-slate-100" alt="item" />
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-black text-slate-900 text-sm leading-tight truncate">{listing.title}</h5>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <EyeIcon className="h-3.5 w-3.5 text-slate-300" /> {Math.floor(Math.random() * 500) + 100} views
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <CalendarIcon className="h-3.5 w-3.5 text-slate-300" /> {bookings.filter(b => b.listingId === listing.id).length} bookings
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</p>
                                        <p className="font-black text-slate-900">$1,120</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold italic">List your first item to see performance data.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Financial Ledger</h2>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-gray-900">
                                    <tr><th className="p-4 font-bold">Transaction</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold text-right">Amount</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-gray-700">
                                    <tr className="hover:bg-slate-50"><td className="p-4 font-medium">Rental Payout - Jet Ski #002</td><td className="p-4"><span className="text-emerald-600 font-bold">CLEARED</span></td><td className="p-4 font-black text-right text-emerald-500">+$240.00</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="p-4 font-medium">Service Fee - Booking #491</td><td className="p-4"><span className="text-slate-400 font-bold">PENDING</span></td><td className="p-4 font-black text-right text-red-500">-$10.00</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="p-4 font-medium">Promotion Boost - Weekly</td><td className="p-4"><span className="text-emerald-600 font-bold">CLEARED</span></td><td className="p-4 font-black text-right text-red-500">-$14.99</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'favorites':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Saved Gear</h2>
                        {favoriteListings && favoriteListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {favoriteListings.map(l => <ListingCard key={l.id} listing={l} onClick={() => onListingClick?.(l.id)} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}
                            </div>
                        ) : <p className="text-center p-20 text-slate-400 italic font-bold">No saved items yet.</p>}
                    </div>
                );
            default:
                return <div className="p-20 text-center text-gray-300 flex flex-col items-center gap-4"><SparklesIcon className="h-12 w-12" /><p className="font-bold">Module under development</p></div>;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200">
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Dashboard</h1>
                        <p className="text-slate-500 mt-1 font-medium">Member since {new Date(user.registeredDate).getFullYear()}</p>
                    </div>
                    <button onClick={() => onViewPublicProfile(user.id)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50">View Public Profile</button>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-1/4 lg:w-1/5">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-2 space-y-1 sticky top-24">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <tab.icon className="h-5 w-5 mr-3" /> {tab.name}
                                </button>
                            ))}
                        </div>
                    </aside>
                    <main className="flex-1 min-w-0">
                        {renderContent()}
                    </main>
                </div>
            </div>
            {listingToBoost && <PromotionModal listing={listingToBoost} onClose={() => setListingToBoost(null)} />}
            
            {listingCalendar && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in duration-300">
                        <button onClick={() => setListingCalendar(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <XIcon className="h-6 w-6 text-slate-400" />
                        </button>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <CalendarIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Availability Calendar</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{listingCalendar.title}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex justify-center">
                            <DayPicker 
                                mode="multiple" 
                                selected={listingCalendar.bookedDates?.map(d => new Date(d)) || []}
                                disabled={{ before: new Date() }}
                                modifiersStyles={{
                                    selected: { 
                                        backgroundColor: '#4f46e5', 
                                        color: 'white',
                                        borderRadius: '8px'
                                    }
                                }}
                            />
                        </div>
                        <div className="mt-8 flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <InfoIcon className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-relaxed">
                                Highlighted dates are currently booked. This is your calendar view for this listing.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center animate-in zoom-in duration-300">
                        <div className="bg-red-100 text-red-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
                            <AlertTriangleIcon className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900">Are you sure?</h2>
                        <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                            This action is permanent and cannot be undone. All your data will be wiped from our systems.
                        </p>
                        <div className="mt-10 space-y-3">
                            <button 
                                onClick={handleCloseAccount}
                                disabled={isDeleting}
                                className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : 'Yes, Delete My Account'}
                            </button>
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="w-full py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboardPage;