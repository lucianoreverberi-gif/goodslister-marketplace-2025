import React, { useState } from 'react';
import { ListingCategory } from '../types';

/**
 * BookingLegalModal — Phase 3b Robust Contracts
 *
 * Category-aware modal that shows:
 *  - Booking summary (item, price, deposit)
 *  - INLINE critical risk disclosures per category
 *  - Links to full Rental Agreement + Category Annex
 *  - 3 targeted checkboxes (agreement + risk assumption + damage responsibility)
 *
 * The 3-checkbox design implements the "manifest assent" principle from
 * online contract law: user must actively acknowledge each of the three
 * legally material categories, not just one global checkbox.
 *
 * All acceptance is recorded with the two document bundles: the
 * transactional_core_v2_0 (always) + annex_<category>_v2_0 (specific to
 * what the user is renting).
 */

const LEGAL_VERSION = '2.0';

// Category-specific critical risks displayed INLINE in the modal.
// Extracted from Section 5 (Specific Risk Disclosure) of each Annex v2.0.
// Kept short (4-6 bullets max) so the modal remains scannable.
const CATEGORY_RISKS: Record<string, { critical: string[]; note?: string }> = {
    MOTORCYCLES: {
        critical: [
            'Serious injury or DEATH — motorcycles have far higher fatality per mile than cars',
            'Traumatic brain injury even with helmet',
            'Road rash, amputation, spinal cord injury, paralysis',
            'Being struck by a car whose driver fails to see you (esp. at intersections)',
            'Burns from hot exhaust pipes, fuel fire',
            'Loss of control on sand, gravel, painted lines, wet or oily pavement',
        ],
        note: 'DOT-approved helmet is contractually required for ALL riders regardless of any Florida adult helmet exemption.',
    },
    BIKES: {
        critical: [
            'Being struck by cars, trucks, or buses (especially at intersections)',
            'Head injury, traumatic brain injury, facial injury even with helmet',
            'Falls from potholes, gravel, sand, wet leaves, painted lines',
            'Brake failure, tire blowout, chain or drivetrain failure',
            'For e-bikes: heavier + faster than regular bikes, longer braking distance',
            'Lithium battery overheating (never charge unattended)',
        ],
    },
    BOATS: {
        critical: [
            'DROWNING — including after falling overboard, capsizing, or loss of consciousness',
            'Propeller strike causing laceration, amputation, and DEATH',
            'Carbon monoxide poisoning from engine, generator, or station-wagon effect',
            'Sudden storms, waterspouts, squalls, and building seas',
            'Hypothermia even in Florida waters; grounding, sinking, fire',
            'Collision with vessels, docks, pilings, channel markers, sandbars, reefs',
        ],
        note: 'Valid Florida Boating Safety ID required if born after Jan 1, 1988 (Fla. Stat. § 327.395). Help may be hours away.',
    },
    CAMPING: {
        critical: [
            'Carbon monoxide poisoning and DEATH from heaters, stoves, grills, generators in enclosed spaces',
            'Fire, burns, and explosion from propane, butane, campfires, lanterns',
            'Lithium battery thermal runaway, fire, and toxic smoke',
            'Falls from roof top tent or ladder (esp. at night)',
            'Wildlife encounters: bears, snakes, alligators, insect-borne illness',
            'Remote locations with delayed emergency response (measured in hours)',
        ],
        note: 'NEVER run any fuel-burning appliance inside a tent, vehicle, trailer, or enclosed space.',
    },
    WINTER_SPORTS: {
        critical: [
            'Serious injury, paralysis, and DEATH from falls and collisions',
            'Collision with trees, lift towers, rocks, other skiers/riders',
            'Traumatic brain injury even with helmet',
            'Knee ligament injury, ACL tear, wrist/clavicle fracture',
            'Binding failure to release, or premature release',
            'Hidden obstacles, tree wells, deep snow immersion suffocation, avalanche',
        ],
        note: 'YOU are solely responsible for having bindings professionally adjusted and tested to your specs before use.',
    },
    WATER_SPORTS: {
        critical: [
            'DROWNING — including after impact, entanglement, or exhaustion',
            'Being carried out by rip current, tide, wind, or offshore drift',
            'For Jet Ski: propeller strike causing amputation; orifice injury from jet thrust',
            'For hydrofoils: exceptionally sharp equipment causing severe lacerating injury',
            'Kite: being lofted, dragged, or slammed; line injury and strangulation',
            'Sudden squalls, lightning, unforecast weather; marine animal injury',
        ],
        note: 'You must be able to swim competently. Kitesurf/Wingfoil not available to beginners without an instructor.',
    },
    RVS: {
        critical: [
            'Rollover from high center of gravity, especially in crosswind or emergency swerve',
            'Trailer sway, jackknife, and total loss of control at highway speed',
            'Overhead clearance strikes on bridges, canopies, drive-throughs, tree limbs',
            'Tire blowout on a heavy vehicle causing immediate loss of control',
            'Propane leak, fire, and explosion; refrigerator or wiring fire',
            'Carbon monoxide poisoning from generator, furnace, or engine while sleeping',
        ],
        note: 'RV drives, turns, stops, and reacts to wind completely differently from a car. Plan your route for height, length, weight.',
    },
    ATVS_UTVS: {
        critical: [
            'Rollover (common due to high center of gravity + unstable terrain)',
            'Ejection, collision, impact with trees or fixed objects',
            'Terrain hazards: hidden holes, logs, rocks, ruts',
            'Drowning from water crossings',
            'Helmet failure; mechanical failure',
            'Serious injury or DEATH',
        ],
        note: 'PROHIBITED on Florida public roads/highways (Fla. Stat. § 316.2074). Operate only on private property or designated OHV areas.',
    },
};

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
    bookingPrice?: number;
    securityDeposit?: number;
    onAccepted: () => void;
    onCancel: () => void;
}

