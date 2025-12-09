
import React, { useState, useEffect } from 'react';
import { Listing, User, Booking, ListingCategory } from '../types';
import { MapPinIcon, StarIcon, ChevronLeftIcon, ShareIcon, HeartIcon, MessageSquareIcon, CheckCircleIcon, XIcon, ShieldCheckIcon, UmbrellaIcon, WalletIcon, CreditCardIcon, AlertTriangleIcon, FileTextIcon, UploadCloudIcon, FileSignatureIcon, PenToolIcon, ShieldIcon } from './icons';
import ListingMap from './ListingMap';
import { DayPicker, DateRange } from 'react-day-picker';
import { differenceInCalendarDays, format } from 'date-fns';
import { LegalService } from '../services/legalService';
import ImageUploader from './ImageUploader'; 

// A simple component to render Markdown from the AI description
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const createMarkup = (markdownText: string) => {
        if (!markdownText) return { __html: '' };
        const paragraphs = markdownText.split('\n\n').map(p => {
            let processedParagraph = p
                .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold my-3">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (processedParagraph.includes('* ')) {
                const listItems = processedParagraph.split('\n')
                    .filter(line => line.trim().startsWith('* '))
                    .map(item => `<li class="ml-5 list-disc">${item.trim().substring(2).trim()}</li>`)
                    .join('');
                processedParagraph = processedParagraph.replace(/(\* .*\n?)+/, `<ul class="space-y-1 my-3">${listItems}</ul>`);
            }
            if (!processedParagraph.startsWith('<h3') && !processedParagraph.startsWith('<ul')) {
                 processedParagraph = `<p>${processedParagraph.replace(/\n/g, '<br />')}</p>`;
            }
            return processedParagraph;
        }).join('');
        return { __html: paragraphs };
    };
    return <div className="prose max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={createMarkup(text)} />;
};

interface ListingDetailPageProps {
    listing: Listing;
    onBack: () => void;
    onStartConversation: (listing: Listing) => void;
    currentUser: User | null;
    onCreateBooking: (
        listingId: string, 
        startDate: Date, 
        endDate: Date, 
        totalPrice: number, 
        paymentMethod: 'platform' | 'direct',
        protectionType: 'waiver' | 'insurance',
        protectionFee: number
    ) => Promise<Booking>;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
    onViewOwnerProfile?: () => void; // New Prop
}

