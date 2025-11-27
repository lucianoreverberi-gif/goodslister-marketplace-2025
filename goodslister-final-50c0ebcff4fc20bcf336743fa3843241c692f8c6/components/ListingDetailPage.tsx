
import React, { useState, useEffect } from 'react';
import { Listing, User, Booking, ListingCategory } from '../types';
import { MapPinIcon, StarIcon, ChevronLeftIcon, ShareIcon, HeartIcon, MessageSquareIcon, CheckCircleIcon, XIcon, ShieldCheckIcon, UmbrellaIcon, WalletIcon, CreditCardIcon, AlertTriangleIcon, FileTextIcon, UploadCloudIcon, FileSignatureIcon, PenToolIcon, ShieldIcon, CalendarIcon, ClockIcon, LockIcon } from './icons';
import ListingMap from './ListingMap';
import { DayPicker, DateRange } from 'react-day-picker';
import { differenceInCalendarDays, format, addHours, setHours, setMinutes, startOfDay } from 'date-fns';
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
        amountPaidOnline: number,
        balanceDueOnSite: number,
        protectionType: 'waiver' | 'insurance',
        protectionFee: number
    ) => Promise<Booking>;
}

const BookingConfirmationModal: React.FC<{ booking: Booking, onClose: () => void }> = ({ booking, onClose }) => {
    
    // Generate Google Calendar Link
    const createGoogleCalendarUrl = () => {
        const title = encodeURIComponent(`Rental: ${booking.listing.title}`);
        const details = encodeURIComponent(`Rental via Goodslister.\nItem: ${booking.listing.title}\nOwner: ${booking.listing.owner.name}\nPrice: $${booking.totalPrice}`);
        const location = encodeURIComponent(`${booking.listing.location.city}, ${booking.listing.location.country}`);
        
        // Format dates for Google (YYYYMMDDTHHmmSSZ) - keeping it simple with ISO slice
        const start = new Date(booking.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = new Date(booking.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
        
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative text-center p-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XIcon className="h-6 w-6" />
                </button>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
                <p className="text-gray-600 mt-2">Your reservation for the <span className="font-semibold">{booking.listing.title}</span> is complete.</p>
                
                <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm"><strong>Start:</strong> {format(new Date(booking.startDate), 'MMM dd, h:mm a')}</p>
                    <p className="text-sm"><strong>End:</strong> {format(new Date(booking.endDate), 'MMM dd, h:mm a')}</p>
                    
                    <div className="border-t border-gray-200 my-3"></div>
                    
                    {/* SPLIT PAYMENT SUMMARY */}
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                        <span>Paid Online:</span>
                        <span className="font-semibold text-gray-900">${booking.amountPaidOnline?.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-lg mt-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <span className="font-bold text-yellow-800">Balance Due:</span>
                        <span className="font-bold text-yellow-800">${booking.balanceDueOnSite?.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1 text-center">
                        Please pay this amount to the host upon pickup via Cash, Zelle, or Venmo.
                    </p>
                </div>
                
                <a 
                    href={createGoogleCalendarUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    Add to Google Calendar
                </a>

                <button onClick={onClose} className="mt-3 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                    Continue Browsing
                </button>
            </div>
        </div>
    );
};

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
    
    // Safely generate contract HTML, handle potential errors in contract generation gracefully
    let contractHtml = "";
    try {
        contractHtml = LegalService.generateContractHtml(listing, renter, startDate, endDate, totalPrice);
    } catch (e) {
        console.error("Contract generation failed:", e);
        contractHtml = "<p>Error generating contract. Please contact support.</p>";
    }

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

interface BookingBreakdownModalProps {
    listingTitle: string;
    days: number;
    priceDetails: any;
    onConfirm: () => void;
    onClose: () => void;
    isProcessing: boolean;
}

const BookingBreakdownModal: React.FC<BookingBreakdownModalProps> = ({ listingTitle, days, priceDetails, onConfirm, onClose, isProcessing }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative p-6 flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm & Pay</h2>
                <p className="text-gray-600 mb-6 text-sm">Secure your booking for <strong>{listingTitle}</strong>.</p>

                <div className="space-y-6 overflow-y-auto flex-1">
                    
                    {/* Pay Now Section */}
                    <div className="border border-cyan-200 bg-cyan-50 rounded-xl p-4">
                        <h3 className="font-bold text-cyan-800 flex items-center gap-2 mb-3">
                            <CreditCardIcon className="h-5 w-5" /> Pay Now to Reserve
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Goodslister Service Fee (15%)</span>
                                <span className="font-medium">${priceDetails.serviceFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Protection Plan</span>
                                <span className="font-medium">${priceDetails.protectionFee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-cyan-200 pt-2 flex justify-between font-bold text-lg text-cyan-900">
                                <span>Due Now (Stripe)</span>
                                <span>${priceDetails.onlineTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-cyan-700 bg-white/50 p-2 rounded">
                            <LockIcon className="h-3 w-3" />
                            <span>Security Deposit of ${priceDetails.depositAmount} will be placed on hold.</span>
                        </div>
                    </div>

                    {/* Pay Later Section */}
                    <div className="border border-gray-200 bg-gray-50 rounded-xl p-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
                            <WalletIcon className="h-5 w-5" /> Pay to Host at Pickup
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Rental Rate ({days} {days === 1 ? 'day' : 'days'})</span>
                                <span className="font-medium">${priceDetails.rentalTotal.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-gray-800">
                                <span>Balance Due</span>
                                <span>${priceDetails.rentalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 italic">
                            Pay directly via Zelle, Cash, or Venmo when you meet the host.
                        </div>
                    </div>

                </div>

                <div className="pt-6 mt-4 border-t">
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 text-white font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isProcessing ? 'Processing Payment...' : `Pay Reserve & Book ($${priceDetails.onlineTotal.toFixed(2)})`}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        By clicking, you agree to our Terms & Cancellation Policy.
                    </p>
                </div>
            </div>
        </div>
    );
};


const ListingDetailPage: React.FC<ListingDetailPageProps> = ({ listing, onBack, onStartConversation, currentUser, onCreateBooking }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    // State for Daily Rental
    const [range, setRange] = useState<DateRange | undefined>();
    // State for Hourly Rental
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);

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

    // Hourly Time Slots Generation (e.g., 8 AM to 8 PM)
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 8; i <= 20; i++) {
            slots.push(i);
        }
        return slots;
    };
    const timeSlots = generateTimeSlots();

    const toggleTimeSlot = (hour: number) => {
        if (selectedTimeSlots.includes(hour)) {
            setSelectedTimeSlots(selectedTimeSlots.filter(h => h !== hour));
        } else {
            setSelectedTimeSlots([...selectedTimeSlots, hour]);
        }
    };

    // Identify high-risk categories where insurance is handled directly (not via platform add-on)
    const isHighRisk = 
        listing.category === ListingCategory.MOTORCYCLES ||
        listing.category === ListingCategory.BOATS ||
        listing.category === ListingCategory.RVS ||
        listing.category === ListingCategory.UTVS ||
        (listing.category === ListingCategory.WATER_SPORTS && listing.subcategory?.toLowerCase().includes('jet ski'));

    // Calculate Totals - REFRACTORED FOR SPLIT PAYMENT
    const getPriceDetails = () => {
        let rentalTotal = 0;
        let days = 0;

        if (listing.pricingType === 'daily') {
            if (!range?.from || !range?.to) return null;
            days = differenceInCalendarDays(range.to, range.from) + 1;
            const basePrice = listing.pricePerDay || 0;
            rentalTotal = basePrice * days;
        } else {
            // Hourly Logic
            if (!selectedDate || selectedTimeSlots.length === 0) return null;
            days = 1; // Considered 1 "booking event"
            const basePrice = listing.pricePerHour || 0;
            rentalTotal = basePrice * selectedTimeSlots.length;
        }
        
        // --- 1. Platform Fee (Due Now) ---
        // 15% Service Fee charged on the base rental amount
        const serviceFee = rentalTotal * 0.15;

        // --- 2. Protection Fee (Due Now) ---
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
        
        const onlineTotal = serviceFee + protectionFee;
        const totalProjectedCost = rentalTotal + onlineTotal;

        return {
            days, // or hours count contextually
            rentalTotal, // Due Later (Offline)
            serviceFee,  // Due Now
            protectionFee, // Due Now
            onlineTotal, // Total Due Now
            depositAmount: listing.securityDeposit || 0,
            totalPrice: totalProjectedCost
        };
    };

    const priceDetails = getPriceDetails();

    const handleBookClick = () => {
        const isValidDaily = listing.pricingType === 'daily' && range?.from && range?.to;
        const isValidHourly = listing.pricingType === 'hourly' && selectedDate && selectedTimeSlots.length > 0;

        if (!currentUser || isOwner) return;
        if (!isValidDaily && !isValidHourly) return;

        // Trigger Contract Signing first
        setShowContractModal(true);
    };

    const handleContractSigned = () => {
        setShowContractModal(false);
        // Trigger Split Payment Modal
        setShowPaymentModal(true);
    };

    const handleConfirmBooking = async () => {
        if (!priceDetails) return;
        
        // Determine start/end dates based on pricing type
        let finalStartDate: Date;
        let finalEndDate: Date;

        if (listing.pricingType === 'daily' && range?.from && range?.to) {
            finalStartDate = range.from;
            finalEndDate = range.to;
        } else if (listing.pricingType === 'hourly' && selectedDate && selectedTimeSlots.length > 0) {
            // Sort slots to find range
            const sortedSlots = [...selectedTimeSlots].sort((a, b) => a - b);
            const startHour = sortedSlots[0];
            const endHour = sortedSlots[sortedSlots.length - 1];
            
            // Construct Dates
            finalStartDate = setMinutes(setHours(startOfDay(selectedDate), startHour), 0);
            finalEndDate = setMinutes(setHours(startOfDay(selectedDate), endHour + 1), 0); // +1 to represent end of the hour
        } else {
            return;
        }

        setIsBooking(true);
        setBookingError(null);

        // Simulate Stripe Processing Delay
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        try {
            const newBooking = await onCreateBooking(
                listing.id, 
                finalStartDate, 
                finalEndDate, 
                priceDetails.totalPrice, // Total value of booking
                priceDetails.onlineTotal, // Amount charged to card
                priceDetails.rentalTotal, // Balance due on site
                (!isHighRisk && (insurancePlan === 'premium' || insurancePlan === 'standard')) ? 'insurance' : 'waiver',
                priceDetails.protectionFee
            );
            setSuccessfulBooking(newBooking);
            setRange(undefined); 
            setSelectedDate(undefined);
            setSelectedTimeSlots([]);
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

    // Need to construct startDate/endDate for contract modal too if hourly
    const getContractDates = () => {
        if (listing.pricingType === 'daily' && range?.from && range?.to) {
            return { start: range.from, end: range.to };
        }
        if (listing.pricingType === 'hourly' && selectedDate && selectedTimeSlots.length > 0) {
             const sortedSlots = [...selectedTimeSlots].sort((a, b) => a - b);
             const start = setHours(selectedDate, sortedSlots[0]);
             const end = setHours(selectedDate, sortedSlots[sortedSlots.length - 1] + 1);
             return { start, end };
        }
        return { start: new Date(), end: new Date() }; // Fallback
    };
    const contractDates = getContractDates();

    return (
        <div className="bg-gray-50">
            {/* Contract Modal - Step 1 of Checkout */}
            {showContractModal && currentUser && priceDetails && (
                <ContractSigningModal 
                    listing={listing} 
                    renter={currentUser}
                    startDate={contractDates.start}
                    endDate={contractDates.end}
                    totalPrice={priceDetails.totalPrice}
                    onSign={handleContractSigned}
                    onClose={() => setShowContractModal(false)}
                />
            )}

            {/* Payment Modal - Step 2 of Checkout (Refactored for Split) */}
            {showPaymentModal && priceDetails && (
                <BookingBreakdownModal 
                    listingTitle={listing.title}
                    days={priceDetails.days}
                    priceDetails={priceDetails}
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
                                     <button className="p-2 bg-white/80 rounded-full text-gray-700 hover:bg-white hover:text-red-500 transition">
                                        <HeartIcon className="h-5 w-5"/>
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
                                      <div className="flex items-center text-right">
                                        <img src={listing.owner.avatarUrl} alt={listing.owner.name} className="w-10 h-10 rounded-full mr-2"/>
                                        <div>
                                            <p className="font-semibold text-gray-800">{listing.owner.name}</p>
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
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-lg p-4 border flex justify-center">
                                            <DayPicker
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                disabled={disabledDays}
                                                numberOfMonths={1}
                                                pagedNavigation
                                                showOutsideDays
                                                fixedWeeks
                                                modifiersStyles={modifiersStyles}
                                            />
                                        </div>
                                        {selectedDate && (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                                    <ClockIcon className="h-4 w-4 text-cyan-600" />
                                                    Select Hours for {format(selectedDate, 'MMM dd')}
                                                </h3>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {timeSlots.map(hour => (
                                                        <button
                                                            key={hour}
                                                            onClick={() => toggleTimeSlot(hour)}
                                                            className={`py-2 px-2 rounded text-xs font-medium transition-colors border ${
                                                                selectedTimeSlots.includes(hour)
                                                                    ? 'bg-cyan-600 text-white border-cyan-600'
                                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-cyan-400'
                                                            }`}
                                                        >
                                                            {hour}:00 - {hour + 1}:00
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                        
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
                                            {/* Offline Portion */}
                                            <div className="flex justify-between items-center text-gray-700">
                                                {listing.pricingType === 'daily' ? (
                                                    <span>Rental (${(listing.pricePerDay || 0)} x {priceDetails.days} days)</span>
                                                ) : (
                                                    <span>Rental (${(listing.pricePerHour || 0)} x {selectedTimeSlots.length} hours)</span>
                                                )}
                                                <span className="font-medium">${priceDetails.rentalTotal.toFixed(2)}</span>
                                            </div>
                                            
                                            {/* Online Portion */}
                                            {priceDetails.serviceFee > 0 && (
                                                <div className="flex justify-between items-center text-gray-700 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <CreditCardIcon className="h-3 w-3 text-cyan-600" /> 
                                                        Service Fee
                                                    </span>
                                                    <span className="font-medium text-cyan-700">${priceDetails.serviceFee.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {priceDetails.protectionFee > 0 && (
                                                <div className="flex justify-between items-center text-gray-700 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <UmbrellaIcon className="h-3 w-3 text-cyan-600" /> 
                                                        Protection Fee
                                                    </span>
                                                    <span className="font-medium text-cyan-700">${priceDetails.protectionFee.toFixed(2)}</span>
                                                </div>
                                            )}
                                            
                                            {/* Split Totals */}
                                            <div className="border-t pt-2 mt-2">
                                                <div className="flex justify-between items-center font-bold text-cyan-800">
                                                    <span>Due Now (Online)</span>
                                                    <span>${priceDetails.onlineTotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-500 text-sm mt-1">
                                                    <span>Due Later (Direct to Host)</span>
                                                    <span>${priceDetails.rentalTotal.toFixed(2)}</span>
                                                </div>
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
