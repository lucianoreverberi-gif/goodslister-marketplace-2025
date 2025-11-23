
import React, { useState, useEffect } from 'react';
import { Session } from '../App';
import { Listing, Booking } from '../types';
import { getListingAdvice, ListingAdviceType } from '../services/geminiService';
import { PackageIcon, DollarSignIcon, BarChartIcon, BrainCircuitIcon, StarIcon, LightbulbIcon, MegaphoneIcon, WandSparklesIcon, ShieldIcon, MailIcon, PhoneIcon, CreditCardIcon, CheckCircleIcon, CalendarIcon, EyeIcon, PencilIcon, RocketIcon, XIcon, LandmarkIcon, CalculatorIcon, UmbrellaIcon } from './icons';
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

interface PromotionModalProps {
    listing: Listing;
    onClose: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ listing, onClose }) => {
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const plans = [
        { id: 1, name: 'Local Boost', price: 4.99, duration: '3 Days', features: ['2x Visibility in search', `Targeted to ${listing.location.city}`, 'Basic Analytics'] },
        { id: 2, name: 'City Star', price: 9.99, duration: '7 Days', features: ['5x Visibility', 'Top of search results', 'Verified Badge on listing'], recommended: true },
        { id: 3, name: 'Regional Hero', price: 29.99, duration: '30 Days', features: ['Max Visibility', 'Homepage Feature', 'Email Newsletter Feature'] },
    ];

    const handlePromote = () => {
        if (!selectedPlan) return;
        setIsProcessing(true);
        // Simulation of payment processing
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
                    <div className="bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                    <p className="text-gray-600 mt-2">
                        Your listing <strong>{listing.title}</strong> is now being promoted in <strong>{listing.location.city}</strong>.
                    </p>
                    <button onClick={onClose} className="mt-6 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <RocketIcon className="h-6 w-6 text-cyan-600" />
                        Boost Visibility
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Promote <strong>{listing.title}</strong> to renters in <strong>{listing.location.city}</strong> and get booked faster.
                    </p>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div 
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                                    selectedPlan === plan.id 
                                        ? 'border-cyan-600 bg-cyan-50 ring-2 ring-cyan-200' 
                                        : 'border-gray-200 hover:border-cyan-300'
                                }`}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                                        MOST POPULAR
                                    </div>
                                )}
                                <h3 className="font-bold text-lg text-gray-900 text-center">{plan.name}</h3>
                                <div className="text-center my-3">
                                    <span className="text-2xl font-extrabold text-gray-900">${plan.price}</span>
                                </div>
                                <p className="text-center text-sm font-semibold text-cyan-700 mb-4">{plan.duration}</p>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={handlePromote}
                        disabled={!selectedPlan || isProcessing}
                        className="w-full py-3 px-4 text-white font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isProcessing ? 'Processing Payment...' : (selectedPlan ? `Pay $${plans.find(p => p.id === selectedPlan)?.price} & Promote` : 'Select a Plan')}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-3">
                        Secure payment powered by Stripe. No hidden fees.
                    </p>
                </div>
            </div>
        </div>
    );
};

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
        // Select the first listing by default, or empty string if none.
        const [selectedListingId, setSelectedListingId] = useState<string>(listings.length > 0 ? listings[0].id : '');
        const [isLoading, setIsLoading] = useState(false);
        const [aiResponse, setAiResponse] = useState('');
        const [adviceType, setAdviceType] = useState<ListingAdviceType | null>(null);
        const [showPromotionModal, setShowPromotionModal] = useState(false);

        // This effect runs on mount to pre-generate the social media post if the specific listing exists.
        useEffect(() => {
            const generateInitialAdvice = async () => {
                // If we have listings and none selected, default to first one
                if (!selectedListingId && listings.length > 0) {
                    setSelectedListingId(listings[0].id);
                }

                // Optionally trigger an initial advice for demo purposes
                if (selectedListingId && !aiResponse) {
                     // We won't auto-trigger here to let user choose, unless specifically desired.
                     // But for the user's specific request context (pre-loading), let's leave it user-driven
                     // or only trigger if they have specifically selected the demo bike.
                     if (selectedListingId === 'listing-2') {
                         handleGenerateAdvice('promotion');
                     }
                }
            };
            generateInitialAdvice();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []); 

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

        const selectedListing = listings.find(l => l.id === selectedListingId);

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

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4">
                        <button onClick={() => handleGenerateAdvice('improvement')} disabled={isLoading} className="flex items-center justify-center gap-2 p-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition disabled:opacity-50">
                            <LightbulbIcon className="h-5 w-5"/> Improve Listing
                        </button>
                         <button onClick={() => handleGenerateAdvice('pricing')} disabled={isLoading} className="flex items-center justify-center gap-2 p-3 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition disabled:opacity-50">
                            <DollarSignIcon className="h-5 w-5"/> Pricing Strategy
                        </button>
                         <button onClick={() => handleGenerateAdvice('promotion')} disabled={isLoading} className="flex items-center justify-center gap-2 p-3 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition disabled:opacity-50">
                           <MegaphoneIcon className="h-5 w-5"/> Social Promotion
                        </button>
                        <button 
                            onClick={() => setShowPromotionModal(true)} 
                            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition transform"
                        >
                           <RocketIcon className="h-5 w-5"/> Boost Visibility
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
                 {showPromotionModal && selectedListing && (
                     <PromotionModal 
                        listing={selectedListing} 
                        onClose={() => setShowPromotionModal(false)} 
                     />
                 )}
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

    const FeeStrategyAdvisor = () => {
        const [simulatedPrice, setSimulatedPrice] = useState(100);
        const renterFeePercent = 10; // 10% standard industry rate
        const ownerFeePercent = 3;   // 3% standard transaction fee

        const renterPays = simulatedPrice * (1 + renterFeePercent/100);
        const platformKeeps = (simulatedPrice * (renterFeePercent/100)) + (simulatedPrice * (ownerFeePercent/100));
        const ownerGets = simulatedPrice * (1 - ownerFeePercent/100);

        return (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 mb-8 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                        <CalculatorIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">Revenue Simulator & Fee Strategy</h3>
                        <p className="text-sm text-indigo-600">Understanding marketplace fees for clients and public</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                            <strong>Standard Industry Model:</strong>
                            <br/>
                            1. <strong>Renter Fee (Public):</strong> Usually 10-15% added on top. Covers support & platform maintenance.
                            <br/>
                            2. <strong>Owner Fee (Client):</strong> Usually 3-5% deducted from payout. Covers payment processing costs (like Stripe).
                        </p>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Simulate Rental Price ($)</label>
                            <input 
                                type="number" 
                                value={simulatedPrice} 
                                onChange={(e) => setSimulatedPrice(Number(e.target.value))}
                                className="w-full text-2xl font-bold border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center pb-2 border-b border-dashed">
                            <span className="text-gray-600">Renter Pays (Price + {renterFeePercent}%)</span>
                            <span className="font-bold text-gray-900">${renterPays.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                             <span>Platform Revenue</span>
                             <span>${platformKeeps.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t font-bold text-lg text-green-600">
                             <span>You Receive (Price - {ownerFeePercent}%)</span>
                             <span>${ownerGets.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                const now = new Date();
                // Helper to separate bookings
                const activeBookings = bookings.filter(b => {
                    const start = new Date(b.startDate);
                    const end = new Date(b.endDate);
                    return start <= now && end >= now;
                }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

                const futureBookings = bookings.filter(b => new Date(b.startDate) > now)
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

                const pastBookings = bookings.filter(b => new Date(b.endDate) < now)
                    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

                const renderBookingTable = (title: string, data: Booking[], emptyMsg: string, isHighlight = false) => (
                    <div className="mb-8 last:mb-0">
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
                                            <th className="p-3">Total Price</th>
                                            <th className="p-3">Insurance</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map(booking => (
                                            <tr key={booking.id} className="border-b last:border-0">
                                                <td className="p-3 font-medium">{booking.listing.title}</td>
                                                <td className="p-3">{format(new Date(booking.startDate), 'MMM dd, yyyy')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</td>
                                                <td className="p-3">${booking.totalPrice.toFixed(2)}</td>
                                                <td className="p-3 text-gray-600 capitalize text-xs">
                                                    <div className="flex items-center gap-1">
                                                        {booking.insurancePlan && booking.insurancePlan !== 'standard' ? <ShieldIcon className="h-3 w-3 text-cyan-600"/> : null}
                                                        {booking.insurancePlan || 'Standard'}
                                                    </div>
                                                </td>
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
                            ) : <p className="text-gray-500 text-sm italic py-2">{emptyMsg}</p>}
                        </div>
                    </div>
                );

                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
                        {bookings.length === 0 ? (
                             <div className="bg-white p-8 rounded-lg shadow text-center text-gray-600">
                                <p>You haven't booked any items yet.</p>
                            </div>
                        ) : (
                            <div>
                                {renderBookingTable("Active Today", activeBookings, "No active bookings right now.", true)}
                                {renderBookingTable("Upcoming Bookings", futureBookings, "No upcoming bookings scheduled.")}
                                {renderBookingTable("Past History", pastBookings, "No past bookings.")}
                            </div>
                        )}
                    </div>
                );
            case 'security':
                return <SecurityTab />;
            case 'billing':
                return (
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                             <h2 className="text-2xl font-bold">Billing & Payments</h2>
                             <button className="mt-4 sm:mt-0 px-4 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 flex items-center gap-2">
                                <LandmarkIcon className="h-5 w-5" /> Connect Bank Account
                             </button>
                        </div>
                        
                        {/* Wallet / Balance Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <p className="text-sm font-medium text-gray-500">Available Balance</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">$450.00</p>
                                <p className="text-xs text-gray-400 mt-2">Ready to payout</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
                                <p className="text-sm font-medium text-gray-500">Pending Balance</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">$120.00</p>
                                <p className="text-xs text-gray-400 mt-2">Available after rental completion</p>
                            </div>
                        </div>

                        {/* Fee Advisor */}
                        <FeeStrategyAdvisor />

                        {/* Transaction History Table */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3 text-right">Gross Amount</th>
                                            <th className="p-3 text-right text-gray-500">Fees (3%)</th>
                                            <th className="p-3 text-right font-bold">Net Payout</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="p-3">2024-07-15</td>
                                            <td className="p-3">
                                                <div className="font-medium">Rental: Adventure Double Kayak</div>
                                                <div className="text-xs text-gray-500">Ref: #TX-9821</div>
                                            </td>
                                            <td className="p-3 text-right">$155.00</td>
                                            <td className="p-3 text-right text-red-400">-$4.65</td>
                                            <td className="p-3 text-right font-bold text-green-600">+$150.35</td>
                                        </tr>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="p-3">2024-07-10</td>
                                            <td className="p-3">
                                                <div className="font-medium">Rental: Pro Snowboard</div>
                                                <div className="text-xs text-gray-500">Ref: #TX-9812</div>
                                            </td>
                                            <td className="p-3 text-right">$232.00</td>
                                            <td className="p-3 text-right text-red-400">-$6.96</td>
                                            <td className="p-3 text-right font-bold text-green-600">+$225.04</td>
                                        </tr>
                                    </tbody>
                                </table>
                             </div>
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