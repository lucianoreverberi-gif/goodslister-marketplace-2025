import React, { useState, useEffect } from 'react';
import { Session, Listing, Booking, Page } from '../types';
import { 
    PackageIcon, DollarSignIcon, BarChartIcon, StarIcon, 
    ShieldIcon, CalendarIcon, PencilIcon, XIcon, 
    HeartIcon, UserCheckIcon, TrashIcon, TrendUpIcon, 
    ShieldCheckIcon, PhoneIcon, LockIcon, AlertTriangleIcon,
    SmartphoneIcon, CreditCardIcon
} from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';
import ListingCard from './ListingCard';

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
    onDeleteAccount?: () => Promise<void>;
    onChangePassword?: (current: string, next: string) => Promise<boolean>;
}

type DashboardTab = 'analytics' | 'bookings' | 'listings' | 'favorites' | 'profile' | 'security' | 'billing';

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ 
    user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onUpdateProfile,
    onListingClick, onEditListing, favoriteListings = [], onToggleFavorite, onViewPublicProfile, onDeleteListing, onBookingStatusUpdate, onNavigate,
    onDeleteAccount, onChangePassword
}) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
    const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);

    useEffect(() => { setLocalBookings(bookings); }, [bookings]);

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'analytics', name: 'Performance', icon: BarChartIcon },
        { id: 'bookings', name: 'Reservations', icon: CalendarIcon },
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'favorites', name: 'Saved Items', icon: HeartIcon },
        { id: 'profile', name: 'Public Profile', icon: UserCheckIcon },
        { id: 'security', name: 'Security & ID', icon: ShieldIcon },
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
            <div className="space-y-12 animate-in fade-in duration-700">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-5xl font-black text-gray-900 tracking-tighter">Dashboard</h2>
                        <p className="text-gray-500 font-medium mt-2 text-lg">Real-time performance of your adventure gear.</p>
                    </div>
                    <div className="bg-white px-5 py-2.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Live Updates</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 relative overflow-hidden group">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] relative z-10">Total Earnings</p>
                        <p className="text-4xl font-black text-gray-900 mt-3 relative z-10">${totalEarnings.toLocaleString()}</p>
                        <div className="mt-5 flex items-center gap-1.5 text-green-500 font-black text-xs relative z-10">
                            <TrendUpIcon className="h-4 w-4" /> +12.4%
                        </div>
                        <div className="absolute -right-6 -top-6 text-gray-50/50">
                            <DollarSignIcon className="h-32 w-32" />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Listings</p>
                        <p className="text-4xl font-black text-gray-900 mt-3">{listings.length}</p>
                        <div className="mt-5 flex items-center gap-2">
                             <div className="flex -space-x-2.5">
                                 {listings.slice(0, 3).map((l, i) => <img key={i} src={l.images[0]} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />)}
                             </div>
                             <span className="text-[11px] font-black text-gray-400 ml-1">Live gear</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Avg. Rating</p>
                        <p className="text-4xl font-black text-gray-900 mt-3">{avgRating.toFixed(1)}</p>
                        <div className="mt-5 flex text-yellow-400 gap-0.5">
                            {[1,2,3,4,5].map(i => <StarIcon key={i} className="h-4 w-4" />)}
                        </div>
                    </div>

                    <div className="bg-[#2d2d5f] p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] relative z-10">Visibility</p>
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
                        <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Upcoming Payouts</h3>
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
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">My Listings</h2>
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
            case 'bookings': return <BookingsManager bookings={localBookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'security': return (
                <>
                    <SecurityManager user={user} onOpenPhone={() => setShowPhoneModal(true)} onOpenId={() => setShowIdModal(true)} onChangePassword={onChangePassword} onDeleteAccount={onDeleteAccount} />
                    {showPhoneModal && <PhoneVerificationModal onClose={() => setShowPhoneModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'phone')} />}
                    {showIdModal && <IdVerificationModal onClose={() => setShowIdModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'id')} />}
                </>
            );
            case 'profile': return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
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
                                <button onClick={() => onViewPublicProfile(user.id)} className="px-8 py-3.5 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black uppercase tracking-widest">Public Bio</button>
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
            default: return <div className="py-20 text-center text-gray-300 italic animate-pulse">Loading section...</div>;
        }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col lg:flex-row gap-16">
                    <aside className="lg:w-80 flex-shrink-0">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-5 sticky top-28">
                             <div className="px-4 py-8 mb-4">
                                <p className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.4em] mb-1">Control Hub</p>
                                <p className="text-xl font-black text-gray-900 tracking-tight">Main Menu</p>
                             </div>
                             {tabs.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id)} 
                                    className={`w-full flex items-center px-7 py-5 rounded-[1.8rem] text-sm font-black transition-all mb-2.5 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                                >
                                    <tab.icon className={`h-5 w-5 mr-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} /> 
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

