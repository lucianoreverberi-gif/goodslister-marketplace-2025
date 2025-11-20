
import React, { useState, useEffect } from 'react';
import { Session } from '../App';
import { Listing, Booking } from '../types';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService';
import { PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, LightbulbIcon, MegaphoneIcon, WandSparklesIcon, ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, PencilIcon } from './icons';
import ImageUploader from './ImageUploader';
import { format } from 'date-fns';

interface UserDashboardPageProps {
    user: Session;
    listings: Listing[];
    bookings: Booking[];
    onVerificationUpdate: (userId: string, verificationType: 'email' | 'phone' | 'id') => void;
    onUpdateAvatar: (userId: string, newAvatarUrl: string) => Promise<void>;
    onListingClick?: (listingId: string) => void;
    onEditListing?: (listingId: string) => void;
}

type DashboardTab = 'listings' | 'bookings' | 'billing' | 'analytics' | 'aiAssistant' | 'security';

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ user, listings, bookings, onVerificationUpdate, onUpdateAvatar, onListingClick, onEditListing }) => {
    // Set 'aiAssistant' as the default active tab to fulfill the user's request.
    const [activeTab, setActiveTab] = useState<DashboardTab>('aiAssistant');

    const tabs: { id: DashboardTab; name: string; icon: React.ElementType }[] = [
        { id: 'listings', name: 'My Listings', icon: PackageIcon },
        { id: 'bookings', name: 'My Bookings', icon: CalendarIcon },
        { id: 'security', name: 'Security & Verification', icon: ShieldIcon },
        { id: 'billing', name: 'Billing', icon: DollarSignIcon },
        { id: 'analytics', name: 'Analytics', icon: BarChartIcon },
        { id: 'aiAssistant', name: 'AI Assistant', icon: BrainCircuitIcon },
    ];
    
    const AIOptimizer: React.FC = () => {
        // Set the 'Scott Spark Mountain Bike' (id: 'listing-2') as the default selected listing.
        const [selectedListingId, setSelectedListingId] = useState<string>('listing-2');
        const [isLoading, setIsLoading] = useState(false);
        const [aiResponse, setAiResponse] = useState('');
        const [adviceType, setAdviceType] = useState<ListingAdviceType | null>(null);

        // This effect runs on mount to pre-generate the social media post as requested by the user.
        useEffect(() => {
            const generateInitialAdvice = async () => {
                const scottBike = listings.find(l => l.id === 'listing-2');
                // Only run if the bike is selected, and we don't already have a response.
                if (selectedListingId === 'listing-2' && scottBike && !aiResponse) {
                    await handleGenerateAdvice('promotion');
                }
            };
            generateInitialAdvice();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []); // Run only once on mount

        const handleGenerateAdvice = async (type: ListingAdviceType) => {
            const selectedListing = listings.find(l => l.id === selectedListingId);
            if (!selectedListing) return;

            setIsLoading(true);
            setAiResponse('');
            setAdviceType(type);
            const response = await getListingAdvice(selectedListing, type);
            setAiResponse(response);
            setIsLoading(false);
        };

        if (listings.length === 0) {
            return (
                <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800">You have no listings yet</h3>
                    <p className="mt-2 text-sm text-gray-600">List your first item to start using the AI Assistant and optimize your rentals!</p>
                </div>
            )
        }

        return (
            <div className="bg-white p-6 rounded-lg shadow">
                 <h3 className="text-xl font-bold mb-4">Power Up Your Listings with AI</h3>
                 <div className="space-y-4">
                     <div>
                        <label htmlFor="listing-select" className="block text-sm font-medium text-gray-700">Select a listing to optimize:</label>
                        <select
                            id="listing-select"
                            value={selectedListingId}
                            onChange={(e) => setSelectedListingId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                        >
                            {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                        <button onClick={() => handleGenerateAdvice('improvement')} disabled={isLoading} className="flex items-center justify-center gap-2 p-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition disabled:opacity-50">
                            <LightbulbIcon className="h-5 w-5"/> Improve Listing
                        </button>
                         <button onClick={() => handleGenerateAdvice('pricing')} disabled={isLoading} className="flex items-center justify-center gap-2 p-3 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition disabled:opacity-50">
                            <DollarSignIcon className="h-5 w-5"/> Pricing Strategy
                        </button>
                         <button onClick={() => handleGenerateAdvice('promotion')} disabled={isLoading} className="flex items-center justify-center gap-2 p-3 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition disabled:opacity-50">
                           <MegaphoneIcon className="h-5 w-5"/> Social Promotion
                        </button>
                    </div>

                    {(isLoading || aiResponse) && (
                        <div className="mt-6 pt-6 border-t">
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2 text-gray-600">
                                    <WandSparklesIcon className="h-5 w-5 animate-pulse"/>
                                    <span>Generating recommendation...</span>
                                </div>
                            ) : (
                                <div>
                                     <h4 className="font-semibold text-gray-800 mb-2 capitalize">{adviceType} Recommendation:</h4>
                                     <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap p-4 bg-gray-50 rounded-md" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                                </div>
                            )}
                        </div>
                    )}
                 </div>
            </div>
        )
    }

    const SecurityTab: React.FC = () => {
        const getTrustScore = () => {
            let score = 25; // Base score
            if (user.isEmailVerified) score += 25;
            if (user.isPhoneVerified) score += 25;
            if (user.isIdVerified) score += 25;
            return score;
        };

        const score = getTrustScore();
        const circumference = 2 * Math.PI * 45; // 2 * pi * radius
        const offset = circumference - (score / 100) * circumference;

        return (
            <div>
                 <h2 className="text-2xl font-bold mb-6">Security & Verification</h2>
                 <div className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r pb-6 md:pb-0 md:pr-8">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                <circle
                                    className="text-green-500"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="45"
                                    cx="50"
                                    cy="50"
                                    style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                                    transform="rotate(-90 50 50)"
                                />
                                <text x="50" y="55" fontFamily="Verdana" fontSize="24" textAnchor="middle" fill="currentColor" className="font-bold">{score}%</text>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold mt-4">Trust Score</h3>
                        <p className="text-sm text-gray-600 mt-1">Complete your profile to increase your score and build more trust.</p>
                    </div>
                     <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Complete your profile</h3>
                        <ul className="space-y-4">
                            <VerificationItem icon={MailIcon} text="Email address verified" isVerified={!!user.isEmailVerified} onVerify={() => onVerificationUpdate(user.id, 'email')} />
                            <VerificationItem icon={PhoneIcon} text="Phone Number" isVerified={!!user.isPhoneVerified} onVerify={() => onVerificationUpdate(user.id, 'phone')} />
                            <VerificationItem icon={CreditCardIcon} text="Identity Document" isVerified={!!user.isIdVerified} onVerify={() => onVerificationUpdate(user.id, 'id')} />
                        </ul>
                         <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-2">Reputation</h3>
                            <div className="flex items-center">
                                <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                                <span className="font-bold text-gray-800">{user.averageRating?.toFixed(1) || 'N/A'}</span>
                                <span className="text-sm text-gray-600 ml-2">({user.totalReviews || 0} reviews)</span>
                            </div>
                         </div>
                    </div>
                 </div>
            </div>
        )
    };

    const VerificationItem: React.FC<{icon: React.ElementType, text: string, isVerified: boolean, onVerify: () => void}> = ({ icon: Icon, text, isVerified, onVerify }) => (
         <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
                <Icon className={`w-5 h-5 mr-3 ${isVerified ? 'text-green-600' : 'text-gray-500'}`} />
                <span className="font-medium text-gray-800">{text}</span>
            </div>
            {isVerified ? (
                <div className="flex items-center text-green-600 font-semibold text-sm">
                    <CheckCircleIcon className="w-5 h-5 mr-1.5" />
                    Verified
                </div>
            ) : (
                <button onClick={onVerify} className="px-3 py-1 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-full">
                    Verify now
                </button>
            )}
        </li>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'listings':
                return (
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
                                                    <button 
                                                        onClick={() => onListingClick && onListingClick(listing.id)}
                                                        className="p-1 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 rounded"
                                                        title="View Listing"
                                                    >
                                                        <EyeIcon className="h-5 w-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => onEditListing && onEditListing(listing.id)}
                                                        className="p-1 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 rounded"
                                                        title="Edit Listing"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
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
            case 'bookings':
                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
                        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                            {bookings.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3">Item</th>
                                            <th className="p-3">Dates</th>
                                            <th className="p-3">Total Price</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map(booking => (
                                            <tr key={booking.id} className="border-b">
                                                <td className="p-3 font-medium">{booking.listing.title}</td>
                                                <td className="p-3">{format(new Date(booking.startDate), 'MMM dd, yyyy')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</td>
                                                <td className="p-3">${booking.totalPrice.toFixed(2)}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        booking.status === 'confirmed' ? 'text-green-800 bg-green-100' : 'text-yellow-800 bg-yellow-100'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p className="text-center p-8 text-gray-600">You haven't booked any items yet.</p>}
                        </div>
                    </div>
                );
            case 'security':
                return <SecurityTab />;
            case 'billing':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Billing</h2>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold">Transaction History (Simulated)</h3>
                             <p className="text-gray-600 text-sm mt-1 mb-4">Here you would see your earnings and payments.</p>
                             <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b"><td className="p-3">2024-07-15</td><td className="p-3">Payout for "Double Kayak"</td><td className="p-3 text-green-600">+$150.00</td></tr>
                                    <tr className="border-b"><td className="p-3">2024-07-10</td><td className="p-3">Payout for "Pro Snowboard"</td><td className="p-3 text-green-600">+$225.00</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'analytics':
                 return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Listing Analytics (Simulated)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-500">Total Views (30 days)</h3>
                                <p className="text-3xl font-bold mt-2">1,250</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-500">Request Rate</h3>
                                <p className="text-3xl font-bold mt-2">12%</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow col-span-1 md:col-span-2 lg:col-span-1">
                                <h3 className="text-lg font-medium text-gray-500">Most Viewed Listing</h3>
                                <div className="flex items-center gap-2 mt-2">
                                     <StarIcon className="h-6 w-6 text-yellow-400"/>
                                     <p className="text-lg font-bold">{listings[0]?.title || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'aiAssistant':
                return <AIOptimizer />;
        }
    };
    

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                        <ImageUploader
                            currentImageUrl={user.avatarUrl}
                            onImageChange={(newUrl) => onUpdateAvatar(user.id, newUrl)}
                            label=""
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">User Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {user.name.split(' ')[0]}.</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="md:w-1/4 lg:w-1/5">
                        <nav className="flex flex-col space-y-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-4 py-2 rounded-lg text-left transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <tab.icon className="h-5 w-5 mr-3" />
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    {/* Main Content */}
                    <main className="flex-1">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;
