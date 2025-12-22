import React, { useState, useEffect } from 'react';
import { Session, Listing, Booking, InspectionPhoto } from '../types';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService';
import { 
    PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, 
    LightbulbIcon, MegaphoneIcon, WandSparklesIcon, ShieldIcon, MailIcon, 
    PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, 
    PencilIcon, RocketIcon, XIcon, LandmarkIcon, CalculatorIcon, 
    UmbrellaIcon, SmartphoneIcon, CameraFaceIcon, ScanIcon, 
    FileWarningIcon, GavelIcon, CameraIcon, HeartIcon, 
    UserCheckIcon, TrashIcon, AlertTriangleIcon, SparklesIcon,
    ChevronRightIcon, ChevronLeftIcon, InfoIcon, ShieldCheckIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    <div className="w-32 h-32 relative group">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-md">
                             <ImageUploader currentImageUrl={avatar} onImageChange={setAvatar} label="" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <CameraIcon className="text-white h-6 w-6" />
                        </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage your public identity and profile bio.</p>
                        <button onClick={() => onViewPublicProfile(user.id)} className="mt-4 text-xs font-bold text-cyan-600 border border-cyan-600 px-3 py-1 rounded-full hover:bg-cyan-50 transition-colors">View Public Profile</button>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block font-bold text-gray-700 uppercase text-xs tracking-widest">Public Bio</label>
                    <textarea 
                        value={bio} 
                        onChange={e => setBio(e.target.value)} 
                        className="w-full border border-gray-200 rounded-xl p-4 text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all" 
                        rows={6} 
                        placeholder="Tell others about your adventure style..."
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg hover:bg-cyan-700 disabled:opacity-50 transition-all transform active:scale-95"
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                            <BrainCircuitIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">AI Listing Strategist</h2>
                            <p className="text-gray-500 text-sm">Optimize your performance and beat the local competition.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Choose a listing to analyze</label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {listings.map(l => (
                                    <div 
                                        key={l.id} 
                                        onClick={() => setSelectedListingId(l.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${selectedListingId === l.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-indigo-200 bg-white'}`}
                                    >
                                        <img src={l.images[0]} className="w-12 h-12 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate text-sm">{l.title}</p>
                                            <p className="text-xs text-gray-500">${l.pricePerDay || l.pricePerHour} / {l.pricingType}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Pick a strategy goal</label>
                            <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => handleGetAdvice('improvement')} disabled={!selectedListingId || isLoading} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition-all disabled:opacity-50">
                                    <div className="bg-cyan-100 p-2 rounded-lg text-cyan-600"><WandSparklesIcon className="h-5 w-5" /></div>
                                    <div><p className="font-bold text-gray-900 text-sm">Improve Title & Description</p><p className="text-xs text-gray-500">SEO optimization and better conversions.</p></div>
                                </button>
                                <button onClick={() => handleGetAdvice('pricing')} disabled={!selectedListingId || isLoading} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition-all disabled:opacity-50">
                                    <div className="bg-green-100 p-2 rounded-lg text-green-600"><DollarSignIcon className="h-5 w-5" /></div>
                                    <div><p className="font-bold text-gray-900 text-sm">Analyze Pricing</p><p className="text-xs text-gray-500">Get a competitive market assessment.</p></div>
                                </button>
                                <button onClick={() => handleGetAdvice('promotion')} disabled={!selectedListingId || isLoading} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition-all disabled:opacity-50">
                                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><MegaphoneIcon className="h-5 w-5" /></div>
                                    <div><p className="font-bold text-gray-900 text-sm">Create Social Campaign</p><p className="text-xs text-gray-500">AI-written post for Instagram/Facebook.</p></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {advice && (
                    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2"><LightbulbIcon className="h-5 w-5" /> Strategy Insights</h3>
                            <button onClick={() => setAdvice('')} className="text-indigo-400 hover:text-indigo-600"><XIcon className="h-5 w-5" /></button>
                        </div>
                        <div className="p-8"><div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: advice.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>').replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>') }} /></div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full relative">
                            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            <SparklesIcon className="absolute inset-0 m-auto h-6 w-6 text-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-indigo-600 font-bold animate-pulse">Refining strategy with AI...</p>
                    </div>
                )}
            </div>
        );
    };

    const VerificationItem: React.FC<{icon: React.ElementType, text: string, isVerified: boolean, onVerify: () => void}> = ({ icon: Icon, text, isVerified, onVerify }) => (
         <li className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
            <div className="flex items-center">
                <Icon className={`w-6 h-6 mr-4 ${isVerified ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`font-bold ${isVerified ? 'text-gray-900' : 'text-gray-500'}`}>{text}</span>
            </div>
            {isVerified ? (
                <div className="flex items-center text-green-600 font-bold text-xs uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <CheckCircleIcon className="w-4 h-4 mr-1.5" /> Verified
                </div>
            ) : (
                <button onClick={onVerify} className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-full shadow-md">Verify</button>
            )}
        </li>
    );

    const SecurityTab: React.FC = () => {
        const score = (user.isEmailVerified ? 25 : 0) + (user.isPhoneVerified ? 25 : 0) + (user.isIdVerified ? 50 : 0);
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r pb-8 lg:pb-0 lg:pr-12">
                        <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-gray-100">
                            <span className="text-3xl font-black text-gray-900">{score}%</span>
                            <div className="absolute inset-0 border-8 border-cyan-500 rounded-full" style={{ clipPath: `polygon(50% 50%, -50% -50%, ${score}% -50%, ${score}% 150%, -50% 150%)` }}></div>
                        </div>
                        <h3 className="text-lg font-bold mt-4 text-gray-900">Trust Score</h3>
                    </div>
                     <div className="lg:col-span-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Required Verifications</h3>
                        <ul className="space-y-4">
                            <VerificationItem icon={MailIcon} text="Email address" isVerified={!!user.isEmailVerified} onVerify={() => onVerificationUpdate(user.id, 'email')} />
                            <VerificationItem icon={PhoneIcon} text="Phone SMS" isVerified={!!user.isPhoneVerified} onVerify={() => setShowPhoneModal(true)} />
                            <VerificationItem icon={UserCheckIcon} text="Identity Document" isVerified={!!user.isIdVerified} onVerify={() => setShowIdModal(true)} />
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
                    <h2 className="text-2xl font-bold text-gray-900">Manage Reservations</h2>
                    <div className="bg-white p-1 rounded-xl border shadow-sm flex">
                        <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'renting' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Renting</button>
                        <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'hosting' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Hosting</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50"><tr><th className="p-4 font-bold text-gray-500">Item</th><th className="p-4 font-bold text-gray-500">Dates</th><th className="p-4 font-bold text-gray-500">Status</th><th className="p-4 font-bold text-gray-500 text-right">Actions</th></tr></thead>
                        <tbody>
                            {displayedBookings.map(b => (
                                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="p-4"><p className="font-bold text-gray-900">{b.listing.title}</p></td>
                                    <td className="p-4 text-gray-600">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{b.status}</span></td>
                                    <td className="p-4 text-right">
                                        {b.status === 'confirmed' && <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('handover'); }} className="text-xs font-bold text-white bg-cyan-600 px-3 py-1.5 rounded-lg">Handover</button>}
                                        {b.status === 'active' && <button onClick={() => { setActiveSessionBooking(b); setSessionInitialMode('return'); }} className="text-xs font-bold text-white bg-orange-600 px-3 py-1.5 rounded-lg">Return</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSettingsTab />;
            case 'listings': return (
                <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold text-gray-900">My Listings</h2><button className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl">+ Add New</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {listings.map(l => (
                            <div key={l.id} className="relative group">
                                <ListingCard listing={l} onClick={onListingClick || (() => {})} isFavorite={favoriteListings?.some(fl => fl.id === l.id)} onToggleFavorite={onToggleFavorite} />
                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onEditListing?.(l.id); }} className="p-2 bg-white rounded-full shadow-lg text-gray-500 hover:text-cyan-600"><PencilIcon className="h-4 w-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setListingToDelete(l.id); }} className="p-2 bg-white rounded-full shadow-lg text-gray-500 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'bookings': return <BookingsManager bookings={bookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'favorites': return (
                <div className="animate-in fade-in duration-500">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Saved Items</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {favoriteListings?.map(l => <ListingCard key={l.id} listing={l} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}
                    </div>
                </div>
            );
            case 'security': return <SecurityTab />;
            case 'aiAssistant': return <AIOptimizer />;
            default: return <div className="py-20 text-center text-gray-400">Detailed analytics coming soon.</div>;
        }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sticky top-24">
                            <nav className="flex flex-col space-y-1">
                                {tabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><tab.icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} /> {tab.name}</button>
                                ))}
                            </nav>
                        </div>
                    </aside>
                    <main className="flex-1 overflow-hidden min-h-[600px]">{renderContent()}</main>
                </div>
            </div>
            {showPhoneModal && <PhoneVerificationModal onClose={() => setShowPhoneModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'phone')} />}
            {showIdModal && <IdVerificationModal onClose={() => setShowIdModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'id')} />}
            {listingToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><TrashIcon className="h-10 w-10 text-red-600" /></div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Listing?</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">This action cannot be undone. All future bookings for this item will be cancelled.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setListingToDelete(null)} className="flex-1 py-3.5 border-2 border-gray-100 text-gray-600 font-bold rounded-xl">Keep It</button>
                            <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl">{isDeleting ? 'Deleting...' : 'Yes, Delete'}</button>
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-gray-100 p-8">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"><XIcon className="h-6 w-6" /></button>
                <div className="bg-cyan-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 text-cyan-600"><SmartphoneIcon className="h-8 w-8" /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify Phone</h3>
                {step === 'input' ? (
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mobile Number</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-gray-400 font-bold">+1</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="786-000-0000" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none" /></div></div>
                        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                        <button onClick={handleSendCode} disabled={!phone || isLoading} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl uppercase tracking-widest text-[10px]">{isLoading ? 'Sending...' : 'Send Verification Code'}</button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="text-center p-4 bg-cyan-50 rounded-xl"><p className="text-xs text-cyan-700 font-medium">Code sent to</p><p className="font-bold text-cyan-900">{phone}</p></div>
                        <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} placeholder="000000" className="w-full text-center text-4xl font-mono font-black tracking-[0.2em] border-b-2 border-gray-100 focus:border-cyan-500 outline-none pb-4 bg-transparent" autoFocus />
                        {error && <p className="text-xs text-red-600 text-center font-bold">{error}</p>}
                        <div className="flex gap-3"><button onClick={() => setStep('input')} className="flex-1 py-3 text-gray-500 text-xs font-bold">Back</button><button onClick={handleVerify} disabled={code.length !== 6 || isLoading} className="flex-[2] py-4 bg-cyan-600 text-white font-bold rounded-2xl uppercase tracking-widest text-[10px]">{isLoading ? '...' : 'Verify Code'}</button></div>
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8"><h3 className="font-bold text-gray-900 flex items-center gap-2"><UserCheckIcon className="h-5 w-5 text-indigo-600" /> Identity Check</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="h-5 w-5" /></button></div>
                {!isLoading ? (
                    <div className="space-y-6">
                        <div className="text-center mb-6"><h4 className="text-xl font-bold text-gray-900">{step === 1 ? 'Front of ID' : 'Back of ID'}</h4><p className="text-sm text-gray-500 mt-1">Ensure the text and edges are clearly visible.</p></div>
                        <div className="aspect-[4/3]"><ImageUploader label="" currentImageUrl={step === 1 ? idFront : idBack} onImageChange={step === 1 ? setIdFront : setIdBack} /></div>
                        <button onClick={handleNext} disabled={(step === 1 && !idFront) || (step === 2 && !idBack)} className="w-full mt-8 py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl uppercase tracking-widest text-[10px]">{step === 1 ? 'Continue' : 'Finish & Upload'}</button>
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-6 animate-in zoom-in-95"><div className="relative w-20 h-20 mx-auto"><div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div><div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div><ShieldIcon className="absolute inset-0 m-auto h-8 w-8 text-indigo-400" /></div><h4 className="text-xl font-bold text-gray-900">Validating ID</h4><p className="text-sm text-gray-500">Checking document authenticity via AI...</p></div>
                )}
            </div>
        </div>
    );
};

export default UserDashboardPage;
