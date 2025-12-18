import React, { useState, useEffect } from 'react';
import { Session, Listing, Booking, Page } from '../types';
import { 
    PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, 
    ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, 
    CalendarIcon, EyeIcon, PencilIcon, XIcon, LandmarkIcon, 
    CalculatorIcon, ScanIcon, CameraIcon, HeartIcon, UserCheckIcon, 
    TrashIcon, LockIcon, BellIcon, GlobeIcon, AlertTriangleIcon, 
    CheckIcon, ShieldCheckIcon, TrendUpIcon, RocketIcon 
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
    onNavigate: (page: Page) => void;
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'security' | 'favorites';

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ 
    user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onUpdateProfile,
    onListingClick, onEditListing, favoriteListings = [], onToggleFavorite, onViewPublicProfile, onDeleteListing, onBookingStatusUpdate, onNavigate
}) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
    const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
    
    useEffect(() => { setLocalBookings(bookings); }, [bookings]);

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'analytics', name: 'Performance', icon: BarChartIcon },
        { id: 'bookings', name: 'Reservations', icon: CalendarIcon },
        { id: 'listings', name: 'My Equipment', icon: PackageIcon },
        { id: 'favorites', name: 'Saved Items', icon: HeartIcon },
        { id: 'profile', name: 'Public Profile', icon: UserCheckIcon },
        { id: 'security', name: 'Trust & ID', icon: ShieldIcon },
        { id: 'billing', name: 'Payouts', icon: DollarSignIcon },
    ];

    const renderAnalytics = () => {
        const totalEarnings = localBookings
            .filter(b => b.status === 'completed' || b.status === 'active')
            .reduce((acc, curr) => acc + (curr.balanceDueOnSite || curr.totalPrice), 0);
        
        const avgRating = listings.length > 0 
            ? listings.reduce((acc, l) => acc + l.rating, 0) / listings.length 
            : 5.0;

        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Your Empire</h2>
                        <p className="text-gray-500 font-medium mt-1">Real-time performance of your adventure gear.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Updates</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-cyan-50/50 group-hover:text-cyan-50 group-hover:scale-110 transition-all">
                            <DollarSignIcon className="h-24 w-24" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earnings</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">${totalEarnings.toLocaleString()}</p>
                        <div className="mt-4 flex items-center gap-1 text-green-500 font-bold text-xs">
                            <TrendUpIcon className="h-3 w-3" /> +12.4%
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Listings</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{listings.length}</p>
                        <div className="mt-4 flex items-center gap-2">
                             <div className="flex -space-x-2">
                                 {listings.slice(0, 3).map((l, i) => <img key={i} src={l.images[0]} className="w-6 h-6 rounded-full border-2 border-white object-cover" />)}
                             </div>
                             <span className="text-[10px] font-bold text-gray-400">Items online</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Quality</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{avgRating.toFixed(1)}</p>
                        <div className="mt-4 flex text-yellow-400">
                            {[1,2,3,4,5].map(i => <StarIcon key={i} className="h-3 w-3" />)}
                        </div>
                    </div>

                    <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 text-white">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Profile Views</p>
                        <p className="text-3xl font-black mt-2">1.2k</p>
                        <div className="mt-4 h-1.5 w-full bg-indigo-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 w-3/4 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-8">Revenue Flow</h3>
                        <div className="h-64 flex items-end gap-3 px-2">
                            {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center group">
                                    <div style={{ height: `${h}%` }} className="w-full bg-gray-100 rounded-t-xl group-hover:bg-cyan-500 transition-all cursor-pointer relative">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${h * 15}</div>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 mt-4">Day {i+1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-6">Upcoming Revenue</h3>
                        <div className="space-y-4">
                            {localBookings.filter(b => b.status === 'confirmed').slice(0, 3).map(b => (
                                <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-xl shadow-sm"><PackageIcon className="h-5 w-5 text-cyan-600" /></div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{b.listing.title}</p>
                                            <p className="text-xs text-gray-500 font-bold">{format(new Date(b.startDate), 'MMM dd')}</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-gray-900">${b.totalPrice}</p>
                                </div>
                            ))}
                            {localBookings.filter(b => b.status === 'confirmed').length === 0 && <p className="text-center py-10 text-gray-400 italic text-sm">No pending payouts.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSecurityTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <ShieldCheckIcon className="h-7 w-7 text-indigo-600" />
                    Identity & Trust Shield
                </h3>
                <p className="text-gray-500 text-sm mt-2">Verification Level: <span className="font-bold text-indigo-600">{user.isIdVerified ? 'Premium (Level 3)' : 'Basic (Level 1)'}</span></p>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-3xl border-2 transition-all ${user.isIdVerified ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-dashed border-gray-200 hover:border-indigo-300'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${user.isIdVerified ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <UserCheckIcon className="h-6 w-6" />
                            </div>
                            {user.isIdVerified ? 
                                <span className="text-[10px] font-black bg-green-500 text-white px-2 py-1 rounded-full uppercase tracking-widest">Verified</span> : 
                                <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-2 py-1 rounded-full uppercase tracking-widest">Required</span>
                            }
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">Stripe Identity</h4>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">Official ID scan and biometric check. Required for high-value boat and powersport rentals.</p>
                        {!user.isIdVerified && (
                            <button 
                                onClick={() => onVerificationUpdate(user.id, 'id')}
                                className="mt-6 w-full py-3 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest"
                            >
                                Verify with Stripe
                            </button>
                        )}
                    </div>

                    <div className={`p-6 rounded-3xl border-2 transition-all ${user.isPhoneVerified ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-dashed border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${user.isPhoneVerified ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <PhoneIcon className="h-6 w-6" />
                            </div>
                            {user.isPhoneVerified ? 
                                <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-1 rounded-full uppercase tracking-widest">Linked</span> : 
                                <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-2 py-1 rounded-full uppercase tracking-widest">Not Linked</span>
                            }
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">Mobile Auth</h4>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">SMS verification for real-time delivery alerts and safety notifications.</p>
                        {!user.isPhoneVerified && (
                            <button 
                                onClick={() => onVerificationUpdate(user.id, 'phone')}
                                className="mt-6 w-full py-3 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest"
                            >
                                Verify Phone
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics': return renderAnalytics();
            
            case 'profile': return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-40 bg-gradient-to-r from-cyan-400 via-indigo-500 to-blue-600 relative">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        </div>
                        <div className="px-10 pb-10">
                            <div className="relative -mt-16 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                                <div className="relative group">
                                    <div className="w-36 h-36 rounded-[2rem] border-[6px] border-white shadow-2xl bg-white overflow-hidden">
                                        <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(url) => onUpdateAvatar(user.id, url)} label="" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl border-4 border-white shadow-lg">
                                        <PencilIcon className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-3xl font-black text-gray-900">{user.name}</h2>
                                    <p className="text-gray-500 font-medium">@{user.email.split('@')[0]}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => onViewPublicProfile(user.id)} className="px-6 py-2.5 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-black transition-all shadow-lg uppercase tracking-widest">View Public Bio</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t pt-10">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block text-left">Your Mission</label>
                                    <textarea 
                                        defaultValue={user.bio} 
                                        className="w-full border-gray-100 bg-gray-50/50 rounded-3xl p-6 text-sm text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" 
                                        placeholder="Tell us about your adventure gear..." 
                                        rows={5} 
                                    />
                                    <button onClick={() => onUpdateProfile(user.bio || '', user.avatarUrl)} className="mt-4 px-6 py-2 bg-cyan-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-md">Update Bio</button>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verified Status</h4>
                                    <div className="space-y-3">
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${user.isIdVerified ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            <ShieldCheckIcon className="h-5 w-5" />
                                            <span className="text-xs font-black uppercase tracking-tighter">ID Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
            
            case 'security': return renderSecurityTab();
            case 'bookings': return <BookingsManager bookings={localBookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            
            case 'listings': return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">My Equipment Portfolio</h2>
                        <button onClick={() => onNavigate('createListing')} className="px-6 py-2.5 bg-cyan-600 text-white text-xs font-black rounded-xl hover:bg-cyan-700 transition-all shadow-lg uppercase tracking-widest">+ List New Gear</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {listings.map(l => (
                            <div key={l.id} className="relative group">
                                <ListingCard listing={l} onClick={onListingClick || (() => {})} />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                    <button onClick={(e) => { e.stopPropagation(); onEditListing?.(l.id); }} className="p-3 bg-white rounded-2xl shadow-xl text-gray-600 hover:text-cyan-600 hover:scale-110 active:scale-95 transition-all"><PencilIcon className="h-5 w-5"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteListing(l.id); }} className="p-3 bg-white rounded-2xl shadow-xl text-gray-600 hover:text-red-600 hover:scale-110 active:scale-95 transition-all"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

            case 'favorites': return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-8">My Wishlist</h2>
                    {favoriteListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {favoriteListings.map(l => <ListingCard key={l.id} listing={l} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white rounded-[2rem] border border-gray-100">
                            <HeartIcon className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold">Your saved items will appear here.</p>
                        </div>
                    )}
                </div>
            );

            default: return <div className="p-20 text-center text-gray-300 italic animate-pulse">Section loading...</div>;
        }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 p-4 sticky top-28">
                             {tabs.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id)} 
                                    className={`w-full flex items-center px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all mb-2 ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-2xl shadow-gray-900/20' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <tab.icon className={`h-5 w-5 mr-4 ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-400'}`} /> 
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </aside>
                    <main className="flex-1">{renderContent()}</main>
                </div>
            </div>
        </div>
    );
};

const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
    const [mode, setMode] = useState<'renting' | 'hosting'>('hosting');
    const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);
    const [sessionInitialMode, setSessionInitialMode] = useState<'handover' | 'return'>('handover');
    
    const rentingBookings = bookings.filter(b => b.renterId === userId);
    const hostingBookings = bookings.filter(b => b.listing.owner.id === userId);
    const displayedBookings = mode === 'renting' ? rentingBookings : hostingBookings;

    const now = new Date();
    const activeBookings = displayedBookings.filter(b => b.status === 'active' || (b.status === 'confirmed' && new Date(b.startDate) <= new Date(now.getTime() + 86400000)));
    const futureBookings = displayedBookings.filter(b => b.status === 'confirmed' && new Date(b.startDate) > new Date(now.getTime() + 86400000));
    const pastBookings = displayedBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

    return (
        <div className="animate-in fade-in duration-500">
             {activeSessionBooking && (
                 <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
                     <div className="absolute top-8 right-8 z-[110]">
                        <button onClick={() => setActiveSessionBooking(null)} className="bg-gray-100 hover:bg-gray-200 p-3 rounded-2xl transition-all"><XIcon className="h-6 w-6 text-gray-600" /></button>
                     </div>
                     <RentalSessionWizard 
                        booking={activeSessionBooking}
                        initialMode={sessionInitialMode}
                        onStatusChange={(status) => onStatusUpdate(activeSessionBooking.id, status)}
                        onComplete={() => setActiveSessionBooking(null)}
                     />
                 </div>
             )}

             <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Reservations</h2>
                <div className="bg-gray-100 p-1.5 rounded-2xl flex shadow-inner">
                    <button onClick={() => setMode('hosting')} className={`px-6 py-2.5 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${mode === 'hosting' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400'}`}>I'm Hosting</button>
                    <button onClick={() => setMode('renting')} className={`px-6 py-2.5 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${mode === 'renting' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400'}`}>I'm Renting</button>
                </div>
            </div>

            <div className="space-y-12">
                {activeBookings.length > 0 && (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-cyan-100/50 border border-cyan-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1.5 w-full bg-cyan-500"></div>
                        <h3 className="font-black text-cyan-900 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                            ACTIVE SESSIONS
                        </h3>
                        <div className="space-y-4">
                            {activeBookings.map(b => (
                                <div key={b.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-cyan-50/30 border border-cyan-100/50 rounded-3xl hover:bg-cyan-50 transition-colors">
                                    <div className="mb-4 md:mb-0 text-center md:text-left">
                                        <p className="font-black text-gray-900 text-lg">{b.listing.title}</p>
                                        <p className="text-xs text-cyan-600 font-bold mt-1 uppercase tracking-widest">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</p>
                                    </div>
                                    <button 
                                        onClick={() => { setActiveSessionBooking(b); setSessionInitialMode(b.status === 'active' ? 'return' : 'handover'); }}
                                        className={`px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${b.status === 'active' ? 'bg-orange-500 text-white' : 'bg-cyan-600 text-white'}`}
                                    >
                                        {b.status === 'active' ? 'Finalize Return' : 'Begin Handover'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-4 ml-2">Future Expeditions</h3>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        {futureBookings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50"><tr className="text-[10px] text-gray-400 uppercase tracking-widest font-black"><th className="p-6">Item</th><th className="p-6">Dates</th><th className="p-6">Status</th></tr></thead>
                                <tbody>
                                    {futureBookings.map(b => (
                                        <tr key={b.id} className="border-b last:border-0 border-gray-50">
                                            <td className="p-6 font-bold text-gray-900">{b.listing.title}</td>
                                            <td className="p-6 text-gray-500 font-medium">{format(new Date(b.startDate), 'MMM dd')}</td>
                                            <td className="p-6"><span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Confirmed</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="p-10 text-center text-gray-400 text-xs italic">No upcoming activity.</div>}
                    </div>
                </div>

                <div>
                    <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-4 ml-2">History</h3>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden opacity-60 grayscale">
                        {pastBookings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <tbody>
                                    {pastBookings.map(b => (
                                        <tr key={b.id} className="border-b last:border-0 border-gray-50">
                                            <td className="p-6 font-bold text-gray-900">{b.listing.title}</td>
                                            <td className="p-6 text-gray-500 font-medium">{format(new Date(b.endDate), 'MMM dd, yyyy')}</td>
                                            <td className="p-6 text-right"><span className="text-xs font-black uppercase tracking-widest text-gray-300">{b.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="p-10 text-center text-gray-400 text-xs italic">Empty history.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;
