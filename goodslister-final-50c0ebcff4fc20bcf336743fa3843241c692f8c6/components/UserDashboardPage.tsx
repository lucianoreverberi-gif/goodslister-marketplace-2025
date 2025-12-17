
import React, { useState, useEffect, useMemo } from 'react';
import { Session, Listing, Booking, Page } from '../types';
import { PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, WandSparklesIcon, ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, PencilIcon, XIcon, LandmarkIcon, CalculatorIcon, ScanIcon, CameraIcon, HeartIcon, UserCheckIcon, TrashIcon, LockIcon, BellIcon, GlobeIcon, AlertTriangleIcon } from './icons';
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
    onLogout: () => void;
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'aiAssistant' | 'security' | 'favorites';

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ 
    user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onUpdateProfile,
    onListingClick, onEditListing, favoriteListings = [], onToggleFavorite, onViewPublicProfile, onDeleteListing, onBookingStatusUpdate, onNavigate, onLogout
}) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);
    const [listingToDelete, setListingToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Profile State
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [isUpdatingPass, setIsUpdatingPass] = useState(false);
    const [passMsg, setPassMsg] = useState({ text: '', type: '' });
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'profile', name: 'Profile & Settings', icon: UserCheckIcon },
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'bookings', name: 'My Bookings', icon: CalendarIcon },
        { id: 'favorites', name: 'Saved Items', icon: HeartIcon },
        { id: 'security', name: 'Security & Verification', icon: ShieldIcon },
        { id: 'billing', name: 'Billing', icon: DollarSignIcon },
        { id: 'analytics', name: 'Analytics', icon: BarChartIcon },
        { id: 'aiAssistant', name: 'AI Assistant', icon: BrainCircuitIcon },
    ];

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingPass(true);
        setPassMsg({ text: '', type: '' });

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, currentPassword: currentPass, newPassword: newPass })
            });
            const data = await res.json();
            if (res.ok) {
                setPassMsg({ text: 'Password updated successfully!', type: 'success' });
                setCurrentPass('');
                setNewPass('');
            } else {
                setPassMsg({ text: data.error || 'Failed to update.', type: 'error' });
            }
        } catch (e) {
            setPassMsg({ text: 'Network error.', type: 'error' });
        } finally {
            setIsUpdatingPass(false);
        }
    };

    const handleCloseAccount = async () => {
        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            if (res.ok) {
                onLogout();
            }
        } catch (e) {
            alert("Failed to close account.");
        }
    };

    const ProfileSettingsTab: React.FC = () => {
        const [bio, setBio] = useState(user.bio || '');
        const [avatar, setAvatar] = useState(user.avatarUrl);
        const [isSaving, setIsSaving] = useState(false);
        const [saveMessage, setSaveMessage] = useState('');

        const handleSaveProfile = async () => { 
            setIsSaving(true); 
            await onUpdateProfile(bio, avatar); 
            setSaveMessage('Profile saved!'); 
            setTimeout(() => setSaveMessage(''), 3000);
            setIsSaving(false); 
        };

        return ( 
            <div className="animate-in fade-in space-y-8">
                {/* 1. Basic Profile Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600 relative"></div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-12 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
                                    <ImageUploader currentImageUrl={avatar} onImageChange={setAvatar} label="" />
                                </div>
                            </div>
                            <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg shadow-md hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save Profile Changes'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">About You</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full border-gray-300 rounded-xl p-4 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[150px] text-gray-700 leading-relaxed" placeholder="Hi! I love outdoor adventures..." />
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><BellIcon className="h-4 w-4" /> Notification Preferences</h4>
                                    <div className="space-y-3">
                                        {['Email updates on bookings', 'New message alerts', 'Promotional offers'].map((pref, i) => (
                                            <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                                <span className="text-sm text-gray-700 group-hover:text-gray-900">{pref}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><GlobeIcon className="h-4 w-4" /> Regional Settings</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <select className="border-gray-300 rounded-lg text-sm"><option>USD ($)</option><option>ARS ($)</option></select>
                                        <select className="border-gray-300 rounded-lg text-sm"><option>English</option><option>Español</option></select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Security Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><LockIcon className="h-5 w-5 text-cyan-600" /> Security</h3>
                    <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Current Password</label>
                            <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-lg" />
                        </div>
                        <button type="submit" disabled={isUpdatingPass} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50">
                            {isUpdatingPass ? 'Updating...' : 'Update Password'}
                        </button>
                        {passMsg.text && <p className={`text-sm font-medium ${passMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passMsg.text}</p>}
                    </form>
                </div>

                {/* 3. Danger Zone */}
                <div className="bg-red-50 rounded-2xl border border-red-100 p-8">
                    <h3 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-red-700 text-sm mb-6">Once you close your account, there is no going back. Please be certain.</p>
                    <button onClick={() => setShowCloseConfirm(true)} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                        Close Account Permanently
                    </button>
                </div>
            </div>
        );
    };

    // Render Logic Switcher
    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSettingsTab />;
            case 'listings': return (
                <div>
                    <h2 className="text-2xl font-bold mb-6">My Listings</h2>
                    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto border border-gray-100">
                        {listings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
                                <tbody>
                                    {listings.map(listing => (
                                        <tr key={listing.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-900">{listing.title}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${listing.isFeatured ? 'text-purple-800 bg-purple-100' : 'text-green-800 bg-green-100'}`}>
                                                    {listing.isFeatured ? 'Featured' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-3 flex justify-end gap-2">
                                                <button onClick={() => onListingClick && onListingClick(listing.id)} className="p-2 text-gray-500 hover:text-cyan-600 bg-gray-50 rounded hover:bg-cyan-50"><EyeIcon className="h-4 w-4" /></button>
                                                <button onClick={() => onEditListing && onEditListing(listing.id)} className="p-2 text-gray-500 hover:text-cyan-600 bg-gray-50 rounded hover:bg-cyan-50"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => setListingToDelete(listing.id)} className="p-2 text-red-500 hover:bg-red-50 rounded bg-gray-50"><TrashIcon className="h-4 w-4" /></button>
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
            case 'favorites': return (<div><h2 className="text-2xl font-bold mb-6">Saved Items</h2>{favoriteListings?.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{favoriteListings.map(l => <ListingCard key={l.id} listing={l} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />)}</div>) : <p className="text-gray-500">No favorites saved.</p>}</div>);
            // ... [Others]
            default: return <div className="p-8 text-center text-gray-400">Section coming soon...</div>;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm bg-white">
                        <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(newUrl) => onUpdateAvatar(user.id, newUrl)} label="" />
                    </div>
                    <div><h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1><p className="text-gray-600 mt-1">Manage your account and adventures.</p></div>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-64 flex-shrink-0">
                        <nav className="flex flex-col space-y-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                    <tab.icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-cyan-600' : 'text-gray-400'}`} /> {tab.name}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    <main className="flex-1">{renderContent()}</main>
                </div>
            </div>

            {/* Account Close Confirmation */}
            {showCloseConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95">
                        <AlertTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900">Close your account?</h3>
                        <p className="text-gray-600 mt-4 leading-relaxed">
                            This will delete your profile, your listings, and your history. All current bookings will be cancelled. <strong>This cannot be undone.</strong>
                        </p>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button onClick={() => setShowCloseConfirm(false)} className="py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                            <button onClick={handleCloseAccount} className="py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">Yes, Close Account</button>
                        </div>
                    </div>
                </div>
            )}
            {/* [Other existing modals] */}
        </div>
    );
};

// ... BookingsManager implementation remains same or simplified ...
const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
    const rentingBookings = bookings.filter(b => b.renterId === userId);
    const hostingBookings = bookings.filter(b => b.listing.owner.id === userId);
    const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
    const data = mode === 'renting' ? rentingBookings : hostingBookings;

    return (
        <div className="animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{mode === 'renting' ? 'My Trips' : 'My Rentals'}</h2>
                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                    <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'renting' ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Renting</button>
                    <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'hosting' ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Hosting</button>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                {data.length > 0 ? (
                    <table className="w-full text-sm text-left">
                         <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">Item</th><th className="p-3">Dates</th><th className="p-3">Status</th></tr></thead>
                         <tbody>{data.map(b => (
                             <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                                 <td className="p-3 font-medium">{b.listing.title}</td>
                                 <td className="p-3 text-xs text-gray-500">{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</td>
                                 <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold uppercase">{b.status}</span></td>
                             </tr>
                         ))}</tbody>
                    </table>
                ) : <div className="p-12 text-center text-gray-400 italic">No activity yet.</div>}
            </div>
        </div>
    );
};

export default UserDashboardPage;
