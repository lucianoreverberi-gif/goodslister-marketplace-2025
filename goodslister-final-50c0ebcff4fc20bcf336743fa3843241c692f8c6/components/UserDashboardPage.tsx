
import React, { useState, useEffect, useMemo } from 'react';
import { Session, Listing, Booking, Page } from '../types';
import { PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, WandSparklesIcon, ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, PencilIcon, XIcon, LandmarkIcon, CalculatorIcon, ScanIcon, CameraIcon, HeartIcon, UserCheckIcon, TrashIcon, LockIcon, BellIcon, GlobeIcon, AlertTriangleIcon, CheckIcon } from './icons';
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
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'aiAssistant' | 'security' | 'favorites';

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ 
    user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onUpdateProfile,
    onListingClick, onEditListing, favoriteListings = [], onToggleFavorite, onViewPublicProfile, onDeleteListing, onBookingStatusUpdate, onNavigate, onLogout
}) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    
    // NEW: Local state for approvals to show immediate feedback
    const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
    useEffect(() => { setLocalBookings(bookings); }, [bookings]);

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'profile', name: 'Profile & Settings', icon: UserCheckIcon },
        { id: 'analytics', name: 'Analytics', icon: BarChartIcon },
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'bookings', name: 'Reservations', icon: CalendarIcon },
        { id: 'favorites', name: 'Saved Items', icon: HeartIcon },
        { id: 'security', name: 'Security', icon: ShieldIcon },
        { id: 'billing', name: 'Payments', icon: DollarSignIcon },
    ];

    const handleBookingDecision = async (bookingId: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch('/api/bookings/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, action, ownerId: user.id })
            });
            if (res.ok) {
                const newStatus = action === 'approve' ? 'confirmed' : 'rejected';
                setLocalBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus as any } : b));
            }
        } catch (e) {
            alert("Action failed. Check connection.");
        }
    };

    const BookingsManager: React.FC = () => {
        const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
        const rentingBookings = localBookings.filter(b => b.renterId === user.id);
        const hostingBookings = localBookings.filter(b => b.listing.owner.id === user.id);
        const data = mode === 'renting' ? rentingBookings : hostingBookings;

        return (
            <div className="animate-in fade-in">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{mode === 'renting' ? 'My Trips' : 'Incoming Requests'}</h2>
                    <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                        <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'renting' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-500'}`}>Renting</button>
                        <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'hosting' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-500'}`}>Hosting</button>
                    </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {data.length > 0 ? (
                        <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Item</th><th className="p-4">Dates</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead>
                             <tbody className="divide-y divide-gray-100">
                                {data.map(b => (
                                 <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                     <td className="p-4">
                                        <div className="font-bold text-gray-900">{b.listing.title}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold">{mode === 'renting' ? `Owner: ${b.listing.owner.name}` : `Renter ID: #${b.renterId.slice(-4)}`}</div>
                                     </td>
                                     <td className="p-4 text-gray-600">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</td>
                                     <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            b.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {b.status}
                                        </span>
                                     </td>
                                     <td className="p-4 text-right">
                                        {mode === 'hosting' && b.status === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleBookingDecision(b.id, 'reject')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Decline"><XIcon className="h-4 w-4"/></button>
                                                <button onClick={() => handleBookingDecision(b.id, 'approve')} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Approve"><CheckIcon className="h-4 w-4"/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => onListingClick && onListingClick(b.listing.id)} className="text-cyan-600 hover:underline font-bold text-xs">View Gear</button>
                                        )}
                                     </td>
                                 </tr>
                             ))}</tbody>
                        </table>
                    ) : <div className="p-12 text-center text-gray-400 italic">No bookings found.</div>}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600 relative"></div>
                        <div className="px-8 pb-8">
                            <div className="relative -mt-12 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
                                    <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(url) => onUpdateAvatar(user.id, url)} label="" />
                                </div>
                                <button onClick={() => onViewPublicProfile(user.id)} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50">View Public Profile</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2 text-left">About You</label>
                                    <textarea defaultValue={user.bio} className="w-full border-gray-200 rounded-xl p-4 text-sm" placeholder="Tell the community about yourself..." rows={5} />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">Trust Badges</h4>
                                    <div className="flex gap-2">
                                        {user.isIdVerified && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">ID Verified</span>}
                                        {user.isPhoneVerified && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">Phone Linked</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'analytics': return <AnalyticsDashboard bookings={localBookings} listings={listings} />;
            case 'bookings': return <BookingsManager />;
            case 'listings': return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.map(l => (
                        <div key={l.id} className="relative group">
                            <ListingCard listing={l} onClick={onListingClick || (() => {})} />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditListing && onEditListing(l.id)} className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-cyan-600"><PencilIcon className="h-4 w-4"/></button>
                                <button onClick={() => onDeleteListing(l.id)} className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            );
            default: return <div className="p-12 text-center text-gray-400">Section coming soon...</div>;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row gap-10">
                    <aside className="md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 sticky top-24">
                             {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all mb-1 ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                                    <tab.icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-400'}`} /> {tab.name}
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

export default UserDashboardPage;
