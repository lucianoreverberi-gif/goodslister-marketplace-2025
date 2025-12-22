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
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
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
                        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
                        <p className="text-gray-500 font-medium mt-1">Real-time performance overview.</p>
                    </div>
                    <div className="bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Earnings */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Earnings</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">${totalEarnings.toLocaleString()}</p>
                        <div className="mt-4 flex items-center gap-1.5 text-green-600 font-bold text-xs">
                            <TrendUpIcon className="h-4 w-4" /> +12.4%
                        </div>
                    </div>

                    {/* Active Listings */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Listings</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{listings.length}</p>
                        <div className="mt-4 flex items-center gap-2">
                             <div className="flex -space-x-2">
                                 {listings.slice(0, 3).map((l, i) => <img key={i} src={l.images[0]} className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm" />)}
                             </div>
                             <span className="text-[10px] font-medium text-gray-400 ml-1">Live gear</span>
                        </div>
                    </div>

                    {/* Avg Quality */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg. Rating</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{avgRating.toFixed(1)}</p>
                        <div className="mt-4 flex text-yellow-400 gap-0.5">
                            <StarIcon className="h-4 w-4" />
                            <span className="text-[10px] text-gray-500 font-medium ml-1">Top Tier Host</span>
                        </div>
                    </div>

                    {/* Profile Views */}
                    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg text-white">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visibility</p>
                        <p className="text-3xl font-bold mt-2">1.2k</p>
                        <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 w-3/4"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-8">Revenue Flow</h3>
                        <div className="h-48 flex items-end gap-3 px-2">
                            {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center group relative">
                                    <div style={{ height: `${h}%` }} className="w-full bg-gray-50 rounded-t-lg group-hover:bg-cyan-500 transition-all cursor-pointer">
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-300 mt-3 uppercase">D{i+1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Pending Payouts</h3>
                        <div className="space-y-4">
                            {localBookings.filter(b => b.status === 'confirmed').slice(0, 3).map(b => (
                                <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 transition-colors hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-cyan-600">
                                            <PackageIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">{b.listing.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{format(new Date(b.startDate), 'MMM dd')}</p>
                                        </div>
                                    </div>
                                    <p className="text-base font-bold text-gray-900">${b.totalPrice}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics': return renderAnalytics();
            case 'listings': return (
                <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Listings</h2>
                        <button onClick={() => onNavigate('createListing')} className="px-6 py-2.5 bg-cyan-600 text-white text-xs font-bold rounded-xl hover:bg-cyan-700 shadow-lg shadow-cyan-100 uppercase tracking-widest transition-all">Add Gear</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {listings.map(l => (
                            <div key={l.id} className="relative group">
                                <ListingCard listing={l} onClick={onListingClick || (() => {})} />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button onClick={(e) => { e.stopPropagation(); onEditListing?.(l.id); }} className="p-2 bg-white rounded-lg shadow-xl text-gray-600 hover:text-cyan-600 transition-all"><PencilIcon className="h-4 w-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteListing(l.id); }} className="p-2 bg-white rounded-lg shadow-xl text-gray-600 hover:text-red-600 transition-all"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'bookings': return <BookingsManager bookings={localBookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'favorites': return (
                <div className="animate-in fade-in duration-500">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Saved Items</h2>
                    {favoriteListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {favoriteListings.map(l => <ListingCard key={l.id} listing={l} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <HeartIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold">Your wishlist is empty.</p>
                        </div>
                    )}
                </div>
            );
            case 'profile': return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-32 bg-gray-50"></div>
                        <div className="px-8 pb-8">
                            <div className="relative -mt-12 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                                <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white overflow-hidden mx-auto sm:mx-0">
                                    <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(url) => onUpdateAvatar(user.id, url)} label="" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-3xl font-bold text-gray-900">{user.name}</h2>
                                    <p className="text-gray-400 font-medium">@{user.email.split('@')[0]}</p>
                                </div>
                                <button onClick={() => onViewPublicProfile(user.id)} className="px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black uppercase tracking-widest transition-all">Public View</button>
                            </div>
                            <div className="pt-8 border-t border-gray-50">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Bio</label>
                                <textarea 
                                    defaultValue={user.bio} 
                                    className="w-full border-gray-200 bg-gray-50/30 rounded-2xl p-6 text-sm text-gray-700 focus:ring-1 focus:ring-cyan-500 outline-none" 
                                    rows={4} 
                                />
                                <button onClick={() => onUpdateProfile(user.bio || '', user.avatarUrl)} className="mt-4 px-6 py-2 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg uppercase hover:bg-gray-50 transition-all">Update Info</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'security': return (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-8">Verification Center</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={`p-6 rounded-2xl border transition-all ${user.isIdVerified ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${user.isIdVerified ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}><UserCheckIcon className="h-6 w-6" /></div>
                                    {user.isIdVerified && <span className="text-[9px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase">Verified</span>}
                                </div>
                                <h4 className="font-bold text-gray-900">ID Verification</h4>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Necessary for high-value gear rentals.</p>
                                {!user.isIdVerified && <button onClick={() => onVerificationUpdate(user.id, 'id')} className="mt-6 w-full py-3 bg-cyan-600 text-white text-[10px] font-bold rounded-xl hover:bg-cyan-700 uppercase tracking-widest">Verify Now</button>}
                            </div>

                            <div className={`p-6 rounded-2xl border transition-all ${user.isPhoneVerified ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${user.isPhoneVerified ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}><PhoneIcon className="h-6 w-6" /></div>
                                    {user.isPhoneVerified && <span className="text-[9px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase">Linked</span>}
                                </div>
                                <h4 className="font-bold text-gray-900">Phone Link</h4>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Required for instant booking alerts.</p>
                                {!user.isPhoneVerified && <button onClick={() => onVerificationUpdate(user.id, 'phone')} className="mt-6 w-full py-3 bg-cyan-600 text-white text-[10px] font-bold rounded-xl hover:bg-cyan-700 uppercase tracking-widest">Link Phone</button>}
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'billing': return (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 border border-gray-100">
                        <DollarSignIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Payout Settings</h3>
                    <p className="text-gray-400 mt-2 text-sm max-w-xs mx-auto">Connect your account to receive rental earnings automatically.</p>
                    <button className="mt-8 px-8 py-3 bg-gray-900 text-white text-[10px] font-bold rounded-xl hover:bg-black uppercase tracking-widest">Configure Stripe</button>
                </div>
            );
            default: return <div className="py-20 text-center text-gray-300 italic animate-pulse">Loading...</div>;
        }
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24 shadow-sm">
                             <div className="px-4 py-6 border-b border-gray-50 mb-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-1">Menu</p>
                                <p className="text-lg font-bold text-gray-900 tracking-tight">Main Hub</p>
                             </div>
                             {tabs.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id)} 
                                    className={`w-full flex items-center px-5 py-3.5 rounded-xl text-xs font-bold transition-all mb-1 ${activeTab === tab.id ? 'bg-cyan-50 text-cyan-700 shadow-inner' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <tab.icon className={`h-4 w-4 mr-4 ${activeTab === tab.id ? 'text-cyan-600' : 'text-gray-300'}`} /> 
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
                     <div className="absolute top-8 right-8 z-[110]">
                        <button onClick={() => setActiveSessionBooking(null)} className="bg-gray-50 hover:bg-gray-100 p-3 rounded-full border border-gray-200 transition-all"><XIcon className="h-5 w-5 text-gray-500" /></button>
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
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Reservations</h2>
                <div className="bg-gray-50 p-1 rounded-xl flex border border-gray-100">
                    <button onClick={() => setMode('hosting')} className={`px-6 py-2 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all ${mode === 'hosting' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400'}`}>Hosting</button>
                    <button onClick={() => setMode('renting')} className={`px-6 py-2 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all ${mode === 'renting' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400'}`}>Renting</button>
                </div>
            </div>

            <div className="space-y-10">
                {activeBookings.length > 0 && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-cyan-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1 w-full bg-cyan-500/20"></div>
                        <h3 className="font-bold text-cyan-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                            In Progress
                        </h3>
                        <div className="space-y-4">
                            {activeBookings.map(b => (
                                <div key={b.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-cyan-50/20 border border-cyan-100/50 rounded-2xl transition-colors hover:bg-cyan-50/40">
                                    <div className="mb-4 md:mb-0 text-center md:text-left">
                                        <p className="font-bold text-gray-900 text-xl tracking-tight leading-none">{b.listing.title}</p>
                                        <p className="text-xs text-cyan-700 font-bold mt-2 uppercase tracking-widest">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</p>
                                    </div>
                                    <button 
                                        onClick={() => { setActiveSessionBooking(b); setSessionInitialMode(b.status === 'active' ? 'return' : 'handover'); }}
                                        className={`px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm ${b.status === 'active' ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
                                    >
                                        {b.status === 'active' ? 'Finalize' : 'Begin Handover'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="font-bold text-gray-400 text-[9px] uppercase tracking-[0.4em] mb-4 ml-2">Future Trips</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {futureBookings.length > 0 ? (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100"><tr className="text-[9px] text-gray-400 uppercase tracking-widest font-bold"><th className="p-6">Item</th><th className="p-6">Dates</th><th className="p-6 text-right">Status</th></tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {futureBookings.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="p-6 font-bold text-gray-900">{b.listing.title}</td>
                                            <td className="p-6 text-gray-500 font-medium">{format(new Date(b.startDate), 'MMM dd')}</td>
                                            <td className="p-6 text-right"><span className="text-green-600 font-bold uppercase tracking-tighter">Confirmed</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">No plans yet</div>}
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-gray-400 text-[9px] uppercase tracking-[0.4em] mb-4 ml-2">History</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-60">
                        {pastBookings.length > 0 ? (
                            <table className="w-full text-xs text-left">
                                <tbody className="divide-y divide-gray-50">
                                    {pastBookings.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-6 font-bold text-gray-800">{b.listing.title}</td>
                                            <td className="p-6 text-gray-400 font-medium">{format(new Date(b.endDate), 'MMM dd, yyyy')}</td>
                                            <td className="p-6 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">{b.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">No past items</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;