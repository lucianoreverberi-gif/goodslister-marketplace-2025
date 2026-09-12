import React, { useState } from 'react';
import { Booking } from '../types';
import { XIcon, ShieldCheckIcon, FileTextIcon, AlertCircleIcon, CheckCircleIcon } from './icons';
import SignaturePad from './SignaturePad';
import { format } from 'date-fns';
import { CATEGORY_RISKS, CATEGORY_TO_ANNEX } from './BookingLegalModal';

/**
 * AgreementSignatureModal — Phase 5 Robust Contract at Check-in
 *
 * This modal is presented at the physical handoff (check-in) moment.
 * It is the moment where risk actually starts, so we surface:
 *   - Booking summary (item, dates, price, deposit)
 *   - Category-specific critical risks INLINE (from Annex Section 5)
 *   - Key rental contract clauses INLINE (bailment, condition report,
 *     indemnification, dangerous instrumentality where applicable)
 *   - 3 targeted acknowledgments (agreement + risk + damage)
 *   - Digital signature capture via SignaturePad
 *
 * The signature is uploaded to Vercel Blob and linked to the booking
 * via POST /api/bookings/sign-agreement. Dual signature workflow is
 * supported (renter first, host countersigns).
 */

const LEGAL_VERSION = '2.0';

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
    const [checks, setChecks] = useState({ agreement: false, risk: false, damage: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allChecked = checks.agreement && checks.risk && checks.damage;
    const canSubmit = !!signatureDataUrl && allChecked && !isSubmitting;

    // Category-aware content
    const category = (booking.listing?.category as string) || 'GENERIC';
    const annex = CATEGORY_TO_ANNEX[category] || {
        id: 'annex_generic_v2_0',
        label: 'General',
        annexHash: '#trustSafety',
    };
    const risks = CATEGORY_RISKS[category] || { critical: [], note: undefined };
    const isMotorized = ['MOTORCYCLES', 'BOATS', 'RVS', 'ATVS_UTVS'].includes(category) ||
                        (category === 'WATER_SPORTS' && (booking.listing?.title || '').toLowerCase().includes('jet ski'));

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
                {/* HERO */}
                <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                <ShieldCheckIcon className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-amber-400 font-bold tracking-wider uppercase text-[10px]">Ready to hand off</p>
                                <h2 className="text-xl font-black">Sign the Rental Agreement</h2>
                                <p className="text-xs text-gray-300">{role === 'RENTER' ? 'As the Renter' : 'As the Host / Owner'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-300 hover:text-white">
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* DRAFT BANNER */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg">
                        <p className="text-amber-900 text-xs">
                            <strong>Draft v{LEGAL_VERSION}:</strong> This agreement is pending final review by a Florida-licensed attorney.
                        </p>
                    </div>

                    {/* BOOKING SUMMARY */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FileTextIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Terms</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-600">Item:</span><span className="font-bold text-slate-900">{booking.listing?.title || 'Rental Item'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-600">Category:</span><span className="font-bold text-slate-900">{annex.label}</span></div>
                            <div className="flex justify-between"><span className="text-slate-600">Dates:</span><span className="font-bold text-slate-900">{format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-600">Rental Total:</span><span className="font-bold text-slate-900">${(booking.totalPrice || 0).toFixed(2)}</span></div>
                            {booking.securityDeposit > 0 && (<div className="flex justify-between"><span className="text-slate-600">Security Deposit (refundable):</span><span className="font-bold text-slate-900">${booking.securityDeposit.toFixed(2)}</span></div>)}
                            <div className="flex justify-between pt-2 border-t border-slate-200 mt-2"><span className="font-bold text-slate-900">Total:</span><span className="font-black text-slate-900 text-lg">${totalAmount.toFixed(2)}</span></div>
                        </div>
                    </div>

                    {/* CATEGORY-SPECIFIC RISKS — RENTER only */}
                    {role === 'RENTER' && risks.critical.length > 0 && (
                        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-lg overflow-hidden">
                            <div className="bg-rose-500 text-white px-4 py-2 flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                <span className="uppercase font-bold text-xs tracking-wider">Risks you are assuming at handoff</span>
                            </div>
                            <div className="p-4">
                                <p className="uppercase font-bold text-rose-900 text-xs mb-3">
                                    By signing, you confirm you have re-read and accept these {annex.label.toLowerCase()} risks:
                                </p>
                                <ul className="space-y-1.5">
                                    {risks.critical.map((risk, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-rose-950 leading-snug">
                                            <span className="text-rose-600 font-bold flex-shrink-0 mt-0.5">▪</span>
                                            <span>{risk}</span>
                                        </li>
                                    ))}
                                </ul>
                                {risks.note && (
                                    <p className="text-xs text-rose-800 italic mt-3 pt-3 border-t border-rose-200">
                                        <strong>Note:</strong> {risks.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* KEY LEGAL CLAUSES INLINE */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircleIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key legal terms — read before signing</span>
                        </div>
                        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                            <div>
                                <p className="font-bold text-slate-900">1. Bailment for hire, not a sale</p>
                                <p>This is a temporary rental. Title remains with the Owner at all times. You have possession only during the rental period.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">2. Condition Report is binding evidence</p>
                                <p>Photos taken at check-in and check-out are the primary and controlling evidence of item condition. Damage visible at check-out but not at check-in is presumed to have occurred during the rental period and is your responsibility.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">3. Financial responsibility</p>
                                <p>You are responsible for all loss, damage, theft, salvage, towing, and lost rental income up to the actual cash value of the item. Your security deposit + card on file may be charged for damage beyond normal wear.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">4. Indemnification</p>
                                <p>You agree to defend and indemnify the Owner and Goodslister from any claim brought by your passengers, guests, or third parties arising from your use of the item.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">5. Insurance disclaimer</p>
                                <p>Goodslister does not provide insurance. Your personal auto or homeowners policy likely does NOT cover this rental. Any protection product is not insurance.</p>
                            </div>
                            {isMotorized && (
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                                    <p className="font-bold text-amber-900">6. Dangerous Instrumentality Notice (motorized items)</p>
                                    <p className="text-amber-900">Under Florida law, the owner of a motor vehicle who voluntarily entrusts it to another may be held vicariously liable for that person's negligent operation. As the {role === 'HOST' ? 'Owner' : 'Renter'}, you acknowledge this and Goodslister has advised the Owner to consult attorney and insurance professional.</p>
                                </div>
                            )}
                            <div className="pt-2">
                                <p className="text-slate-500 italic">
                                    <a href={annex.annexHash} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline font-bold">Read the full {annex.label} Annex ↗</a> and the <a href="/#transactionalCore" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline font-bold">Master Rental Agreement (6 modules) ↗</a>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* THREE TARGETED CHECKBOXES */}
                    <div className="space-y-2.5">
                        <label className="flex items-start gap-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-cyan-400 transition has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50">
                            <input
                                type="checkbox"
                                checked={checks.agreement}
                                onChange={(e) => setChecks({ ...checks, agreement: e.target.checked })}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 flex-shrink-0"
                                disabled={isSubmitting}
                            />
                            <span className="text-sm text-gray-800 leading-relaxed">
                                I, <strong>{userFullName}</strong>, have re-read and agree to the <strong>full Rental Agreement</strong> (6 modules) and the <strong>{annex.label} Annex</strong>, both at version {LEGAL_VERSION}.
                            </span>
                        </label>

                        {role === 'RENTER' && (
                            <label className="flex items-start gap-3 p-3 bg-rose-50 border-2 border-rose-200 rounded-xl cursor-pointer hover:border-rose-400 transition has-[:checked]:border-rose-500 has-[:checked]:bg-rose-100">
                                <input
                                    type="checkbox"
                                    checked={checks.risk}
                                    onChange={(e) => setChecks({ ...checks, risk: e.target.checked })}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 flex-shrink-0"
                                    disabled={isSubmitting}
                                />
                                <span className="text-sm text-gray-800 leading-relaxed">
                                    I <strong>voluntarily assume</strong> the specific {annex.label.toLowerCase()} risks listed above, including risk of serious injury or death.
                                </span>
                            </label>
                        )}

                        {role === 'HOST' && (
                            <label className="flex items-start gap-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl cursor-pointer hover:border-amber-400 transition has-[:checked]:border-amber-500 has-[:checked]:bg-amber-100">
                                <input
                                    type="checkbox"
                                    checked={checks.risk}
                                    onChange={(e) => setChecks({ ...checks, risk: e.target.checked })}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                                    disabled={isSubmitting}
                                />
                                <span className="text-sm text-gray-800 leading-relaxed">
                                    As Owner, I confirm the item is in <strong>safe, functional condition</strong>, has no known unrepaired safety defect, and includes all legally required safety equipment.
                                </span>
                            </label>
                        )}

                        <label className="flex items-start gap-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl cursor-pointer hover:border-amber-400 transition has-[:checked]:border-amber-500 has-[:checked]:bg-amber-100">
                            <input
                                type="checkbox"
                                checked={checks.damage}
                                onChange={(e) => setChecks({ ...checks, damage: e.target.checked })}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                                disabled={isSubmitting}
                            />
                            <span className="text-sm text-gray-800 leading-relaxed">
                                {role === 'RENTER'
                                    ? <>I am <strong>responsible for damages</strong> beyond normal wear and tear. My deposit + card may be charged per the Damage Policy.</>
                                    : <>I will complete the <strong>Condition Report</strong> photos at handoff and again at return, and file any damage claim within 24 hours of return with matched evidence.</>}
                            </span>
                        </label>
                    </div>

                    {/* SIGNATURE PAD */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircleIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your signature</span>
                        </div>
                        <SignaturePad onChange={setSignatureDataUrl} />
                        <p className="text-[10px] text-slate-500 mt-2 italic">
                            Your signature, timestamp, and IP address are recorded as your electronic signature per ESIGN Act (15 U.S.C. § 7001) and Fla. Stat. § 668.004.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg">
                            <p className="text-rose-900 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="border-t border-slate-100 p-5 bg-slate-50 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-medium rounded-xl transition text-base"
                    >
                        Not now
                    </button>
                    <button
                        onClick={handleSign}
                        disabled={!canSubmit}
                        className="flex-1 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition text-base shadow-lg"
                    >
                        {isSubmitting ? 'Submitting signature…' : 'Sign & Complete Check-in'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgreementSignatureModal;
