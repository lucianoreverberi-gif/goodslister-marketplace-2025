import React, { useState, useMemo } from 'react';
import { Session, Listing, Booking, ListingCategory } from '../types.ts';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService.ts';
import { 
    PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, 
    ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, 
    CalendarIcon, EyeIcon, PencilIcon, XIcon, LandmarkIcon, 
    CalculatorIcon, UmbrellaIcon, SmartphoneIcon, CameraFaceIcon, 
    ScanIcon, FileWarningIcon, GavelIcon, CameraIcon, HeartIcon, 
    UserCheckIcon, TrashIcon, AlertTriangleIcon, RocketIcon, ZapIcon, LockIcon,
    MapPinIcon, WandSparklesIcon, MegaphoneIcon, SparklesIcon, TrendUpIcon, 
    ArrowRightIcon, RefreshCwIcon, LightbulbIcon, ClockIcon, SlidersIcon,
    ShieldCheckIcon
} from './icons.tsx';
import ImageUploader from './ImageUploader.tsx';
import { format } from 'date-fns';
import ListingCard from './ListingCard.tsx';
import RentalSessionWizard from './RentalSessionWizard.tsx';

interface UserDashboardPageProps {
    user: Session;
    listings: Listing[];
    bookings: Booking[];
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
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'security' | 'favorites' | 'aiAssistant';

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

const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
    const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
    const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);
    const [sessionInitialMode, setSessionInitialMode] = useState<'handover' | 'return'>('handover');
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    const displayedBookings = mode === 'renting' ? bookings.filter(b => b.renterId === userId) : bookings.filter(b => b.listing.owner.id === userId);

    return (
        <div className="animate-in fade-in duration-500">
             {activeSessionBooking && (
                 <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
                     <RentalSessionWizard 
                        booking={activeSessionBooking} 
                        initialMode={sessionInitialMode} 
                        onStatusChange={(status) => onStatusUpdate(activeSessionBooking.id, status)} 
                        onComplete={() => setActiveSessionBooking(null)} 
                     />
                 </div>
             )}
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{mode === 'renting' ? 'My Trips' : 'Reservations'}</h2>
                <div className="bg-white p-1 rounded-xl border border-slate-100 flex shadow-sm">
                    <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'renting' ? 'bg-cyan-100 text-cyan-700 shadow-inner' : 'text-slate-500'}`}>I'm Renting</button>
                    <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'hosting' ? 'bg-cyan-100 text-cyan-700 shadow-inner' : 'text-slate-500'}`}>I'm Hosting</button>
                </div>
            </div>

            <div className="space-y-4">
                {displayedBookings.map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-900">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <img src={b.listing.images[0]} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
                            <div>
                                <h4 className="font-bold leading-tight text-gray-900">{b.listing.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd, yyyy')}</p>
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                    b.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {b.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto justify-end">
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
                        </div>
                    </div>
                ))}
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
        user, listings, bookings, favoriteListings, onListingClick, onEditListing, 
        onDeleteListing, onToggleFavorite, onUpdateAvatar, onUpdateProfile, 
        onVerificationUpdate, onBookingStatusUpdate, onViewPublicProfile 
    } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    const [listingToBoost, setListingToBoost] = useState<Listing | null>(null);

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'profile', name: 'Profile Settings', icon: UserCheckIcon },
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'bookings', name: 'My Bookings', icon: CalendarIcon },
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
                                <button onClick={() => onUpdateProfile(user.name, user.bio || '', user.avatarUrl)} className="px-8 py-3 bg-cyan-600 text-white font-black rounded-xl">Save Changes</button>
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
                return <BookingsManager bookings={bookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'security':
                return <SecurityTab user={user} onVerify={(type) => onVerificationUpdate(user.id, type)} />;
            case 'aiAssistant':
                return <AIListingCoach listings={listings} />;
            case 'analytics':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Hosting Performance</h2>
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
                                <h4 className="text-3xl font-black mt-1">{user.totalReviews || 0}</h4>
                                <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold mt-4"><StarIcon className="h-3 w-3" /> Community rating</div>
                            </div>
                             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Rate</p>
                                <h4 className="text-3xl font-black mt-1">98%</h4>
                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold mt-4"><CheckCircleIcon className="h-3 w-3" /> Superhost status</div>
                            </div>
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
        </div>
    );
};

export default UserDashboardPage;