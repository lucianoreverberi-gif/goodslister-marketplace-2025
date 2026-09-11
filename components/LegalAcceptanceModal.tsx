import React, { useState } from 'react';

/**
 * LegalAcceptanceModal
 *
 * Blocking modal shown to authenticated users who have not yet accepted the current
 * Universal Core legal bundle (v2.0). Cannot be dismissed. On accept, POSTs to
 * /api/legal/accept with the user's identity, records the acceptance server-side,
 * then unblocks the app.
 *
 * The 6 core documents are linked (open in new tab) so the user has access to review
 * each one before checking the box.
 */

const LEGAL_VERSION = '2.0';
const DOCUMENT_BUNDLE = 'universal_core_v2_0';

const LEGAL_DOCS: Array<{ label: string; hash: string }> = [
    { label: 'Terms of Service', hash: '#terms' },
    { label: 'Privacy Policy', hash: '#privacyPolicy' },
    { label: 'Payments Terms', hash: '#payments' },
    { label: 'Insurance & Verification Disclosure', hash: '#insuranceDisclosure' },
    { label: 'Dispute Resolution', hash: '#disputeResolution' },
    { label: 'Trust & Safety', hash: '#trustSafety' },
];

interface LegalAcceptanceModalProps {
    userId: string;
    userName?: string;
    onAccepted: () => void;
    onCancel?: () => void;
    reason?: 'listing' | 'booking' | 'generic';
}

export const LegalAcceptanceModal: React.FC<LegalAcceptanceModalProps> = ({ userId, userName, onAccepted, onCancel, reason = 'generic' }) => {

    const headline = {
        listing: 'Before you list an item',
        booking: 'Before you book',
        generic: 'One quick step',
    }[reason];

    const subtitle = {
        listing: 'Please review and accept our platform terms so listers and renters are protected.',
        booking: 'Please review and accept our platform terms so this booking is properly protected.',
        generic: 'Please review and accept our platform terms. These documents govern how you use Goodslister and protect both listers and renters.',
    }[reason];
    const [checked, setChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        if (!checked || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/legal/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    documentBundle: DOCUMENT_BUNDLE,
                    documentVersion: LEGAL_VERSION,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to record acceptance');
            }
            onAccepted();
        } catch (err: any) {
            console.error('[LegalAcceptanceModal] accept failed:', err);
            setError(err?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-cyan-950 text-white p-6 sm:p-8">
                    <span className="text-cyan-400 font-bold tracking-wider uppercase text-xs">
                        {userName ? `${userName.split(' ')[0]}, quick check` : 'Platform Terms'}
                    </span>
                    <h2 id="legal-modal-title" className="text-2xl sm:text-3xl font-extrabold mt-2">
                        {headline}
                    </h2>
                    <p className="text-gray-300 mt-3 text-sm sm:text-base">
                        {subtitle}
                    </p>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg mb-6">
                        <p className="text-amber-900 text-xs">
                            <strong>Draft v{LEGAL_VERSION}:</strong> These documents are pending final review by a Florida-licensed attorney. Material changes will be notified before launch.
                        </p>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Click any document below to review the full text in a new tab:
                    </p>

                    <ul className="space-y-2 mb-6">
                        {LEGAL_DOCS.map((doc) => (
                            <li key={doc.hash}>
                                <a
                                    href={doc.hash}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-gradient-to-br from-cyan-50 to-white border border-cyan-100 rounded-lg hover:border-cyan-400 hover:shadow-sm transition group"
                                >
                                    <span className="text-cyan-900 font-medium group-hover:text-cyan-700">
                                        {doc.label}
                                    </span>
                                    <span className="text-cyan-500 text-sm">Open in new tab ↗</span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    <label className="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-cyan-400 transition has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 flex-shrink-0"
                            disabled={submitting}
                        />
                        <span className="text-sm text-gray-800 leading-relaxed">
                            <strong>I have read and agree to</strong> the Terms of Service, Privacy Policy, Payments Terms, Insurance &amp; Verification Disclosure, Dispute Resolution, and Trust &amp; Safety Policy (all version {LEGAL_VERSION}). I understand Goodslister is a marketplace and not an insurer, and that arbitration and class action waivers apply.
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
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                disabled={submitting}
                                className="sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium rounded-xl transition text-base"
                            >
                                Not now
                            </button>
                        )}
                        <button
                            onClick={handleAccept}
                            disabled={!checked || submitting}
                            className="flex-1 bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition text-base shadow-lg"
                        >
                            {submitting ? 'Recording your acceptance…' : 'Accept & Continue'}
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

export default LegalAcceptanceModal;
