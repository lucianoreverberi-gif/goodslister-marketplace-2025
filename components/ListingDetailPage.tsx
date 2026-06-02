
import React, { useState, useEffect } from 'react';
import { Listing, User, Booking, ListingCategory } from '../types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { LegalService } from '../services/legalService';
// FIX: Added RefreshCwIcon and RocketIcon to the import list to resolve "Cannot find name" errors.
import { MapPinIcon, StarIcon, ChevronLeftIcon, ShareIcon, HeartIcon, MessageSquareIcon, CheckCircleIcon, XIcon, ShieldCheckIcon, UmbrellaIcon, WalletIcon, CreditCardIcon, AlertTriangleIcon, FileTextIcon, UploadCloudIcon, FileSignatureIcon, PenToolIcon, ShieldIcon, ClockIcon, ZapIcon, LockIcon, RefreshCwIcon, RocketIcon } from './icons';
import ListingMap from './ListingMap';
import { DayPicker, DateRange } from 'react-day-picker';
import { differenceInCalendarDays, format, addHours, setHours, setMinutes } from 'date-fns';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

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
        protectionFee: number,
        securityDeposit: number
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
            <h2 className="text-2xl font-bold text-gray-900">Request Sent!</h2>
            <p className="text-gray-600 mt-2">
                We've processed your fees. The owner <strong>{booking.listing.owner.name}</strong> has been notified to approve your trip.
            </p>
            <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Paid Now (Fees)</span>
                    <span className="font-bold text-green-600">${(booking.totalPrice - booking.balanceDueOnSite).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Due at Pickup (Rental)</span>
                    <span className="font-black text-gray-900">${booking.balanceDueOnSite.toFixed(2)}</span>
                </div>
            </div>
            <button onClick={onClose} className="mt-6 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                Back to Explore
            </button>
        </div>
    </div>
);

interface PaymentSelectionModalProps {
    totalPrice: number;
    rentalCost: number;
    serviceFee: number;
    protectionFee: number;
    securityDeposit: number;
    onConfirm: (method: 'platform' | 'direct') => void;
    onClose: () => void;
    isProcessing: boolean;
}

