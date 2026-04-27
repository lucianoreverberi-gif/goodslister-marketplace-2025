
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
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-all active:scale-95">
                    <ChevronLeftIcon className="h-5 w-5" />
                    Back to results
                </button>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <div className="relative">
                                <img src={listing.images[activeImageIndex]} alt={listing.title} className="w-full h-[500px] object-cover" />
                                <div className="absolute top-4 right-4 flex gap-2">
                                     <button className="p-3 bg-white/80 backdrop-blur-md rounded-full text-gray-700 hover:bg-white transition shadow-lg" onClick={() => onToggleFavorite(listing.id)}>
                                        <HeartIcon className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                    </button>
                                </div>
                            </div>
                             {listing.images.length > 1 && (
                                <div className="grid grid-cols-5 gap-2 p-4 bg-slate-50">
                                    {listing.images.map((img, index) => (
                                        <button key={index} onClick={() => setActiveImageIndex(index)} className={`rounded-xl overflow-hidden aspect-video transition-all ${index === activeImageIndex ? 'ring-4 ring-cyan-500 scale-95' : 'opacity-70 hover:opacity-100'}`}>
                                            <img src={img} alt="thumbnail" className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-2 p-6 sm:p-10 flex flex-col bg-white">
                            <div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-black text-cyan-600 uppercase tracking-[0.2em]">{listing.category}{listing.subcategory && ` • ${listing.subcategory}`}</p>
                                    {listing.isInstantBook && (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-cyan-700 uppercase tracking-widest bg-cyan-100 w-fit px-3 py-1 rounded-full border border-cyan-200">
                                            <ZapIcon className="h-3 w-3 fill-cyan-700" /> Instant Book
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 mt-4 leading-tight tracking-tight">{listing.title}</h1>
                                <div className="flex items-center text-sm text-slate-500 font-bold mt-4"><MapPinIcon className="h-4 w-4 mr-2 text-cyan-500" /><span>{listing.location.city}, {listing.location.state}</span></div>
                                
                                {requiresLicense && (
                                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                                        <AlertTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-sm font-black text-amber-900">License / ID Required</p>
                                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                                {listing.category === ListingCategory.MOTORCYCLES && (listing.engineCC || 0) >= 50 
                                                    ? `Based on local laws and engine size (${listing.engineCC}cc), a valid motorcycle license must be presented at pick-up.`
                                                    : listing.category === ListingCategory.BOATS || (listing.category === ListingCategory.WATER_SPORTS && (listing.subcategory?.toLowerCase().includes('jet') || listing.subcategory?.toLowerCase().includes('pwc') || listing.subcategory?.toLowerCase().includes('waverunner')))
                                                    ? "A valid Boating Safety ID or Operator license is required to operate this vessel."
                                                    : listing.category === ListingCategory.WINTER_SPORTS && listing.subcategory?.toLowerCase().includes('snowmobile')
                                                    ? "A valid Driver's License or Snowmobile Safety Certificate is required for this rental."
                                                    : "A valid Government-issued Driver's License must be presented at pick-up."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-baseline mt-6 border-b border-slate-100 pb-6">
                                     <span className="text-4xl font-black text-slate-900">${listing.pricingType === 'hourly' ? listing.pricePerHour : listing.pricePerDay}</span>
                                     <span className="text-sm font-bold text-slate-400 ml-1 uppercase">{listing.pricingType === 'hourly' ? '/hour' : '/day'}</span>
                                     <div className="flex items-center ml-auto bg-slate-50 px-3 py-1.5 rounded-full"><StarIcon className="h-4 w-4 text-amber-400 mr-1.5 fill-amber-400"/><span className="font-black text-slate-900 text-sm">{listing.rating}</span></div>
                                </div>
                            </div>

                             <div className="mt-8">
                                <div className="flex items-center justify-between">
                                      <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={onViewOwnerProfile}>
                                        <img src={listing.owner.avatarUrl} alt={listing.owner.name} className="w-12 h-12 rounded-2xl object-cover mr-4 shadow-sm border border-slate-100"/>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">{listing.owner.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Host</p>
                                        </div>
                                    </div>
                                    {!isOwner && (
                                        <button onClick={() => onStartConversation(listing)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-cyan-600 transition-colors shadow-sm"><MessageSquareIcon className="h-6 w-6" /></button>
                                    )}
                                </div>
                                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-10 mb-4">Description</h2>
                                <SimpleMarkdown text={listing.description} />
                            </div>
                           
                            <div className="mt-auto pt-10">
                                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 mb-6">
                                    {isHourly ? (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Pick a Date</h3>
                                            <div className="flex justify-center"><DayPicker mode="single" selected={hourlyDate} onSelect={setHourlyDate} disabled={disabledDays} modifiersStyles={modifiersStyles}/></div>
                                            {hourlyDate && (
                                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                                                    <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white border-slate-200 rounded-xl p-3 font-bold text-sm shadow-sm">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                                    <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="w-full bg-white border-slate-200 rounded-xl p-3 font-bold text-sm shadow-sm">{durationOptions.map(d => <option key={d} value={d}>{d} Hour{d > 1 ? 's' : ''}</option>)}</select>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex justify-center"><DayPicker mode="range" selected={range} onSelect={setRange} disabled={disabledDays} modifiersStyles={modifiersStyles}/></div>
                                    )}
                                </div>
                                
                                {priceDetails && (
                                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4 mb-6 shadow-2xl shadow-slate-200 animate-in fade-in duration-500">
                                        {requiresLicense && (
                                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 mb-2 flex items-center gap-2">
                                                <AlertTriangleIcon className="h-4 w-4 text-amber-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">License will be verified at pick-up</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs font-bold opacity-60 uppercase tracking-widest"><span>Rental Subtotal</span><span className="font-black text-white">${priceDetails.rentalTotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-xs font-bold opacity-60 uppercase tracking-widest"><span>Platform Fees</span><span className="font-black text-white">${(priceDetails.serviceFee + priceDetails.protectionFee).toFixed(2)}</span></div>
                                        <div className="flex justify-between text-xs font-bold opacity-60 uppercase tracking-widest"><span>Security Deposit (Held)</span><span className="font-black text-white">${priceDetails.securityDeposit.toFixed(2)}</span></div>
                                        <div className="flex justify-between font-black text-3xl pt-4 border-t border-white/10 tracking-tight"><span>Total</span><span className="text-cyan-400">${(priceDetails.totalPrice + priceDetails.securityDeposit).toFixed(2)}</span></div>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center pt-2">Fees & Deposit collected now to secure request</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleBookClick}
                                    disabled={!currentUser || isOwner || !priceDetails || isBooking}
                                    className="w-full py-5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-[2rem] shadow-xl shadow-cyan-100 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-sm"
                                >
                                    {isOwner ? "This is your gear" : (listing.isInstantBook ? "Instant Book" : "Send Request")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetailPage;
