import React, { useState } from 'react';
import { Booking } from '../types';
import { XIcon, ShieldCheckIcon, FileTextIcon, AlertCircleIcon, CheckCircleIcon } from './icons';
import SignaturePad from './SignaturePad';
import { format } from 'date-fns';

interface AgreementSignatureModalProps {
    booking: Booking;
    userId: string;
    role: 'HOST' | 'RENTER';
    userFullName: string;
    onSigned: () => void;
    onClose: () => void;
}

const AgreementSignatureModal: React.FC<AgreementSignatureModalProps> = ({ booking, userId, role, userFullName, onSigned, onClose }) => {
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = !!signatureDataUrl && agreed && !isSubmitting;

    const handleSign = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const blob = await (await fetch(signatureDataUrl!)).blob();
            const filename = 'signature-' + role.toLowerCase() + '-' + booking.id + '-' + Date.now() + '.png';
            const uploadRes = await fetch('/api/upload-image?filename=' + encodeURIComponent(filename) + '&folder=signatures', {
                method: 'POST',
                body: blob,
            });
            if (!uploadRes.ok) throw new Error('Failed to upload signature');
            const uploadData = await uploadRes.json();

            const signRes = await fetch('/api/bookings/sign-agreement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    userId,
                    role,
                    signatureUrl: uploadData.url,
                }),
            });
            if (!signRes.ok) {
                const err = await signRes.json();
                throw new Error(err.error || 'Failed to save signature');
            }
            onSigned();
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            setIsSubmitting(false);
        }
    };

    const totalAmount = (booking.totalPrice || 0) + (booking.securityDeposit || 0);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-cyan-50 rounded-2xl flex items-center justify-center">
                            <ShieldCheckIcon className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Rental Agreement</h2>
                            <p className="text-xs text-slate-500">Sign to confirm rental terms</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FileTextIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Terms</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-600">Item:</span><span className="font-bold text-slate-900">{booking.listing?.title || 'Rental Item'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-600">Dates:</span><span className="font-bold text-slate-900">{format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-600">Rental Total:</span><span className="font-bold text-slate-900">${(booking.totalPrice || 0).toFixed(2)}</span></div>
                            {booking.securityDeposit > 0 && (<div className="flex justify-between"><span className="text-slate-600">Security Deposit (refundable):</span><span className="font-bold text-slate-900">${booking.securityDeposit.toFixed(2)}</span></div>)}
                            <div className="flex justify-between pt-2 border-t border-slate-200 mt-2"><span className="font-bold text-slate-900">Total:</span><span className="font-black text-slate-900 text-lg">${totalAmount.toFixed(2)}</span></div>
                        </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                        <p><strong className="text-slate-900">By signing, you confirm:</strong></p>
                        <ul className="space-y-1 pl-5 list-disc">
                            <li>You have read and agree to the full Rental Agreement, Terms of Service, and Privacy Policy.</li>
                            <li>You are responsible for the item during the rental period per the damage protection terms selected.</li>
                            <li>Cancellation and refund policies apply as described in the agreement.</li>
                            <li>The security deposit will be released after return if no damage claim is filed.</li>
                        </ul>
                    </div>

                    <div>
                        <SignaturePad onChange={setSignatureDataUrl} label={'Sign as ' + userFullName} />
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                            I, <strong>{userFullName}</strong>, have read and agree to the Rental Agreement, Terms of Service, and Privacy Policy.
                        </span>
                    </label>

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-700 font-medium">{error}</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-3 text-slate-600 font-bold text-sm hover:text-slate-900 disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSign}
                        disabled={!canSubmit}
                        className="flex-1 sm:flex-none px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-cyan-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'SIGNING...' : (<><CheckCircleIcon className="h-4 w-4" /> CONFIRM & SIGN</>)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgreementSignatureModal;
