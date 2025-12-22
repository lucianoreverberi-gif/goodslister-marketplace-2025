import React, { useState, useEffect } from 'react';
import { Session, Listing, Booking, InspectionPhoto } from '../types';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService';
// Added missing WalletIcon and ClockIcon to imports
import { 
    PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, 
    LightbulbIcon, MegaphoneIcon, WandSparklesIcon, ShieldIcon, MailIcon, 
    PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, 
    PencilIcon, RocketIcon, XIcon, LandmarkIcon, CalculatorIcon, 
    UmbrellaIcon, SmartphoneIcon, CameraFaceIcon, ScanIcon, 
    FileWarningIcon, GavelIcon, CameraIcon, HeartIcon, 
    UserCheckIcon, TrashIcon, AlertTriangleIcon, SparklesIcon,
    ChevronRightIcon, ChevronLeftIcon, InfoIcon, ShieldCheckIcon,
    TrendUpIcon, WalletIcon, ClockIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';
import ListingCard from './ListingCard';
import RentalSessionWizard from './RentalSessionWizard';
import AnalyticsDashboard from './AnalyticsDashboard';

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

type DashboardTab = 'analytics' | 'listings' | 'bookings' | 'billing' | 'aiAssistant' | 'security' | 'profile' | 'favorites';

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ 
    user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onUpdateProfile,
    onListingClick, onEditListing, favoriteListings = [], onToggleFavorite, onViewPublicProfile, onDeleteListing, onBookingStatusUpdate 
}) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);
    const [listingToDelete, setListingToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'analytics', name: 'Performance', icon: BarChartIcon },
        { id: 'bookings', name: 'Reservations', icon: CalendarIcon },
        { id: 'listings', name: 'My Gear', icon: PackageIcon },
        { id: 'aiAssistant', name: 'AI Strategist', icon: BrainCircuitIcon },
        { id: 'billing', name: 'Payouts', icon: DollarSignIcon },
        { id: 'favorites', name: 'Saved', icon: HeartIcon },
        { id: 'security', name: 'Security', icon: ShieldIcon },
        { id: 'profile', name: 'Profile', icon: UserCheckIcon },
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

    // --- SUB-COMPONENTS ---

    const ProfileSettingsTab: React.FC = () => {
        const [bio, setBio] = useState(user.bio || '');
        const [avatar, setAvatar] = useState(user.avatarUrl);
        const [isSaving, setIsSaving] = useState(false);
        const [saveMessage, setSaveMessage] = useState('');
        
        const handleSave = async () => { 
            setIsSaving(true); 
            await onUpdateProfile(bio, avatar); 
            setSaveMessage('Saved!'); 
            setIsSaving(false); 
            setTimeout(() => setSaveMessage(''), 3000);
        };

        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    <div className="w-32 h-32 relative group">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-md">
                             <ImageUploader currentImageUrl={avatar} onImageChange={setAvatar} label="" />
                        </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{user.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage your public identity and profile bio.</p>
                        <button onClick={() => onViewPublicProfile(user.id)} className="mt-4 text-xs font-black text-cyan-600 border-2 border-cyan-600 px-4 py-1.5 rounded-full hover:bg-cyan-50 transition-colors uppercase tracking-widest">View Public Profile</button>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">Public Bio</label>
                    <textarea 
                        value={bio} 
                        onChange={e => setBio(e.target.value)} 
                        className="w-full border border-gray-100 bg-gray-50 rounded-2xl p-6 text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all" 
                        rows={6} 
                        placeholder="Tell others about your adventure style..."
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="px-10 py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-xl shadow-cyan-100 hover:bg-cyan-700 disabled:opacity-50 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saveMessage && (
                        <span className="text-green-600 font-bold flex items-center gap-1 animate-in slide-in-from-left-2">
                            <CheckCircleIcon className="h-5 w-5" />
                            {saveMessage}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const AIOptimizer: React.FC = () => {
        const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
        const [advice, setAdvice] = useState<string>('');
        const [isLoading, setIsLoading] = useState(false);
        const [activeType, setActiveType] = useState<ListingAdviceType | null>(null);

        const handleGetAdvice = async (type: ListingAdviceType) => {
            const listing = listings.find(l => l.id === selectedListingId);
            if (!listing) return;
            
            setIsLoading(true);
            setActiveType(type);
            setAdvice('');
            try {
                const res = await getListingAdvice(listing, type);
                setAdvice(res);
            } catch (e) {
                setAdvice("Failed to generate AI advice. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100">
                            <BrainCircuitIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">AI Strategist</h2>
                            <p className="text-gray-500 text-sm font-medium">Data-driven insights to maximize your earnings.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Listing</label>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {listings.map(l => (
                                    <div 
                                        key={l.id} 
                                        onClick={() => setSelectedListingId(l.id)}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedListingId === l.id ? 'border-cyan-600 bg-cyan-50 shadow-md' : 'border-gray-50 hover:border-gray-200 bg-white'}`}
                                    >
                                        <img src={l.images[0]} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-gray-900 truncate text-sm">{l.title}</p>
                                            <p className="text-xs text-gray-500 font-bold">${l.pricePerDay || l.pricePerHour} / {l.pricingType}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Engine</label>
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => handleGetAdvice('improvement')} disabled={!selectedListingId || isLoading} className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-cyan-200 text-left transition-all disabled:opacity-50 group">
                                    <div className="bg-cyan-100 p-3 rounded-xl text-cyan-600 group-hover:scale-110 transition-transform"><WandSparklesIcon className="h-6 w-6" /></div>
                                    <div><p className="font-black text-gray-900 text-sm">Optimize Copy</p><p className="text-xs text-gray-500 font-medium">Improve SEO and conversion rates.</p></div>
                                </button>
                                <button onClick={() => handleGetAdvice('pricing')} disabled={!selectedListingId || isLoading} className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-green-200 text-left transition-all disabled:opacity-50 group">
                                    <div className="bg-green-100 p-3 rounded-xl text-green-600 group-hover:scale-110 transition-transform"><DollarSignIcon className="h-6 w-6" /></div>
                                    <div><p className="font-black text-gray-900 text-sm">Market Price Check</p><p className="text-xs text-gray-500 font-medium">Benchmark against local competitors.</p></div>
                                </button>
                                <button onClick={() => handleGetAdvice('promotion')} disabled={!selectedListingId || isLoading} className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-purple-200 text-left transition-all disabled:opacity-50 group">
                                    <div className="bg-purple-100 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform"><MegaphoneIcon className="h-6 w-6" /></div>
                                    <div><p className="font-black text-gray-900 text-sm">Viral Content Generator</p><p className="text-xs text-gray-500 font-medium">Ready-to-post social media captions.</p></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {advice && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="bg-indigo-600 px-8 py-4 flex items-center justify-between">
                            <h3 className="font-black text-white flex items-center gap-2 text-sm uppercase tracking-widest"><SparklesIcon className="h-5 w-5" /> AI Strategy Report</h3>
                            <button onClick={() => setAdvice('')} className="text-indigo-200 hover:text-white transition-colors"><XIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="p-10">
                            <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: advice.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-black">$1</strong>').replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>') }} />
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-indigo-100 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            <BrainCircuitIcon className="absolute inset-0 m-auto h-8 w-8 text-indigo-600" />
                        </div>
                        <p className="text-indigo-600 font-black text-sm uppercase tracking-[0.2em] animate-pulse">Scanning Market Data...</p>
                    </div>
                )}
            </div>
        );
    };

    const BillingTab: React.FC = () => {
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
        const pendingPayout = confirmedBookings.reduce((acc, b) => acc + (b.balanceDueOnSite || 0), 0);
        
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-10">
                    <div className="bg-green-100 p-8 rounded-[2rem] text-green-600 shadow-inner">
                        <WalletIcon className="h-12 w-12" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Earnings & Payouts</h2>
                        <p className="text-gray-500 font-medium mt-1">Manage how you get paid for your gear rentals.</p>
                    </div>
                    <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl text-center min-w-[240px]">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Receivable</p>
                        <p className="text-4xl font-black">${pendingPayout.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><CreditCardIcon className="h-6 w-6 text-cyan-600" /> Payout Method</h3>
                        <div className="p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center text-center">
                            <LandmarkIcon className="h-10 w-10 text-gray-300 mb-4" />
                            <p className="text-gray-600 font-bold mb-6">No bank account connected</p>
                            <button className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 uppercase text-xs tracking-widest">Connect Stripe Payouts</button>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><ClockIcon className="h-6 w-6 text-cyan-600" /> Recent Activity</h3>
                        <div className="space-y-4">
                            {confirmedBookings.slice(0, 4).map(b => (
                                <div key={b.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <p className="text-sm font-black text-gray-800">{b.listing.title}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{format(new Date(b.startDate), 'MMM dd')}</p>
                                    </div>
                                    <p className="font-black text-green-600">+${b.balanceDueOnSite}</p>
                                </div>
                            ))}
                            {confirmedBookings.length === 0 && <p className="text-center py-10 text-gray-400 italic font-medium">No payout history yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const VerificationItem: React.FC<{icon: React.ElementType, text: string, isVerified: boolean, onVerify: () => void}> = ({ icon: Icon, text, isVerified, onVerify }) => (
         <li className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center">
                <div className={`p-3 rounded-2xl mr-4 ${isVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`font-black text-sm uppercase tracking-wider ${isVerified ? 'text-gray-900' : 'text-gray-400'}`}>{text}</span>
            </div>
            {isVerified ? (
                <div className="bg-green-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-100">
                    <CheckCircleIcon className="w-4 h-4" /> Verified
                </div>
            ) : (
                <button onClick={onVerify} className="px-6 py-2 text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 rounded-2xl shadow-xl shadow-cyan-100 transition-all uppercase tracking-widest">Verify</button>
            )}
        </li>
    );

    const SecurityTab: React.FC = () => {
        const score = (user.isEmailVerified ? 25 : 0) + (user.isPhoneVerified ? 25 : 0) + (user.isIdVerified ? 50 : 0);
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r pb-8 lg:pb-0 lg:pr-12">
                        <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-[12px] border-gray-50">
                            <span className="text-4xl font-black text-gray-900">{score}%</span>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle 
                                    cx="72" cy="72" r="66" 
                                    fill="transparent" 
                                    stroke="currentColor" 
                                    strokeWidth="12" 
                                    strokeDasharray={414} 
                                    strokeDashoffset={414 - (414 * score) / 100}
                                    className="text-cyan-500 transition-all duration-1000"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black mt-6 text-gray-900 tracking-tight">Trust Level</h3>
                    </div>
                     <div className="lg:col-span-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Mandatory Verifications</h3>
                        <ul className="space-y-4">
                            <VerificationItem icon={MailIcon} text="Email Secure" isVerified={!!user.isEmailVerified} onVerify={() => onVerificationUpdate(user.id, 'email')} />
                            <VerificationItem icon={PhoneIcon} text="Mobile Linked" isVerified={!!user.isPhoneVerified} onVerify={() => setShowPhoneModal(true)} />
                            <VerificationItem icon={UserCheckIcon} text="Gov Identity" isVerified={!!user.isIdVerified} onVerify={() => setShowIdModal(true)} />
                        </ul>
                    </div>
                 </div>
            </div>
        );
    };

    const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
        const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
        const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);
        const [sessionInitialMode, setSessionInitialMode] = useState<'handover' | 'return'>('handover');
        const displayedBookings = mode === 'renting' ? bookings.filter(b => b.renterId === userId) : bookings.filter(b => b.listing.owner.id === userId);
        return (
            <div className="animate-in fade-in duration-500">
                {activeSessionBooking && (
                    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
                        <RentalSessionWizard booking={activeSessionBooking} initialMode={sessionInitialMode} onStatusChange={(s) => onStatusUpdate(activeSessionBooking.id, s)} onComplete={() => setActiveSessionBooking(null)} />
                    </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Reservations</h2>
                    <div className="bg-white p-1.5 rounded-2xl border shadow-inner flex">
                        <button onClick={() => setMode('renting')} className={`px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${mode === 'renting' ? 'bg-cyan-600 text-white font-black shadow-xl' : 'text-gray-400 hover:text-gray-900'}`}>Renting</button>
                        <button onClick={() => setMode('hosting')} className={`px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${mode === 'hosting' ? 'bg-cyan-600 text-white font-black shadow-xl' : 'text-gray-400 hover:text-gray-900'}`}>Hosting</button>
                    </div>
                </div>
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="p-6">Item</th>
                                <th className="p-6">Duration</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedBookings.map(b => (
                                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-6 font-black text-gray-900 text-base">{b.listing.title}</td>
                                    <td className="p-6 text-gray-500 font-bold">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</td>
                                    <td className="p-6 text-right">
                                        {b.status === 'confirmed' && <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('handover'); }} className="px-6 py-2 bg-cyan-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-100">Handover</button>}
                                        {b.status === 'active' && <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('return'); }} className="px-6 py-2 bg-orange-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100">Return</button>}
                                    </td>
                                </tr>
                            ))}
                            {displayedBookings.length === 0 && (
                                <tr><td colSpan={3} className="p-20 text-center text-gray-400 font-bold italic">No active reservations found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics': return <AnalyticsDashboard bookings={bookings} listings={listings} />;
            case 'listings': return (
                <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">My Gear</h2>
                        <button className="px-8 py-3 bg-gray-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-black shadow-xl transition-all">+ Add New Listing</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {listings.map(l => (
                            <div key={l.id} className="relative group">
                                <ListingCard listing={l} onClick={onListingClick || (() => {})} isFavorite={favoriteListings?.some(fl => fl.id === l.id)} onToggleFavorite={onToggleFavorite} />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                    <button onClick={(e) => { e.stopPropagation(); onEditListing?.(l.id); }} className="p-3 bg-white rounded-2xl shadow-2xl text-gray-600 hover:text-cyan-600"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setListingToDelete(l.id); }} className="p-3 bg-white rounded-2xl shadow-2xl text-gray-600 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'bookings': return <BookingsManager bookings={bookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'favorites': return (
                <div className="animate-in fade-in duration-500">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-10">Saved Items</h2>
                    {favoriteListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {favoriteListings.map(l => <ListingCard key={l.id} listing={l} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}
                        </div>
                    ) : (
                        <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <HeartIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold italic">You haven't saved any items yet.</p>
                        </div>
                    )}
                </div>
            );
            case 'security': return <SecurityTab />;
            case 'billing': return <BillingTab />;
            case 'aiAssistant': return <AIOptimizer />;
            case 'profile': return <ProfileSettingsTab />;
            default: return null;
        }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-16">
                    <aside className="lg:w-80 flex-shrink-0">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-5 sticky top-28">
                             <div className="p-6 mb-4 border-b border-gray-50">
                                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.4em] mb-1">Command Hub</p>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Main Menu</h2>
                             </div>
                             <nav className="flex flex-col space-y-2">
                                {tabs.map(tab => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id)} 
                                        className={`flex items-center px-6 py-4 rounded-[1.8rem] text-sm font-black transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                                    >
                                        <tab.icon className={`h-5 w-5 mr-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} /> 
                                        {tab.name}
                                    </button>
                                ))}
                             </nav>
                        </div>
                    </aside>

                    <main className="flex-1 overflow-hidden min-h-[700px]">
                        {renderContent()}
                    </main>
                </div>
            </div>

            {/* Modals */}
            {showPhoneModal && <PhoneVerificationModal onClose={() => setShowPhoneModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'phone')} />}
            {showIdModal && <IdVerificationModal onClose={() => setShowIdModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'id')} />}
            {listingToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-gray-100">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrashIcon className="h-10 w-10 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Listing?</h3>
                        <p className="text-gray-600 font-medium mb-8 leading-relaxed">This action cannot be undone. All future bookings for this item will be cancelled.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setListingToDelete(null)} className="flex-1 py-4 border-2 border-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">Keep It</button>
                            <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                                {isDeleting ? '...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
        if (!phone || phone.replace(/\D/g, '').length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
        setError(''); setIsLoading(true);
        const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
        try {
            const res = await fetch('/api/verify/phone', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'send', phoneNumber: formattedPhone }) });
            const data = await res.json();
            if (res.ok) setStep('code'); else setError(data.error || 'Failed to send code.');
        } catch (e) { setError('Connection error. Try again.'); } finally { setIsLoading(false); }
    };
    const handleVerify = async () => {
        if (!code || code.length !== 6) return;
        setError(''); setIsLoading(true);
        const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
        try {
            const res = await fetch('/api/verify/phone', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'verify', phoneNumber: formattedPhone, code }) });
            const data = await res.json();
            if (res.ok && data.status === 'approved') { onSuccess(); onClose(); } else setError(data.message || 'Invalid code.');
        } catch (e) { setError('Verification failed.'); } finally { setIsLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative border border-gray-100 p-10">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"><XIcon className="h-6 w-6" /></button>
                <div className="bg-cyan-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 text-cyan-600 shadow-inner"><SmartphoneIcon className="h-10 w-10" /></div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter">Verify Phone</h3>
                {step === 'input' ? (
                    <div className="space-y-8 mt-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mobile Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-400 font-black">+1</span>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="786-000-0000" className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none font-bold" />
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-600 font-black flex items-center gap-2"><AlertTriangleIcon className="h-3 w-3" /> {error}</p>}
                        <button onClick={handleSendCode} disabled={!phone || isLoading} className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl hover:bg-black transition-all">
                            {isLoading ? 'Sending...' : 'Send SMS Code'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-4 mt-6">
                        <div className="text-center p-6 bg-cyan-50 rounded-3xl border border-cyan-100">
                            <p className="text-[10px] text-cyan-600 font-black uppercase tracking-widest mb-1">Code sent to</p>
                            <p className="font-black text-cyan-900 text-lg">{phone}</p>
                        </div>
                        <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} placeholder="000000" className="w-full text-center text-4xl font-mono font-black tracking-[0.4em] border-b-4 border-gray-100 focus:border-cyan-500 outline-none pb-4 bg-transparent" autoFocus />
                        {error && <p className="text-xs text-red-600 text-center font-black">{error}</p>}
                        <div className="flex gap-4">
                            <button onClick={() => setStep('input')} className="flex-1 py-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">Back</button>
                            <button onClick={handleVerify} disabled={code.length !== 6 || isLoading} className="flex-[2] py-5 bg-cyan-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-cyan-100">
                                {isLoading ? '...' : 'Verify Code'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const IdVerificationModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [idFront, setIdFront] = useState('');
    const [idBack, setIdBack] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleNext = () => { if (step === 1 && idFront) setStep(2); else if (step === 2 && idBack) handleSubmit(); };
    const handleSubmit = async () => { setIsLoading(true); await new Promise(r => setTimeout(r, 2500)); onSuccess(); onClose(); };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative border border-gray-100 p-10">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="font-black text-gray-900 flex items-center gap-3 text-lg tracking-tighter">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><UserCheckIcon className="h-5 w-5" /></div>
                        Identity Check
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon className="h-6 w-6" /></button>
                </div>
                {!isLoading ? (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h4 className="text-xl font-black text-gray-900">{step === 1 ? 'Front of ID' : 'Back of ID'}</h4>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Ensure all text is sharp and readable.</p>
                        </div>
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-inner bg-gray-50 border-2 border-dashed border-gray-200">
                            <ImageUploader label="" currentImageUrl={step === 1 ? idFront : idBack} onImageChange={step === 1 ? setIdFront : setIdBack} />
                        </div>
                        <button onClick={handleNext} disabled={(step === 1 && !idFront) || (step === 2 && !idBack)} className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-2xl uppercase tracking-widest text-[10px] hover:bg-black transition-all">
                            {step === 1 ? 'Continue' : 'Finish & Upload'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-8 animate-in zoom-in-95">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-[6px] border-indigo-100 rounded-full"></div>
                            <div className="absolute inset-0 border-[6px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            <ShieldIcon className="absolute inset-0 m-auto h-10 w-10 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-gray-900 tracking-tighter">Validating Identity</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 animate-pulse">Running Biometric Scan...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboardPage;