import React, { useState, useEffect } from 'react';
import { Session, Listing, Booking, Page } from '../types';
import { 
    PackageIcon, DollarSignIcon, BarChartIcon, StarIcon, 
    ShieldIcon, CalendarIcon, EyeIcon, PencilIcon, XIcon, 
    HeartIcon, UserCheckIcon, TrashIcon, TrendUpIcon, 
    ShieldCheckIcon, PhoneIcon
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

type DashboardTab = 'analytics' | 'bookings' | 'listings' | 'favorites' | 'profile' | 'security' | 'billing';

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
            : 0.0;

        return (
            <div className="space-y-12 animate-in fade-in duration-700">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-5xl font-black text-gray-900 tracking-tighter">Your Empire</h2>
                        <p className="text-gray-500 font-medium mt-2 text-lg">Real-time performance of your adventure gear.</p>
                    </div>
                    <div className="bg-white px-5 py-2.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Live Updates</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Earnings */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 relative overflow-hidden group">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] relative z-10">Total Earnings</p>
                        <p className="text-4xl font-black text-gray-900 mt-3 relative z-10">${totalEarnings.toLocaleString()}</p>
                        <div className="mt-5 flex items-center gap-1.5 text-green-500 font-black text-xs relative z-10">
                            <TrendUpIcon className="h-4 w-4" /> +12.4%
                        </div>
                        <div className="absolute -right-6 -top-6 text-gray-50/50 group-hover:text-cyan-50/50 transition-colors">
                            <DollarSignIcon className="h-32 w-32" />
                        </div>
                    </div>

                    {/* Active Listings */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Listings</p>
                        <p className="text-4xl font-black text-gray-900 mt-3">{listings.length}</p>
                        <div className="mt-5 flex items-center gap-2">
                             <div className="flex -space-x-2.5">
                                 {listings.slice(0, 3).map((l, i) => <img key={i} src={l.images[0]} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />)}
                             </div>
                             <span className="text-[11px] font-black text-gray-400 ml-1">Items online</span>
                        </div>
                    </div>

                    {/* Avg Quality */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Avg. Quality</p>
                        <p className="text-4xl font-black text-gray-900 mt-3">{avgRating.toFixed(1)}</p>
                        <div className="mt-5 flex text-yellow-400 gap-0.5">
                            {[1,2,3,4,5].map(i => <StarIcon key={i} className="h-4 w-4" />)}
                        </div>
                    </div>

                    {/* Profile Views */}
                    <div className="bg-[#2d2d5f] p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 text-white relative overflow-hidden">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] relative z-10">Profile Views</p>
                        <p className="text-4xl font-black mt-3 relative z-10">1.2k</p>
                        <div className="mt-6 h-2 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
                            <div className="h-full bg-cyan-400 w-3/4 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm min-h-[400px]">
                        <h3 className="text-2xl font-black text-gray-900 mb-10 tracking-tight">Revenue Flow</h3>
                        <div className="h-64 flex items-end gap-4 px-2">
                            {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center group relative">
                                    <div style={{ height: `${h}%` }} className="w-full bg-gray-100 rounded-t-2xl group-hover:bg-cyan-500 transition-all cursor-pointer">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-black">
                                            ${h * 15}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-300 mt-5 uppercase tracking-widest">Day {i+1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm">
                        <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Upcoming Revenue</h3>
                        <div className="space-y-5">
                            {localBookings.filter(b => b.status === 'confirmed').slice(0, 3).map(b => (
                                <div key={b.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all hover:bg-gray-50">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm text-cyan-600">
                                            <PackageIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-gray-900 leading-tight">{b.listing.title}</p>
                                            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{format(new Date(b.startDate), 'MMM dd')}</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-black text-gray-900 tracking-tight">${b.totalPrice}</p>
                                </div>
                            ))}
                            {localBookings.filter(b => b.status === 'confirmed').length === 0 && <p className="text-center py-20 text-gray-400 italic font-bold">No pending payouts.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics': return renderAnalytics();
            case 'bookings': return <BookingsManager bookings={localBookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'listings': return (
                <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">My Equipment</h2>
                        <button onClick={() => onNavigate('createListing')} className="px-8 py-3.5 bg-cyan-600 text-white text-xs font-black rounded-2xl hover:bg-cyan-700 shadow-xl uppercase tracking-widest">+ List New Gear</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {listings.map(l => (
                            <div key={l.id} className="relative group">
                                <ListingCard listing={l} onClick={onListingClick || (() => {})} />
                                <div className="absolute top-5 right-5 flex gap-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                    <button onClick={(e) => { e.stopPropagation(); onEditListing?.(l.id); }} className="p-3.5 bg-white rounded-2xl shadow-2xl text-gray-600 hover:text-cyan-600 transition-all"><PencilIcon className="h-5 w-5"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteListing(l.id); }} className="p-3.5 bg-white rounded-2xl shadow-2xl text-gray-600 hover:text-red-600 transition-all"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'favorites': return (
                <div className="animate-in fade-in duration-500">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-10">Saved Items</h2>
                    {favoriteListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {favoriteListings.map(l => <ListingCard key={l.id} listing={l} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white rounded-[3rem] border border-gray-50 shadow-sm">
                            <HeartIcon className="h-20 w-20 text-gray-100 mx-auto mb-6" />
                            <p className="text-gray-400 font-black text-lg">Your wishlist is empty.</p>
                        </div>
                    )}
                </div>
            );
            case 'profile': return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
                        <div className="h-48 bg-gradient-to-r from-cyan-400 via-indigo-500 to-blue-600"></div>
                        <div className="px-12 pb-12">
                            <div className="relative -mt-20 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                                <div className="relative mx-auto sm:mx-0">
                                    <div className="w-40 h-40 rounded-[2.5rem] border-[8px] border-white shadow-2xl bg-white overflow-hidden">
                                        <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(url) => onUpdateAvatar(user.id, url)} label="" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">{user.name}</h2>
                                    <p className="text-gray-500 font-bold mt-1 text-lg">@{user.email.split('@')[0]}</p>
                                </div>
                                <button onClick={() => onViewPublicProfile(user.id)} className="px-8 py-3.5 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black uppercase tracking-widest">View Public Bio</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-50 pt-12">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5 block">Personal Mission</label>
                                    <textarea 
                                        defaultValue={user.bio} 
                                        className="w-full border-gray-100 bg-gray-50/30 rounded-[2rem] p-8 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-cyan-500" 
                                        placeholder="Share your adventure story..." 
                                        rows={6} 
                                    />
                                    <button onClick={() => onUpdateProfile(user.bio || '', user.avatarUrl)} className="mt-6 px-8 py-3 bg-cyan-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-cyan-100">Update Profile</button>
                                </div>
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Trust Assets</h4>
                                    <div className={`flex items-center gap-4 p-5 rounded-3xl border ${user.isIdVerified ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <ShieldCheckIcon className="h-7 w-7" />
                                        <span className="text-sm font-black uppercase tracking-tight">Identity Verified</span>
                                    </div>
                                    <div className={`flex items-center gap-4 p-5 rounded-3xl border ${user.isPhoneVerified ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                        <PhoneIcon className="h-7 w-7" />
                                        <span className="text-sm font-black uppercase tracking-tight">Mobile Linked</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'security': return (
                 <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-10">Trust & ID</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${user.isIdVerified ? 'bg-green-50 border-green-200' : 'bg-white border-dashed border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${user.isIdVerified ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-400'}`}><UserCheckIcon className="h-8 w-8" /></div>
                                    {user.isIdVerified && <span className="text-[10px] font-black bg-green-500 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">Verified</span>}
                                </div>
                                <h4 className="font-black text-gray-900 text-xl">Identity Shield</h4>
                                <p className="text-xs text-gray-500 mt-3 leading-relaxed font-bold">Government ID scan and facial biometrics required for high-value rentals.</p>
                                {!user.isIdVerified && <button onClick={() => onVerificationUpdate(user.id, 'id')} className="mt-8 w-full py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 uppercase tracking-widest">Complete Verification</button>}
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${user.isPhoneVerified ? 'bg-blue-50 border-blue-200' : 'bg-white border-dashed border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${user.isPhoneVerified ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}><PhoneIcon className="h-8 w-8" /></div>
                                    {user.isPhoneVerified && <span className="text-[10px] font-black bg-blue-500 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">Linked</span>}
                                </div>
                                <h4 className="font-black text-gray-900 text-xl">Mobile Auth</h4>
                                <p className="text-xs text-gray-500 mt-3 leading-relaxed font-bold">Two-factor authentication for withdrawals and booking security alerts.</p>
                                {!user.isPhoneVerified && <button onClick={() => onVerificationUpdate(user.id, 'phone')} className="mt-8 w-full py-4 bg-blue-600 text-white text-xs font-black rounded-2xl hover:bg-blue-700 uppercase tracking-widest">Verify Mobile</button>}
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'billing': return (
                <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl text-center animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                        <DollarSignIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Payout Settings</h3>
                    <p className="text-gray-500 mt-3 max-w-sm mx-auto font-medium">Connect your local bank account or Zelle to receive your rental earnings automatically.</p>
                    <button className="mt-10 px-10 py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black uppercase tracking-widest">Setup Payouts</button>
                </div>
            );
            default: return <div className="py-20 text-center text-gray-300 italic animate-pulse">Loading section...</div>;
        }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col lg:flex-row gap-16">
                    <aside className="lg:w-80 flex-shrink-0">
                        <div className="bg-[#12122b] rounded-[2.5rem] shadow-2xl shadow-gray-200 p-5 sticky top-28">
                             <div className="px-4 py-8 mb-4">
                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-1 opacity-50">Control Center</p>
                                <p className="text-xl font-black text-white tracking-tight">Main Menu</p>
                             </div>
                             {tabs.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id)} 
                                    className={`w-full flex items-center px-7 py-5 rounded-[1.8rem] text-sm font-black transition-all mb-2.5 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <tab.icon className={`h-5 w-5 mr-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} /> 
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </aside>
                    <main className="flex-1 overflow-hidden">{renderContent()}</main>
                </div>
            </div>
        </div>
    );
};

const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
    const [mode, setMode] = useState<'hosting' | 'renting'>('hosting');
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
                     <div className="absolute top-10 right-10 z-[110]">
                        <button onClick={() => setActiveSessionBooking(null)} className="bg-gray-100 hover:bg-gray-200 p-4 rounded-[1.5rem] transition-all"><XIcon className="h-6 w-6 text-gray-600" /></button>
                     </div>
                     <RentalSessionWizard 
                        booking={activeSessionBooking}
                        initialMode={sessionInitialMode}
                        onStatusChange={(status) => onStatusUpdate(activeSessionBooking.id, status)}
                        onComplete={() => setActiveSessionBooking(null)}
                     />
                 </div>
             )}

             <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-8">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Reservations</h2>
                <div className="bg-gray-100 p-1.5 rounded-2xl flex shadow-inner border border-gray-200/50">
                    <button onClick={() => setMode('hosting')} className={`px-10 py-3 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${mode === 'hosting' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400'}`}>I'm Hosting</button>
                    <button onClick={() => setMode('renting')} className={`px-10 py-3 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${mode === 'renting' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400'}`}>I'm Renting</button>
                </div>
            </div>

            <div className="space-y-12">
                {activeBookings.length > 0 && (
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-cyan-100/50 border border-cyan-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-2 w-full bg-cyan-500"></div>
                        <h3 className="font-black text-cyan-900 mb-8 flex items-center gap-3 tracking-tight text-xl">
                            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></span>
                            ACTIVE SESSIONS
                        </h3>
                        <div className="space-y-5">
                            {activeBookings.map(b => (
                                <div key={b.id} className="flex flex-col md:flex-row items-center justify-between p-8 bg-cyan-50/40 border border-cyan-100/60 rounded-[2rem] hover:bg-cyan-50 transition-colors">
                                    <div className="mb-6 md:mb-0 text-center md:text-left">
                                        <p className="font-black text-gray-900 text-2xl tracking-tight leading-none">{b.listing.title}</p>
                                        <p className="text-sm text-cyan-600 font-bold mt-2 uppercase tracking-widest">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</p>
                                    </div>
                                    <button 
                                        onClick={() => { setActiveSessionBooking(b); setSessionInitialMode(b.status === 'active' ? 'return' : 'handover'); }}
                                        className={`px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 ${b.status === 'active' ? 'bg-orange-500 text-white shadow-orange-100' : 'bg-cyan-600 text-white shadow-cyan-100'}`}
                                    >
                                        {b.status === 'active' ? 'Finalize Return' : 'Begin Handover'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="font-black text-gray-400 text-[11px] uppercase tracking-[0.4em] mb-6 ml-3">Future Expeditions</h3>
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        {futureBookings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50"><tr className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black"><th className="p-8">Item</th><th className="p-8 text-center">Dates</th><th className="p-8 text-right">Status</th></tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {futureBookings.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-8 font-black text-gray-900 text-base">{b.listing.title}</td>
                                            <td className="p-8 text-gray-500 font-bold text-center">{format(new Date(b.startDate), 'MMM dd')}</td>
                                            <td className="p-8 text-right"><span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">Confirmed</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="p-16 text-center text-gray-400 text-sm font-bold italic">No upcoming activity.</div>}
                    </div>
                </div>

                <div>
                    <h3 className="font-black text-gray-400 text-[11px] uppercase tracking-[0.4em] mb-6 ml-3">History</h3>
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden opacity-60 grayscale">
                        {pastBookings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-gray-50">
                                    {pastBookings.map(b => (
                                        <tr key={b.id} className="border-b last:border-0 border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="p-8 font-black text-gray-900 text-base">{b.listing.title}</td>
                                            <td className="p-8 text-gray-500 font-bold">{format(new Date(b.endDate), 'MMM dd, yyyy')}</td>
                                            <td className="p-8 text-right"><span className="text-xs font-black uppercase tracking-widest text-gray-300">{b.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="p-16 text-center text-gray-400 text-sm font-bold italic">Empty history.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;