const StripeCheckoutForm: React.FC<PaymentSelectionModalProps> = ({ totalPrice, rentalCost, serviceFee, protectionFee, securityDeposit, onConfirm, onClose, isProcessing }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    
    const totalFees = serviceFee + protectionFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!stripe || !elements) return;
        
        setProcessingPayment(true);
        setError(null);
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        try {
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                setError(error.message || 'Payment method failed.');
                setProcessingPayment(false);
                return;
            }

            // Mock backend call to our own api endpoint
            const res = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalFees, paymentMethodId: paymentMethod.id })
            });

            if (!res.ok) {
                throw new Error('Payment processing failed on server');
            }

            onConfirm('platform');
        } catch (err: any) {
            setError(err.message || 'An error occurred during payment processing.');
            setProcessingPayment(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative overflow-hidden flex flex-col animate-in zoom-in duration-300">
                <div className="p-8 bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">Secure your trip with Goodslister</p>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><XIcon className="h-6 w-6 text-slate-400" /></button>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-100">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-cyan-700 font-bold">Platform Service Fee</span>
                                <span className="text-cyan-900 font-black">${serviceFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-cyan-700 font-bold">Protection & Legal Shield</span>
                                <span className="text-cyan-900 font-black">${protectionFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-cyan-200">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-cyan-700 font-bold">Security Deposit</span>
                                    <span className="bg-cyan-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">HELD</span>
                                </div>
                                <span className="text-cyan-900 font-black">${securityDeposit.toFixed(2)}</span>
                            </div>
                            <div className="pt-3 border-t border-cyan-200 flex justify-between">
                                <div className="flex flex-col">
                                    <span className="text-cyan-800 font-black uppercase text-[10px]">Total Due Now</span>
                                    <span className="text-[9px] font-bold text-cyan-600 italic">Deposit is held, not charged</span>
                                </div>
                                <span className="text-2xl text-cyan-900 font-black tracking-tight">${(totalFees + securityDeposit).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Real Stripe Form */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Card details</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <CardElement options={{
                                    style: {
                                        base: {
                                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                            fontSize: '14px',
                                            color: '#334155',
                                            '::placeholder': { color: '#94a3b8' }
                                        }
                                    }
                                }} />
                            </div>
                            {error && <p className="text-xs text-red-500 font-bold mt-2">{error}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold justify-center">
                        <LockIcon className="h-4 w-4" /> SECURE STRIPE ENCRYPTION
                    </div>
                </div>

                <div className="p-8 bg-slate-900 text-white flex flex-col gap-4">
                    <div className="flex justify-between items-center opacity-80">
                        <span className="text-sm font-bold italic">Pay owner directly at pickup:</span>
                        <span className="text-lg font-black text-cyan-400">${rentalCost.toFixed(2)}</span>
                    </div>
                    <button 
                        type="submit"
                        disabled={isProcessing || processingPayment || !stripe}
                        className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black shadow-xl shadow-cyan-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {(isProcessing || processingPayment) ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : <>Pay ${totalFees.toFixed(2)} & Request Trip <RocketIcon className="h-5 w-5" /></>}
                    </button>
                    <button type="button" onClick={() => onConfirm('direct')} disabled={isProcessing || processingPayment} className="w-full text-xs font-bold text-slate-400 hover:text-white transition-colors">
                        Or pay full amount later (Skip checkout)
                    </button>
                </div>
            </div>
        </form>
    );
};

const StripeCheckout: React.FC<PaymentSelectionModalProps> = (props) => (
    <Elements stripe={stripePromise}>
        <StripeCheckoutForm {...props} />
    </Elements>
);

const ListingDetailPage: React.FC<ListingDetailPageProps> = ({ listing, onBack, onStartConversation, currentUser, onCreateBooking, isFavorite, onToggleFavorite, onViewOwnerProfile }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [range, setRange] = useState<DateRange | undefined>();
    const [hourlyDate, setHourlyDate] = useState<Date | undefined>(undefined);
    const [startTime, setStartTime] = useState<string>('09:00');
    const [durationHours, setDurationHours] = useState<number>(1);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [successfulBooking, setSuccessfulBooking] = useState<Booking | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [insurancePlan, setInsurancePlan] = useState<'none' | 'standard' | 'premium'>('standard');

    const isOwner = currentUser?.id === listing.owner.id;
    const bookedDays = listing.bookedDates?.map(d => new Date(d)) || [];
    const disabledDays = [{ before: new Date() }, ...bookedDays];
    const isHourly = listing.pricingType === 'hourly';

    const isHighRisk = 
        listing.category === ListingCategory.MOTORCYCLES ||
        listing.category === ListingCategory.BOATS ||
        listing.category === ListingCategory.RVS ||
        listing.category === ListingCategory.ATVS_UTVS ||
        (listing.category === ListingCategory.WATER_SPORTS && listing.subcategory?.toLowerCase().includes('jet ski'));

    const timeOptions = Array.from({ length: 11 }, (_, i) => {
        const hour = i + 8;
        return `${hour < 10 ? '0' : ''}${hour}:00`;
    });

    const durationOptions = [1, 2, 3, 4, 5, 6, 8, 24];

    const requiresLicense = LegalService.isLicenseRequired(listing);

    const getPriceDetails = () => {
        let rentalTotal = 0;
        let unitCount = 0;

        if (isHourly) {
            if (!hourlyDate) return null;
            unitCount = durationHours;
            rentalTotal = (listing.pricePerHour || 0) * unitCount;
        } else {
            if (!range?.from || !range?.to) return null;
            unitCount = differenceInCalendarDays(range.to, range.from) + 1;
            rentalTotal = (listing.pricePerDay || 0) * unitCount;
        }
        
        let protectionFee = 0;
        if (!isHighRisk) {
            if (insurancePlan === 'standard') protectionFee = rentalTotal * 0.10;
            else if (insurancePlan === 'premium') protectionFee = rentalTotal * 0.20;
        } else {
            // For high risk, protection is often a daily flat fee to Risk Fund
            protectionFee = unitCount * 25.00; 
        }
        
        const serviceFee = rentalTotal * 0.10; 
        const securityDeposit = listing.securityDeposit || 0;
        const totalPrice = rentalTotal + protectionFee + serviceFee;

        return { unitCount, rentalTotal, protectionFee, serviceFee, securityDeposit, totalPrice };
    };

    const priceDetails = getPriceDetails();

    const handleBookClick = () => {
        if (!currentUser) {
            alert("Please log in to book.");
            return;
        }
        if (isOwner || !priceDetails) return;
        setShowPaymentModal(true);
    };

    const handleConfirmBooking = async (paymentMethod: 'platform' | 'direct') => {
        if (!priceDetails) return;
        
        let finalStartDate: Date;
        let finalEndDate: Date;

        if (isHourly && hourlyDate) {
            const [hours, mins] = startTime.split(':').map(Number);
            finalStartDate = setMinutes(setHours(new Date(hourlyDate), hours), mins);
            finalEndDate = addHours(finalStartDate, durationHours);
        } else if (range?.from && range?.to) {
            finalStartDate = range.from;
            finalEndDate = range.to;
        } else return;
        
        setIsBooking(true);
        setBookingError(null);

        try {
            const newBooking = await onCreateBooking(
                listing.id, 
                finalStartDate, 
                finalEndDate, 
                priceDetails.totalPrice, 
                paymentMethod,
                'insurance',
                priceDetails.protectionFee,
                priceDetails.securityDeposit
            );
            setSuccessfulBooking(newBooking);
            setRange(undefined); 
            setHourlyDate(undefined);
            setShowPaymentModal(false);
        } catch (error) {
            setBookingError(error instanceof Error ? error.message : "Booking failed.");
        } finally {
            setIsBooking(false);
        }
    };

    const modifiersStyles: any = {
      selected: { backgroundColor: '#06B6D4', color: 'white' },
      today: { fontWeight: 'bold', color: '#10B981' },
      disabled: { textDecoration: 'line-through', opacity: 0.5 }
    };

    return (
        <div className="bg-gray-50">
            {showPaymentModal && priceDetails && (
                <StripeCheckout 
                    totalPrice={priceDetails.totalPrice} 
                    rentalCost={priceDetails.rentalTotal}
                    serviceFee={priceDetails.serviceFee}
                    protectionFee={priceDetails.protectionFee}
                    securityDeposit={priceDetails.securityDeposit}
                    onConfirm={handleConfirmBooking} 
                    onClose={() => setShowPaymentModal(false)} 
                    isProcessing={isBooking}
                />
            )}

            {successfulBooking && (
                <BookingConfirmationModal booking={successfulBooking} onClose={() => setSuccessfulBooking(null)} />
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 mb-4 transition-all uppercase tracking-widest">
                            <ChevronLeftIcon className="h-4 w-4" />
                            Back to explore
                        </button>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em]">{listing.category}{listing.subcategory && ` • ${listing.subcategory}`}</p>
                                {listing.isInstantBook && (
                                    <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <ZapIcon className="h-2.5 w-2.5 fill-emerald-700" /> Instant Book
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">{listing.title}</h1>
                            <div className="flex items-center gap-6 mt-2">
                                <div className="flex items-center text-sm text-slate-500 font-bold">
                                    <MapPinIcon className="h-4 w-4 mr-1.5 text-cyan-500" />
                                    <span>{listing.location.city}, {listing.location.state}</span>
                                </div>
                                <div className="flex items-center bg-slate-100 px-3 py-1 rounded-full">
                                    <StarIcon className="h-3.5 w-3.5 text-amber-400 mr-1.5 fill-amber-400"/>
                                    <span className="font-black text-slate-900 text-xs">{listing.rating}</span>
                                    <span className="text-[10px] text-slate-400 ml-1 font-bold">({Math.floor(Math.random() * 50) + 10} reviews)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                            <ShareIcon className="h-4 w-4" /> Share
                        </button>
                        <button onClick={() => onToggleFavorite(listing.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm ${isFavorite ? 'text-red-500 border-red-100 bg-red-50' : 'text-slate-600'}`}>
                            <HeartIcon className={`h-4 w-4 ${isFavorite ? 'fill-red-500' : ''}`} /> {isFavorite ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Media Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 h-[400px] md:h-[550px] rounded-[2.5rem] overflow-hidden">
                    <div className="md:col-span-2 h-full">
                        <img src={listing.images[activeImageIndex]} alt={listing.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="hidden md:grid grid-cols-1 grid-rows-2 gap-4 col-span-1 h-full">
                        <img src={listing.images[1] || listing.images[0]} className="w-full h-full object-cover" />
                        <img src={listing.images[2] || listing.images[0]} className="w-full h-full object-cover" />
                    </div>
                    <div className="hidden md:grid grid-cols-1 grid-rows-2 gap-4 col-span-1 h-full">
                        <img src={listing.images[3] || listing.images[0]} className="w-full h-full object-cover" />
                        <div className="relative w-full h-full">
                            <img src={listing.images[4] || listing.images[0]} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-black text-lg cursor-pointer">
                                +{listing.images.length} photos
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-7 space-y-12">
                        <section className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={onViewOwnerProfile}>
                                <div className="relative">
                                    <img src={listing.owner.avatarUrl} alt={listing.owner.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white"/>
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white">
                                        <CheckCircleIcon className="h-2.5 w-2.5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900 leading-tight">Hosted by {listing.owner.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top Rated • 128 rentals</p>
                                </div>
                            </div>
                            {!isOwner && (
                                <button onClick={() => onStartConversation(listing)} className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2">
                                    <MessageSquareIcon className="h-4 w-4" /> Message Host
                                </button>
                            )}
                        </section>

                        <section>
                            <h3 className="text-xl font-black text-slate-900 mb-4">Description</h3>
                            <SimpleMarkdown text={listing.description} />
                        </section>

                        <section>
                            <h3 className="text-xl font-black text-slate-900 mb-6 font-sans">Specifications & Features</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                    <ClockIcon className="h-5 w-5 text-cyan-500 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Model</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{isHourly ? 'Hourly' : 'Daily'} Flexible</p>
                                </div>
                                {(() => {
                                    const mode = listing.operation_mode || 1;
                                    const depositValue = listing.security_deposit || listing.securityDeposit || 0;
                                    const formattedDeposit = depositValue > 0 ? `$${depositValue.toLocaleString()}` : '';
                                    
                                    if (mode === 1) {
                                        return (
                                            <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm col-span-2 sm:col-span-1 flex flex-col justify-between">
                                                <div>
                                                    <ShieldCheckIcon className="h-5 w-5 text-emerald-500 mb-2" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROTECTION</p>
                                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Goodslister Peer Waiver</p>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                                    Hosts and renters agree to a peer damage waiver. Damage handled via security deposit and dispute resolution.
                                                </p>
                                            </div>
                                        );
                                    } else if (mode === 2) {
                                        return (
                                            <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm col-span-2 sm:col-span-1 flex flex-col justify-between">
                                                <div>
                                                    <ShieldCheckIcon className="h-5 w-5 text-blue-500 mb-2" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROTECTION</p>
                                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Peer-to-Peer Insurance</p>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                                    This rental is covered by our insurance partner. Security deposit held during rental: {formattedDeposit}.
                                                </p>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm col-span-2 sm:col-span-1 flex flex-col justify-between">
                                                <div>
                                                    <ShieldCheckIcon className="h-5 w-5 text-orange-500 mb-2" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CHARTER & INSURANCE</p>
                                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Bareboat Demise Charter</p>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                                    Renter takes operational responsibility and legal control of the vessel/vehicle during the rental. Host provides primary commercial insurance (certificate verified by Goodslister). Optional Renter's Protection available at checkout. Security deposit: {formattedDeposit}.
                                                </p>
                                            </div>
                                        );
                                    }
                                })()}
                                <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                    <CheckCircleIcon className="h-5 w-5 text-indigo-500 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Certified Inspection</p>
                                </div>
                                {listing.engineCC && (
                                    <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                        <ZapIcon className="h-5 w-5 text-amber-500 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                                        <p className="text-sm font-bold text-slate-800 mt-0.5">{listing.engineCC}cc Engine</p>
                                    </div>
                                )}
                                <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                    <UmbrellaIcon className="h-5 w-5 text-sky-500 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancellation</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Moderate Policy</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                    <RocketIcon className="h-5 w-5 text-rose-500 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handover</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Digital Check-in</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-900">Location</h3>
                                <p className="text-sm font-bold text-slate-500">{listing.location.city}, {listing.location.state}</p>
                            </div>
                            <div className="h-[300px] rounded-[2rem] overflow-hidden shadow-inner border border-slate-100">
                                <ListingMap center={{ lat: listing.location.latitude, lng: listing.location.longitude }} />
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Booking Card */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-12">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-100">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900">${listing.pricingType === 'hourly' ? listing.pricePerHour : listing.pricePerDay}</span>
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{listing.pricingType === 'hourly' ? '/ hr' : '/ day'}</span>
                                    </div>
                                    {((listing.security_deposit || listing.securityDeposit) && (listing.security_deposit || listing.securityDeposit || 0) > 0) ? (
                                        <div className="mt-2 text-xs font-semibold text-slate-500">
                                            Security deposit: <span className="font-bold text-slate-800">${(listing.security_deposit || listing.securityDeposit)?.toLocaleString()}</span> (held during rental)
                                        </div>
                                    ) : null}
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
                                        {isHourly ? (
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-2">Rental Timing</h3>
                                                <div className="flex justify-center bg-white rounded-2xl py-2 my-picker-custom"><DayPicker mode="single" selected={hourlyDate} onSelect={setHourlyDate} disabled={disabledDays} modifiersStyles={modifiersStyles}/></div>
                                                {hourlyDate && (
                                                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 ml-1">START TIME</label>
                                                            <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white border-slate-200 rounded-xl p-3 font-bold text-xs shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 ml-1">DURATION</label>
                                                            <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="w-full bg-white border-slate-200 rounded-xl p-3 font-bold text-xs shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none">{durationOptions.map(d => <option key={d} value={d}>{d} Hour{d > 1 ? 's' : ''}</option>)}</select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-2">Select Duration</h3>
                                                 <div className="flex justify-center bg-white rounded-2xl py-2 my-picker-custom"><DayPicker mode="range" selected={range} onSelect={setRange} disabled={disabledDays} modifiersStyles={modifiersStyles}/></div>
                                            </div>
                                        )}
                                    </div>

                                    {priceDetails ? (
                                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4 shadow-xl animate-in zoom-in-95 duration-300">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                                    <span>Rental Cost</span>
                                                    <span className="font-black text-white">${priceDetails.rentalTotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1">Protocol & Service Fees <ShieldIcon className="h-3 w-3" /></span>
                                                    <span className="font-black text-white">${(priceDetails.serviceFee + priceDetails.protectionFee).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1">Security Deposit <LockIcon className="h-3 w-3" /></span>
                                                    <span className="font-black text-white">${priceDetails.securityDeposit.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-white/10">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Total to Pay</p>
                                                        <p className="text-3xl font-black tracking-tight text-white">${(priceDetails.totalPrice + priceDetails.securityDeposit).toFixed(2)}</p>
                                                    </div>
                                                    <button 
                                                        onClick={handleBookClick}
                                                        className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-black rounded-2xl shadow-xl shadow-cyan-900/20 transition-all active:scale-95 text-xs uppercase"
                                                    >
                                                        Reserve Now
                                                    </button>
                                                </div>
                                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.15em] text-center mt-6">Secure checkout powered by Stripe</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                            <ClockIcon className="h-8 w-8 text-slate-300 mb-3" />
                                            <p className="text-xs font-bold text-slate-500">Pick your dates to see total pricing and availability.</p>
                                        </div>
                                    )}

                                    {!priceDetails && (
                                        <button
                                            disabled
                                            className="w-full py-5 bg-slate-100 text-slate-400 font-black rounded-3xl uppercase tracking-widest text-xs cursor-not-allowed"
                                        >
                                            Select Dates
                                        </button>
                                    )}

                                    {requiresLicense && (
                                        <div className="flex items-center gap-2 justify-center py-2">
                                            <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Vetting Process applies to this gear</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> Professional Grade Host Protection
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ListingDetailPage;
