
import React, { useState, useEffect } from 'react';
import { Session, Listing, Booking, InspectionPhoto } from '../types';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService';
import { PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, LightbulbIcon, MegaphoneIcon, WandSparklesIcon, ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, PencilIcon, RocketIcon, XIcon, LandmarkIcon, CalculatorIcon, UmbrellaIcon, SmartphoneIcon, CameraFaceIcon, ScanIcon, FileWarningIcon, GavelIcon, CameraIcon, HeartIcon, UserCheckIcon, TrashIcon, AlertTriangleIcon } from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';
import RentalSessionWizard from './RentalSessionWizard'; // Use the Wizard
import ListingCard from './ListingCard';
import DigitalInspection from './DigitalInspection'; // Import DigitalInspection for the BookingsManager to use if needed directly, though Wizard handles it mostly

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
    onBookingStatusUpdate: (bookingId: string, status: string) => Promise<void>; // NEW PROP
}

type DashboardTab = 'profile' | 'listings' | 'bookings' | 'billing' | 'analytics' | 'aiAssistant' | 'security' | 'favorites';

// Placeholders for components not fully expanded in this file to keep it concise
interface PromotionModalProps { listing: Listing; onClose: () => void; }
const InspectionModal: React.FC<{ booking: Booking, onClose: () => void }> = ({ booking, onClose }) => { return null; };
const PromotionModal: React.FC<PromotionModalProps> = ({ listing, onClose }) => { return null; };
const PhoneVerificationModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => { return null; };
const IdVerificationModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => { return null; };


