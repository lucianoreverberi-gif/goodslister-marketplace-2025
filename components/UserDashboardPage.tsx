import React, { useState, useMemo, useEffect } from 'react';
import { Session, Listing, Booking, ListingCategory } from '../types';
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
    ShieldCheckIcon, InfoIcon, ExternalLinkIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';
import ListingCard from './ListingCard';
import RentalSessionWizard from './RentalSessionWizard';
import ConnectStripeModal from './ConnectStripeModal';

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
    onUpdateDepositStatus: (bookingId: string, newStatus: 'held' | 'released' | 'disputed' | 'claimed') => void;
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'security' | 'favorites' | 'aiAssistant' | 'boosts';

const STRIPE_ENABLED = process.env.STRIPE_ENABLED === 'true' || (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_STRIPE_ENABLED === 'true');

const PromotionModal: React.FC<{ listing: Listing, onClose: () => void, user: Session }> = ({ listing, onClose, user }) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string>('spotlight');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [waitlistEmail, setWaitlistEmail] = useState(user.email || '');

    const plans = [
        {
            id: 'local',
            name: 'Local Boost',
            price: '5.99',
            duration: '3 DAYS',
            icon: MapPinIcon,
            features: [
                'Top of search in your city',
                'Highlighted map pin on city view',
                '"Boosted" badge on listing card',
                'Reach: ~200 nearby renters'
            ]
        },
        {
            id: 'spotlight',
            name: 'Spotlight',
            price: '14.99',
            duration: '7 DAYS',
            icon: WandSparklesIcon,
            popular: true,
            features: [
                'Everything in Local Boost',
                'Top of search across your state',
                'Featured in your category browse page',
                'Priority placement in your region',
                'Reach: ~1,500 in-state renters'
            ]
        },
        {
            id: 'regional',
            name: 'Regional Hero',
            price: '29.99',
            duration: '14 DAYS',
            icon: StarIcon,
            features: [
                'Everything in Spotlight',
                'Homepage "Hero" Slider rotation',
                'Top placement in 3 nearby cities',
                '"Featured" badge with premium styling',
                'Reach: ~5,000 regional renters'
            ]
        }
    ];

    const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

    const handlePromote = async () => {
        if (!STRIPE_ENABLED) {
            setShowWaitlist(true);
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/boost/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listing_id: listing.id,
                    tier: selectedPlanId,
                    user_id: user.id
                })
            });
            const data = await res.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error(data.error || 'Failed to start checkout');
            }
        } catch (e) {
            console.error(e);
            alert('Payment failed to initialize. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleJoinWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await fetch('/api/boost/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: waitlistEmail,
                    listing_id: listing.id,
                    desired_tier: selectedPlanId,
                    user_id: user.id
                })
            });
            setIsSuccess(true);
        } catch (e) {
            alert('Failed to join waitlist. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center text-slate-900 relative animate-in zoom-in duration-300">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                        <CheckCircleIcon className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900">{STRIPE_ENABLED ? 'Boost Active!' : 'You\'re on the list!'}</h2>
                    <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                        {STRIPE_ENABLED 
                            ? `Your item "${listing.title}" is now receiving premium exposure.`
                            : `We'll notify you as soon as boosts launch. Your interest in a ${selectedPlanId} boost is noted!`}
                    </p>
                    <button onClick={onClose} className="mt-10 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (showWaitlist) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center animate-in zoom-in duration-300">
                    <div className="bg-cyan-100 text-cyan-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <ClockIcon className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Boosts Launching Soon</h2>
                    <p className="text-slate-500 text-sm mt-4 font-medium leading-relaxed">
                        We are finalizing our secure payment integration. Want us to email you as soon as this listing's boost goes live?
                    </p>
                    <form onSubmit={handleJoinWaitlist} className="mt-8 space-y-4">
                        <input 
                            type="email" 
                            required
                            value={waitlistEmail}
                            onChange={e => setWaitlistEmail(e.target.value)}
                            placeholder="Your email address"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                        />
                        <button 
                            disabled={isProcessing}
                            className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-700 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : 'Notify Me at Launch'}
                        </button>
                        <button type="button" onClick={() => setShowWaitlist(false)} className="text-xs text-slate-400 font-bold hover:text-slate-600">
                            Go back to tiers
                        </button>
                    </form>
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
                            <p className="text-slate-500 text-[10px] mt-1 font-medium italic">Boosted listings are shown to renters near your asset's location — just like Turo and GetMyBoat.</p>
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
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-cyan-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-20 whitespace-nowrap uppercase tracking-widest">
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
                    
                    <p className="mt-10 text-center text-[10px] text-slate-400 font-medium max-w-2xl mx-auto italic">
                        Potential reach figures are estimates based on average platform traffic. Actual reach varies by category, season, listing quality, and geographic demand.
                    </p>
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

