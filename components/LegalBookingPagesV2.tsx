// ============================================================================
// Legal Booking Pages V2 — STUB (all 4 categories placeholder)
// ============================================================================
// TEMPORARY STUB with placeholders for the 4 new-category annexes:
//   - Annex I  — Personal Watercraft (PWC)
//   - Annex J  — Electric Rideables
//   - Annex K  — Fishing Gear
//   - Annex L  — Diving & Snorkeling
//
// The full content (drafted via Perplexity + Luciano legal review) will be
// pasted in one commit that REPLACES this stub entirely.
// ============================================================================

import React from 'react';

const StubPage: React.FC<{ title: string; accent: string }> = ({ title, accent }) => (
    <div className="bg-white min-h-screen">
        <div className={`bg-gradient-to-br from-slate-900 to-${accent}-950 py-16 text-white`}>
            <div className="container mx-auto px-6 max-w-4xl">
                <span className={`text-${accent}-400 font-bold tracking-wider uppercase text-xs`}>Legal · Draft</span>
                <h1 className="text-3xl font-extrabold mt-2 mb-3">{title}</h1>
                <p className="text-gray-300">This annex is being finalized with legal counsel.</p>
            </div>
        </div>
        <div className="container mx-auto px-6 py-16 max-w-4xl text-center">
            <p className="text-slate-600 leading-relaxed">
                In the meantime, please refer to the general Terms &amp; Conditions and the
                Assumption of Risk (Module 12) which apply to all Goodslister rentals.
            </p>
            <a href="/#legalTerms" className="mt-6 inline-block text-cyan-600 font-bold text-sm hover:underline">
                Back to Legal Center
            </a>
        </div>
    </div>
);

export const AnnexPWCPage: React.FC = () => (
    <StubPage title="Annex I — Personal Watercraft (PWC)" accent="sky" />
);

export const AnnexElectricRideablesPage: React.FC = () => (
    <StubPage title="Annex J — Electric Rideables" accent="violet" />
);

export const AnnexFishingGearPage: React.FC = () => (
    <StubPage title="Annex K — Fishing Gear" accent="emerald" />
);

export const AnnexDivingSnorkelingPage: React.FC = () => (
    <StubPage title="Annex L — Diving & Snorkeling" accent="cyan" />
);