export const BookingLegalModal: React.FC<BookingLegalModalProps> = ({
    userId,
    userName,
    category,
    itemTitle,
    bookingPrice,
    securityDeposit,
    onAccepted,
    onCancel,
}) => {
    const [checks, setChecks] = useState({ agreement: false, risk: false, damage: false });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allChecked = checks.agreement && checks.risk && checks.damage;

    const annex = CATEGORY_TO_ANNEX[category] || {
        id: 'annex_generic_v2_0',
        label: 'General',
        annexHash: '#trustSafety',
    };
    const risks = CATEGORY_RISKS[category] || { critical: [], note: undefined };

    const handleAccept = async () => {
        if (!allChecked || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* HERO */}
                <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white p-6 sm:p-7">
                    <span className="text-amber-400 font-bold tracking-wider uppercase text-xs">
                        {userName ? `${userName.split(' ')[0]}, one more thing` : 'Before we book'}
                    </span>
                    <h2 id="booking-legal-title" className="text-2xl sm:text-3xl font-extrabold mt-2">
                        Rental terms for {annex.label}
                    </h2>

                    {/* BOOKING SUMMARY */}
                    <div className="mt-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-white font-bold text-sm truncate">{itemTitle}</div>
                            <div className="text-gray-300 text-xs">Category: {annex.label}</div>
                        </div>
                        {(bookingPrice != null || securityDeposit != null) && (
                            <div className="text-right flex-shrink-0">
                                {bookingPrice != null && (
                                    <div className="text-white font-bold text-lg">${bookingPrice.toFixed(2)}</div>
                                )}
                                {securityDeposit != null && securityDeposit > 0 && (
                                    <div className="text-gray-300 text-xs">+ ${securityDeposit.toFixed(2)} deposit</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* BODY */}
                <div className="p-6 sm:p-7 overflow-y-auto flex-1">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg mb-5">
                        <p className="text-amber-900 text-xs">
                            <strong>Draft v{LEGAL_VERSION}:</strong> These documents are pending final review by a Florida-licensed attorney. Material changes will be notified before launch.
                        </p>
                    </div>

                    {/* INLINE RISKS — the key change vs Phase 3 */}
                    {risks.critical.length > 0 && (
                        <div className="mb-6">
                            <div className="bg-rose-50 border-l-4 border-rose-500 rounded-lg overflow-hidden">
                                <div className="bg-rose-500 text-white px-4 py-2 flex items-center gap-2">
                                    <span className="text-xl">⚠️</span>
                                    <span className="uppercase font-bold text-xs tracking-wider">Specific risks you are assuming</span>
                                </div>
                                <div className="p-4">
                                    <p className="uppercase font-bold text-rose-900 text-xs mb-3">
                                        By booking, you acknowledge that {annex.label.toLowerCase()} involves risk of:
                                    </p>
                                    <ul className="space-y-2">
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
                        </div>
                    )}

                    {/* DOCUMENT LINKS */}
                    <div className="mb-5">
                        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold">📄</span>
                            Full documents (opens in new tab)
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                            <a
                                href="/#transactionalCore"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-cyan-200 rounded-lg text-cyan-800 text-sm font-medium hover:border-cyan-400 hover:shadow-sm transition"
                            >
                                <span>📖</span>
                                <span className="flex-1">Rental Agreement (6 modules)</span>
                                <span className="text-xs">↗</span>
                            </a>
                            <a
                                href={annex.annexHash}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-lg text-amber-800 text-sm font-medium hover:border-amber-400 hover:shadow-sm transition"
                            >
                                <span>📚</span>
                                <span className="flex-1">{annex.label} Annex</span>
                                <span className="text-xs">↗</span>
                            </a>
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
                                disabled={submitting}
                            />
                            <span className="text-sm text-gray-800 leading-relaxed">
                                I have read and agree to the <strong>Rental Agreement</strong> (all 6 modules) and the <strong>{annex.label} Annex</strong>, both at version {LEGAL_VERSION}.
                            </span>
                        </label>

                        <label className="flex items-start gap-3 p-3 bg-rose-50 border-2 border-rose-200 rounded-xl cursor-pointer hover:border-rose-400 transition has-[:checked]:border-rose-500 has-[:checked]:bg-rose-100">
                            <input
                                type="checkbox"
                                checked={checks.risk}
                                onChange={(e) => setChecks({ ...checks, risk: e.target.checked })}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 flex-shrink-0"
                                disabled={submitting}
                            />
                            <span className="text-sm text-gray-800 leading-relaxed">
                                I <strong>understand and voluntarily assume</strong> the specific risks of {annex.label.toLowerCase()} listed above, including risk of serious injury or death.
                            </span>
                        </label>

                        <label className="flex items-start gap-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl cursor-pointer hover:border-amber-400 transition has-[:checked]:border-amber-500 has-[:checked]:bg-amber-100">
                            <input
                                type="checkbox"
                                checked={checks.damage}
                                onChange={(e) => setChecks({ ...checks, damage: e.target.checked })}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                                disabled={submitting}
                            />
                            <span className="text-sm text-gray-800 leading-relaxed">
                                I am <strong>responsible for damages</strong> beyond normal wear and tear. My security deposit + card on file may be charged per the Damage Policy.
                            </span>
                        </label>
                    </div>

                    {error && (
                        <div className="mt-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg">
                            <p className="text-rose-900 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50">
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
                            disabled={!allChecked || submitting}
                            className="flex-1 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition text-base shadow-lg"
                        >
                            {submitting ? 'Recording acceptance…' : 'Accept & Continue to Payment'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Your acceptance is timestamped, IP-logged, and recorded per the ESIGN Act (15 U.S.C. § 7001) and Fla. Stat. § 668.004.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingLegalModal;
