
import React, { useState, useEffect } from 'react';
import { Listing, User, Booking, ListingCategory } from '../types';
import { MapPinIcon, StarIcon, ChevronLeftIcon, ShareIcon, HeartIcon, MessageSquareIcon, CheckCircleIcon, XIcon, ShieldCheckIcon, UmbrellaIcon, WalletIcon, CreditCardIcon, AlertTriangleIcon, FileTextIcon, UploadCloudIcon, FileSignatureIcon, PenToolIcon, ShieldIcon, ClockIcon, ZapIcon } from './icons';
import ListingMap from './ListingMap';
import { DayPicker, DateRange } from 'react-day-picker';
import { differenceInCalendarDays, format, addHours, setHours, setMinutes } from 'date-fns';
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
    onViewOwnerProfile?: () => void;
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
                <p><strong>Dates:</strong> {format(new Date(booking.startDate), 'LLL dd, h:mm a')} - {format(new Date(booking.endDate), 'h:mm a')}</p>
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
                {booking.paymentMethod === 'direct' && (
                     <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800 font-medium">
                         Reminder: You have only paid the service fee (and deposit if applicable). The rental balance is due directly to the owner upon pickup.
                     </div>
                )}
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

interface PriceData {
    unitCount: number;
    rentalTotal: number;
    protectionFee: number;
    serviceFee: number;
    stripeAdminFee: number;
    depositAmount: number; // The deposit that needs to be collected NOW
    totalPayFull: number;
    totalSplitUpfront: number;
    balanceDirect: number;
}

interface PaymentSelectionModalProps {
    priceData: PriceData;
    isHighRisk: boolean;
    isInstant: boolean;
    onConfirm: (method: 'platform' | 'direct') => void;
    onClose: () => void;
    isProcessing: boolean;
}

