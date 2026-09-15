// ============================================================================
// Legal Booking Pages V2 — STUB (placeholders for K + L)
// ============================================================================
// TEMPORARY STUB. Will be replaced with full annexes when all 4 (I, J, K, L)
// are drafted via Perplexity + Luciano legal review.
//
// This stub unblocks the Vercel build by satisfying App.tsx's imports for:
//   - AnnexPWCPage
//   - AnnexElectricRideablesPage
//
// Full content (Annex I + J drafted, K + L pending) will be pasted in one
// commit once Perplexity outputs are ready for K (Fishing) + L (Diving).
// ============================================================================

import React from 'react';

const StubPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
            <div className="text-6xl mb-4">📜</div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">{title}</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
                This annex is being finalized with legal counsel and will be published soon.
                In the meantime, please refer to the general Terms &amp; Conditions and the
                Assumption of Risk (Module 12) which apply to all Goodslister rentals.
            </p>
            <a href="/#legalTerms" className="mt-6 inline-block text-cyan-600 font-bold text-sm hover:underline">
                ← Back to Legal Center
            </a>
        </div>
    </div>
);

export const AnnexPWCPage: React.FC = () => (
    <StubPage title="Annex I — Personal Watercraft (PWC)" />
);

export const AnnexElectricRideablesPage: React.FC = () => (
    <StubPage title="Annex J — Electric Rideables" />
);