const BookingConfirmationModal: React.FC<{ booking: Booking, onClose: () => void }> = ({ booking, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative text-center p-8">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <XIcon className="h-6 w-6" />
            </button>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
            <p className="text-gray-600 mt-2">Your reservation for the <span className="font-semibold">{booking.listing.title}</span> is complete.</p>
            <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg border">
                <p><strong>Dates:</strong> {format(new Date(booking.startDate), 'LLL dd, yyyy')} - {format(new Date(booking.endDate), 'LLL dd, yyyy')}</p>
                <div className="flex items-center justify-between mt-2">
                    <strong>Total Price:</strong> 
                    <span className="text-lg font-bold text-cyan-700">${booking.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm border-t pt-2 border-gray-200">
                     <ShieldCheckIcon className={`h-4 w-4 ${booking.protectionType === 'insurance' ? 'text-blue-600' : 'text-green-600'}`} />
                     <div>
                        <span className="font-semibold">{booking.protectionType === 'insurance' ? 'Platform Insurance' : 'Standard/Waiver'}</span>
                        {booking.protectionFee > 0 && <span className="text-gray-500 block text-xs">Fee: ${booking.protectionFee.toFixed(2)}</span>}
                     </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                    {booking.paymentMethod === 'platform' ? <CreditCardIcon className="h-4 w-4 text-green-600" /> : <WalletIcon className="h-4 w-4 text-amber-600" />}
                    <p className="capitalize font-medium">{booking.paymentMethod === 'platform' ? 'Paid Online' : 'Pay on Pickup'}</p>
                </div>
                <p className="mt-3 text-xs text-gray-400 text-center">Check your email for the receipt.</p>
            </div>
            <button onClick={onClose} className="mt-6 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                Continue Browsing
            </button>
        </div>
    </div>
);

interface ContractSigningModalProps {
    listing: Listing;
    renter: User;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    onSign: () => void;
    onClose: () => void;
}

const ContractSigningModal: React.FC<ContractSigningModalProps> = ({ listing, renter, startDate, endDate, totalPrice, onSign, onClose }) => {
    const [agreed, setAgreed] = useState(false);
    const contractHtml = LegalService.generateContractHtml(listing, renter, startDate, endDate, totalPrice);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <div className="p-6 border-b bg-gray-50 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileSignatureIcon className="h-6 w-6 text-cyan-600" />
                        Sign Rental Agreement
                    </h2>
                    <p className="text-gray-600 mt-1">Please review and sign the contract for this {listing.category}.</p>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div 
                        className="prose prose-sm max-w-none text-gray-700 border border-gray-300 p-6 rounded shadow-inner bg-white"
                        dangerouslySetInnerHTML={{ __html: contractHtml }}
                    />
                </div>

                <div className="p-6 border-t bg-white rounded-b-2xl">
                    <div className="flex items-center gap-3 mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <input 
                            type="checkbox" 
                            id="agree" 
                            checked={agreed} 
                            onChange={(e) => setAgreed(e.target.checked)} 
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="agree" className="text-sm text-gray-700 font-medium">
                            I have read and agree to the terms above. I understand this is a legally binding contract.
                        </label>
                    </div>
                    
                    <button
                        onClick={onSign}
                        disabled={!agreed}
                        className="w-full py-3 px-4 text-white font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        <PenToolIcon className="h-5 w-5" />
                        Digitally Sign & Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};

interface PaymentSelectionModalProps {
    totalPrice: number;
    onConfirm: (method: 'platform' | 'direct') => void;
    onClose: () => void;
    isProcessing: boolean;
}

const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({ totalPrice, onConfirm, onClose, isProcessing }) => {
    const [selectedMethod, setSelectedMethod] = useState<'platform' | 'direct' | null>(null);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative p-6 flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Payment Method</h2>
                <p className="text-gray-600 mb-6">Complete your booking securely.</p>

                <div className="space-y-4 overflow-y-auto flex-1">
                    {/* Platform Payment Card */}
                    <div 
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedMethod === 'platform' ? 'border-cyan-600 bg-cyan-50 ring-1 ring-cyan-200' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setSelectedMethod('platform')}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-600">
                                    <CreditCardIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Pay Securely Now</h3>
                                    <p className="text-sm text-gray-500">Credit / Debit Card</p>
                                </div>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">Recommended</span>
                        </div>
                        <div className="mt-3 pl-11">
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-green-500"/> Includes Goodslister Protection</li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-green-500"/> Instant Confirmation</li>
                            </ul>
                        </div>
                    </div>

                    {/* Direct Payment Card */}
                    <div 
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedMethod === 'direct' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-200' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setSelectedMethod('direct')}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                                    <WalletIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Pay on Pickup</h3>
                                    <p className="text-sm text-gray-500">Direct to Owner</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pl-11">
                            <p className="text-sm text-gray-600 mb-2">Coordinate payment (Cash, Venmo, etc.) directly with the owner when you meet.</p>
                            {selectedMethod === 'direct' && (
                                <div className="bg-amber-100 border border-amber-200 p-3 rounded-lg text-amber-800 text-xs flex gap-2 items-start">
                                    <AlertTriangleIcon className="h-5 w-5 flex-shrink-0" />
                                    <p><strong>Warning:</strong> Payments made outside the platform are NOT covered by our Insurance or Refund Policy. Proceed with caution.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-4 border-t">
                    <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-900">
                        <span>Total to Pay</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => selectedMethod && onConfirm(selectedMethod)}
                        disabled={!selectedMethod || isProcessing}
                        className="w-full py-3 px-4 text-white font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : (selectedMethod === 'platform' ? `Pay $${totalPrice.toFixed(2)} & Book` : 'Confirm Booking')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ListingDetailPage: React.FC<ListingDetailPageProps> = ({ listing, onBack, onStartConversation, currentUser, onCreateBooking, isFavorite, onToggleFavorite, onViewOwnerProfile }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [range, setRange] = useState<DateRange | undefined>();
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [successfulBooking, setSuccessfulBooking] = useState<Booking | null>(null);
    
    const [showContractModal, setShowContractModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // State for Insurance Selection
    const [insurancePlan, setInsurancePlan] = useState<'none' | 'standard' | 'premium'>('standard');

    const isOwner = currentUser?.id === listing.owner.id;
    const bookedDays = listing.bookedDates?.map(d => new Date(d)) || [];
    const disabledDays = [{ before: new Date() }, ...bookedDays];

    // Identify high-risk categories where insurance is handled directly (not via platform add-on)
    const isHighRisk = 
        listing.category === ListingCategory.MOTORCYCLES ||
        listing.category === ListingCategory.BOATS ||
        listing.category === ListingCategory.RVS ||
        listing.category === ListingCategory.ATVS_UTVS ||
        (listing.category === ListingCategory.WATER_SPORTS && listing.subcategory?.toLowerCase().includes('jet ski'));

    // Calculate Totals
    const getPriceDetails = () => {
        if (!range?.from || !range?.to) return null;
        const days = differenceInCalendarDays(range.to, range.from) + 1;
        const basePrice = listing.pricingType === 'daily' ? (listing.pricePerDay || 0) : 0;
        
        const rentalTotal = basePrice * days;
        
        // Logic: Platform insurance only applies to non-high-risk items.
        // For High Risk items, protectionFee is 0 because it's handled directly/externally.
        let protectionFee = 0;
        if (!isHighRisk) {
            if (insurancePlan === 'standard') {
                protectionFee = rentalTotal * 0.10; // 10% for standard
            } else if (insurancePlan === 'premium') {
                protectionFee = rentalTotal * 0.20; // 20% for premium
            }
            // 'none' is 0
        }
        
        const totalPrice = rentalTotal + protectionFee;

        return {
            days,
            rentalTotal,
            protectionFee,
            totalPrice
        };
    };

    const priceDetails = getPriceDetails();

    const handleBookClick = () => {
        if (!currentUser || !range?.from || !range?.to || isOwner) return;
        // Trigger Contract Signing first
        setShowContractModal(true);
    };

    const handleContractSigned = () => {
        setShowContractModal(false);
        // Trigger Payment
        setShowPaymentModal(true);
    };

    const handleConfirmBooking = async (paymentMethod: 'platform' | 'direct') => {
        if (!range?.from || !range?.to || !priceDetails) return;
        
        setIsBooking(true);
        setBookingError(null);

        // Simulate slight delay for UX
        if (paymentMethod === 'platform') {
            await new Promise(resolve => setTimeout(resolve, 1500)); 
        }

        try {
            const newBooking = await onCreateBooking(
                listing.id, 
                range.from, 
                range.to, 
                priceDetails.totalPrice, 
                paymentMethod,
                (!isHighRisk && (insurancePlan === 'premium' || insurancePlan === 'standard')) ? 'insurance' : 'waiver',
                priceDetails.protectionFee
            );
            setSuccessfulBooking(newBooking);
            setRange(undefined); // Reset calendar
            setShowPaymentModal(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            setBookingError(message);
        } finally {
            setIsBooking(false);
        }
    };

    const modifiersStyles: React.CSSProperties | any = {
      selected: { backgroundColor: '#06B6D4', color: 'white' },
      range_middle: { backgroundColor: '#06B6D4', color: 'white', borderRadius: 0 },
      range_start: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
      range_end: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
      today: { fontWeight: 'bold', color: '#10B981' },
      disabled: { textDecoration: 'line-through', opacity: 0.5 }
    };

    return (
        <div className="bg-gray-50">
            {/* Contract Modal - Step 1 of Checkout */}
            {showContractModal && currentUser && priceDetails && range?.from && range?.to && (
                <ContractSigningModal 
                    listing={listing} 
                    renter={currentUser}
                    startDate={range.from}
                    endDate={range.to}
                    totalPrice={priceDetails.totalPrice}
                    onSign={handleContractSigned}
                    onClose={() => setShowContractModal(false)}
                />
            )}

            {/* Payment Modal - Step 2 of Checkout */}
            {showPaymentModal && priceDetails && (
                <PaymentSelectionModal 
                    totalPrice={priceDetails.totalPrice} 
                    onConfirm={handleConfirmBooking} 
                    onClose={() => setShowPaymentModal(false)} 
                    isProcessing={isBooking}
                />
            )}

            {successfulBooking && (
                <BookingConfirmationModal booking={successfulBooking} onClose={() => setSuccessfulBooking(null)} />
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <ChevronLeftIcon className="h-5 w-5" />
                    Back to results
                </button>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/80">
                    <div className="grid grid-cols-1 lg:grid-cols-5">
                        {/* Image Gallery */}
                        <div className="lg:col-span-3">
                            <div className="relative">
                                <img src={listing.images[activeImageIndex]} alt={`${listing.title} image ${activeImageIndex + 1}`} className="w-full h-[500px] object-cover" />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button className="p-2 bg-white/80 rounded-full text-gray-700 hover:bg-white hover:text-gray-900 transition">
                                        <ShareIcon className="h-5 w-5"/>
                                    </button>
                                     <button 
                                        className="p-2 bg-white/80 rounded-full text-gray-700 hover:bg-white transition"
                                        onClick={() => onToggleFavorite(listing.id)}
                                     >
                                        <HeartIcon className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}/>
                                    </button>
                                </div>
                            </div>
                             {listing.images.length > 1 && (
                                <div className="grid grid-cols-5 gap-2 p-2 bg-gray-100">
                                    {listing.images.map((img, index) => (
                                        <button key={index} onClick={() => setActiveImageIndex(index)} className={`rounded-md overflow-hidden aspect-w-1 aspect-h-1 ${index === activeImageIndex ? 'ring-2 ring-cyan-500' : 'opacity-70 hover:opacity-100'}`}>
                                            <img src={img} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details and Booking */}
                        <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col">
                            <div>
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">{listing.category}{listing.subcategory && ` / ${listing.subcategory}`}</p>
                                    {listing.hasGpsTracker && (
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                            GPS Tracked
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mt-2">{listing.title}</h1>
                                
                                <div className="flex items-center text-sm text-gray-600 mt-4">
                                    <MapPinIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                    <span>{listing.location.city}, {listing.location.state}, {listing.location.country}</span>
                                </div>

                                <div className="flex items-baseline mt-4">
                                     <span className="text-3xl font-bold text-gray-900">
                                        {listing.pricingType === 'hourly' ? `$${listing.pricePerHour}` : `$${listing.pricePerDay}`}
                                    </span>
                                    <span className="text-lg text-gray-500">
                                        {listing.pricingType === 'hourly' ? '/hour' : '/day'}
                                    </span>
                                    <div className="flex items-center ml-auto">
                                        <StarIcon className="h-5 w-5 text-yellow-400 mr-1"/>
                                        <span className="font-bold text-gray-700">{listing.rating}</span>
                                        <span className="text-gray-500 ml-1.5">({listing.reviewsCount} reviews)</span>
                                    </div>
                                </div>
                            </div>

                             <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                     <h2 className="text-lg font-semibold text-gray-800">Owner</h2>
                                      <div 
                                        className="flex items-center text-right cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={onViewOwnerProfile}
                                      >
                                        <img src={listing.owner.avatarUrl} alt={listing.owner.name} className="w-10 h-10 rounded-full mr-2"/>
                                        <div>
                                            <p className="font-semibold text-gray-800 hover:text-cyan-600 transition-colors">{listing.owner.name}</p>
                                        </div>
                                    </div>
                                </div>
                                {!isOwner && (
                                    <button
                                        onClick={() => onStartConversation(listing)}
                                        className="mt-4 w-full py-2 px-4 text-cyan-700 font-semibold rounded-lg bg-white border border-cyan-600 hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquareIcon className="h-5 w-5" />
                                        Chat with {listing.owner.name.split(' ')[0]}
                                    </button>
                                )}
                                 <h2 className="text-lg font-semibold text-gray-800 mt-4">Description</h2>
                                <SimpleMarkdown text={listing.description} />
                                {listing.ownerRules && (
                                    <>
                                        <h2 className="text-lg font-semibold text-gray-800 mt-4">Owner's Rules</h2>
                                        <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.ownerRules}</p>
                                    </>
                                )}
                            </div>
                           
                            {/* Booking Section */}
                            <div className="mt-auto pt-8">
                                {bookingError && <p className="text-sm text-red-600 text-center mb-4">{bookingError}</p>}
                                {listing.pricingType === 'daily' ? (
                                    <>
                                        <div className="bg-gray-50 rounded-lg p-4 border flex justify-center">
                                            <DayPicker
                                                mode="range"
                                                selected={range}
                                                onSelect={setRange}
                                                disabled={disabledDays}
                                                numberOfMonths={1}
                                                pagedNavigation
                                                showOutsideDays
                                                fixedWeeks
                                                modifiersStyles={modifiersStyles}
                                            />
                                        </div>
                                        
                                        {/* Price Summary & Insurance Section */}
                                        {priceDetails && (
                                            <div className="mt-4 space-y-4">
                                                {isHighRisk ? (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm text-sm text-amber-900">
                                                        <div className="flex items-center gap-2 font-bold mb-1">
                                                            <ShieldIcon className="h-4 w-4 text-amber-700" />
                                                            Direct Insurance
                                                        </div>
                                                        <p>For this high-value item, insurance and damage policies are handled directly with the owner. Please review the contract before signing.</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                            <ShieldCheckIcon className="h-5 w-5 text-cyan-600" />
                                                            Protection Plan
                                                        </h3>
                                                        <div className="space-y-3">
                                                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${insurancePlan === 'none' ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-50'}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name="insurance" 
                                                                    value="none" 
                                                                    checked={insurancePlan === 'none'}
                                                                    onChange={() => setInsurancePlan('none')}
                                                                    className="mt-1 text-gray-500 focus:ring-gray-400"
                                                                />
                                                                <div>
                                                                    <span className="font-bold text-gray-900 block">No Insurance (Free)</span>
                                                                    <span className="text-xs text-gray-500">You are fully responsible for all damages.</span>
                                                                </div>
                                                            </label>
                                                            
                                                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${insurancePlan === 'standard' ? 'bg-cyan-50 border-cyan-200' : 'hover:bg-gray-50'}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name="insurance" 
                                                                    value="standard" 
                                                                    checked={insurancePlan === 'standard'}
                                                                    onChange={() => setInsurancePlan('standard')}
                                                                    className="mt-1 text-cyan-600 focus:ring-cyan-500"
                                                                />
                                                                <div>
                                                                    <span className="font-bold text-gray-900 block">Standard (+10%)</span>
                                                                    <span className="text-xs text-gray-500">Basic coverage. $500 deductible.</span>
                                                                </div>
                                                            </label>
                                                            
                                                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${insurancePlan === 'premium' ? 'bg-cyan-50 border-cyan-200' : 'hover:bg-gray-50'}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name="insurance" 
                                                                    value="premium" 
                                                                    checked={insurancePlan === 'premium'}
                                                                    onChange={() => setInsurancePlan('premium')}
                                                                    className="mt-1 text-cyan-600 focus:ring-cyan-500"
                                                                />
                                                                <div>
                                                                    <span className="font-bold text-gray-900 block">Premium (+20%)</span>
                                                                    <span className="text-xs text-gray-500">Full coverage, theft protection, $0 deductible.</span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                                                    <div className="flex justify-between items-center text-gray-700">
                                                        <span>Rental (${(listing.pricePerDay || 0)} x {priceDetails.days} days)</span>
                                                        <span className="font-medium">${priceDetails.rentalTotal.toFixed(2)}</span>
                                                    </div>
                                                    {priceDetails.protectionFee > 0 && (
                                                        <div className="flex justify-between items-center text-gray-700 text-sm">
                                                            <span className="flex items-center gap-1">
                                                                <UmbrellaIcon className="h-3 w-3" /> 
                                                                Protection Fee
                                                            </span>
                                                            <span className="font-medium">${priceDetails.protectionFee.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center font-bold text-lg pt-2 border-t text-gray-900">
                                                        <span>Total</span>
                                                        <span>${priceDetails.totalPrice.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleBookClick}
                                            disabled={!currentUser || isOwner || !priceDetails || isBooking}
                                            className="mt-4 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isOwner ? "This is your listing" : (currentUser ? (priceDetails ? "Book Now" : "Select dates to book") : "Log in to book")}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-gray-50 rounded-lg p-6 border text-center">
                                            <h3 className="font-semibold text-gray-800">Hourly Rental</h3>
                                            <p className="text-sm text-gray-600 mt-2">This item is rented by the hour. Please contact the owner directly to arrange booking times and details.</p>
                                        </div>
                                        <button
                                            onClick={() => onStartConversation(listing)}
                                            disabled={!currentUser || isOwner}
                                            className="mt-4 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isOwner ? "This is your listing" : (currentUser ? "Contact Owner to Book" : "Log in to contact owner")}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200/80">
                    <h2 className="text-2xl font-bold text-gray-800">Location</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        The exact location will be provided after booking. The map shows the general area for privacy.
                    </p>
                    <div className="mt-4 rounded-lg overflow-hidden">
                        <ListingMap center={{ lat: listing.location.latitude, lng: listing.location.longitude }} />
                    </div>
                </div>

                 {listing.videoUrl && (
                    <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200/80">
                        <h2 className="text-2xl font-bold text-gray-800">Video</h2>
                        <div className="aspect-w-16 aspect-h-9 mt-4 rounded-lg overflow-hidden">
                            <iframe 
                                src={listing.videoUrl.replace("watch?v=", "embed/")} 
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListingDetailPage;