const MyBoostsManager: React.FC<{ user: Session, onBoostListing: () => void }> = ({ user, onBoostListing }) => {
    const [boosts, setBoosts] = React.useState<any[]>([]);
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchBoosts = async () => {
            try {
                const res = await fetch(`/api/boost/my-boosts?user_id=${user.id}`);
                const data = await res.json();
                setBoosts(data.boosts || []);
                setStats(data.stats || null);
            } catch (e) {
                console.error('Failed to fetch boosts');
            } finally {
                setLoading(false);
            }
        };
        fetchBoosts();
    }, [user.id]);

    const activeBoosts = boosts.filter(b => b.status === 'active');
    const pastBoosts = boosts.filter(b => b.status !== 'active');

    if (loading) return <div className="p-20 text-center"><RefreshCwIcon className="h-8 w-8 animate-spin mx-auto text-slate-300" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {!STRIPE_ENABLED && (
                <div className="bg-cyan-600 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-cyan-100">
                    <ClockIcon className="h-5 w-5" />
                    <p className="text-sm font-bold">Boosts launching soon. You'll be notified when ready.</p>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Promote your listings</h2>
                    <p className="text-slate-500 text-sm font-medium">Track your exposure and maximize your earnings.</p>
                </div>
                {boosts.length > 0 && (
                    <button onClick={onBoostListing} className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-black flex items-center gap-2">
                        <RocketIcon className="h-4 w-4" /> BOOST A LISTING
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Boosts</p>
                    <h4 className="text-2xl font-black mt-1 text-slate-900">{activeBoosts.length}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Spent</p>
                    <h4 className="text-2xl font-black mt-1 text-slate-900">${Number(stats?.total_spent || 0).toFixed(2)}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Views Gen.</p>
                    <h4 className="text-2xl font-black mt-1 text-emerald-600">+{Number(stats?.total_views || 0).toLocaleString()}</h4>
                </div>
            </div>

            {boosts.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <RocketIcon className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold italic">No active boosts found.</p>
                    <p className="text-slate-500 text-sm mt-2">Boost your first listing to appear at the top of search results in your area.</p>
                    <button onClick={onBoostListing} className="mt-6 px-8 py-3 bg-cyan-600 text-white font-black rounded-xl hover:bg-cyan-700 shadow-lg shadow-cyan-100 transition-all">
                        Go to My Listings
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {activeBoosts.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <ZapIcon className="h-4 w-4 text-cyan-500" /> Active Now
                            </h3>
                            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                                {activeBoosts.map(b => (
                                    <div key={b.id} className="p-5 flex items-center gap-5 hover:bg-slate-50/50 transition-colors border-b last:border-0 border-slate-50">
                                        <img src={JSON.parse(b.listing_images)[0]} className="w-14 h-14 rounded-xl object-cover" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 text-sm">{b.listing_title}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">{b.tier}</span>
                                                <span className="text-[10px] font-medium text-slate-400">Ends {format(new Date(b.expires_at), 'MMM dd')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 text-right pr-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Views</p>
                                                <p className="text-sm font-black text-emerald-600">+{b.views_count}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiries</p>
                                                <p className="text-sm font-black text-blue-600">+{b.inquiries_count}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {pastBoosts.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Past Exposure</h3>
                            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden opacity-80">
                                {pastBoosts.map(b => (
                                    <div key={b.id} className="p-4 flex items-center gap-4 border-b last:border-0 border-slate-50 text-slate-700">
                                        <img src={JSON.parse(b.listing_images)[0]} className="w-10 h-10 rounded-lg object-cover grayscale" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-xs">{b.listing_title}</h4>
                                            <p className="text-[10px] font-medium text-slate-400">{format(new Date(b.starts_at), 'MMM dd')} - {format(new Date(b.expires_at), 'MMM dd')}</p>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${b.status === 'expired' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'}`}>
                                            {b.status.toUpperCase()}
                                        </span>
                                        <div className="text-right w-16">
                                            <p className="text-[11px] font-black italic">+{b.views_count} views</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const BookingsManager: React.FC<{ 
    bookings: Booking[], 
    userId: string, 
    onStatusUpdate: (id: string, status: string) => Promise<void>,
    onUpdateDepositStatus: (bookingId: string, newStatus: 'held' | 'released' | 'disputed' | 'claimed') => void
}> = ({ bookings, userId, onStatusUpdate, onUpdateDepositStatus }) => {
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
                        onUpdateDepositStatus={onUpdateDepositStatus}
                        onComplete={() => setActiveSessionBooking(null)} 
                     />
                 </div>
             )}
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{mode === 'renting' ? 'My Trips' : 'Reservations'}</h2>
                <div className="bg-white p-1 rounded-xl border border-slate-100 flex shadow-sm">
                    <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'renting' ? 'bg-cyan-100 text-cyan-700 shadow-inner' : 'text-slate-500 hover:bg-slate-50'}`}>I'm Renting</button>
                    <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'hosting' ? 'bg-cyan-100 text-cyan-700 shadow-inner' : 'text-slate-500 hover:bg-slate-50'}`}>I'm Hosting</button>
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
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                        b.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                                        b.status === 'completed' ? 'bg-slate-100 text-slate-600' :
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
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            {b.status === 'confirmed' && (
                                <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('handover'); }} className="px-5 py-2 bg-cyan-600 text-white text-[10px] font-bold rounded-lg hover:bg-cyan-700 shadow shadow-cyan-100 transition-all flex items-center gap-2">
                                    <RocketIcon className="h-3.5 w-3.5" /> CHECK-IN
                                </button>
                            )}
                            {b.status === 'active' && (
                                <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('return'); }} className="px-5 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-black shadow shadow-slate-200 transition-all flex items-center gap-2">
                                    <RefreshCwIcon className="h-3.5 w-3.5" /> RETURN
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
                    <h3 className="text-lg font-bold mt-6 text-slate-800">Trust Score</h3>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">Verify your profile to unlock more bookings.</p>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    {[
                        { id: 'email', name: 'Email Verification', icon: MailIcon, done: !!user.isEmailVerified },
                        { id: 'phone', name: 'Phone Confirmation', icon: PhoneIcon, done: !!user.isPhoneVerified },
                        { id: 'id', name: 'Government ID Check', icon: CreditCardIcon, done: !!user.isIdVerified },
                    ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <item.icon className={`h-4 w-4 ${item.done ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                            </div>
                            {item.done ? <span className="text-emerald-600 font-bold text-[10px] uppercase flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full"><CheckCircleIcon className="h-3.5 w-3.5" /> VERIFIED</span> : 
                                <button onClick={() => onVerify(item.id as any)} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] font-bold rounded-lg transition-colors">VERIFY</button>
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
    const [selectedAgent, setSelectedAgent] = useState<'coach' | 'legal' | 'chat'>('coach');
    const [showBetaModal, setShowBetaModal] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);

    const agents = [
        { id: 'coach', name: 'Success Coach', icon: BrainCircuitIcon, color: 'bg-indigo-600', description: 'Listing & Pricing optimization', price: 'FREE' },
        { id: 'legal', name: 'Legal Shield', icon: ShieldCheckIcon, color: 'bg-emerald-600', description: 'Compliance pathways & templates', premium: true, price: '$4.99' },
        { id: 'chat', name: 'Auto-Reply', icon: MailIcon, color: 'bg-cyan-600', description: 'Automated guest vetting (BETA)', premium: true, price: '$9.99' },
    ];

    const getAdvice = async () => {
        if (selectedAgent === 'chat') {
            setShowBetaModal(true);
            return;
        }
        if (selectedAgent === 'legal') {
            setAdvice(`### 🛡️ Legal Shield Activation\n\nYou are clicking on a premium AI Assistant module. This feature is trained specifically for compliance pathways and custom agreement drafting.\n\n**To activate this module for your listings, please upgrade to the Pro Host plan.**`);
            return;
        }
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

    const ComingSoonToast = () => (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-[150] animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-bold">Coming soon — checkout integration in progress</span>
        </div>
    );

    const BetaModal = () => (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                    <MailIcon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Auto-Reply (BETA)</h3>
                <p className="mt-4 text-slate-600 font-medium leading-relaxed">
                    Auto-Reply is in early access. We'll notify you when it goes live for your account. In the meantime, all other Pro features are active.
                </p>
                <button onClick={() => setShowBetaModal(false)} className="mt-8 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all">
                    Got it
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <SparklesIcon className="h-24 w-24" />
                </div>
                <h2 className="text-2xl font-black flex items-center gap-3"><BrainCircuitIcon className="h-8 w-8 text-cyan-400" /> Goodslister AI Assistant</h2>
                <p className="text-slate-400 mt-2 font-medium">One intelligent assistant. Built to grow your rental business.</p>
            </div>

            {/* AI Impact metrics card */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative">
                <div 
                    className="absolute top-4 right-4 bg-gray-200 text-gray-600 text-[11px] font-black px-2 py-0.5 rounded-full cursor-help"
                    title="Illustrative metrics for demo purposes. Real performance data will appear once you publish listings."
                >
                    SAMPLE DATA
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendUpIcon className="h-5 w-5 text-emerald-500" /> Your AI Impact (Last 30 Days)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Views</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-slate-900">+42%</span>
                            <span className="text-[10px] font-bold text-emerald-600">vs prev 30d</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Conv.</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-slate-900">+18%</span>
                            <span className="text-[10px] font-bold text-emerald-600">vs prev 30d</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Lift</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-emerald-600">+$1,240</span>
                            <span className="text-[10px] font-bold text-slate-400">added value</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-center">
                    <button className="text-xs font-black text-cyan-600 hover:text-cyan-700 flex items-center gap-2 group">
                        Unlock unlimited AI strategies <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agents.map(agent => (
                    <button 
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent.id as any)}
                        className={`p-5 rounded-3xl border-2 transition-all text-left relative group ${selectedAgent === agent.id ? 'bg-white border-cyan-500 shadow-xl' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                    >
                        {agent.id === 'chat' ? (
                            <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full">BETA</span>
                        ) : agent.premium ? (
                            <span className="absolute top-4 right-4 bg-cyan-100 text-cyan-700 text-[8px] font-black px-2 py-0.5 rounded-full">PRO</span>
                        ) : (
                            <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-full">INCLUDED</span>
                        )}
                        <div className={`w-10 h-10 rounded-xl ${agent.color} text-white flex items-center justify-center mb-4`}>
                            <agent.icon className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-slate-900">{agent.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{agent.description}</p>
                    </button>
                ))}
            </div>

            {listings.length > 0 ? (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {agents.find(a => a.id === selectedAgent)?.name} Configuration
                    </h3>
                    
                    {selectedAgent === 'coach' ? (
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
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                            <p className="text-xs text-slate-500 font-medium">Select a listing to apply this agent's expertise.</p>
                            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="mt-3 bg-white border-slate-200 rounded-lg p-2 text-xs font-bold mx-auto block">
                                {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                            </select>
                        </div>
                    )}

                    <button onClick={getAdvice} disabled={loading} className={`w-full py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${selectedAgent === 'coach' ? 'bg-slate-900 hover:bg-black' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
                        {loading ? <RefreshCwIcon className="h-4 w-4 animate-spin" /> : <WandSparklesIcon className="h-4 w-4" />}
                        {loading ? 'Consulting AI...' : selectedAgent === 'coach' ? 'Generate AI Strategy' : `Activate ${agents.find(a => a.id === selectedAgent)?.name}`}
                    </button>
                    {advice && (
                        <div className="space-y-4">
                            <div 
                                className="p-6 bg-blue-50 rounded-2xl text-slate-800 font-medium leading-relaxed whitespace-pre-wrap text-sm"
                                dangerouslySetInnerHTML={{ 
                                    __html: advice
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/### (.*?)\n/g, '<h4 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h4>')
                                }}
                            />
                            <p className="text-[10px] text-slate-400 italic leading-tight text-center">
                                AI suggestions are informational only and do not constitute legal advice. Always consult a licensed attorney before signing rental contracts or operating regulated assets.
                            </p>
                        </div>
                    )}
                </div>
            ) : <p className="text-center p-20 text-slate-400 italic font-bold">List an item to unlock AI Success Coach.</p>}

            {/* Pricing Section for Upsell */}
            <div className="mt-16 pt-16 border-t border-slate-200">
                <div className="text-center mb-10">
                    <h3 className="text-xl font-black text-slate-900">Upgrade Your Assistant</h3>
                    <p className="text-slate-500 text-sm mt-2">Unlock unlimited strategies, legal shields, and auto-replies.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Starter (Simplified for Dashboard) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm opacity-60">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-900">Starter</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current Plan</p>
                            </div>
                            <span className="text-xl font-black text-slate-900">$0</span>
                        </div>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-center gap-2 text-[10px] text-slate-600"><CheckCircleIcon className="h-3 w-3 text-slate-400" /> 5 strategies / mo</li>
                            <li className="flex items-center gap-2 text-[10px] text-slate-600"><CheckCircleIcon className="h-3 w-3 text-slate-400" /> AI Help Center (24/7)</li>
                        </ul>
                    </div>
                    {/* Pro Host (Featured for Dashboard) */}
                    <div className="bg-white p-6 rounded-3xl border-2 border-cyan-500 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-cyan-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl">RECOMMENDED</div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-900">Pro Host</h4>
                                <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">Upgrade to Scale</p>
                            </div>
                            <span className="text-xl font-black text-slate-900">$29<span className="text-xs text-slate-400">/mo</span></span>
                        </div>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-center gap-2 text-[10px] text-slate-600"><ZapIcon className="h-3 w-3 text-cyan-500" /> Unlimited AI strategies</li>
                            <li className="flex items-center gap-2 text-[10px] text-slate-600"><ZapIcon className="h-3 w-3 text-cyan-500" /> Auto-Reply (BETA)</li>
                        </ul>
                        <button 
                            onClick={() => {
                                setShowComingSoon(true);
                                setTimeout(() => setShowComingSoon(false), 3000);
                            }}
                            className="mt-6 w-full py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all text-xs"
                        >
                            Start 14-day Free Trial
                        </button>
                    </div>
                </div>
            </div>

            {showBetaModal && <BetaModal />}
            {showComingSoon && <ComingSoonToast />}

            <div className="mt-12 text-center">
                <p className="text-[12px] text-slate-400 italic">
                    Demo account — figures shown are illustrative only and do not reflect real account activity.
                </p>
            </div>
        </div>
    );
};

const UserDashboardPage: React.FC<UserDashboardPageProps> = (props) => {
    const { 
        user, listings, bookings, favoriteListings, onListingClick, onEditListing, 
        onDeleteListing, onToggleFavorite, onUpdateAvatar, onUpdateProfile, 
        onVerificationUpdate, onBookingStatusUpdate, onUpdateDepositStatus, onViewPublicProfile 
    } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    const [listingToBoost, setListingToBoost] = useState<Listing | null>(null);

    // Stripe Connect Integration States
    const [stripeStatus, setStripeStatus] = useState<'loading' | 'not_connected' | 'pending' | 'active'>('loading');
    const [stripeDetails, setStripeDetails] = useState<any>(null);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [loginLinkLoading, setLoginLinkLoading] = useState(false);

    const fetchStripeStatus = async (showLoading = true) => {
        if (showLoading) setStripeStatus('loading');
        try {
            const res = await fetch(`/api/stripe/connect/check-status?userId=${user.id}`);
            const data = await res.json();
            if (res.ok) {
                setStripeDetails(data);
                if (data.charges_enabled) {
                    setStripeStatus('active');
                } else if (data.status === 'not_connected') {
                    setStripeStatus('not_connected');
                } else {
                    setStripeStatus('pending');
                }
            } else {
                setStripeStatus('not_connected');
            }
        } catch (e) {
            console.error("Error checking Stripe status:", e);
            setStripeStatus('not_connected');
        }
    };

    const handleViewStripeDashboard = async () => {
        setLoginLinkLoading(true);
        try {
            const res = await fetch('/api/stripe/connect/create-login-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.open(data.url, '_blank', 'noopener,noreferrer');
            } else {
                alert(data.message || 'Error al generar el enlace de acceso a Stripe Express.');
            }
        } catch (e) {
            console.error(e);
            alert('Error al conectar con Stripe.');
        } finally {
            setLoginLinkLoading(false);
        }
    };

    // Keep Stripe status synced when entering the billing tab or when user changes
    useEffect(() => {
        if (activeTab === 'billing') {
            fetchStripeStatus();
        }
    }, [activeTab, user.id]);

    // Handle hash check for onboarding redirect/reload
    useEffect(() => {
        if (typeof window !== 'undefined' && (window.location.hash.includes('stripeOnboardingComplete') || window.location.hash.includes('stripeOnboardingRefresh'))) {
            setActiveTab('billing');
            // Remove the hash so it doesn't trigger on future refreshes
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, []);
    
    // Account Security State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    
    // Account Closure State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Profile Edit State
    const [profileName, setProfileName] = useState(user.name);
    const [profileBio, setProfileBio] = useState(user.bio || '');

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

    const tabs: { id: DashboardTab | 'boosts'; name: string; icon: React.ElementType }[] = [
        { id: 'profile', name: 'Profile Settings', icon: UserCheckIcon },
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'boosts', name: 'My Boosts', icon: RocketIcon },
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
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Public Name</label>
                                    <input 
                                        type="text" 
                                        value={profileName} 
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-500/20" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bio</label>
                                    <textarea 
                                        value={profileBio} 
                                        onChange={(e) => setProfileBio(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-slate-600 min-h-[120px] focus:ring-2 focus:ring-cyan-500/20 outline-none" 
                                        rows={4} 
                                    />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button 
                                        onClick={() => onUpdateProfile(profileName, profileBio, user.avatarUrl)} 
                                        className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <LockIcon className="h-4 w-4 text-slate-400" /> Account Security
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
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
                                    className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md hover:bg-slate-950 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isUpdatingPassword ? <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" /> : 'Update Password'}
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
                                <FileWarningIcon className="h-4 w-4" /> Danger Zone
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-bold text-red-900 text-sm">Close Account</h4>
                                    <p className="text-[10px] text-red-700/70 font-medium mt-0.5">Permanently delete your profile, listings, and history.</p>
                                </div>
                                <button 
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="px-4 py-2 bg-white text-red-600 border border-red-100 text-[10px] font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                    <TrashIcon className="h-3.5 w-3.5" /> Delete My Account
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
                                            <td className="p-4 font-bold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    {l.title}
                                                    {l.boostTier && (
                                                        <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-[8px] font-black rounded-md flex items-center gap-1">
                                                            <ZapIcon className="h-2 w-2" /> BOOSTED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
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
            case 'boosts':
                return <MyBoostsManager user={user} onBoostListing={() => setActiveTab('listings')} />;
            case 'bookings':
                return <BookingsManager bookings={bookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} onUpdateDepositStatus={onUpdateDepositStatus} />;
            case 'security':
                return <SecurityTab user={user} onVerify={(type) => onVerificationUpdate(user.id, type)} />;
            case 'aiAssistant':
                return <AIListingCoach listings={listings} />;
            case 'analytics':
                const earnings = bookings
                    .filter(b => b.listing.owner.id === user.id && (b.status === 'confirmed' || b.status === 'completed'))
                    .reduce((sum, b) => sum + b.totalPrice, 0);
                
                const activeRentals = bookings.filter(b => b.status === 'active').length;
                const pendingRequests = bookings.filter(b => b.status === 'pending' && b.listing.owner.id === user.id).length;

                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Hosting Performance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Earnings</p>
                                <h4 className="text-2xl font-bold mt-1 text-slate-800">${earnings.toLocaleString()}</h4>
                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-medium mt-4"><TrendUpIcon className="h-3 w-3" /> Realized revenue</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Trips</p>
                                <h4 className="text-2xl font-bold mt-1 text-slate-800">{activeRentals}</h4>
                                <div className="flex items-center gap-1 text-blue-500 text-[10px] font-medium mt-4"><ArrowRightIcon className="h-3 w-3" /> Rentals in progress</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Req</p>
                                <h4 className="text-2xl font-bold mt-1 text-slate-800">{pendingRequests}</h4>
                                <div className="flex items-center gap-1 text-amber-500 text-[10px] font-medium mt-4"><CalendarIcon className="h-3 w-3" /> Needs your attention</div>
                            </div>
                             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-gray-900">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trust Score</p>
                                <h4 className="text-2xl font-bold mt-1 text-slate-800">{user.isIdVerified ? '98%' : '65%'}</h4>
                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-medium mt-4"><CheckCircleIcon className="h-3 w-3" /> Based on verification</div>
                            </div>
                        </div>
                    </div>
                );
            case 'billing':
                const myEarnings = bookings.filter(b => b.listing.owner.id === user.id && b.status !== 'cancelled');
                
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-905 tracking-tight">Finanzas y Cobros</h2>
                                <p className="text-xs text-slate-500 font-bold">Administra tus configuraciones de cobro seguro de Stripe y consulta tu historial de pagos.</p>
                            </div>
                            <button 
                                onClick={() => fetchStripeStatus(true)}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                            >
                                <RefreshCwIcon className={`h-3.5 w-3.5 text-slate-500 ${stripeStatus === 'loading' ? 'animate-spin text-cyan-600' : ''}`} />
                                Refrescar Cuenta
                            </button>
                        </div>

                        {/* Stripe Connect Express Status Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-gray-900">
                            <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
                                <div className="space-y-2 max-w-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-cyan-100 p-2 rounded-xl text-cyan-600 shrink-0">
                                            <CreditCardIcon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Pagos / Cobrar con Stripe</h3>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Vincular tu cuenta con Stripe Connect habilita pagos express automáticos e inmediatos. También activa nuestro <strong>Smart Legal Shield</strong> que protege tus pertenencias configurando depósitos de garantía súper altos de forma automática al reservar.
                                    </p>
                                </div>
                                <div className="w-full lg:w-auto shrink-0 flex flex-col md:flex-row lg:flex-col items-stretch lg:items-end gap-3 justify-center">
                                    {stripeStatus === 'loading' && (
                                        <div className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 min-w-[240px]">
                                            <RefreshCwIcon className="h-4 w-4 animate-spin text-cyan-600" />
                                            <span>Consultando a Stripe...</span>
                                        </div>
                                    )}

                                    {stripeStatus === 'not_connected' && (
                                        <button
                                            onClick={() => setIsConnectModalOpen(true)}
                                            className="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-2 min-w-[240px]"
                                        >
                                            <LandmarkIcon className="h-4 w-4" />
                                            Conectar cuenta de pagos
                                        </button>
                                    )}

                                    {stripeStatus === 'pending' && (
                                        <div className="flex flex-col gap-2 min-w-[240px] items-stretch sm:items-start lg:items-end">
                                            <span className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-full uppercase border border-amber-100 self-stretch sm:self-auto">
                                                <InfoIcon className="h-4 w-4 text-amber-600" /> Configuración Pendiente
                                            </span>
                                            <p className="text-[11px] text-slate-500 max-w-[250px] leading-relaxed text-center sm:text-left lg:text-right">
                                                Completá tu registro en Stripe para poder recibir el dinero de tus listas.
                                            </p>
                                            <button
                                                onClick={() => setIsConnectModalOpen(true)}
                                                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-2xl shadow-xl shadow-amber-100 transition-all flex items-center justify-center gap-2 mt-1"
                                            >
                                                <RefreshCwIcon className="h-4 w-4" />
                                                Completar registro
                                            </button>
                                        </div>
                                    )}

                                    {stripeStatus === 'active' && (
                                        <div className="flex flex-col gap-2 min-w-[240px] items-stretch sm:items-start lg:items-end">
                                            <span className="flex items-center justify-center gap-1.5 px-4 b py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full uppercase border border-emerald-100 self-stretch sm:self-auto">
                                                <CheckCircleIcon className="h-4 w-4 text-emerald-600" /> Listo para recibir pagos
                                            </span>
                                            <button
                                                onClick={handleViewStripeDashboard}
                                                disabled={loginLinkLoading}
                                                className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 mt-1 shadow-sm active:scale-95 disabled:bg-slate-400"
                                            >
                                                {loginLinkLoading ? (
                                                    <RefreshCwIcon className="h-4 w-4 animate-spin text-white" />
                                                ) : (
                                                    <ExternalLinkIcon className="h-4 w-4" />
                                                )}
                                                Ver mi panel de Stripe
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Financial Ledger Section */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Ledger Financiero</h3>
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden text-gray-900">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-gray-900">
                                        <tr><th className="p-4 font-bold">Transaction</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold text-right">Amount</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-gray-700">
                                        {myEarnings.length === 0 ? (
                                            <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">No transactions found.</td></tr>
                                        ) : (
                                            myEarnings.map(b => (
                                                <tr key={b.id} className="hover:bg-slate-50">
                                                    <td className="p-4 font-medium">Rental Payout - {b.listing.title}</td>
                                                    <td className="p-4">
                                                        <span className={`font-bold uppercase text-[10px] ${b.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                            {b.status === 'completed' ? 'CLEARED' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-black text-right text-emerald-500">+${b.totalPrice.toFixed(2)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
            {listingToBoost && <PromotionModal listing={listingToBoost} onClose={() => setListingToBoost(null)} user={user} />}
            
            {isConnectModalOpen && (
                <ConnectStripeModal 
                    user={user} 
                    onClose={() => {
                        setIsConnectModalOpen(false);
                        fetchStripeStatus(false);
                    }} 
                />
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