const SecurityManager: React.FC<{ user: Session, onOpenPhone: () => void, onOpenId: () => void, onChangePassword?: any, onDeleteAccount?: any }> = ({ user, onOpenPhone, onOpenId, onChangePassword, onDeleteAccount }) => {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onChangePassword) return;
        setIsUpdating(true);
        const success = await onChangePassword(currentPass, newPass);
        if (success) {
            setCurrentPass('');
            setNewPass('');
        }
        setIsUpdating(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-10">Identity & Trust</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${user.isIdVerified ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-dashed border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${user.isIdVerified ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}><UserCheckIcon className="h-8 w-8" /></div>
                            {user.isIdVerified && <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">Verified</span>}
                        </div>
                        <h4 className="font-black text-gray-900 text-xl">Government ID</h4>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed font-bold">Required for high-value rentals and boat charters.</p>
                        {!user.isIdVerified && <button onClick={onOpenId} className="mt-8 w-full py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 uppercase tracking-widest">Verify Identity</button>}
                    </div>

                    <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${user.isPhoneVerified ? 'bg-green-50 border-green-100' : 'bg-white border-dashed border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${user.isPhoneVerified ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}><PhoneIcon className="h-8 w-8" /></div>
                            {user.isPhoneVerified && <span className="text-[10px] font-black bg-green-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">Linked</span>}
                        </div>
                        <h4 className="font-black text-gray-900 text-xl">SMS Verification</h4>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed font-bold">Link your mobile for instant booking notifications and security.</p>
                        {!user.isPhoneVerified && <button onClick={onOpenPhone} className="mt-8 w-full py-4 bg-cyan-600 text-white text-xs font-black rounded-2xl hover:bg-cyan-700 transition-all shadow-xl shadow-cyan-100 uppercase tracking-widest">Link Phone (SMS)</button>}
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-8">Access Management</h3>
                <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Current Password</label>
                        <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full border-gray-100 bg-gray-50/50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">New Secure Password</label>
                        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full border-gray-100 bg-gray-50/50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" required />
                    </div>
                    <button type="submit" disabled={isUpdating} className="px-10 py-4 bg-cyan-600 text-white text-xs font-black rounded-2xl hover:bg-cyan-700 shadow-lg shadow-cyan-100 uppercase tracking-widest">
                        {isUpdating ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100 shadow-sm">
                <h3 className="text-2xl font-black text-red-900 tracking-tighter mb-4 flex items-center gap-3">
                    <AlertTriangleIcon className="h-6 w-6" /> Danger Zone
                </h3>
                <p className="text-sm text-red-700 font-medium mb-8">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-8 py-3.5 border-2 border-red-200 text-red-600 text-[10px] font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest"
                >
                    Close Account Forever
                </button>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-gray-100">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                            <TrashIcon className="h-10 w-10" />
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 mb-2">Are you sure?</h4>
                        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">This will delete your listings, reviews, and earning history permanently.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 text-xs font-black rounded-2xl hover:bg-gray-200 uppercase tracking-widest">Cancel</button>
                            <button onClick={() => { setShowDeleteConfirm(false); onDeleteAccount?.(); }} className="flex-1 py-4 bg-red-600 text-white text-xs font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 uppercase tracking-widest">Yes, Delete</button>
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
        if (!phone || phone.length < 10) {
            setError("Please enter a valid phone number.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch('/api/verify/phone', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'send', phoneNumber: phone })
            });
            if (res.ok) setStep('code');
            else setError('Failed to send code.');
        } catch (e) { setError('Connection error.'); }
        finally { setIsLoading(false); }
    };

    const handleVerify = async () => {
        if (!code || code.length !== 6) return;
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch('/api/verify/phone', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'verify', phoneNumber: phone, code })
            });
            const data = await res.json();
            if (res.ok && data.status === 'approved') {
                onSuccess();
                onClose();
            } else setError('Invalid code.');
        } catch (e) { setError('Verification failed.'); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><XIcon className="h-6 w-6" /></button>
                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <SmartphoneIcon className="h-7 w-7 text-cyan-600" /> Phone Verify
                </h3>
                {step === 'input' ? (
                    <div className="space-y-6">
                        <p className="text-sm text-gray-500 font-medium">We'll send a 6-digit code to your mobile device.</p>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mobile Number</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 000 000 0000" className="w-full border-gray-100 bg-gray-50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                        {error && <p className="text-xs text-red-600">{error}</p>}
                        <button onClick={handleSendCode} disabled={!phone || isLoading} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black uppercase tracking-widest text-[10px]">
                            {isLoading ? 'Sending...' : 'Send SMS Code'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="text-center"><p className="text-sm text-gray-500 font-medium">Enter the code sent to</p><p className="font-black text-gray-900 mt-1">{phone}</p></div>
                        <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} placeholder="000000" className="w-full text-center text-3xl font-black tracking-[0.5em] border-b-2 border-gray-100 focus:border-cyan-500 outline-none pb-4" />
                        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
                        <button onClick={handleVerify} disabled={code.length !== 6 || isLoading} className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-700 uppercase tracking-widest text-[10px]">
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const IdVerificationModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [front, setFront] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 2000));
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><XIcon className="h-6 w-6" /></button>
                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <CreditCardIcon className="h-7 w-7 text-indigo-600" /> ID Verify
                </h3>
                <div className="space-y-6">
                    <p className="text-sm text-gray-500 font-medium">Upload a clear photo of your government-issued ID.</p>
                    <ImageUploader label="Front of ID" currentImageUrl={front} onImageChange={setFront} />
                    <button onClick={handleSubmit} disabled={!front || isLoading} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black uppercase tracking-widest text-[10px]">
                        {isLoading ? 'Processing ID...' : 'Submit for Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
    const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
    const displayedBookings = mode === 'renting' ? bookings.filter(b => b.renterId === userId) : bookings.filter(b => b.listing.owner.id === userId);
    return (
        <div className="animate-in fade-in duration-500">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-8">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Reservations</h2>
                <div className="bg-gray-100 p-1.5 rounded-2xl flex shadow-inner border border-gray-200/50">
                    <button onClick={() => setMode('hosting')} className={`px-10 py-3 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${mode === 'hosting' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400'}`}>I'm Hosting</button>
                    <button onClick={() => setMode('renting')} className={`px-10 py-3 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${mode === 'renting' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400'}`}>I'm Renting</button>
                </div>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50"><tr className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black"><th className="p-8">Item</th><th className="p-8 text-center">Dates</th><th className="p-8 text-right">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayedBookings.map(b => (
                            <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-8 font-black text-gray-900 text-base">{b.listing.title}</td>
                                <td className="p-8 text-gray-500 font-bold text-center">{format(new Date(b.startDate), 'MMM dd')}</td>
                                <td className="p-8 text-right"><span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">{b.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserDashboardPage;