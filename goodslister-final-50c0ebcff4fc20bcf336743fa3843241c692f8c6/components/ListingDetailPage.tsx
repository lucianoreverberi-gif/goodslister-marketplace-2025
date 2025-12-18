
import React, { useState, useEffect } from 'react';
import { Listing, User, Booking, ListingCategory } from '../types';
import { MapPinIcon, StarIcon, ChevronLeftIcon, ShareIcon, HeartIcon, MessageSquareIcon, CheckCircleIcon, XIcon, ShieldCheckIcon, UmbrellaIcon, WalletIcon, CreditCardIcon, AlertTriangleIcon, FileTextIcon, UploadCloudIcon, FileSignatureIcon, PenToolIcon, ShieldIcon, ClockIcon, ZapIcon, LockIcon, InfoIcon, ExternalLinkIcon } from './icons';
import ListingMap from './ListingMap';
import { DayPicker, DateRange } from 'react-day-picker';
import { differenceInCalendarDays, format, addHours, setHours, setMinutes } from 'date-fns';
import { LegalService, ContractType } from '../services/legalService';

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

const ListingDetailPage: React.FC<ListingDetailPageProps> = (props) => {
    const { listing, currentUser, onBack, onStartConversation, onCreateBooking, isFavorite, onToggleFavorite, onViewOwnerProfile } = props;
    
    const [range, setRange] = useState<DateRange | undefined>();
    const [isBooking, setIsBooking] = useState(false);
    const [showFullContract, setShowFullContract] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const contractType = LegalService.getContractType(listing);

    const handleBookNow = async () => {
        if (!currentUser) return;
        if (!range?.from || !range?.to) return;
        
        setIsBooking(true);
        try {
            const days = differenceInCalendarDays(range.to, range.from) + 1;
            const totalPrice = (listing.pricePerDay || 0) * days;
            
            await onCreateBooking(
                listing.id, 
                range.from, 
                range.to, 
                totalPrice, 
                'platform', 
                'waiver', 
                totalPrice * 0.15
            );
            setBookingSuccess(true);
        } catch (e) {
            alert("Booking failed.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Modal para ver el contrato completo (opcional) */}
            {showFullContract && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                        <button onClick={() => setShowFullContract(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                            <XIcon className="h-6 w-6" />
                        </button>
                        <div className="p-6 border-b bg-gray-50">
                            <h2 className="text-xl font-bold">Contract Template: {contractType}</h2>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 prose prose-sm" 
                             dangerouslySetInnerHTML={{ __html: LegalService.generateContractHtml(listing, currentUser || {name: 'Renter'} as any, new Date(), new Date(), 0) }} />
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-800 transition-colors">
                    <ChevronLeftIcon className="h-5 w-5" /> Back to Explore
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna Izquierda: Info del Bien */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                            <img src={listing.images[0]} className="w-full h-[400px] object-cover" />
                            <div className="p-8">
                                <h1 className="text-4xl font-black text-gray-900">{listing.title}</h1>
                                <p className="text-gray-600 mt-4 leading-relaxed">{listing.description}</p>
                            </div>
                        </div>

                        {/* SECCIÓN LEGAL (Transparencia sin fricción) */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <ShieldCheckIcon className="h-6 w-6 text-cyan-600" />
                                    Protection & Rules
                                </h2>
                                <button 
                                    onClick={() => setShowFullContract(true)}
                                    className="text-xs font-bold text-cyan-600 hover:underline uppercase tracking-widest"
                                >
                                    Preview Full Contract
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                                        <FileTextIcon className="h-4 w-4 text-gray-400" />
                                        Standard Agreement
                                    </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        This rental uses the <strong>{contractType}</strong>. You will be required to sign this document digitally upon physical pickup of the equipment.
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                                        <ZapIcon className="h-4 w-4 text-amber-500" />
                                        Security Deposit
                                    </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        A refundable deposit of <strong>${listing.securityDeposit || 0}</strong> will be held during the rental. Damage protection is included in the service fee.
                                    </p>
                                </div>
                            </div>

                            {listing.ownerRules && (
                                <div className="mt-6 p-6 bg-cyan-50/50 rounded-2xl border border-cyan-100">
                                    <h4 className="text-xs font-black text-cyan-800 uppercase tracking-widest mb-2">Owner's Specific Rules</h4>
                                    <p className="text-sm text-cyan-900 italic">"{listing.ownerRules}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Widget de Pago */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 sticky top-24">
                            <div className="mb-6">
                                <span className="text-3xl font-black text-gray-900">${listing.pricePerDay}</span>
                                <span className="text-gray-500 font-bold ml-1">/ day</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Select Dates</label>
                                    <div className="border rounded-2xl p-2 bg-gray-50">
                                        <DayPicker mode="range" selected={range} onSelect={setRange} />
                                    </div>
                                </div>

                                {range?.from && range?.to && (
                                    <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Rental ({differenceInCalendarDays(range.to, range.from) + 1} days)</span>
                                            <span className="font-bold">${(listing.pricePerDay || 0) * (differenceInCalendarDays(range.to, range.from) + 1)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Service & Protection Fee</span>
                                            <span className="font-bold">${((listing.pricePerDay || 0) * (differenceInCalendarDays(range.to, range.from) + 1) * 0.15).toFixed(2)}</span>
                                        </div>
                                        <div className="pt-2 border-t flex justify-between font-black text-lg text-gray-900">
                                            <span>Total</span>
                                            <span>${((listing.pricePerDay || 0) * (differenceInCalendarDays(range.to, range.from) + 1) * 1.15).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={handleBookNow}
                                    disabled={!range || isBooking || bookingSuccess}
                                    className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isBooking ? 'Processing...' : bookingSuccess ? 'Reserved!' : 'Reserve & Pay'}
                                </button>
                                
                                <div className="flex items-center gap-2 justify-center mt-4">
                                    <LockIcon className="h-3 w-3 text-gray-400" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure Checkout</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetailPage;