const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({ priceData, isHighRisk, isInstant, onConfirm, onClose, isProcessing }) => {
    // Logic: If high risk OR total > 1000, enforce split payment.
    const isOverLimit = priceData.totalPayFull > 1000;
    const forceSplit = isHighRisk || isOverLimit;
    
    // Default to 'direct' (split) if forced, otherwise null to force choice
    const [selectedMethod, setSelectedMethod] = useState<'platform' | 'direct' | null>(forceSplit ? 'direct' : null);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative p-6 flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Booking</h2>
                <p className="text-gray-600 mb-6">Choose how you want to pay.</p>

                <div className="space-y-4 overflow-y-auto flex-1">
                    {/* OPTION 1: PAY FULL (Platform) */}
                    <div 
                        className={`border-2 rounded-xl p-4 transition-all ${
                            forceSplit
                                ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' 
                                : `cursor-pointer ${selectedMethod === 'platform' ? 'border-cyan-600 bg-cyan-50 ring-1 ring-cyan-200' : 'border-gray-200 hover:border-gray-300'}`
                        }`}
                        onClick={() => !forceSplit && setSelectedMethod('platform')}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${forceSplit ? 'bg-gray-200 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                                    <CreditCardIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Pay Full Amount</h3>
                                    <p className="text-sm text-gray-500">Includes Stripe Fee</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-gray-900">${priceData.totalPayFull.toFixed(2)}</span>
                                {!forceSplit && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">All inclusive</span>}
                            </div>
                        </div>
                        {forceSplit && (
                            <div className="mt-2 text-xs text-red-500 font-medium">
                                * Not available for bookings over $1,000 or high-risk items.
                            </div>
                        )}
                        {!forceSplit && selectedMethod === 'platform' && (
                             <div className="mt-3 pl-11 text-xs text-gray-600">
                                Includes: Rental (${priceData.rentalTotal}), Service Fee, Protection, Deposit${isInstant ? '' : ' (Authorized)'} and a ${priceData.stripeAdminFee.toFixed(2)} admin fee.
                            </div>
                        )}
                    </div>

                    {/* OPTION 2: SPLIT PAYMENT (Direct) */}
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
                                    <h3 className="font-bold text-gray-900">Split Payment</h3>
                                    <p className="text-sm text-gray-500">Secure listing now, pay owner later.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-cyan-700">Pay Now: ${priceData.totalSplitUpfront.toFixed(2)}</span>
                                <span className="text-xs text-amber-700">Due Later: ${priceData.balanceDirect.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        {selectedMethod === 'direct' && (
                            <div className="mt-3 pl-11">
                                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                    <li><strong>Pay Now:</strong> Service Fee{priceData.protectionFee > 0 && ', Protection Plan'}{isInstant && priceData.depositAmount > 0 && ', Security Deposit'}.</li>
                                    <li><strong>Pay Later:</strong> ${priceData.balanceDirect.toFixed(2)} directly to owner (Zelle/Cash) at pickup.</li>
                                </ul>
                                {isInstant && priceData.depositAmount > 0 && (
                                     <div className="mt-2 p-2 bg-amber-100 rounded text-amber-800 text-xs font-bold flex items-center gap-2">
                                        <ShieldIcon className="h-4 w-4" />
                                        Instant Booking: ${priceData.depositAmount} Deposit included upfront.
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6 mt-4 border-t">
                    <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-900">
                        <span>Due Today</span>
                        <span>${selectedMethod === 'direct' ? priceData.totalSplitUpfront.toFixed(2) : (selectedMethod ? priceData.totalPayFull.toFixed(2) : '0.00')}</span>
                    </div>
                    <button
                        onClick={() => selectedMethod && onConfirm(selectedMethod)}
                        disabled={!selectedMethod || isProcessing}
                        className="w-full py-3 px-4 text-white font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Confirm & Pay'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ListingDetailPage: React.FC<ListingDetailPageProps> = ({ listing, onBack, onStartConversation, currentUser, onCreateBooking, isFavorite, onToggleFavorite, onViewOwnerProfile }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    // Daily State
    const [range, setRange] = useState<DateRange | undefined>();
    
    // Hourly State (NEW)
    const [hourlyDate, setHourlyDate] = useState<Date | undefined>(undefined);
    const [startTime, setStartTime] = useState<string>('09:00');
    const [durationHours, setDurationHours] = useState<number>(1);
    
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
    const isHourly = listing.pricingType === 'hourly';
    
    // Check if listing allows instant booking
    const isInstant = !!listing.instantBookingEnabled;

    // Identify high-risk categories where insurance is handled directly (not via platform add-on)
    const isHighRisk = 
        listing.category === ListingCategory.MOTORCYCLES ||
        listing.category === ListingCategory.BOATS ||
        listing.category === ListingCategory.RVS ||
        listing.category === ListingCategory.ATVS_UTVS ||
        (listing.category === ListingCategory.WATER_SPORTS && listing.subcategory?.toLowerCase().includes('jet ski'));

    // Helper: Generate Time Options (08:00 to 18:00)
    const timeOptions = Array.from({ length: 11 }, (_, i) => {
        const hour = i + 8;
        return `${hour < 10 ? '0' : ''}${hour}:00`;
    });

    // Helper: Generate Duration Options
    const durationOptions = [1, 2, 3, 4, 5, 6, 8, 24];

    // STRIPE FEE CONSTANT
    const STRIPE_FEE_PERCENTAGE = 0.03;

    // Calculate Totals (Updated logic for hybrid strategy)
    const getPriceDetails = (): PriceData | null => {
        let rentalTotal = 0;
        let unitCount = 0; // days or hours

        if (isHourly) {
            if (!hourlyDate) return null;
            unitCount = durationHours;
            const basePrice = listing.pricePerHour || 0;
            rentalTotal = basePrice * unitCount;
        } else {
            // Daily
            if (!range?.from || !range?.to) return null;
            unitCount = differenceInCalendarDays(range.to, range.from) + 1;
            const basePrice = listing.pricePerDay || 0;
            rentalTotal = basePrice * unitCount;
        }
        
        // 1. Insurance Logic (Only for Soft Goods)
        let protectionFee = 0;
        if (!isHighRisk) {
            if (insurancePlan === 'standard') {
                protectionFee = rentalTotal * 0.10; // 10% for standard
            } else if (insurancePlan === 'premium') {
                protectionFee = rentalTotal * 0.20; // 20% for premium
            }
        }
        
        // 2. Service Fee (10% of rental) - Platform Commission
        const serviceFee = rentalTotal * 0.10;
        
        // 3. Deposit Logic (Only charged upfront if Instant Booking)
        // If it's "Request to Book", deposit is authorized later, not charged now.
        const depositAmount = isInstant ? (listing.securityDeposit || 0) : 0;

        // 4. Split Payment Calculation (The "Direct" Option)
        // Upfront = Commission + Insurance + Deposit (if instant)
        const totalSplitUpfront = serviceFee + protectionFee + depositAmount;
        // Balance = Rental Price (Paid to owner directly)
        const balanceDirect = rentalTotal;

        // 5. Pay Full Calculation (The "Platform" Option)
        // Base Total before Stripe Fee
        const rawFullTotal = rentalTotal + protectionFee + serviceFee + depositAmount;
        // Add Admin Cost for Stripe Payouts (~3%)
        const stripeAdminFee = rawFullTotal * STRIPE_FEE_PERCENTAGE;
        const totalPayFull = rawFullTotal + stripeAdminFee;

        return {
            unitCount,
            rentalTotal,
            protectionFee,
            serviceFee,
            stripeAdminFee,
            depositAmount,
            totalPayFull,
            totalSplitUpfront,
            balanceDirect
        };
    };

    const priceDetails = getPriceDetails();

    const handleBookClick = () => {
        if (!currentUser || isOwner || !priceDetails) return;
        // Validate dates
        if (isHourly && !hourlyDate) return;
        if (!isHourly && (!range?.from || !range?.to)) return;

        // Trigger Contract Signing first
        setShowContractModal(true);
    };

    const handleContractSigned = () => {
        setShowContractModal(false);
        // Trigger Payment
        setShowPaymentModal(true);
    };

    const handleConfirmBooking = async (paymentMethod: 'platform' | 'direct') => {
        if (!priceDetails) return;
        
        // Calculate Exact Dates based on Pricing Model
        let finalStartDate: Date;
        let finalEndDate: Date;

        if (isHourly && hourlyDate) {
            const [hours, mins] = startTime.split(':').map(Number);
            finalStartDate = setMinutes(setHours(new Date(hourlyDate), hours), mins);
            finalEndDate = addHours(finalStartDate, durationHours);
        } else if (range?.from && range?.to) {
            finalStartDate = range.from;
            finalEndDate = range.to;
            // Set end date to end of day for cleaner logic if needed
        } else {
            return;
        }
        
        setIsBooking(true);
        setBookingError(null);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        try {
            // Determine total price recorded in DB
            const finalTotalPrice = paymentMethod === 'platform' ? priceDetails.totalPayFull : (priceDetails.totalSplitUpfront + priceDetails.balanceDirect);
            
            const newBooking = await onCreateBooking(
                listing.id, 
                finalStartDate, 
                finalEndDate, 
                finalTotalPrice, 
                paymentMethod,
                (!isHighRisk && (insurancePlan === 'premium' || insurancePlan === 'standard')) ? 'insurance' : 'waiver',
                priceDetails.protectionFee
            );
            setSuccessfulBooking(newBooking);
            setRange(undefined); 
            setHourlyDate(undefined);
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

    // Calculate Modal Dates for passing props safely
    const contractStartDate = isHourly && hourlyDate ? setHours(new Date(hourlyDate), parseInt(startTime.split(':')[0])) : range?.from || new Date();
    const contractEndDate = isHourly && hourlyDate ? addHours(contractStartDate, durationHours) : range?.to || new Date();

    return (
        <div className="bg-gray-50">
            {/* Contract Modal - Step 1 of Checkout */}
            {showContractModal && currentUser && priceDetails && (
                <ContractSigningModal 
                    listing={listing} 
                    renter={currentUser}
                    startDate={contractStartDate}
                    endDate={contractEndDate}
                    totalPrice={priceDetails.totalPayFull} // Estimate
                    onSign={handleContractSigned}
                    onClose={() => setShowContractModal(false)}
                />
            )}

            {/* Payment Modal - Step 2 of Checkout */}
            {showPaymentModal && priceDetails && (
                <PaymentSelectionModal 
                    priceData={priceDetails}
                    isHighRisk={isHighRisk}
                    isInstant={isInstant}
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
                                {isInstant && (
                                    <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-10">
                                        <ZapIcon className="h-3 w-3" />
                                        Instant Book
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button className="p-2 bg-white/80 rounded-full text-gray-700 hover:bg-white hover:text-gray-900 transition">
                                        <ShareIcon className="h-5 w-5"/>
                                    </button>
                                     <button 
                                        className="p-2 bg-white/80 rounded-full text-gray-700 hover:bg-white transition"
                                        onClick={() => onToggleFavorite(listing.id)}
                                     >
                                        <HeartIcon className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
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
                                
                                <div className="bg-gray-50 rounded-lg p-4 border">
                                    {isHourly ? (
                                        // HOURLY SELECTOR
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <ClockIcon className="h-5 w-5 text-cyan-600" /> 
                                                Select Date & Time
                                            </h3>
                                            <div className="flex justify-center">
                                                <DayPicker
                                                    mode="single"
                                                    selected={hourlyDate}
                                                    onSelect={setHourlyDate}
                                                    disabled={disabledDays}
                                                    numberOfMonths={1}
                                                    modifiersStyles={modifiersStyles}
                                                />
                                            </div>
                                            {hourlyDate && (
                                                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                                        <select 
                                                            value={startTime} 
                                                            onChange={(e) => setStartTime(e.target.value)}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                                        >
                                                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration</label>
                                                        <select 
                                                            value={durationHours} 
                                                            onChange={(e) => setDurationHours(Number(e.target.value))}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                                        >
                                                            {durationOptions.map(d => <option key={d} value={d}>{d} Hour{d > 1 ? 's' : ''}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // DAILY SELECTOR (Existing)
                                        <div className="flex justify-center">
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
                                    )}
                                </div>
                                
                                {/* Price Summary & Insurance Section */}
                                {priceDetails && (
                                    <div className="mt-4 space-y-4">
                                        {isHighRisk ? (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm text-sm text-amber-900">
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <ShieldIcon className="h-4 w-4 text-amber-700" />
                                                    Direct Insurance Required
                                                </div>
                                                <p>For this high-risk item, platform insurance is unavailable. You are responsible for insurance/damages directly with the owner.</p>
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
                                                <span>
                                                    Rental (${isHourly ? listing.pricePerHour : listing.pricePerDay} x {priceDetails.unitCount} {isHourly ? 'hrs' : 'days'})
                                                </span>
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
                                            {/* Show Service Fee explicitly */}
                                            <div className="flex justify-between items-center text-gray-700 text-sm">
                                                <span>Service Fee (10%)</span>
                                                <span className="font-medium">${priceDetails.serviceFee.toFixed(2)}</span>
                                            </div>
                                            
                                            {/* Show Deposit IF Instant Booking */}
                                            {isInstant && priceDetails.depositAmount > 0 && (
                                                <div className="flex justify-between items-center text-gray-700 text-sm border-t pt-2 mt-2 border-gray-200 border-dashed">
                                                    <span>Security Deposit (Refundable)</span>
                                                    <span className="font-medium">${priceDetails.depositAmount.toFixed(2)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center font-bold text-lg pt-2 border-t text-gray-900">
                                                <span>Total Cost</span>
                                                <span>${(priceDetails.rentalTotal + priceDetails.serviceFee + priceDetails.protectionFee).toFixed(2)}</span>
                                            </div>
                                            
                                            <div className="text-xs text-right text-gray-500 mt-1">
                                                Due Now: <span className="font-bold text-cyan-700">${priceDetails.totalSplitUpfront.toFixed(2)}</span> 
                                                {priceDetails.balanceDirect > 0 && ` + $${priceDetails.balanceDirect.toFixed(0)} later`}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleBookClick}
                                    disabled={!currentUser || isOwner || !priceDetails || isBooking}
                                    className="mt-4 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isOwner ? "This is your listing" : (currentUser ? (priceDetails ? (isInstant ? "Instant Book" : "Request to Book") : "Select date/time to book") : "Log in to book")}
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
