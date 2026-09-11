import React, { useState } from 'react';
import { ListingCategory } from '../types';

/**
 * BookingLegalModal — Phase 3 booking-time acceptance
 *
 * Shows the applicable legal package for a specific booking:
 *  - Transactional Core (applies to all bookings)
 *  - Category-specific Annex (applies only to items of that category)
 *
 * Design: category-aware modal that shows only the annex relevant to what the
 * user is renting. A person renting a bike does NOT see boat rules and vice
 * versa — this is the whole point of the modular legal architecture.
 *
 * The acceptance is tracked per user, per document bundle (transactional_core
 * once, then annex_<category> once per category).
 */

const LEGAL_VERSION = '2.0';

// Maps app categories to annex identifiers per legal package v2.0
const CATEGORY_TO_ANNEX: Record<string, { id: string; label: string; annexHash: string }> = {
    MOTORCYCLES: { id: 'annex_a_motorcycles_v2_0', label: 'Motorcycles', annexHash: '#annexMotorcycles' },
    BIKES: { id: 'annex_b_bikes_v2_0', label: 'Bikes', annexHash: '#annexBikes' },
    BOATS: { id: 'annex_c_boats_v2_0', label: 'Boats & Vessels', annexHash: '#annexBoats' },
    CAMPING: { id: 'annex_d_camping_v2_0', label: 'Camping Equipment', annexHash: '#annexCamping' },
    WINTER_SPORTS: { id: 'annex_e_winter_sports_v2_0', label: 'Winter Sports', annexHash: '#annexWinterSports' },
    WATER_SPORTS: { id: 'annex_f_water_sports_v2_0', label: 'Water Sports', annexHash: '#annexWaterSports' },
    RVS: { id: 'annex_g_rvs_v2_0', label: 'RVs', annexHash: '#annexRVs' },
    ATVS_UTVS: { id: 'annex_h_atvs_utvs_v2_0', label: 'ATVs & UTVs', annexHash: '#annexATVs' },
};

interface BookingLegalModalProps {
    userId: string;
    userName?: string;
    category: ListingCategory;
    itemTitle: string;
    onAccepted: () => void;
    onCancel: () => void;
}

export const BookingLegalModal: React.FC<BookingLegalModalProps> = ({ userId, userName, category, itemTitle, onAccepted, onCancel }) => {
    const [checked, setChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const annex = CATEGORY_TO_ANNEX[category] || {
        id: 'annex_generic_v2_0',
        label: 'General',
        annexHash: '#trustSafety',
    };

    const handleAccept = async () => {
        if (!checked || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            // Two acceptances at once: transactional core + this booking's annex
            const bundles = ['transactional_core_v2_0', annex.id];
            const promises = bundles.map((bundle) =>
                fetch('/api/legal/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        documentBundle: bundle,
                        documentVersion: LEGAL_VERSION,
                    }),
                }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
            );
            await Promise.all(promises);
            onAccepted();
        } catch (err: any) {
            console.error('[BookingLegalModal] accept failed:', err);
            setError('Something went wrong recording your acceptance. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-legal-title"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white p-6 sm:p-8">
                    <span className="text-amber-400 font-bold tracking-wider uppercase text-xs">
                        {userName ? `${userName.split(' ')[0]}, one more thing` : 'Before we book'}
                    </span>
                    <h2 id="booking-legal-title" className="text-2xl sm:text-3xl font-extrabold mt-2">
                        Rental terms for {annex.label}
                    </h2>
                    <p className="text-gray-300 mt-3 text-sm sm:text-base">
                        You're booking <strong className="text-white">"{itemTitle}"</strong>. Please review and accept the rental agreement and the {annex.label.toLowerCase()}-specific rules before we proceed to payment.
                    </p>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg mb-6">
                        <p className="text-amber-900 text-xs">
                            <strong>Draft v{LEGAL_VERSION}:</strong> These documents are pending final review by a Florida-licensed attorney. Material changes will be notified before launch.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold">1</span>
                            Rental Agreement (applies to every booking)
                        </h3>
                        <ul className="space-y-2 ml-8">
                            {[
                                { label: 'Lister Agreement', hash: '#lister-agreement' },
                                { label: 'Renter Agreement', hash: '#renter-agreement' },
                                { label: 'Master Rental Agreement', hash: '#master-rental' },
                                { label: 'Security Deposit & Damage Policy', hash: '#deposit-damage' },
                                { label: 'Cancellation & Refund Policy', hash: '#cancellation' },
                                { label: 'Assumption of Risk (general)', hash: '#assumption-risk' },
                            ].map((doc) => (
                                <li key={doc.hash}>
                                    <a
                                        href={`/#transactionalCore${doc.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-700 text-sm hover:underline"
                                    >
                                        → {doc.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">2</span>
                            {annex.label} Rules (specific to this booking)
                        </h3>
                        <div className="ml-8">
                            <a
                                href={annex.annexHash}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-lg text-amber-900 font-medium hover:border-amber-400 hover:shadow-sm transition text-sm"
                            >
                                📖 Open {annex.label} Annex ↗
                            </a>
                        </div>
                    </div>

                    <label className="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-cyan-400 transition has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 flex-shrink-0"
                            disabled={submitting}
                        />
                        <span className="text-sm text-gray-800 leading-relaxed">
                            <strong>I have read and agree</strong> to the Rental Agreement (all 6 modules) and the {annex.label} Annex, both at version {LEGAL_VERSION}. I understand the specific risks of {annex.label.toLowerCase()} rentals and voluntarily assume them.
                        </span>
                    </label>

                    {error && (
                        <div className="mt-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg">
                            <p className="text-rose-900 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 p-4 sm:p-6 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onCancel}
                            disabled={submitting}
                            className="sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium rounded-xl transition text-base"
                        >
                            Not now
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={!checked || submitting}
                            className="flex-1 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition text-base shadow-lg"
                        >
                            {submitting ? 'Recording acceptance…' : 'Accept & Continue to Payment'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Your acceptance is timestamped and recorded per the ESIGN Act (15 U.S.C. § 7001) and Fla. Stat. § 668.004.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingLegalModal;
