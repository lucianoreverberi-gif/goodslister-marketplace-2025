import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './icons';

interface FAQItem {
    q: string;
    a: string;
}

const renterFAQs: FAQItem[] = [
    {
        q: "How does payment work?",
        a: "You pay the full rental amount securely through Stripe when you book. If the item requires a security deposit, a separate refundable hold is placed on your card (like a hotel). The rental amount is transferred to the host after successful checkout."
    },
    {
        q: "Do I need to verify my identity?",
        a: "Yes, first-time renters must complete a quick identity verification via Stripe Identity (photo of your government-issued ID plus a selfie, about 2 minutes). This protects hosts and keeps the marketplace safe. Verification is one-time and reusable for all future bookings."
    },
    {
        q: "How does the security deposit work?",
        a: "The deposit amount is set by each host and clearly shown on the listing. Your card is authorized (not charged) at booking. The hold is automatically released 3 days after checkout if no damage is reported. If damage is claimed, you have 48 hours to accept or dispute. Bank processing may take 5-10 additional business days to reflect on your statement."
    },
    {
        q: "What is the handoff protocol?",
        a: "At pickup and return, you upload 4-10 photos of the item's condition and confirm with a digital signature (checkbox with timestamp and IP). This creates a mutual record that protects both you and the host in case of any dispute later."
    },
    {
        q: "What if I accidentally damage the item?",
        a: "If damage occurs, the host reports it within 48 hours of return with photos, description, and claim amount. You receive an email notification and have 48 hours to accept or dispute the claim. If you dispute, Goodslister admin reviews all evidence (photos from both parties, signatures, condition notes) and makes a fair, final decision."
    },
    {
        q: "Can I cancel my booking?",
        a: "Cancellation policies are set by each host and displayed on the listing before you book. Refunds for eligible cancellations are processed automatically via Stripe within 5-10 business days depending on your bank."
    },
    {
        q: "What if the host cancels on me?",
        a: "If a host cancels after your booking is confirmed, you receive a full refund automatically and we help you find an alternative listing. Hosts who repeatedly cancel lose Superhost status and search visibility, keeping the marketplace reliable."
    },
    {
        q: "How do I contact my host?",
        a: "Once your booking is confirmed, you can message your host directly through our in-app chat. For urgent issues during a rental, message the host first. If unresolved within 2 hours, contact us at support@goodslister.com."
    },
    {
        q: "Where does Goodslister operate?",
        a: "Goodslister launched in South Florida (Miami, Fort Lauderdale, West Palm Beach) where our community is most active. You can list from anywhere in the US, but visibility and bookings will be highest where demand exists. We're expanding statewide throughout 2026."
    },
    {
        q: "How does the AI search work?",
        a: "Search naturally in English or Spanish. Type queries like 'jet ski Miami for 4 people' or 'kayak Fort Lauderdale' and our AI understands context, location, and category automatically. Voice search is also supported on modern browsers."
    }
];

const hostFAQs: FAQItem[] = [
    {
        q: "When do I get paid?",
        a: "Payouts are handled via Stripe Connect. Money is transferred to your connected bank account within 2-7 business days after successful checkout (renter signs off on return with no damage). New Stripe accounts may see longer initial delays as Stripe verifies your info. Goodslister takes a 6% platform fee on each booking."
    },
    {
        q: "What are the platform fees?",
        a: "Goodslister takes a 6% commission on completed bookings. This may adjust as we grow and is always visible during your listing setup. There are no listing fees, no monthly subscriptions, and no hidden charges. Boost promotions are optional and separate."
    },
    {
        q: "Do I need commercial insurance?",
        a: "For high-value equipment (vehicles, boats, jet skis, RVs, ATVs), commercial insurance is required and must be uploaded before listing. For smaller items (surfboards, kayaks, cameras, camping gear), personal coverage combined with the deposit hold typically suffices. When unsure, consult your insurance provider or contact support@goodslister.com."
    },
    {
        q: "How do security deposits protect me?",
        a: "You set the deposit amount per listing. When a renter books, their card is authorized for the deposit (funds held, not charged). If damage occurs, you have 48 hours after checkout to report it with photos, description, and claim amount. If the renter accepts (or doesn't respond within 48h), funds are captured to your account. If disputed, Goodslister admin resolves fairly."
    },
    {
        q: "What are Boosts and how much do they cost?",
        a: "Boosts increase your listing visibility in search results. Local Boost is $5.99 for 3 days (nearby priority). Spotlight Boost is $14.99 for 7 days (top of search). Regional Boost is $29.99 for 14 days (multi-city visibility). Payment via Stripe. Non-refundable once active."
    },
    {
        q: "How do I become a Superhost?",
        a: "Complete 10 successful bookings with high response rate and no unresolved disputes. The Superhost badge appears on your listings and profile, boosting trust and conversion. Progress is tracked en your Dashboard Home tab."
    },
    {
        q: "Can I use AI-generated cover images?",
        a: "Yes. After uploading 3 or more real photos of your item, our AI can generate a stunning cover image (e.g., 'friends riding jet skis at sunset over Miami turquoise water, drone view'). Real photos remain visible in the listing gallery, ensuring transparency while giving you a professional hero shot."
    },
    {
        q: "How do I set my prices?",
        a: "You have full control. Set daily or hourly rates when creating your listing. Best practice: check similar listings in your area to stay competitive. Our AI-powered pricing assistant (coming soon) will suggest optimal rates based on real demand data."
    },
    {
        q: "What if a renter damages my item?",
        a: "Report within 48 hours of checkout via your dashboard with photos, description, and claim amount (up to the deposit hold). Renter has 48 hours to accept or dispute. If accepted, deposit is captured to your account. If disputed, Goodslister admin reviews all evidence and decides. If no response in 48 hours, the claim is auto-accepted in your favor."
    },
    {
        q: "How do I prevent fake bookings or bad renters?",
        a: "All renters complete mandatory identity verification via Stripe Identity before their first booking. Handoff protocol requires photos plus signature from both parties at pickup and return. You can also decline any booking request that seems suspicious. Repeat offenders are suspended platform-wide."
    }
];

const FAQSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'renter' | 'host'>('renter');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const currentFAQs = activeTab === 'renter' ? renterFAQs : hostFAQs;

    return (
        <section className="bg-white py-16 sm:py-24 border-t border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Frequently Asked Questions</h2>
                    <p className="mt-4 text-lg text-gray-600">Everything you need to know about renting and hosting on Goodslister.</p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="bg-gray-100 p-1 rounded-full inline-flex">
                        <button
                            onClick={() => { setActiveTab('renter'); setOpenIndex(null); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'renter'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            For Renters
                        </button>
                        <button
                            onClick={() => { setActiveTab('host'); setOpenIndex(null); }}
                             className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'host'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            For Hosts
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentFAQs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 last:border-0">
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex justify-between items-center py-4 text-left focus:outline-none group"
                            >
                                <span className={`text-lg font-medium transition-colors ${openIndex === index ? 'text-cyan-700' : 'text-gray-900 group-hover:text-cyan-600'}`}>
                                    {faq.q}
                                </span>
                                <span className="ml-6 flex-shrink-0 text-cyan-600">
                                    {openIndex === index ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="pb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
                                        {faq.a}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm text-gray-500">
                        Still have questions? Reach us at <a href="mailto:support@goodslister.com" className="text-cyan-600 font-semibold hover:underline">support@goodslister.com</a>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;