const BookingsManager: React.FC<{ bookings: Booking[], userId: string, onStatusUpdate: (id: string, status: string) => Promise<void> }> = ({ bookings, userId, onStatusUpdate }) => {
    const [mode, setMode] = useState<'renting' | 'hosting'>('renting');
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);
    
    // Session Wizard State
    const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);
    const [sessionInitialMode, setSessionInitialMode] = useState<'handover' | 'return'>('handover');
    
    // Legacy Inspection State (for viewing past reports)
    const [selectedInspection, setSelectedInspection] = useState<Booking | null>(null);

    const rentingBookings = bookings.filter(b => b.renterId === userId);
    const hostingBookings = bookings.filter(b => b.listing.owner.id === userId);

    const displayedBookings = mode === 'renting' ? rentingBookings : hostingBookings;

    const now = new Date();
    
    // RELAXED FILTER: If status is 'active', show it in "Active" regardless of dates.
    const activeBookings = displayedBookings.filter(b => {
        if (b.status === 'active') return true; 
        if (b.status === 'confirmed') {
            const start = new Date(b.startDate);
            // Show if start date is today or in the past (late start)
            return start <= new Date(now.getTime() + 24 * 60 * 60 * 1000); 
        }
        return false;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const futureBookings = displayedBookings.filter(b => b.status === 'confirmed' && new Date(b.startDate) > new Date(now.getTime() + 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const pastBookings = displayedBookings.filter(b => b.status === 'completed' || b.status === 'cancelled')
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    const handleSessionComplete = () => {
        setActiveSessionBooking(null);
    };

    const renderBookingTable = (title: string, data: Booking[], emptyMsg: string, isHighlight = false) => (
        <div className="mb-8 last:mb-0 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4">
                <h3 className={`text-lg font-bold ${isHighlight ? 'text-cyan-700' : 'text-gray-800'}`}>{title}</h3>
                {data.length > 0 && <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{data.length}</span>}
            </div>
            <div className={`bg-white p-4 rounded-lg shadow overflow-x-auto ${isHighlight ? 'border border-cyan-200' : ''}`}>
                {data.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3">Item</th>
                                <th className="p-3">Dates</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(booking => (
                                <tr key={booking.id} className="border-b last:border-0">
                                    <td className="p-3">
                                        <div className="font-medium text-gray-900">{booking.listing.title}</div>
                                        <div className="text-xs text-gray-500">
                                            {mode === 'renting' ? `Owner: ${booking.listing.owner.name}` : `Renter: Client #${booking.renterId.substring(0,4)}`}
                                        </div>
                                    </td>
                                    <td className="p-3">{format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            booking.status === 'confirmed' ? 'text-green-800 bg-green-100' : 
                                            booking.status === 'active' ? 'text-blue-800 bg-blue-100' : 
                                            'text-gray-800 bg-gray-100'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            {/* Logic: If confirmed, show Handover. If Active, show Return. */}
                                            {booking.status === 'confirmed' && (
                                                <button 
                                                    onClick={() => { setActiveSessionBooking(booking); setSessionInitialMode('handover'); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-xs font-bold rounded hover:bg-cyan-700"
                                                >
                                                    <CameraIcon className="h-3 w-3" /> Start Handover
                                                </button>
                                            )}
                                            {booking.status === 'active' && (
                                                <button 
                                                    onClick={() => { setActiveSessionBooking(booking); setSessionInitialMode('return'); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700"
                                                >
                                                    <ScanIcon className="h-3 w-3" /> Start Return
                                                </button>
                                            )}
                                            {booking.status === 'completed' && (
                                                <button className="text-xs text-gray-400 cursor-default">Archived</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 text-sm italic py-2">{emptyMsg}</p>}
            </div>
        </div>
    );

    return (
        <div>
             {/* RENTAL SESSION WIZARD OVERLAY */}
             {activeSessionBooking && (
                 <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                     <div className="absolute top-4 right-4 z-50">
                        <button onClick={() => setActiveSessionBooking(null)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <XIcon className="h-6 w-6 text-gray-600" />
                        </button>
                     </div>
                     <RentalSessionWizard 
                        booking={activeSessionBooking}
                        initialMode={sessionInitialMode}
                        onStatusChange={(status) => onStatusUpdate(activeSessionBooking.id, status)} // CONNECTED
                        onComplete={handleSessionComplete}
                     />
                 </div>
             )}

             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    {mode === 'renting' ? 'My Trips & Rentals' : 'Reservations & Clients'}
                </h2>
                
                {mode === 'hosting' && (
                    <button 
                        onClick={() => setIsCalendarConnected(!isCalendarConnected)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                            isCalendarConnected 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {isCalendarConnected ? <><CheckCircleIcon className="h-4 w-4" /> Synced</> : <><CalendarIcon className="h-4 w-4" /> Sync Calendar</>}
                    </button>
                )}

                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                    <button onClick={() => setMode('renting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'renting' ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>I'm Renting</button>
                    <button onClick={() => setMode('hosting')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'hosting' ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>I'm Hosting</button>
                </div>
            </div>

            {displayedBookings.length === 0 ? (
                 <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500 border border-dashed border-gray-300">
                    <p className="text-lg">No bookings found in this category.</p>
                </div>
            ) : (
                <div>
                    {renderBookingTable("Active & Ready", activeBookings, "", true)}
                    {renderBookingTable("Upcoming", futureBookings, "")}
                    {renderBookingTable("History", pastBookings, "")}
                </div>
            )}
        </div>
    )
}

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ 
    user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onUpdateProfile,
    onListingClick, onEditListing, favoriteListings = [], onToggleFavorite, onViewPublicProfile, onDeleteListing, onBookingStatusUpdate 
}) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);
    
    // Delete State
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
    
    const ProfileSettingsTab: React.FC = () => {
        const [bio, setBio] = useState(user.bio || '');
        const [avatar, setAvatar] = useState(user.avatarUrl);
        const [isSaving, setIsSaving] = useState(false);
        const [saveMessage, setSaveMessage] = useState('');

        const handleSave = async () => {
            setIsSaving(true);
            await onUpdateProfile(bio, avatar);
            setSaveMessage('Profile saved successfully!');
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Public Profile</h2>
                    <button 
                        onClick={() => onViewPublicProfile(user.id)}
                        className="text-sm text-cyan-600 font-semibold hover:underline flex items-center gap-1"
                    >
                        View as Public <EyeIcon className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-8 space-y-8">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-32 h-32 flex-shrink-0">
                            <ImageUploader currentImageUrl={avatar} onImageChange={setAvatar} label="" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">This photo appears on your listings and profile.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                            <input type="text" value={user.name} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <input type="text" value={user.email} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">About Me (Bio)</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 transition-all" placeholder="Tell the community about yourself!" />
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        {saveMessage && <span className="text-green-600 text-sm font-medium animate-pulse">{saveMessage}</span>}
                        <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors shadow-sm">
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const AIOptimizer = () => <div className="p-6 bg-white rounded-lg shadow">AI Assistant Placeholder</div>;
    const SecurityTab = () => <div className="p-6 bg-white rounded-lg shadow">Security Settings Placeholder</div>;
    const FeeStrategyAdvisor = () => <div className="p-6 bg-white rounded-lg shadow mb-6">Billing & Fees Placeholder</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSettingsTab />;
            case 'listings': return (
                <div>
                    <h2 className="text-2xl font-bold mb-6">My Listings</h2>
                    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                        {listings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Title</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Price/day</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map(listing => (
                                        <tr key={listing.id} className="border-b">
                                            <td className="p-3 font-medium">{listing.title}</td>
                                            <td className="p-3">{listing.category}</td>
                                            <td className="p-3">${listing.pricePerDay}</td>
                                            <td className="p-3"><span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span></td>
                                            <td className="p-3 flex justify-end gap-2">
                                                <button onClick={() => onListingClick && onListingClick(listing.id)} className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" title="View">
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => onEditListing && onEditListing(listing.id)} className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" title="Edit">
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                {/* DELETE BUTTON - VISIBLE RED */}
                                                <button 
                                                    onClick={() => setListingToDelete(listing.id)} 
                                                    className="p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors" 
                                                    title="Delete Listing"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="text-center p-8 text-gray-600">You haven't listed any items yet.</p>}
                    </div>
                </div>
            );
            case 'bookings': return <BookingsManager bookings={bookings} userId={user.id} onStatusUpdate={onBookingStatusUpdate} />;
            case 'favorites': return (<div><h2 className="text-2xl font-bold mb-6">Saved Items</h2>{favoriteListings && favoriteListings.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{favoriteListings.map(listing => (<ListingCard key={listing.id} listing={listing} onClick={onListingClick || (() => {})} isFavorite={true} onToggleFavorite={onToggleFavorite} />))}</div>) : (<div className="text-center py-12 bg-white rounded-lg border border-gray-200"><HeartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900">No favorites yet</h3><p className="text-gray-500 mt-1">Start exploring and save items you love!</p></div>)}</div>);
            case 'security': return <SecurityTab />;
            case 'billing': return (<div><h2 className="text-2xl font-bold mb-6">Billing</h2><FeeStrategyAdvisor /><div className="bg-white p-6 rounded-lg shadow"><p className="text-gray-500">Transaction history and payouts.</p></div></div>);
            case 'analytics': return (<div><h2 className="text-2xl font-bold mb-6">Listing Analytics</h2><div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-500">Analytics are simulated in this demo.</p></div></div>);
            case 'aiAssistant': return <AIOptimizer />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-sm">
                        <ImageUploader currentImageUrl={user.avatarUrl} onImageChange={(newUrl) => onUpdateAvatar(user.id, newUrl)} label="" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">User Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {user.name.split(' ')[0]}.</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-1/4 lg:w-1/5">
                        <nav className="flex flex-col space-y-2">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-4 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>
                                    <tab.icon className="h-5 w-5 mr-3" /> {tab.name}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    <main className="flex-1">
                        {renderContent()}
                    </main>
                </div>
            </div>
            {showPhoneModal && <PhoneVerificationModal onClose={() => setShowPhoneModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'phone')} />}
            {showIdModal && <IdVerificationModal onClose={() => setShowIdModal(false)} onSuccess={() => onVerificationUpdate(user.id, 'id')} />}
            
            {/* DELETE CONFIRMATION MODAL */}
            {listingToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <AlertTriangleIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Listing?</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            Are you sure you want to delete this listing? This action <strong>cannot be undone</strong>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setListingToDelete(null)} className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50">
                                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboardPage;
